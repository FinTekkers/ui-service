import { FieldProto } from "@fintekkers/ledger-models/node/fintekkers/models/position/field_pb";
import { PositionFilter } from "@fintekkers/ledger-models/node/wrappers/models/position/positionfilter";
import * as dt from "@fintekkers/ledger-models/node/wrappers/models/utils/datetime";
import { ProtoSerializationUtil } from "@fintekkers/ledger-models/node/wrappers/models/utils/serialization";
import { PortfolioService } from "@fintekkers/ledger-models/node/wrappers/services/portfolio-service/PortfolioService";
import { SecurityService } from "@fintekkers/ledger-models/node/wrappers/services/security-service/SecurityService";

/** @type {import('./$types').PageServerLoad} */
export async function load() {
  const now = dt.ZonedDateTime.now();
  const portfolioService = new PortfolioService();
  const securityService = new SecurityService();

  // Fetching portfolio data
  const filterPortfolio: PositionFilter = new PositionFilter();
  filterPortfolio.addEqualsFilter(FieldProto.PORTFOLIO_NAME, "Federal Reserve SOMA Holdings");

  const portfolioData = await portfolioService.searchPortfolio(now.toProto(), filterPortfolio)
    .then((portfolios) => {
      const results = portfolios.map((portfolio) => {
        return {
          portfolioName: portfolio.getPortfolioName(),
          portfolioAsOf: portfolio.getAsOf().toString(),
          portfolioId: portfolio.getID().toString(),
        };
      });
      return results;
    })
    .catch((err) => {
      return {
        portfolioName: "Error: " + err.message,
        portfolioAsOf: "",
        portfolioId: "",
      };
    });

  // Fetching security data
  const filterSecurity = new PositionFilter();
  filterSecurity.addEqualsFilter(FieldProto.ASSET_CLASS, "Fixed Income");
  filterSecurity.addEqualsFilter(FieldProto.SECURITY_ISSUER_NAME, "US Government");

  const securities = await securityService.searchSecurityAsOfNow(filterSecurity);
  let securityResults = [];

  for (let index in securities) {
    let security = securities[index];
    let issuanceList = security.proto.getIssuanceInfoList();
    let issuance = issuanceList && issuanceList.length > 0 ? issuanceList[0] : null;

    if (issuance) {
      if (!issuance.getPostAuctionOutstandingQuantity() && security.getMaturityDate().getFullYear() > 2009) {
        console.log("Issued with %s, issuance: %s", security.getSecurityID().getIdentifierValue(), issuance);
      } else if (!issuance.getPostAuctionOutstandingQuantity() && security.getMaturityDate().getFullYear() <= 2009) {
        // Swallow this data gap. It's old and we don't mind
      } else {
        let postAuctionQuantity = ProtoSerializationUtil.deserialize(issuance.getPostAuctionOutstandingQuantity());
        let id = security.getSecurityID() ? security.getSecurityID().getIdentifierValue() : security.getID().toString();

        let result = {
          cusip: id,
          issueDate: security.getIssueDate(),
          outstandingAmount: postAuctionQuantity,
          maturityDate: security.getMaturityDate(),
        };
        securityResults.push(result);
      }
    }
  }

  // Fetching transaction data
  return { portfolioData, securityData: securityResults };
}
