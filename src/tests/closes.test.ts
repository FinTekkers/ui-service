/**
 * US-347: closes.ts reads every stored close, not just the price service's
 * default 1,000. The fake Search in helpers/fakePriceSearch.ts mirrors
 * price-service-rust's grpc.rs and fails every call whose limit is unset
 * (the service's silent 1,000-row default), 0 or over 10,000.
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

import type { PriceProto } from "@fintekkers/ledger-models/node/fintekkers/models/price/price_pb.js";
import { QueryPriceRequestProto } from "@fintekkers/ledger-models/node/fintekkers/requests/price/query_price_request_pb.js";
import { PositionFilterProto } from "@fintekkers/ledger-models/node/fintekkers/models/position/position_filter_pb.js";
import {
  MAX_SEARCH_RESULTS,
  fetchClosesByTicker,
  readAllPrices,
} from "$lib/server/closes";
import {
  DAY_S,
  dailyRows,
  fakeSearch,
  row,
  warning,
  type Row,
} from "./helpers/fakePriceSearch";

const NOW = new Date("2026-11-25T15:00:00Z");
const SPY = {
  identifier: "SPY",
  uuidHex: "0a10c0ffee",
  uuidStr: "0a10c0ff-ee00-4000-8000-000000000005",
};

/** 8,500 closes from 1993-01-29 to Nov 2026, as SPY holds after MDI-162. */
function spyRows(): Row[] {
  const span = (Date.parse("2026-11-24") - Date.parse("1993-01-29")) / 1000;
  return dailyRows("1993-01-29", 8_500, span / DAY_S / 8_500);
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
    expect(new Set(closes.map((c) => c.date)).size, "distinct dates").toBe(
      8_500
    );
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
    let closes: unknown = "not returned";
    await expect(
      fetchClosesByTicker("SPY", "key-123").then((c) => (closes = c))
    ).rejects.toThrow(/Results limited to 1000 records/);
    expect(closes, "no partial closes").toBe("not returned");
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
  test("the fake refuses a request with no limit, 0 or over 10,000", async () => {
    const fake = fakeSearch(spyRows());
    for (const limit of [undefined, 0, MAX_SEARCH_RESULTS + 1]) {
      const request = new QueryPriceRequestProto();
      if (limit !== undefined) request.setLimit(limit);
      await expect(fake.search(request), `limit ${limit}`).rejects.toThrow(
        /request limit/
      );
    }
  });

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
    let prices: unknown = "not returned";
    await expect(
      readAllPrices(fake.search, FILTER, NOW, 1_000).then((p) => (prices = p))
    ).rejects.toThrow(/Results limited to 1000 records/);
    expect(prices, "no partial rows").toBe("not returned");
    expect(fake.calls).toHaveLength(3);
  });

  test("oldest-first server order: still every close once", async () => {
    const rows = spyRows();
    const fake = fakeSearch(rows, { oldestFirst: true });

    expectExactly(await readAllPrices(fake.search, FILTER, NOW, 1_000), rows);
  });

  test("more rows on one timestamp than a request can hold rejects", async () => {
    const at = Date.parse("2026-11-24T20:00:00Z") / 1000;
    const rows = Array.from({ length: 30 }, (_, i) => row(at, "1", i + 1));
    await expect(
      readAllPrices(fakeSearch(rows).search, FILTER, NOW, 10)
    ).rejects.toThrow(/too dense/);
  });
});
