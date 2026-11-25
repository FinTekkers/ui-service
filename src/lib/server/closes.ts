/**
 * Every daily close the price service holds for one exchange ticker,
 * oldest first: one security search by EXCH_TICKER, then price searches by
 * SECURITY_ID, through the broker with the caller's key. Shared by the
 * homepage chart (US-250), /free/tech-vs-sp500 (US-339) and
 * /free/sigma-moves (US-341). Lives under src/lib/server/ so SvelteKit
 * refuses any client import of it. An unknown ticker gives []; errors
 * propagate to the caller's loader.
 *
 * US-347: the wrapper's PriceService.search() sets no `limit`, so the
 * service returned only its default 1,000 newest rows (with a warning the
 * wrapper drops). readAllPrices sets an explicit limit of
 * MAX_SEARCH_RESULTS on every request and, when a batch fills, reads back
 * in date windows that each stay under it. The service has no paging. Any
 * error or warning in a response throws: never a silently short history.
 */
import { FetchSecurity } from "$lib/security";
import { getServiceConnection } from "$lib/grpc-auth";
import { fromDecimalProto } from "$lib/decimal";
import type { Close } from "$lib/free/techVsSp500";
import type { Identifier } from "@fintekkers/ledger-models/node/wrappers/models/security/identifier";
import { ZonedDateTime } from "@fintekkers/ledger-models/node/wrappers/models/utils/datetime";
import { PositionFilter } from "@fintekkers/ledger-models/node/wrappers/models/position/positionfilter";
import { UUID } from "@fintekkers/ledger-models/node/wrappers/models/utils/uuid";
import { stampOwn } from "@fintekkers/ledger-models/node/wrappers/util/object-types";
import { PriceClient } from "@fintekkers/ledger-models/node/fintekkers/services/price-service/price_service_grpc_pb.js";
import { QueryPriceRequestProto } from "@fintekkers/ledger-models/node/fintekkers/requests/price/query_price_request_pb.js";
import type { QueryPriceResponseProto } from "@fintekkers/ledger-models/node/fintekkers/requests/price/query_price_response_pb.js";
import { DateRangeProto } from "@fintekkers/ledger-models/node/fintekkers/models/util/date_range_pb.js";
import type { PriceProto } from "@fintekkers/ledger-models/node/fintekkers/models/price/price_pb.js";
import type { PositionFilterProto } from "@fintekkers/ledger-models/node/fintekkers/models/position/position_filter_pb.js";
import field_pkg from "@fintekkers/ledger-models/node/fintekkers/models/position/field_pb.js";

const { FieldProto } = field_pkg;

export type { Close } from "$lib/free/techVsSp500";

/** price-service-rust's hard row ceiling per Search (src/service/grpc.rs);
 * a larger `limit` is clamped to it without a warning. */
export const MAX_SEARCH_RESULTS = 10_000;

/** The first window tried once an open-ended read fills: ~2,500 daily
 * closes, well under the ceiling. Windows halve while they fill. */
const INITIAL_SPAN_S = 10 * 366 * 24 * 60 * 60;
/** A window this short that still fills is too dense to read. */
const MIN_SPAN_S = 60;
/** Stops a misbehaving service from looping the read forever. */
const MAX_REQUESTS = 1_000;

/** One price Search: every streamed response for `request`. */
export type PriceSearch = (
  request: QueryPriceRequestProto
) => Promise<QueryPriceResponseProto[]>;

/** Price Search through the broker with `apiKey`, as fixings.ts reads. */
export function createPriceSearch(apiKey: string): PriceSearch {
  const conn = getServiceConnection(apiKey);
  const client = new PriceClient(conn.url, conn.credentials, {
    interceptors: conn.interceptors,
    ...conn.clientOptions,
  });
  return (request) =>
    new Promise((resolve, reject) => {
      const responses: QueryPriceResponseProto[] = [];
      const stream = client.search(request);
      stream.on("data", (response: QueryPriceResponseProto) =>
        responses.push(response)
      );
      stream.on("end", () => resolve(responses));
      stream.on("error", (err: unknown) => reject(err));
    });
}

/** Whole seconds, as a timestamp the request accepts. Whole seconds keep
 * ZonedDateTime.from's nanos right before 1970 too. */
function timestampAt(seconds: number) {
  return ZonedDateTime.from(new Date(seconds * 1000)).toProto();
}

/** Throws on any error or warning, e.g. "Results limited to 1000 records". */
function rejectWarnings(response: QueryPriceResponseProto): void {
  const summary = response.getErrorsOrWarnings();
  if (!summary) return;
  const problems = [...summary.getErrorsList(), ...summary.getWarningsList()];
  if (!problems.length) return;
  const text = problems
    .map((p) => p.getDetail()?.getMessageForUser() || `code ${p.getCode()}`)
    .join("; ");
  throw new Error(`Price search returned an error or warning: ${text}`);
}

