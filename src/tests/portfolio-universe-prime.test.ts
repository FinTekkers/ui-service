/**
 * US-211: `/data/portfolios` primes the cached portfolio universe so e2e
 * probe portfolios are visible to the transactions and positions filters
 * immediately (no 5-minute cache wait in tests).
 */
import { describe, expect, it } from "vitest";
import {
  FetchPortfolioUniverse,
  clearPortfolioUniverseCache,
  primePortfolioUniverseCache,
} from "../lib/portfolios";

describe("primePortfolioUniverseCache (US-211)", () => {
  it("primed entries are returned by FetchPortfolioUniverse without a fetch", async () => {
    clearPortfolioUniverseCache();
    primePortfolioUniverseCache(undefined, [
      { portfolioId: "id-b", portfolioName: "Beta" },
      { portfolioId: "id-a", portfolioName: "Alpha" },
    ]);
    const universe = await FetchPortfolioUniverse(undefined);
    expect(universe.map((e) => e.portfolioName)).toEqual(["Alpha", "Beta"]);
  });

  it("re-priming with the index rows replaces a stale cache", async () => {
    clearPortfolioUniverseCache();
    primePortfolioUniverseCache(undefined, [
      { portfolioId: "id-old", portfolioName: "Old" },
    ]);
    primePortfolioUniverseCache(undefined, [
      { portfolioId: "id-new", portfolioName: "qa-221-probe-xyz" },
      { portfolioId: "id-old", portfolioName: "Old" },
    ]);
    const universe = await FetchPortfolioUniverse(undefined);
    expect(universe.some((e) => e.portfolioName === "qa-221-probe-xyz")).toBe(
      true
    );
  });

  it("dedupes streamed versions on portfolioId, like FetchPortfolioUniverse", async () => {
    clearPortfolioUniverseCache();
    primePortfolioUniverseCache(undefined, [
      { portfolioId: "id-a", portfolioName: "Alpha" },
      { portfolioId: "id-a", portfolioName: "Alpha" },
      { portfolioId: "id-b", portfolioName: "Beta" },
    ]);
    const universe = await FetchPortfolioUniverse(undefined);
    expect(universe.map((e) => e.portfolioId)).toEqual(["id-a", "id-b"]);
  });

  it("cache entries are keyed by apiKey", async () => {
    clearPortfolioUniverseCache();
    primePortfolioUniverseCache("key-a", [
      { portfolioId: "id-a", portfolioName: "Alpha" },
    ]);
    const universe = await FetchPortfolioUniverse("key-a");
    expect(universe.map((e) => e.portfolioName)).toEqual(["Alpha"]);
    clearPortfolioUniverseCache();
  });
});
