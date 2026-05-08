//Requests & Services
import {PortfolioService} from "@fintekkers/ledger-models/node/wrappers/services/portfolio-service/PortfolioService";
import * as dt from "@fintekkers/ledger-models/node/wrappers/models/utils/datetime";
import {PositionFilter} from "@fintekkers/ledger-models/node/wrappers/models/position/positionfilter";
import type Portfolio from "@fintekkers/ledger-models/node/wrappers/models/portfolio/portfolio";
import { deleteEntity } from '$lib/entity-delete';
import { FetchTransactionByPortfolio } from '$lib/transactions';

/** @type {import('../../../../../.svelte-kit/types/src/routes').PageServerLoad} */
export async function load({locals, request}) {
  const now = dt.ZonedDateTime.now();
  const portfolioService = new PortfolioService(locals.user?.apiKey);

  // Empty filter = all portfolios. The SOMA-only PORTFOLIO_NAME
  // filter that lived here previously was a single-portfolio-seed
  // expedient that became second-brain#221 once the seed grew —
  // truncated the page to exactly the one portfolio name it
  // hardcoded. Page is the portfolios index; it should list every
  // portfolio the API returns.
  const filter: PositionFilter = new PositionFilter();

  const portfolioData = await portfolioService
    .searchPortfolio(now.toProto(), filter)
    .then((portfolios: Portfolio[]) => {
      console.log("Portfolios found: " + portfolios.length);
      // Per-row try/catch — a single malformed portfolio (e.g. a
      // missing/invalid asOf timestamp on legacy or partial data)
      // shouldn't tank the whole list. Same defensive pattern as
      // security.ts:elementsToReturn. Pre-#221 the hardcoded
      // PORTFOLIO_NAME filter incidentally hid these crashes by
      // narrowing to one well-formed row.
      const safe = <T>(fn: () => T, fallback: T): T => {
        try { return fn(); } catch { return fallback; }
      };
      const rows: Array<{ portfolioName: string; portfolioAsOf: string; portfolioId: string; uuidHex: string }> = [];
      for (const portfolio of portfolios) {
        try {
          const uuidProto = portfolio.proto?.getUuid?.();
          const uuidHex = uuidProto ? Buffer.from(uuidProto.serializeBinary()).toString('hex') : '';
          rows.push({
            portfolioName: safe(() => portfolio.getPortfolioName(), ''),
            portfolioAsOf: safe(() => portfolio.getAsOf().toString(), ''),
            portfolioId: safe(() => portfolio.getID().toString(), ''),
            uuidHex,
          });
        } catch (rowErr: any) {
          console.warn('Skipping portfolio row due to wrapper error:', rowErr?.message ?? rowErr);
        }
      }
      return rows;
    })
    .catch((err: Error) => {
      console.error("Portfolio fetch error:", err.message);
      return [{
        portfolioName: "Error: " + err.message, portfolioAsOf: "", portfolioId: "", uuidHex: ""
      }];
    });

  const searchParams = new URLSearchParams(request.url.split('?')[1]);
  const selectedPortfolioId = searchParams.get('portfolioId');

  let transactions: import('$lib/transactions').TransactionData[] = [];
  if (selectedPortfolioId) {
    try {
      transactions = await FetchTransactionByPortfolio(selectedPortfolioId, locals.user?.apiKey);
    } catch (err: any) {
      console.error('Transaction fetch error:', err?.message ?? err);
    }
  }

  return { portfolioData, transactions, selectedPortfolioId, user: locals.user };
}

export const actions = {
  dryRun: async ({ request, locals }) => {
    const formData = await request.formData();
    const uuidHex = formData.get('uuidHex') as string;
    if (!uuidHex) return { deleteResult: { success: false, totalCount: 0, affectedEntities: [], warnings: [], error: 'Missing UUID' } };
    return { deleteResult: await deleteEntity('PORTFOLIO', uuidHex, true, false, false, locals.user?.apiKey), uuidHex };
  },
  confirmDelete: async ({ request, locals }) => {
    const formData = await request.formData();
    const uuidHex = formData.get('uuidHex') as string;
    const cascade = formData.get('cascade') === 'true';
    const force = formData.get('force') === 'true';
    if (!uuidHex) return { deleteResult: { success: false, totalCount: 0, affectedEntities: [], warnings: [], error: 'Missing UUID' } };
    return { deleteResult: await deleteEntity('PORTFOLIO', uuidHex, false, force, cascade, locals.user?.apiKey) };
  },
};