function priceKey(p: PriceProto): string {
  const ts = p.getAsOf()?.getTimestamp();
  return `${
    p.getUuid()?.getRawUuid_asB64() ?? ""
  }|${ts?.getSeconds()}.${ts?.getNanos()}`;
}

/**
 * Every price matching `filter` as of `now`, in no particular order. Each
 * request sets `limit = maxRows`; a batch that comes back with `maxRows`
 * rows, or marked truncated, may have more behind it.
 *
 * 1. Read everything up to `upper` (first `now`) with no lower bound. A
 *    short batch is the rest of the history: stop.
 * 2. Otherwise read the window [upper − span, upper], halving `span` while
 *    the window fills. Keep it, move `upper` to its start, go to 1.
 *
 * Each repeat of step 1 can return a full batch that only says "more", so
 * deep histories cost extra reads; XLK and SPY (under 10,000 closes) take
 * one. Both bounds are inclusive, so a boundary row comes back twice: rows
 * are de-duplicated on (uuid, as_of). No start date is assumed.
 */
export async function readAllPrices(
  search: PriceSearch,
  filter: PositionFilterProto,
  now: Date,
  maxRows = MAX_SEARCH_RESULTS
): Promise<PriceProto[]> {
  const rows = new Map<string, PriceProto>();
  let requests = 0;

  async function read(
    upperS: number,
    lowerS?: number
  ): Promise<{ prices: PriceProto[]; full: boolean }> {
    if (++requests > MAX_REQUESTS) {
      throw new Error(
        `Price search did not finish within ${MAX_REQUESTS} requests`
      );
    }
    const request = new QueryPriceRequestProto();
    stampOwn(request);
    request.setAsOf(timestampAt(upperS));
    request.setSearchPriceInput(filter);
    request.setLimit(maxRows);
    if (lowerS !== undefined) {
      const range = new DateRangeProto();
      stampOwn(range);
      range.setStart(timestampAt(lowerS));
      range.setEnd(timestampAt(upperS));
      request.setDateRange(range);
    }
    const responses = await search(request);
    const prices: PriceProto[] = [];
    let truncated = false;
    for (const response of responses) {
      rejectWarnings(response);
      truncated ||= response.getTruncated();
      prices.push(...response.getPriceResponseList());
    }
    return { prices, full: truncated || prices.length >= maxRows };
  }

  const keep = (prices: PriceProto[]) => {
    for (const p of prices) rows.set(priceKey(p), p);
  };

  // Round up so a close stamped within `now`'s last second is included.
  let upperS = Math.ceil(now.getTime() / 1000);
  let spanS = INITIAL_SPAN_S;
  for (;;) {
    const open = await read(upperS);
    keep(open.prices);
    if (!open.full) break;

    for (;;) {
      const window = await read(upperS, upperS - spanS);
      if (!window.full) {
        keep(window.prices);
        break;
      }
      spanS = Math.floor(spanS / 2);
      if (spanS < MIN_SPAN_S) {
        throw new Error(
          `Prices too dense to read under ${maxRows} rows per request`
        );
      }
    }
    upperS -= spanS;
  }
  return [...rows.values()];
}

function asOfMillis(p: PriceProto): number {
  const ts = p.getAsOf()?.getTimestamp();
  if (!ts) throw new Error("Price search returned a price with no as_of");
  return ts.getSeconds() * 1000 + Math.floor(ts.getNanos() / 1e6);
}

function closeOf(p: PriceProto): number {
  const value = fromDecimalProto(p.getPrice());
  if (!value) throw new Error("Price search returned a price with no value");
  return Number(value);
}

export async function fetchClosesByTicker(
  ticker: string,
  apiKey: string
): Promise<Close[]> {
  // An identifier filter means one security search, no issuer fan-out.
  const matches = await FetchSecurity(
    null,
    null,
    ticker,
    "EXCH_TICKER",
    undefined,
    undefined,
    apiKey
  );
  const sec = matches.find((s) => s.uuidHex && s.uuidStr);
  if (!sec) return [];

  const filter = new PositionFilter();
  // Same cast as /data/prices: the wrapper's addObjectFilter declares only
  // Identifier, but the runtime accepts a UUID for SECURITY_ID.
  filter.addObjectFilter(
    FieldProto.SECURITY_ID,
    new UUID(UUID.fromString(sec.uuidStr!)) as unknown as Identifier
  );

  const protos = await readAllPrices(
    createPriceSearch(apiKey),
    filter.toProto(),
    new Date()
  );
  // Sort on the timestamp before it is dropped.
  return protos
    .map((p) => ({ asOfMs: asOfMillis(p), close: closeOf(p) }))
    .sort((a, b) => a.asOfMs - b.asOfMs)
    .map(({ asOfMs, close }) => ({
      date: new Date(asOfMs).toISOString().slice(0, 10),
      close,
    }));
}
