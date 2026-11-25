/**
 * US-350: free-tips reads every stored price for the TIPS through
 * closes.ts's chunked reader, not just the price service's default 1,000,
 * and a read cut short throws instead of returning a partial list. The
 * price Search is the shared fake (helpers/fakePriceSearch.ts), which fails
 * any request whose limit is unset, 0 or over 10,000.
 */
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({ createPriceSearch: vi.fn() }));

vi.mock("$lib/server/closes", async (importOriginal) => ({
  ...(await importOriginal<typeof import("$lib/server/closes")>()),
  createPriceSearch: mocks.createPriceSearch,
}));

import {
  fetchLatestRealCleanPrice,
  fetchRealCleanPrices,
} from "$lib/server/free-tips";
import { PriceHistoryIncompleteError } from "$lib/server/closes";
import {
  DAY_S,
  dailyRows,
  expectLimitsWithinCeiling,
  fakeSearch,
  warning,
  type Row,
} from "./helpers/fakePriceSearch";

const NOW = new Date("2026-11-25T15:00:00Z");
const KEY = "key-350";
const SECURITY_UUID = "0a10c0ff-ee00-4000-8000-000000000350";

/** `count` daily prices, the last on 2026-11-24. */
function rowsEndingYesterday(count: number): Row[] {
  const first = new Date(Date.parse("2026-11-24") - (count - 1) * DAY_S * 1000)
    .toISOString()
    .slice(0, 10);
  return dailyRows(first, count);
}

/** 1,000 rows plus the notice the service sends with its default cap. */
function truncatedFake() {
  return fakeSearch(rowsEndingYesterday(1_000), {
    summaryOnCall: {
      call: 1,
      summary: warning("Results limited to 1000 records"),
    },
  });
}

let fake: ReturnType<typeof fakeSearch>;

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(NOW);
  mocks.createPriceSearch.mockReset().mockImplementation(() => fake.search);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("fetchRealCleanPrices", () => {
  test("2,500 stored prices: all of them, oldest first, no duplicates", async () => {
    fake = fakeSearch(rowsEndingYesterday(2_500));

    const prices = await fetchRealCleanPrices(SECURITY_UUID, KEY, NOW);

    expect(prices).toHaveLength(2_500);
    for (let i = 1; i < prices.length; i++) {
      expect(prices[i].at, `row ${i}`).toBeGreaterThan(prices[i - 1].at);
    }
    expect(prices[0].value).toBe("100.25");
    expect(prices.at(-1)).toMatchObject({
      value: "2599.25",
      date: "2026-11-24",
    });
    expect(mocks.createPriceSearch).toHaveBeenCalledWith(KEY);
    expectLimitsWithinCeiling(fake.calls);
  });

  test("1,000 rows with a truncation notice: rejects, no partial list", async () => {
    fake = truncatedFake();
    let prices: unknown = "not returned";

    await expect(
      fetchRealCleanPrices(SECURITY_UUID, KEY, NOW).then((p) => (prices = p))
    ).rejects.toThrow(PriceHistoryIncompleteError);
    expect(prices, "no partial list").toBe("not returned");
    expectLimitsWithinCeiling(fake.calls);
  });
});

describe("fetchLatestRealCleanPrice", () => {
  test("without the notice, the same 1,000 rows give yesterday's price", async () => {
    fake = fakeSearch(rowsEndingYesterday(1_000));

    expect(await fetchLatestRealCleanPrice(SECURITY_UUID, KEY, NOW)).toEqual({
      value: "1099.25",
      date: "2026-11-24",
    });
    expectLimitsWithinCeiling(fake.calls);
  });

  test("1,000 rows with a truncation notice: rejects, no latest from partial data", async () => {
    fake = truncatedFake();

    await expect(
      fetchLatestRealCleanPrice(SECURITY_UUID, KEY, NOW)
    ).rejects.toThrow(/Results limited to 1000 records/);
    expectLimitsWithinCeiling(fake.calls);
  });
});
