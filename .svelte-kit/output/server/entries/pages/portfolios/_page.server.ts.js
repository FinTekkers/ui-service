import { PortfolioService } from "@fintekkers/ledger-models/node/wrappers/services/portfolio-service/PortfolioService.js";
import * as dt from "@fintekkers/ledger-models/node/wrappers/models/utils/datetime.js";
import { PositionFilter } from "@fintekkers/ledger-models/node/wrappers/models/position/positionfilter.js";
import pkg from "@fintekkers/ledger-models/node/fintekkers/models/position/field_pb.js";
const { FieldProto } = pkg;
async function load() {
  const now = dt.ZonedDateTime.now();
  const portfolioService = new PortfolioService();
  const filter = new PositionFilter();
  filter.addEqualsFilter(FieldProto.PORTFOLIO_NAME, "Federal Reserve SOMA Holdings");
  const portfolioData = portfolioService.searchPortfolio(now.toProto(), filter).then((portfolios) => {
    console.log("Portfolios found: " + portfolios.length);
    const results = portfolios.map((portfolio) => {
      return {
        portfolioName: portfolio.getPortfolioName(),
        portfolioAsOf: portfolio.getAsOf().toString(),
        portfolioId: portfolio.getID().toString()
      };
    });
    return results;
  }).catch((err) => {
    return {
      portfolioName: "Error: " + err.message,
      portfolioAsOf: "",
      portfolioId: ""
    };
  });
  return { portfolioData };
}
export {
  load
};
