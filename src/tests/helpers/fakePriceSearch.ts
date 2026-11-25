/**
 * A fake price Search shared by closes.test.ts (US-347) and the US-350
 * free-tips and /data/prices tests. It mirrors price-service-rust's
 * grpc.rs: as_of and date_range bounds are inclusive (upper = min(as_of,
 * range.end)), rows are the newest first then `take(limit)`, and
 * `truncated` marks a response that left rows behind. It fails every call
 * whose limit is unset (the service's silent 1,000-row default), 0 or over
 * 10,000, and any response of more than 10,000 rows.
 */
import { expect } from "vitest";
import { PriceProto } from "@fintekkers/ledger-models/node/fintekkers/models/price/price_pb.js";
import { QueryPriceResponseProto } from "@fintekkers/ledger-models/node/fintekkers/requests/price/query_price_response_pb.js";
import type { QueryPriceRequestProto } from "@fintekkers/ledger-models/node/fintekkers/requests/price/query_price_request_pb.js";
import { SummaryProto } from "@fintekkers/ledger-models/node/fintekkers/requests/util/errors/summary_pb.js";
import { WarningProto } from "@fintekkers/ledger-models/node/fintekkers/requests/util/errors/error_pb.js";
import { Message } from "@fintekkers/ledger-models/node/fintekkers/requests/util/errors/message_pb.js";
import { UUIDProto } from "@fintekkers/ledger-models/node/fintekkers/models/util/uuid_pb.js";
import { LocalTimestampProto } from "@fintekkers/ledger-models/node/fintekkers/models/util/local_timestamp_pb.js";
import { Timestamp } from "google-protobuf/google/protobuf/timestamp_pb.js";
import { toDecimalProto } from "$lib/decimal";
import { MAX_SEARCH_RESULTS, type PriceSearch } from "$lib/server/closes";

export const DAY_S = 24 * 60 * 60;

export type Row = { seconds: number; proto: PriceProto };

function uuidBytes(n: number): Uint8Array {
  const bytes = new Uint8Array(16);
  new DataView(bytes.buffer).setUint32(12, n);
  return bytes;
}

export function row(seconds: number, close: string, id: number): Row {
  const asOf = new LocalTimestampProto()
    .setTimestamp(new Timestamp().setSeconds(seconds).setNanos(0))
    .setTimeZone("America/New_York");
  const proto = new PriceProto()
    .setUuid(new UUIDProto().setRawUuid(uuidBytes(id)))
    .setAsOf(asOf)
    .setPrice(toDecimalProto(close));
  return { seconds, proto };
}

/** `count` closes at 20:00Z, `firstDate` first, `stepDays` apart. */
export function dailyRows(
  firstDate: string,
  count: number,
  stepDays = 1
): Row[] {
  const first = Date.parse(`${firstDate}T20:00:00Z`) / 1000;
  return Array.from({ length: count }, (_, i) =>
    row(first + Math.floor(i * stepDays) * DAY_S, `${100 + i}.25`, i + 1)
  );
}

function seconds(ts: LocalTimestampProto | undefined): number | undefined {
  return ts?.getTimestamp()?.getSeconds();
}

export function warning(text: string): SummaryProto {
  return new SummaryProto().setWarningsList([
    new WarningProto().setDetail(new Message().setMessageForUser(text)),
  ]);
}

export type FakeOptions = {
  /** The response to call `n` (1-based) carries this summary. */
  summaryOnCall?: { call: number; summary: SummaryProto };
  /** Take the oldest rows instead of the newest. */
  oldestFirst?: boolean;
};

/** A price Search over `rows`, as price-service-rust answers it. */
export function fakeSearch(rows: Row[], options: FakeOptions = {}) {
  const newestFirst = [...rows].sort((a, b) => b.seconds - a.seconds);
  const calls: { limit: number; returned: number }[] = [];
  const search: PriceSearch = async (request: QueryPriceRequestProto) => {
    const limit = request.getLimit();
    expect(limit, "request limit").toBeGreaterThanOrEqual(1);
    expect(limit, "request limit").toBeLessThanOrEqual(MAX_SEARCH_RESULTS);

    // grpc.rs reads up to min(as_of, date_range.end): the request's as_of is
    // an inclusive upper bound. Without it every open read would return the
    // same newest rows.
    const asOf = seconds(request.getAsOf()) ?? Infinity;
    const range = request.getDateRange();
    const lower = seconds(range?.getStart()) ?? -Infinity;
    const upper = Math.min(asOf, seconds(range?.getEnd()) ?? Infinity);
    let matched = newestFirst.filter(
      (r) => r.seconds >= lower && r.seconds <= upper
    );
    if (options.oldestFirst) matched = matched.reverse();

    let summary: SummaryProto | undefined;
    const page = matched.slice(0, Math.min(limit, MAX_SEARCH_RESULTS));
    calls.push({ limit, returned: page.length });
    expect(page.length, "rows in one response").toBeLessThanOrEqual(
      MAX_SEARCH_RESULTS
    );
    if (options.summaryOnCall?.call === calls.length) {
      summary = options.summaryOnCall.summary;
    }

    const response = new QueryPriceResponseProto()
      .setPriceResponseList(page.map((r) => r.proto))
      .setTruncated(matched.length > page.length);
    if (summary) response.setErrorsOrWarnings(summary);
    return [response];
  };
  return { search, calls };
}

/** Metric 5 (US-350): at least one request, each with 1 ≤ limit ≤ 10,000. */
export function expectLimitsWithinCeiling(calls: { limit: number }[]) {
  expect(calls.length, "captured requests").toBeGreaterThanOrEqual(1);
  for (const { limit } of calls) {
    expect(limit, "request limit").toBeGreaterThanOrEqual(1);
    expect(limit, "request limit").toBeLessThanOrEqual(MAX_SEARCH_RESULTS);
  }
}
