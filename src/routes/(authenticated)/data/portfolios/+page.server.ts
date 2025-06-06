//Requests & Services
import {PortfolioService} from "@fintekkers/ledger-models/node/wrappers/services/portfolio-service/PortfolioService";
import * as dt from "@fintekkers/ledger-models/node/wrappers/models/utils/datetime";
import {PositionFilter} from "@fintekkers/ledger-models/node/wrappers/models/position/positionfilter";
import type Portfolio from "@fintekkers/ledger-models/node/wrappers/models/portfolio/portfolio";
import pkg from '@fintekkers/ledger-models/node/fintekkers/models/position/field_pb.js';

const { FieldProto } = pkg;

/** @type {import('../../../../../.svelte-kit/types/src/routes').PageServerLoad} */
export async function load({locals}) {
    // ***API code below
  const now = dt.ZonedDateTime.now();

  const portfolioService = new PortfolioService();

  const filter: PositionFilter = new PositionFilter();
  filter.addEqualsFilter(FieldProto.PORTFOLIO_NAME, "Federal Reserve SOMA Holdings");

  const portfolioData = portfolioService
    .searchPortfolio(now.toProto(), filter)
    .then((portfolios: Portfolio[]) => {
      console.log("Portfolios found: " + portfolios.length);

      return portfolios.map(portfolio => {
          return {
              portfolioName: portfolio.getPortfolioName(),
              portfolioAsOf: portfolio.getAsOf().toString(),
              portfolioId: portfolio.getID().toString()
          };
      });
    })
    .catch((err: Error) => {
      return {
        portfolioName: "Error: " + err.message, portfolioAsOf: "", portfolioId: ""
      };
    });

  return {portfolioData,
      user: locals.user };
}