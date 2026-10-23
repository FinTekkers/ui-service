/**
 * US-211: the `/data/portfolios` load primes the cached portfolio universe
 * from its own search. A failed search must keep the previously primed
 * cache; a good search must prime only rows with an ID and a name.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const searchPortfolio = vi.fn();

vi.mock(
  "@fintekkers/ledger-models/node/wrappers/services/portfolio-service/PortfolioService",
  () => ({
    PortfolioService: vi.fn().mockImplementation(() => ({ searchPortfolio })),
  })
);
vi.mock("$lib/entity-delete", () => ({ deleteEntity: vi.fn() }));
vi.mock("$lib/transactions", () => ({ FetchTransactionByPortfolio: vi.fn() }));

import { load } from "../routes/(authenticated)/data/portfolios/+page.server";
import {
  FetchPortfolioUniverse,
  clearPortfolioUniverseCache,
  primePortfolioUniverseCache,
} from "../lib/portfolios";

function fakePortfolio(id: string, name: string) {
  return {
    proto: undefined,
    getPortfolioName: () => name,
    getAsOf: () => ({ toString: () => "2026-10-13" }),
    getID: () => ({ toString: () => id }),
  };
}

const event = {
  locals: { user: { apiKey: "key-load" } },
  url: new URL("https://www.fintekkers.org/data/portfolios"),
};

describe("/data/portfolios load primes the portfolio universe (US-211)", () => {
  beforeEach(() => {
    clearPortfolioUniverseCache();
    searchPortfolio.mockReset();
  });

  it("a failed search leaves a previously primed cache unchanged", async () => {
    primePortfolioUniverseCache("key-load", [
      { portfolioId: "id-a", portfolioName: "Alpha" },
    ]);
    searchPortfolio.mockRejectedValue(new Error("broker unavailable"));

    const result = await load(event as any);

    expect(result.portfolioData[0].portfolioName).toBe(
      "Error: broker unavailable"
    );
    const universe = await FetchPortfolioUniverse("key-load");
    expect(universe).toEqual([{ portfolioId: "id-a", portfolioName: "Alpha" }]);
  });

  it("a good search primes only rows with both an ID and a name", async () => {
    primePortfolioUniverseCache("key-load", [
      { portfolioId: "id-old", portfolioName: "Old" },
    ]);
    searchPortfolio.mockResolvedValue([
      fakePortfolio("id-b", "qa-221-probe-123"),
      fakePortfolio("", "No ID"),
      fakePortfolio("id-c", ""),
      fakePortfolio("id-a", "Alpha"),
    ]);

    await load(event as any);

    const universe = await FetchPortfolioUniverse("key-load");
    expect(universe).toEqual([
      { portfolioId: "id-a", portfolioName: "Alpha" },
      { portfolioId: "id-b", portfolioName: "qa-221-probe-123" },
    ]);
    expect(searchPortfolio).toHaveBeenCalledTimes(1);
  });
});
