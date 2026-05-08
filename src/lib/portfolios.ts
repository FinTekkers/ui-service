import pkg from '@fintekkers/ledger-models/node/fintekkers/models/position/field_pb.js';
const { FieldProto } = pkg;
import { PositionFilter } from "@fintekkers/ledger-models/node/wrappers/models/position/positionfilter";
import * as dt from "@fintekkers/ledger-models/node/wrappers/models/utils/datetime";
import { PortfolioService } from "@fintekkers/ledger-models/node/wrappers/services/portfolio-service/PortfolioService";

export async function FetchPortfolio(portfolioName: string, apiKey?: string) {
  const now = dt.ZonedDateTime.now();
  const portfolioService = new PortfolioService(apiKey);

  const filterPortfolio: PositionFilter = new PositionFilter();
  // filterPortfolio.addEqualsFilter(FieldProto.PORTFOLIO_NAME, portfolioName);

  try {
    const portfolios = await portfolioService.searchPortfolio(now.toProto(), filterPortfolio);
    const portfolioResults = portfolios.map((portfolio) => ({
      portfolioName: portfolio.getPortfolioName(),
      portfolioAsOf: portfolio.getAsOf().toString(),
      portfolioId: portfolio.getID().toString(),
    }));
    return portfolioResults;
  } catch (error) {
    console.error("Error fetching portfolio data:", error);
    return [];
  }
}

// Phase 3 of second-brain#226: PortfolioFilter primitive needs a list of
// (id, name) pairs to drive autocomplete. Mirrors the FetchSecurityUniverse
// pattern in $lib/security — list-all once, cache for 5 minutes, filter
// client-side. The SOMA seed has one portfolio today; the cache + client-
// side filter scales fine to dozens-to-hundreds without needing a
// per-prefix RPC.
export interface PortfolioUniverseEntry {
  portfolioId: string;     // formatted UUID string
  portfolioName: string;   // human-readable display name
}

const PORTFOLIO_UNIVERSE_TTL_MS = 5 * 60 * 1000;
const portfolioUniverseCache = new Map<string, { value: PortfolioUniverseEntry[]; fetchedAt: number }>();

export function clearPortfolioUniverseCache(): void {
  portfolioUniverseCache.clear();
}

export async function FetchPortfolioUniverse(apiKey?: string): Promise<PortfolioUniverseEntry[]> {
  const cacheKey = apiKey ?? '__no_key__';
  const cached = portfolioUniverseCache.get(cacheKey);
  if (cached && Date.now() - cached.fetchedAt < PORTFOLIO_UNIVERSE_TTL_MS) {
    return cached.value;
  }

  const now = dt.ZonedDateTime.now();
  const portfolioService = new PortfolioService(apiKey);
  const filter = new PositionFilter();

  let entries: PortfolioUniverseEntry[] = [];
  try {
    const portfolios = await portfolioService.searchPortfolio(now.toProto(), filter);
    // Dedupe on portfolioId — searchPortfolio can stream historical versions.
    const byId = new Map<string, PortfolioUniverseEntry>();
    for (const p of portfolios) {
      const portfolioId = p.getID().toString();
      const portfolioName = p.getPortfolioName();
      if (!portfolioId || !portfolioName) continue;
      byId.set(portfolioId, { portfolioId, portfolioName });
    }
    entries = [...byId.values()].sort((a, b) =>
      a.portfolioName.localeCompare(b.portfolioName),
    );
  } catch (e: any) {
    console.warn('Portfolio universe fetch failed:', e?.message ?? e);
    entries = [];
  }

  portfolioUniverseCache.set(cacheKey, { value: entries, fetchedAt: Date.now() });
  return entries;
}
