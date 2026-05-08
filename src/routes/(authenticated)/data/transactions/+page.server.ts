import { FetchTransaction, FetchTransactionByPortfolio } from "$lib/transactions";
import { deleteEntity } from '$lib/entity-delete';
import { FetchPortfolioUniverse, type PortfolioUniverseEntry } from "$lib/portfolios";

/** @type {import('../../../../../.svelte-kit/types/src/routes').PageServerLoad} */
export async function load({ locals, url }) {
  // When the user clicks "Txns" on a portfolio row in /data/portfolios, the
  // link includes ?portfolioId=<uuid>. Route through FetchTransactionByPortfolio
  // so the gRPC search adds a PORTFOLIO_ID PositionFilter and returns only
  // that portfolio's transactions. Without scoping, the portfolio click would
  // dump every transaction across every portfolio onto the page.
  const portfolioId = url.searchParams.get('portfolioId');
  const apiKey = locals.user?.apiKey;

  // Phase 3 of #226 (PR-B): PortfolioFilter primitive needs the
  // (id, name) universe + the resolved display name for the inbound
  // portfolioId. Mirrors the /data/positions wiring shipped in PR #146.
  // The universe is cached for 5 min in $lib/portfolios so the
  // per-load cost is bounded. Empty universe (e.g. portfolio service
  // unavailable) leaves the autocomplete empty but doesn't break the
  // page.
  const portfolioUniverse: PortfolioUniverseEntry[] =
    await FetchPortfolioUniverse(apiKey).catch(() => []);
  const portfolioName =
    portfolioId && portfolioUniverse.find((p) => p.portfolioId === portfolioId)?.portfolioName || '';

  // Phase 3 PR-B of #226: optional tradeDate filter. URL convention
  // mirrors /data/positions exactly (?tradeDate=YYYY-MM-DD&
  // tradeDateOperator=<proto enum name from PositionFilterOperator>).
  // Both URL params required for the filter to apply — half-formed
  // shapes drop both, matching the form's emit guard. The wrapper's
  // fromName (in $lib/transactions) is the only validator (#229
  // review: no UI-side normalization).
  const tradeDate = url.searchParams.get('tradeDate') ?? undefined;
  const tradeDateOperator = url.searchParams.get('tradeDateOperator') ?? undefined;

  const transactions = portfolioId
    ? await FetchTransactionByPortfolio(portfolioId, apiKey, tradeDate, tradeDateOperator)
    : await FetchTransaction(apiKey, tradeDate, tradeDateOperator);
  return {
    transactions,
    portfolioId: portfolioId || null,
    portfolioName,
    portfolioUniverse,
    user: locals.user
  };
}

export const actions = {
  dryRun: async ({ request, locals }) => {
    const formData = await request.formData();
    const uuidHex = formData.get('uuidHex') as string;
    if (!uuidHex) return { deleteResult: { success: false, totalCount: 0, affectedEntities: [], warnings: [], error: 'Missing UUID' } };
    return { deleteResult: await deleteEntity('TRANSACTION', uuidHex, true, false, false, locals.user?.apiKey), uuidHex };
  },
  confirmDelete: async ({ request, locals }) => {
    const formData = await request.formData();
    const uuidHex = formData.get('uuidHex') as string;
    const force = formData.get('force') === 'true';
    if (!uuidHex) return { deleteResult: { success: false, totalCount: 0, affectedEntities: [], warnings: [], error: 'Missing UUID' } };
    return { deleteResult: await deleteEntity('TRANSACTION', uuidHex, false, force, false, locals.user?.apiKey) };
  },
};