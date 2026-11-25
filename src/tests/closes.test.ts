/**
 * US-347: closes.ts reads every stored close, not just the price service's
 * default 1,000. A fake Search mirrors price-service-rust's grpc.rs: as_of
 * and date_range bounds are inclusive, rows are the newest first then
 * `take(limit)`, `limit < 1` gives 1,000 rows plus a warning, a larger
 * limit is clamped to 10,000 without one, and `truncated` marks a response
 * that left rows behind. The fake asserts on every call that the request's
 * limit is 1..10,000 and that it returns at most 10,000 rows.
 */
import { EventEmitter } from "events";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  BROKER: { url: "broker.sentinel:8085", credentials: { broker: true } },
  FetchSecurity: vi.fn(),
  PriceClient: vi.fn(),
  getServiceConnection: vi.fn(),
}));

vi.mock("$lib/grpc-auth", () => ({
  getServiceConnection: mocks.getServiceConnection,
}));
vi.mock("$lib/security", () => ({ FetchSecurity: mocks.FetchSecurity }));
vi.mock(
  "@fintekkers/ledger-models/node/fintekkers/services/price-service/price_service_grpc_pb.js",
  () => ({ PriceClient: mocks.PriceClient })
);

import { PriceProto } from "@fintekkers/ledger-models/node/fintekkers/models/price/price_pb.js";
import { QueryPriceResponseProto } from "@fintekkers/ledger-models/node/fintekkers/requests/price/query_price_response_pb.js";
import type { QueryPriceRequestProto } from "@fintekkers/ledger-models/node/fintekkers/requests/price/query_price_request_pb.js";
import { PositionFilterProto } from "@fintekkers/ledger-models/node/fintekkers/models/position/position_filter_pb.js";
import { SummaryProto } from "@fintekkers/ledger-models/node/fintekkers/requests/util/errors/summary_pb.js";
import {
  ErrorProto,
  WarningProto,
} from "@fintekkers/ledger-models/node/fintekkers/requests/util/errors/error_pb.js";
import { Message } from "@fintekkers/ledger-models/node/fintekkers/requests/util/errors/message_pb.js";
import { UUIDProto } from "@fintekkers/ledger-models/node/fintekkers/models/util/uuid_pb.js";
import { LocalTimestampProto } from "@fintekkers/ledger-models/node/fintekkers/models/util/local_timestamp_pb.js";
import { Timestamp } from "google-protobuf/google/protobuf/timestamp_pb.js";
import { toDecimalProto } from "$lib/decimal";
import {
  MAX_SEARCH_RESULTS,
  fetchClosesByTicker,
  readAllPrices,
  type PriceSearch,
} from "$lib/server/closes";

const NOW = new Date("2026-11-25T15:00:00Z");
const DAY_S = 24 * 60 * 60;
const SPY = {
  identifier: "SPY",
  uuidHex: "0a10c0ffee",
  uuidStr: "0a10c0ff-ee00-4000-8000-000000000005",
};

type Row = { seconds: number; proto: PriceProto };

function uuidBytes(n: number): Uint8Array {
  const bytes = new Uint8Array(16);
  new DataView(bytes.buffer).setUint32(12, n);
  return bytes;
}

