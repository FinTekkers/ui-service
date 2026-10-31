/**
 * Reference-rate fixings for the FRN Pricer (US-303), read through the
 * broker with the existing price `Search`, as cpi.ts reads CPI-U. The
 * fixings are the INDEX series market-data-inputs loads (MDI-100): one RATE
 * price per fixing date, the rate in percent as published, stamped at 00:00
 * New York on the fixing date. They reach the valuation request only through
 * ledger-models' `forSecurity` marketData; nothing here picks an arm.
 *
 * Finding the series for an index is a rule about the data; it moves to
 * ledger-models once it has a fixings lookup next to LM-375's CPI one.
 */
import { PriceClient } from "@fintekkers/ledger-models/node/fintekkers/services/price-service/price_service_grpc_pb.js";
import { QueryPriceRequestProto } from "@fintekkers/ledger-models/node/fintekkers/requests/price/query_price_request_pb.js";
import { DateRangeProto } from "@fintekkers/ledger-models/node/fintekkers/models/util/date_range_pb.js";
import { LocalDateProto } from "@fintekkers/ledger-models/node/fintekkers/models/util/local_date_pb.js";
import { ProductTypeProto } from "@fintekkers/ledger-models/node/fintekkers/models/security/product_type_pb.js";
import type { SecurityProto } from "@fintekkers/ledger-models/node/fintekkers/models/security/security_pb.js";
import { ReferenceRateFixingProto } from "@fintekkers/ledger-models/node/fintekkers/requests/valuation/product_inputs_pb.js";
import field_pkg from "@fintekkers/ledger-models/node/fintekkers/models/position/field_pb.js";
import { ZonedDateTime } from "@fintekkers/ledger-models/node/wrappers/models/utils/datetime";
import { PositionFilter } from "@fintekkers/ledger-models/node/wrappers/models/position/positionfilter";
import { UUID } from "@fintekkers/ledger-models/node/wrappers/models/utils/uuid";
import type { Identifier } from "@fintekkers/ledger-models/node/wrappers/models/security/identifier";
import { SecurityService } from "@fintekkers/ledger-models/node/wrappers/services/security-service/SecurityService";
import { stampOwn } from "@fintekkers/ledger-models/node/wrappers/util/object-types";
import { getServiceConnection } from "$lib/grpc-auth";
import { fromDecimalProto, toDecimalProto } from "$lib/decimal";

const { FieldProto } = field_pkg;

/** Fixings read back from the as-of date: covers the latest weekly
 * 13-week bill auction and daily SOFR, well under price-service's row cap. */
export const FIXING_LOOKBACK_DAYS = 120;

/** The time zone market-data-inputs stamps a fixing's date in. */
const FIXING_TZ = "America/New_York";

const DAY_MS = 24 * 60 * 60 * 1000;

/** The INDEX product types that hold reference-rate fixings. */
const FIXING_SERIES_TYPES: number[] = [
  ProductTypeProto.SOFR_SERIES,
  ProductTypeProto.T_BILL_13_WEEK_SERIES,
];

export type PricePoint = { at: number; value: string };

/** One price `Search` for the series; rejects on a service error. */
export function searchSeriesPrices(
  seriesId: string,
  setTimeRange: (request: QueryPriceRequestProto) => void,
  apiKey?: string
): Promise<PricePoint[]> {
  const request = new QueryPriceRequestProto();
  stampOwn(request);
  request.setAsOf(ZonedDateTime.now().toProto());
  setTimeRange(request);

  const filter = new PositionFilter();
  // Wrapper signature too narrow (Identifier-only); runtime accepts UUID
  // for SECURITY_ID, as on the CPI page.
  filter.addObjectFilter(
    FieldProto.SECURITY_ID,
    new UUID(UUID.fromString(seriesId)) as unknown as Identifier
  );
  request.setSearchPriceInput(filter.toProto());

  const conn = getServiceConnection(apiKey);
  const client = new PriceClient(conn.url, conn.credentials, {
    interceptors: conn.interceptors,
    ...conn.clientOptions,
  });

  return new Promise((resolve, reject) => {
    const points: PricePoint[] = [];
    const stream = client.search(request);
    stream.on("data", (response: any) => {
      for (const price of response.getPriceResponseList?.() ?? []) {
        const seconds = price.getAsOf?.()?.getTimestamp?.()?.getSeconds?.();
        let value: string | undefined;
        try {
          value = fromDecimalProto(price.getPrice?.());
        } catch (e) {
          console.warn("Skipping series price, invalid decimal:", e);
          continue;
        }
        if (seconds != null && value)
          points.push({ at: seconds * 1000, value });
      }
    });
    stream.on("end", () => resolve(points));
    stream.on("error", (err: any) => reject(err));
  });
}

/** The UUID of the fixing series for `index`, matched on its index type. */
export async function findFixingSeriesId(
  index: number,
  apiKey?: string
): Promise<string | null> {
  const filter = new PositionFilter();
  filter.addEqualsFilter(FieldProto.ASSET_CLASS, "RATES");
  const securities = await new SecurityService(apiKey).searchSecurityAsOfNow(
    filter
  );
  for (const sec of securities) {
    if (!FIXING_SERIES_TYPES.includes(sec.proto.getProductType())) continue;
    if (sec.proto.getIndexDetails()?.getIndexType() === index) {
      return sec.getID().toString();
    }
  }
  return null;
}

/** `YYYY-MM-DD` of `at` in New York. */
function fixingDateOf(at: number): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: FIXING_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(at));
}

function localDate(iso: string): LocalDateProto {
  const [year, month, day] = iso.split("-").map(Number);
  return new LocalDateProto().setYear(year).setMonth(month).setDay(day);
}

/**
 * The FRN's reference-rate fixings from the last FIXING_LOOKBACK_DAYS up to
 * `asOf`, oldest first, one per fixing date (the latest stamp wins). `rate`
 * is the price as stored, in percent. Empty when the security names no
 * index, its series is not loaded, or no fixing falls in the window: the
 * builder then raises MissingMarketDataError. Rejects on a service error.
 */
export async function fetchFixings(
  security: SecurityProto,
  asOf: Date,
  apiKey?: string
): Promise<ReferenceRateFixingProto[]> {
  const index = security.getFrnExtension()?.getReferenceRateIndex();
  if (!index) return []; // UNKNOWN_INDEX_TYPE is 0
  const seriesId = await findFixingSeriesId(index, apiKey);
  if (!seriesId) return [];

  const end = asOf.getTime();
  const start = end - FIXING_LOOKBACK_DAYS * DAY_MS;
  const points = await searchSeriesPrices(
    seriesId,
    (request) => {
      const range = new DateRangeProto();
      stampOwn(range);
      range.setStart(ZonedDateTime.from(new Date(start)).toProto());
      range.setEnd(ZonedDateTime.from(new Date(end + DAY_MS)).toProto());
      request.setDateRange(range);
    },
    apiKey
  );

  const latestByDate = new Map<string, PricePoint>();
  for (const p of points) {
    if (p.at < start || p.at > end) continue;
    const date = fixingDateOf(p.at);
    const seen = latestByDate.get(date);
    if (!seen || p.at > seen.at) latestByDate.set(date, p);
  }
  return [...latestByDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, p]) =>
      new ReferenceRateFixingProto()
        .setIndex(index)
        .setFixingDate(localDate(date))
        .setRate(toDecimalProto(p.value))
    );
}
