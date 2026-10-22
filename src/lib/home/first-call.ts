import { PortfolioService } from "@fintekkers/ledger-models/node/wrappers/services/portfolio-service/PortfolioService";
import { PositionFilter } from "@fintekkers/ledger-models/node/wrappers/models/position/positionfilter";
import { ZonedDateTime } from "@fintekkers/ledger-models/node/wrappers/models/utils/datetime";
import pkg from "@fintekkers/ledger-models/node/fintekkers/models/position/field_pb.js";
const { FieldProto } = pkg;

// Run with your free API key (Pro register/login) as the first argument.
const apiKey = process.argv[2];
const portfolios = new PortfolioService(apiKey);

const results = await portfolios.searchPortfolio(
  ZonedDateTime.now().toProto(),
  new PositionFilter().addEqualsFilter(
    FieldProto.PORTFOLIO_NAME,
    "Federal Reserve SOMA Holdings"
  )
);

console.log(results[0].getPortfolioName());
