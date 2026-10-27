/**
 * US-291: what the positions and transactions loads send as the trade-date
 * filter, and the Business date state they return for the control.
 *
 * - Every positions return path carries `businessDate` (metric 1).
 * - Tax Lot sends no trade-date filter, even with businessDate or old
 *   tradeDate params in the URL (metric 3).
 * - "Today" is one date for the fetcher and the page data, either side of
 *   midnight UTC (guardrail 3).
 */
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const { FetchPosition, FetchTransaction, FetchTransactionByPortfolio } =
  vi.hoisted(() => ({
    FetchPosition: vi.fn(),
    FetchTransaction: vi.fn(),
    FetchTransactionByPortfolio: vi.fn(),
  }));

vi.mock("$lib/positions", () => ({ FetchPosition }));
vi.mock("$lib/transactions", () => ({
  FetchTransaction,
  FetchTransactionByPortfolio,
}));
vi.mock("$lib/entity-delete", () => ({ deleteEntity: vi.fn() }));
vi.mock("$lib/portfolios", () => ({
  FetchPortfolioUniverse: vi.fn().mockResolvedValue([]),
}));

import { load as positionsLoad } from "../routes/(authenticated)/data/positions/+page.server";
import { load as transactionsLoad } from "../routes/(authenticated)/data/transactions/+page.server";

const FULL = {
  fields: "SECURITY_DESCRIPTION",
  measures: "DIRECTED_QUANTITY",
  positionView: "DEFAULT_VIEW",
  positionType: "TRANSACTION",
};

async function loadPositions(params: Record<string, string>): Promise<any> {
  const qs = new URLSearchParams(params).toString();
  return positionsLoad({
    locals: { user: { apiKey: "key" } },
    request: { url: `http://localhost/data/positions?${qs}` },
  } as any);
}

async function loadTransactions(params: Record<string, string>): Promise<any> {
  const url = new URL("http://localhost/data/transactions");
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return transactionsLoad({
    locals: { user: { apiKey: "key" } },
    url,
  } as any);
}

// FetchPosition(requestData, view, type, sortBy, sortDirection, identifier,
//               tradeDate, tradeDateOperator, …)
const positionTradeDateArgs = () => FetchPosition.mock.calls[0].slice(6, 8);

beforeEach(() => {
  FetchPosition.mockReset().mockResolvedValue([]);
  FetchTransaction.mockReset().mockResolvedValue([]);
  FetchTransactionByPortfolio.mockReset().mockResolvedValue([]);
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.useRealTimers();
});

describe("positions load: businessDate on every return path", () => {
  test.each([
    ["bare URL", {}],
    [
      "fields and measures missing",
      { positionView: "DEFAULT_VIEW", positionType: "TRANSACTION" },
    ],
    [
      "position view/type missing",
      { fields: "SECURITY_DESCRIPTION", measures: "DIRECTED_QUANTITY" },
    ],
  ])("%s returns businessDate in date mode", async (_name, params) => {
    const data = await loadPositions(params);
    expect(FetchPosition).not.toHaveBeenCalled();
    expect(data.businessDate).toBeDefined();
    expect(data.businessDate.mode).toBe("date");
    expect(data.businessDate.date).toBe(data.businessDate.today);
  });

  test("full request returns businessDate", async () => {
    const data = await loadPositions(FULL);
    expect(FetchPosition).toHaveBeenCalledTimes(1);
    expect(data.businessDate.mode).toBe("date");
  });
});

describe("positions load: Tax Lot sends no trade-date filter", () => {
  test.each([
    ["businessDate", { businessDate: "2026-10-27" }],
    [
      "old tradeDate link",
      { tradeDate: "2026-10-27", tradeDateOperator: "LESS_THAN_OR_EQUALS" },
    ],
  ])("with %s", async (_name, extra) => {
    const data = await loadPositions({
      ...FULL,
      positionType: "TAX_LOT",
      ...extra,
    });
    expect(positionTradeDateArgs()).toEqual([undefined, undefined]);
    expect(data.businessDate.taxLot).toBe(true);
    expect(data.businessDate.mode).toBe("all");
  });
});

describe("positions load: filters", () => {
  test("businessDate=YYYY-MM-DD sends LESS_THAN_OR_EQUALS that date", async () => {
    await loadPositions({ ...FULL, businessDate: "2026-05-06" });
    expect(positionTradeDateArgs()).toEqual([
      "2026-05-06",
      "LESS_THAN_OR_EQUALS",
    ]);
  });

  test("businessDate=all sends no filter", async () => {
    await loadPositions({ ...FULL, businessDate: "all" });
    expect(positionTradeDateArgs()).toEqual([undefined, undefined]);
  });

  test("old tradeDate link sends the same filter as before", async () => {
    await loadPositions({
      ...FULL,
      tradeDate: "2026-05-06",
      tradeDateOperator: "MORE_THAN",
    });
    expect(positionTradeDateArgs()).toEqual(["2026-05-06", "MORE_THAN"]);
  });
});

describe("today is one date for the query and the page data", () => {
  test.each([
    ["2026-10-27T23:59:59Z", "2026-10-27"],
    ["2026-10-28T00:00:00Z", "2026-10-28"],
  ])("positions at %s", async (now, expected) => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(now));
    const data = await loadPositions(FULL);
    expect(positionTradeDateArgs()).toEqual([expected, "LESS_THAN_OR_EQUALS"]);
    expect(data.businessDate.date).toBe(expected);
    expect(data.businessDate.today).toBe(expected);
  });

  test.each([
    ["2026-10-27T23:59:59Z", "2026-10-27"],
    ["2026-10-28T00:00:00Z", "2026-10-28"],
  ])("transactions by portfolio at %s", async (now, expected) => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(now));
    const data = await loadTransactions({ portfolioId: "p-1" });
    expect(FetchTransactionByPortfolio).toHaveBeenCalledWith(
      "p-1",
      "key",
      expected,
      "LESS_THAN_OR_EQUALS"
    );
    expect(data.businessDate.date).toBe(expected);
  });
});

describe("transactions load: filters", () => {
  test("businessDate=all sends no filter", async () => {
    const data = await loadTransactions({ businessDate: "all" });
    expect(FetchTransaction).toHaveBeenCalledWith("key", undefined, undefined);
    expect(data.businessDate.mode).toBe("all");
  });

  test("old tradeDate link sends the same filter as before", async () => {
    await loadTransactions({
      tradeDate: "2026-05-15",
      tradeDateOperator: "LESS_THAN_OR_EQUALS",
    });
    expect(FetchTransaction).toHaveBeenCalledWith(
      "key",
      "2026-05-15",
      "LESS_THAN_OR_EQUALS"
    );
  });
});
