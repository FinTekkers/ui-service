import { PortfolioService } from "@fintekkers/ledger-models/node/wrappers/services/portfolio-service/PortfolioService.js";
import { FieldProto } from "@fintekkers/ledger-models/node/fintekkers/models/position/field_pb.js";
import * as uuid from "@fintekkers/ledger-models/node/wrappers/models/utils/uuid.js";
import * as dt from "@fintekkers/ledger-models/node/wrappers/models/utils/datetime.js";
async function load() {
  const now = dt.ZonedDateTime.now();
  const portfolioService = new PortfolioService();
  console.log("portfolioService1", FieldProto.PORTFOLIO_NAME);
  console.log("portfolioService2", FieldProto.PORTFOLIO);
  const portfolioData = portfolioService.searchPortfolio(
    now.toProto(),
    FieldProto.PORTFOLIO_NAME,
    "Federal Reserve SOMA Holdings"
  ).then((portfolios) => {
    const results = portfolios.map((portfolio) => {
      const serializedData = {};
      Object.keys(portfolio.wrappers_["5"].array[0]).forEach((key) => {
        serializedData[key] = serializeInnerObject(
          portfolio.wrappers_["5"].array[0][key]
        );
      });
      return {
        portfolioName: portfolio.getPortfolioName(),
        portfolioData: serializedData,
        portfolioId: uuid.UUID.fromU8Array(
          portfolio.getUuid().getRawUuid_asU8()
        ).toString()
      };
    });
    return results;
  }).catch((err) => {
    return {};
  });
  return { portfolioData };
}
function serializeInnerObject(obj) {
  return obj;
}
export {
  load
};
