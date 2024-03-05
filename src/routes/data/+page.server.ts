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
  // const transactionData = await testTransaction();

  return { portfolioData, securityData: securityResults };
}

// async function testTransaction(): Promise<any> {
//   const now = dt.ZonedDateTime.now();
//   const today = new LocalDateProto().setDay(1).setMonth(1).setYear(2021);

//   const securityService = new SecurityService();
//   const portfolioService = new PortfolioService();
//   const transactionService = new TransactionService();

//   const positionFilter = new PositionFilter();
//   positionFilter.addEqualsFilter(FieldProto.ASSET_CLASS, 'Fixed Income');

//   console.time("searchSecurity");
//   let fixedIncomeSecurities = await securityService.searchSecurity(now.toProto(), positionFilter);
//   console.timeEnd("searchSecurity");

//   let security = fixedIncomeSecurities[0];

//   console.time("searchPortfolio");
//   let portfolios = await portfolioService.searchPortfolio(
//     now.toProto(),
//     new PositionFilter().addEqualsFilter(FieldProto.PORTFOLIO_NAME, 'TEST PORTFOLIO'));
//   console.timeEnd("searchPortfolio");

//   if (portfolios === undefined) {
//     throw new Error('No portfolios found');
//   }

//   const portfolio = portfolios[0];

//   if (portfolio.getPortfolioName().includes('Federal')) {
//     throw new Error('Portfolio is not a test portfolio! Abandoning test');
//   }

//   // Creating a new TransactionProto
//   const transactionProto = new TransactionProto();
//   transactionProto.setObjectClass('Transaction');
//   transactionProto.setVersion('0.0.1');
//   transactionProto.setUuid(uuid.UUID.random().toUUIDProto());
//   transactionProto.setAsOf(now.toProto());
//   transactionProto.setTradeDate(today);
//   transactionProto.setSettlementDate(today); // Same day settlement
//   transactionProto.setTransactionType(TransactionTypeProto.BUY);
//   transactionProto.setPrice(
//     new PriceProto()
//       .setObjectClass('Price')
//       .setAsOf(now.toProto())
//       .setVersion('0.0.1')
//       .setSecurity(security.proto)
//       .setUuid(uuid.UUID.random().toUUIDProto())
//       .setPrice(new DecimalValueProto().setArbitraryPrecisionValue('100.00'))
//   );
//   transactionProto.setQuantity(new DecimalValueProto().setArbitraryPrecisionValue('10000.00'));
//   transactionProto.setPortfolio(portfolio.proto);
//   transactionProto.setSecurity(security.proto);

//   // Creating a new Transaction object with the TransactionProto
//   const transaction = new Transaction(transactionProto);


//   console.time("createTransaction");
//   var createTransactionResponse = await transactionService.createTransaction(transaction);
//   const transactionResponse: any = createTransactionResponse.getTransactionResponse();
//   console.timeEnd("createTransaction");

//   console.log("Searching transaction");

//   console.time("searchTransaction");

//   const transactionID = uuid.UUID.fromU8Array(transactionResponse.getUuid().getRawUuid_asU8());
//   positionFilter.addEqualsFilter(FieldProto.ID, transactionID);
//   const transactions = await transactionService.searchTransaction(now.toProto(), positionFilter);
//   console.timeEnd("searchTransaction");

//   if (transactions === undefined) {
//     console.log('No transactions found');
//   } else {
//     console.log(transactions.length);
//   }

//   return transactions;
// }