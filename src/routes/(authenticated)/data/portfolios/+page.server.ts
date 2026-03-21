//Requests & Services
import {PortfolioService} from "@fintekkers/ledger-models/node/wrappers/services/portfolio-service/PortfolioService";
import * as dt from "@fintekkers/ledger-models/node/wrappers/models/utils/datetime";
import {PositionFilter} from "@fintekkers/ledger-models/node/wrappers/models/position/positionfilter";
import type Portfolio from "@fintekkers/ledger-models/node/wrappers/models/portfolio/portfolio";
import pkg from '@fintekkers/ledger-models/node/fintekkers/models/position/field_pb.js';
import { deleteEntity } from '$lib/entity-delete';

const { FieldProto } = pkg;

/** @type {import('../../../../../.svelte-kit/types/src/routes').PageServerLoad} */
export async function load({locals}) {
  const now = dt.ZonedDateTime.now();
  const portfolioService = new PortfolioService();

  const filter: PositionFilter = new PositionFilter();
  filter.addEqualsFilter(FieldProto.PORTFOLIO_NAME, "Federal Reserve SOMA Holdings");

  const portfolioData = await portfolioService
    .searchPortfolio(now.toProto(), filter)
    .then((portfolios: Portfolio[]) => {
      console.log("Portfolios found: " + portfolios.length);
      return portfolios.map(portfolio => {
          const uuidProto = portfolio.proto?.getUuid?.();
          const uuidHex = uuidProto ? Buffer.from(uuidProto.serializeBinary()).toString('hex') : '';
          return {
              portfolioName: portfolio.getPortfolioName(),
              portfolioAsOf: portfolio.getAsOf().toString(),
              portfolioId: portfolio.getID().toString(),
              uuidHex,
          };
      });
    })
    .catch((err: Error) => {
      console.error("Portfolio fetch error:", err.message);
      return [{
        portfolioName: "Error: " + err.message, portfolioAsOf: "", portfolioId: "", uuidHex: ""
      }];
    });

  return { portfolioData, user: locals.user };
}

export const actions = {
  dryRun: async ({ request }) => {
    const formData = await request.formData();
    const uuidHex = formData.get('uuidHex') as string;
    if (!uuidHex) return { deleteResult: { success: false, totalCount: 0, affectedEntities: [], warnings: [], error: 'Missing UUID' } };
    return { deleteResult: await deleteEntity('PORTFOLIO', uuidHex, true), uuidHex };
  },
  confirmDelete: async ({ request }) => {
    const formData = await request.formData();
    const uuidHex = formData.get('uuidHex') as string;
    const cascade = formData.get('cascade') === 'true';
    const force = formData.get('force') === 'true';
    if (!uuidHex) return { deleteResult: { success: false, totalCount: 0, affectedEntities: [], warnings: [], error: 'Missing UUID' } };
    return { deleteResult: await deleteEntity('PORTFOLIO', uuidHex, false, force, cascade) };
  },
};