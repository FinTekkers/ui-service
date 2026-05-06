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
  const transactions = portfolioId
    ? await FetchTransactionByPortfolio(portfolioId, apiKey)
    : await FetchTransaction(apiKey);
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