import pkg from '@fintekkers/ledger-models/node/fintekkers/models/position/field_pb.js';
const { FieldProto } = pkg;
import { PositionFilter } from "@fintekkers/ledger-models/node/wrappers/models/position/positionfilter";
import * as dt from "@fintekkers/ledger-models/node/wrappers/models/utils/datetime";
import { PortfolioService } from "@fintekkers/ledger-models/node/wrappers/services/portfolio-service/PortfolioService";

export async function FetchPortfolio(portfolioName: string) {
  const now = dt.ZonedDateTime.now();
  const portfolioService = new PortfolioService();

  const filterPortfolio: PositionFilter = new PositionFilter();
  filterPortfolio.addEqualsFilter(FieldProto.PORTFOLIO_NAME, portfolioName);

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
