/**
 * US-211: the /data/portfolios index refreshes the cached portfolio
 * universe, so a portfolio created after another page warmed the cache is
 * visible to the transactions and positions filters straight away.
 *
 * @vitest-environment node
 */
import { afterEach, describe, expect, test } from "vitest";
import {
  FetchPortfolioUniverse,
  clearPortfolioUniverseCache,
  primePortfolioUniverseCache,
} from "$lib/portfolios";

afterEach(() => clearPortfolioUniverseCache());

describe("primePortfolioUniverseCache", () => {
  test("replaces the cached universe for that API key, deduped and sorted", async () => {
    primePortfolioUniverseCache("key-a", [
      { portfolioId: "old", portfolioName: "Old" },
    ]);
    primePortfolioUniverseCache("key-a", [
      { portfolioId: "2", portfolioName: "zeta" },
      { portfolioId: "1", portfolioName: "alpha" },
      { portfolioId: "1", portfolioName: "alpha" },
      { portfolioId: "", portfolioName: "no id" },
      { portfolioId: "3", portfolioName: "" },
    ]);
    // Served from the cache: no portfolio service is running here.
    expect(await FetchPortfolioUniverse("key-a")).toEqual([
      { portfolioId: "1", portfolioName: "alpha" },
      { portfolioId: "2", portfolioName: "zeta" },
    ]);
  });

  test("leaves other API keys' caches alone", async () => {
    primePortfolioUniverseCache("key-a", [
      { portfolioId: "1", portfolioName: "alpha" },
    ]);
    primePortfolioUniverseCache("key-b", [
      { portfolioId: "2", portfolioName: "beta" },
    ]);
    expect(await FetchPortfolioUniverse("key-a")).toEqual([
      { portfolioId: "1", portfolioName: "alpha" },
    ]);
  });
});
