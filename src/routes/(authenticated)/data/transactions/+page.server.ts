import { FetchTransaction, FetchTransactionByPortfolio } from "$lib/transactions";
import { deleteEntity } from '$lib/entity-delete';

/** @type {import('../../../../../.svelte-kit/types/src/routes').PageServerLoad} */
export async function load({ locals, url }) {
  // When the user clicks "Txns" on a portfolio row in /data/portfolios, the
  // link includes ?portfolioId=<uuid>. Route through FetchTransactionByPortfolio
  // so the gRPC search adds a PORTFOLIO_ID PositionFilter and returns only
  // that portfolio's transactions. Without scoping, the portfolio click would
  // dump every transaction across every portfolio onto the page.
  const portfolioId = url.searchParams.get('portfolioId');
  const apiKey = locals.user?.apiKey;

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