function row(seconds: number, close: string, id: number): Row {
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
function dailyRows(firstDate: string, count: number, stepDays = 1): Row[] {
  const first = Date.parse(`${firstDate}T20:00:00Z`) / 1000;
  return Array.from({ length: count }, (_, i) =>
    row(first + Math.floor(i * stepDays) * DAY_S, `${100 + i}.25`, i + 1)
  );
}

/** 8,500 closes from 1993-01-29 to Nov 2026, as SPY holds after MDI-162. */
function spyRows(): Row[] {
  const span = (Date.parse("2026-11-24") - Date.parse("1993-01-29")) / 1000;
  return dailyRows("1993-01-29", 8_500, span / DAY_S / 8_500);
}

function seconds(ts: LocalTimestampProto | undefined): number | undefined {
  return ts?.getTimestamp()?.getSeconds();
}

function warning(text: string): SummaryProto {
  return new SummaryProto().setWarningsList([
    new WarningProto().setDetail(new Message().setMessageForUser(text)),
  ]);
}

type FakeOptions = {
  /** The response to call `n` (1-based) carries this summary. */
  summaryOnCall?: { call: number; summary: SummaryProto };
  /** A lower silent cap than MAX_SEARCH_RESULTS. */
  serverCap?: number;
  /** Take the oldest rows instead of the newest. */
  oldestFirst?: boolean;
};

/** A price Search over `rows`, as price-service-rust answers it. */
function fakeSearch(rows: Row[], options: FakeOptions = {}) {
  const newestFirst = [...rows].sort((a, b) => b.seconds - a.seconds);
  const calls: { limit: number; returned: number }[] = [];
  const search: PriceSearch = async (request: QueryPriceRequestProto) => {
    const limit = request.getLimit();
    expect(limit, "request limit").toBeGreaterThanOrEqual(1);
    expect(limit, "request limit").toBeLessThanOrEqual(MAX_SEARCH_RESULTS);

    const asOf = seconds(request.getAsOf()) ?? Infinity;
    const range = request.getDateRange();
    const lower = seconds(range?.getStart()) ?? -Infinity;
    const upper = Math.min(asOf, seconds(range?.getEnd()) ?? Infinity);
    let matched = newestFirst.filter(
      (r) => r.seconds >= lower && r.seconds <= upper
    );
    if (options.oldestFirst) matched = matched.reverse();

    let summary: SummaryProto | undefined;
    let cap = Math.min(limit, options.serverCap ?? MAX_SEARCH_RESULTS);
    if (limit < 1) {
      cap = 1_000;
      summary = warning("Results limited to 1000 records");
    }
    const page = matched.slice(0, cap);
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

function sortedSeconds(protos: PriceProto[]): number[] {
  return protos
    .map((p) => p.getAsOf()!.getTimestamp()!.getSeconds())
    .sort((a, b) => a - b);
}

function expectExactly(protos: PriceProto[], rows: Row[]) {
  const got = sortedSeconds(protos);
  expect(new Set(got).size, "no duplicates").toBe(got.length);
  expect(got).toEqual(rows.map((r) => r.seconds).sort((a, b) => a - b));
}

const FILTER = new PositionFilterProto();

describe("fetchClosesByTicker, through the broker PriceClient", () => {
  let fake: ReturnType<typeof fakeSearch>;
  let streamError: Error | null;

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(NOW);
    streamError = null;
    mocks.FetchSecurity.mockReset().mockResolvedValue([SPY]);
    mocks.getServiceConnection.mockReset().mockReturnValue(mocks.BROKER);
    mocks.PriceClient.mockReset().mockImplementation(() => ({
      search: (request: QueryPriceRequestProto) => {
        const stream = new EventEmitter();
        setImmediate(async () => {
          try {
            for (const r of await fake.search(request)) stream.emit("data", r);
            if (streamError) stream.emit("error", streamError);
            else stream.emit("end");
          } catch (e) {
            stream.emit("error", e);
          }
        });
        return stream;
      },
    }));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("8,500 closes from 1993: all of them, ascending, one request", async () => {
    const rows = spyRows();
    fake = fakeSearch(rows);

    const closes = await fetchClosesByTicker("SPY", "key-123");

    expect(closes).toHaveLength(8_500);
    expect(closes[0]).toEqual({ date: "1993-01-29", close: 100.25 });
    expect(closes.at(-1)!.date).toBe("2026-11-22");
    expect(closes.at(-1)!.close).toBe(8_599.25);
    const dates = closes.map((c) => c.date);
    for (let i = 1; i < dates.length; i++) {
      expect(dates[i] > dates[i - 1], `${dates[i - 1]} < ${dates[i]}`).toBe(
        true
      );
    }
    expect(fake.calls).toEqual([
      { limit: MAX_SEARCH_RESULTS, returned: 8_500 },
    ]);
    expect(mocks.getServiceConnection).toHaveBeenCalledWith("key-123");
    expect(mocks.PriceClient).toHaveBeenCalledWith(
      mocks.BROKER.url,
      mocks.BROKER.credentials,
      expect.anything()
    );
  });

  test("a warning in errors_or_warnings rejects, with no partial closes", async () => {
    fake = fakeSearch(spyRows(), {
      summaryOnCall: {
        call: 1,
        summary: warning("Results limited to 1000 records"),
      },
    });
    await expect(fetchClosesByTicker("SPY", "key-123")).rejects.toThrow(
      /Results limited to 1000 records/
    );
  });

  test("a stream error after some data rejects", async () => {
    fake = fakeSearch(spyRows());
    streamError = new Error("14 UNAVAILABLE");
    await expect(fetchClosesByTicker("SPY", "key-123")).rejects.toThrow(
      "14 UNAVAILABLE"
    );
  });

  test("an unknown ticker gives [] and no price search", async () => {
    mocks.FetchSecurity.mockResolvedValue([]);
    fake = fakeSearch([]);
    expect(await fetchClosesByTicker("NOPE", "key-123")).toEqual([]);
    expect(mocks.PriceClient).not.toHaveBeenCalled();
  });
});

describe("readAllPrices", () => {
  test("8,500 closes at 1,000 rows a request: windows split, every close once", async () => {
    const rows = spyRows();
    const fake = fakeSearch(rows);

    const prices = await readAllPrices(fake.search, FILTER, NOW, 1_000);

    expectExactly(prices, rows);
    expect(fake.calls.length).toBeGreaterThan(9);
    expect(fake.calls.every((c) => c.limit === 1_000)).toBe(true);
  });

  test("exactly maxRows closes: the full first batch keeps reading, then stops", async () => {
    const rows = dailyRows("2023-01-03", 1_000);
    const fake = fakeSearch(rows);

    const prices = await readAllPrices(fake.search, FILTER, NOW, 1_000);

    expectExactly(prices, rows);
    expect(fake.calls.length).toBeGreaterThan(1);
  });

  test("27,800 closes from 1950: none before 1993 is lost", async () => {
    const rows = dailyRows("1950-01-03", 27_800);
    const fake = fakeSearch(rows);

    const prices = await readAllPrices(fake.search, FILTER, NOW);

    expectExactly(prices, rows);
    const first = new Date(sortedSeconds(prices)[0] * 1000);
    expect(first.toISOString().slice(0, 10)).toBe("1950-01-03");
    expect(fake.calls.length).toBeGreaterThan(1);
  });

  test("a warning on a later request rejects; gathered rows are not returned", async () => {
    const fake = fakeSearch(dailyRows("1950-01-03", 27_800), {
      summaryOnCall: {
        call: 3,
        summary: warning("Results limited to 1000 records"),
      },
    });
    await expect(
      readAllPrices(fake.search, FILTER, NOW, 1_000)
    ).rejects.toThrow(/Results limited to 1000 records/);
    expect(fake.calls).toHaveLength(3);
  });

  test("an error in errors_or_warnings rejects", async () => {
    const summary = new SummaryProto().setErrorsList([
      new ErrorProto().setDetail(new Message().setMessageForUser("bad filter")),
    ]);
    const fake = fakeSearch(spyRows(), { summaryOnCall: { call: 1, summary } });
    await expect(readAllPrices(fake.search, FILTER, NOW)).rejects.toThrow(
      /bad filter/
    );
  });

  test("a response marked truncated under a lower server cap keeps reading", async () => {
    const rows = spyRows();
    const fake = fakeSearch(rows, { serverCap: 3_000 });

    const prices = await readAllPrices(fake.search, FILTER, NOW);

    expectExactly(prices, rows);
  });

  test("oldest-first server order: still every close once", async () => {
    const rows = spyRows();
    const fake = fakeSearch(rows, { oldestFirst: true });

    expectExactly(await readAllPrices(fake.search, FILTER, NOW, 1_000), rows);
  });

  test("two prices on one as_of with different uuids are both kept", async () => {
    const at = Date.parse("2026-11-24T20:00:00Z") / 1000;
    const rows = [row(at, "101.5", 1), row(at, "101.6", 2)];
    const prices = await readAllPrices(fakeSearch(rows).search, FILTER, NOW);
    expect(prices).toHaveLength(2);
  });

  test("no closes: [] in one request", async () => {
    const fake = fakeSearch([]);
    expect(await readAllPrices(fake.search, FILTER, NOW)).toEqual([]);
    expect(fake.calls).toHaveLength(1);
  });

  test("more rows on one timestamp than a request can hold rejects", async () => {
    const at = Date.parse("2026-11-24T20:00:00Z") / 1000;
    const rows = Array.from({ length: 30 }, (_, i) => row(at, "1", i + 1));
    await expect(
      readAllPrices(fakeSearch(rows).search, FILTER, NOW, 10)
    ).rejects.toThrow(/too dense/);
  });
});
