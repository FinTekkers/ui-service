//Requests & Services
import { PortfolioService } from "@fintekkers/ledger-models/node/wrappers/services/portfolio-service/PortfolioService";
import type { PortfolioProto } from "@fintekkers/ledger-models/node/fintekkers/models/portfolio/portfolio_pb";
import type { ServiceError } from "@grpc/grpc-js";

import { FieldProto } from "@fintekkers/ledger-models/node/fintekkers/models/position/field_pb";
import * as uuid from "@fintekkers/ledger-models/node/wrappers/models/utils/uuid";
import * as dt from "@fintekkers/ledger-models/node/wrappers/models/utils/datetime";

/** @type {import('./$types').PageServerLoad} */
export async function load() {
  const now = dt.ZonedDateTime.now();

  const portfolioService = new PortfolioService();

  console.log("portfolioService1", FieldProto.PORTFOLIO_NAME);
  console.log("portfolioService2", FieldProto.PORTFOLIO);

  const portfolioData = portfolioService
    .searchPortfolio(
      now.toProto(),
      FieldProto.PORTFOLIO_NAME,
      "Federal Reserve SOMA Holdings"
    )
    .then((portfolios: PortfolioProto[]) => {
      const results = portfolios.map(portfolio => {
        const serializedData: object = {};

        // Iterate through keys in the data object
        Object.keys(portfolio.wrappers_["5"].array[0]).forEach(key => {
          // Serialize or transform the inner object as needed
          serializedData[key] = serializeInnerObject(
            portfolio.wrappers_["5"].array[0][key]
          );
        });

        return {
          portfolioName: portfolio.getPortfolioName(),
          portfolioData: serializedData,
          portfolioId: uuid.UUID.fromU8Array(
            portfolio.getUuid()!.getRawUuid_asU8()
          ).toString(),
        };
      });

      return results;
    })
    .catch((err: ServiceError) => {
      return {};
    });

  return { portfolioData };
}

function serializeInnerObject(obj) {
  // Implement serialization logic here
  return obj; // Replace this with the serialized data
}
