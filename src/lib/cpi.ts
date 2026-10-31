/**
 * CPI-U NSA readings for the TIPS Pricer (US-229), read with the existing
 * price `Search`. This module only finds and labels the monthly index
 * levels: the reference CPI and index ratio are derived by valuation-service
 * (MeasureProto.REFERENCE_CPI / INDEX_RATIO), never here.
 */
import { PriceHorizonProto } from "@fintekkers/ledger-models/node/fintekkers/requests/price/query_price_request_pb.js";
import { DateRangeProto } from "@fintekkers/ledger-models/node/fintekkers/models/util/date_range_pb.js";
import { ProductTypeProto } from "@fintekkers/ledger-models/node/fintekkers/models/security/product_type_pb.js";
import { IdentifierTypeProto } from "@fintekkers/ledger-models/node/fintekkers/models/security/identifier/identifier_type_pb.js";
import field_pkg from "@fintekkers/ledger-models/node/fintekkers/models/position/field_pb.js";
import { ZonedDateTime } from "@fintekkers/ledger-models/node/wrappers/models/utils/datetime";
import { PositionFilter } from "@fintekkers/ledger-models/node/wrappers/models/position/positionfilter";
import { SecurityService } from "@fintekkers/ledger-models/node/wrappers/services/security-service/SecurityService";
import { stampOwn } from "@fintekkers/ledger-models/node/wrappers/util/object-types";
import { searchSeriesPrices } from "$lib/fixings";

const { FieldProto } = field_pkg;

/** BLS series id of CPI-U NSA, the index US TIPS accrue off. */
export const CPI_U_NSA_SERIES_ID = "CUUR0000SA0";

export type YearMonth = { year: number; month: number }; // month 1-12

/** One monthly CPI-U level as stored in the price service. */
export type CpiReading = YearMonth & { label: string; value: string };

export type CpiLookup = {
  /** Readings for months m-3 and m-2, or null unless both exist. */
  readings: CpiReading[] | null;
  /** Latest month loaded, e.g. "Aug 2026"; null when unknown. */
  latestMonth: string | null;
};

/** What the TIPS Pricer's Current CPI field shows after a lookup. */
export type CurrentCpiState = {
  source: "price-service" | "manual";
  /** valuation-service's REFERENCE_CPI, or "" until there is one. */
  value: string;
  readings: CpiReading[];
  note: string | null;
};

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/** `YYYY-MM-DD` with a real calendar date, else null. */
export function parseSettlementDate(
  value: string | null | undefined
): { year: number; month: number; day: number } | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value ?? "");
  if (!m) return null;
  const [year, month, day] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const d = new Date(Date.UTC(year, month - 1, day));
  if (d.getUTCMonth() !== month - 1 || d.getUTCDate() !== day) return null;
  return { year, month, day };
}

function addMonths(m: YearMonth, n: number): YearMonth {
  const index = m.year * 12 + (m.month - 1) + n;
  return { year: Math.floor(index / 12), month: (index % 12) + 1 };
}

/** Months m-3 and m-2 of the settlement month m. */
export function readingMonthsFor(
  settlementDate: string
): [YearMonth, YearMonth] {
  const d = parseSettlementDate(settlementDate);
  if (!d) throw new Error(`Invalid settlement date: ${settlementDate}`);
  const m = { year: d.year, month: d.month };
  return [addMonths(m, -3), addMonths(m, -2)];
}

/** `[1st 00:00Z, next 1st 00:00Z)` of the month, as UTC milliseconds. */
export function monthWindow(m: YearMonth): { start: number; end: number } {
  return {
    start: Date.UTC(m.year, m.month - 1, 1),
    end: Date.UTC(m.year, m.month, 1),
  };
}

export function monthLabel(m: YearMonth): string {
  return `${MONTHS[m.month - 1]} ${m.year}`;
}

/** e.g. "CPI-U Jul 2026": month only, never a day. */
export function cpiReadingLabel(m: YearMonth): string {
  return `CPI-U ${monthLabel(m)}`;
}

export function noReadingNote(
  settlementDate: string,
  latestMonth: string | null
): string {
  return `No CPI-U reading for ${settlementDate} in the price service (latest loaded: ${
    latestMonth ?? "unknown"
  }). Enter it to calculate. It is not saved.`;
}

export function currentCpiFromLookup(
  settlementDate: string,
  lookup: CpiLookup
): CurrentCpiState {
  if (lookup.readings) {
    return {
      source: "price-service",
      value: "",
      readings: lookup.readings,
      note: null,
    };
  }
  return {
    source: "manual",
    value: "",
    readings: [],
    note: noReadingNote(settlementDate, lookup.latestMonth),
  };
}

/**
 * The UUID of the CPI-U NSA series, matched on its SERIES_ID identifier
 * only. Another CPI_U-indexed series (e.g. CPI-U SA) never matches.
 */
export async function findCpiUSeriesId(
  apiKey?: string
): Promise<string | null> {
  const filter = new PositionFilter();
  filter.addEqualsFilter(FieldProto.ASSET_CLASS, "RATES");
  const securities = await new SecurityService(apiKey).searchSecurityAsOfNow(
    filter
  );
  for (const sec of securities) {
    if (sec.proto.getProductType() !== ProductTypeProto.CPI_SERIES) continue;
    const isSeries = sec.proto
      .getIdentifiersList()
      .some(
        (id) =>
          id.getIdentifierType() === IdentifierTypeProto.SERIES_ID &&
          id.getIdentifierValue() === CPI_U_NSA_SERIES_ID
      );
    if (isSeries) return sec.getID().toString();
  }
  return null;
}

async function fetchMonth(
  seriesId: string,
  m: YearMonth,
  apiKey?: string
): Promise<CpiReading | null> {
  const { start, end } = monthWindow(m);
  const points = await searchSeriesPrices(
    seriesId,
    (request) => {
      // date_range's end is inclusive: the half-open filter below drops a
      // row stamped exactly on the next month's 1st.
      const range = new DateRangeProto();
      stampOwn(range);
      range.setStart(ZonedDateTime.from(new Date(start)).toProto());
      range.setEnd(ZonedDateTime.from(new Date(end)).toProto());
      request.setDateRange(range);
    },
    apiKey
  );
  // One reading per month: the latest stamp wins when an old duplicate
  // (e.g. 00:00Z next to 08:30 New York) is still loaded.
  const inMonth = points
    .filter((p) => p.at >= start && p.at < end)
    .sort((a, b) => a.at - b.at);
  const latest = inMonth[inMonth.length - 1];
  if (!latest) return null;
  return { ...m, label: cpiReadingLabel(m), value: latest.value };
}

async function fetchLatestMonth(
  seriesId: string,
  apiKey?: string
): Promise<string | null> {
  const points = await searchSeriesPrices(
    seriesId,
    (request) => request.setHorizon(PriceHorizonProto.PRICE_HORIZON_MAX),
    apiKey
  );
  if (points.length === 0) return null;
  const latest = new Date(Math.max(...points.map((p) => p.at)));
  return monthLabel({
    year: latest.getUTCFullYear(),
    month: latest.getUTCMonth() + 1,
  });
}

/**
 * CPI-U NSA readings for months m-3 and m-2 of the settlement month. Never
 * throws: a security or price service error reads as "no readings" with an
 * unknown latest month, so the page still renders and the user can type it.
 */
export async function fetchCpiReadings(
  settlementDate: string,
  apiKey?: string
): Promise<CpiLookup> {
  let seriesId: string | null = null;
  try {
    seriesId = await findCpiUSeriesId(apiKey);
    if (!seriesId) return { readings: null, latestMonth: null };
    const months = readingMonthsFor(settlementDate);
    const found = await Promise.all(
      months.map((m) => fetchMonth(seriesId!, m, apiKey))
    );
    if (found.every((r): r is CpiReading => r !== null)) {
      return { readings: found, latestMonth: null };
    }
    return {
      readings: null,
      latestMonth: await fetchLatestMonth(seriesId, apiKey),
    };
  } catch (e: any) {
    console.error(
      "CPI-U reading lookup failed:",
      e?.details ?? e?.message ?? e
    );
    return { readings: null, latestMonth: null };
  }
}
