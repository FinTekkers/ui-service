import * as ts from "@fintekkers/ledger-models/node/wrappers/services/transaction-service/TransactionService";
import * as datetime from "@fintekkers/ledger-models/node/wrappers/models/utils/datetime";
import * as positionFilter from "@fintekkers/ledger-models/node/wrappers/models/position/positionfilter";
import type Transaction from "@fintekkers/ledger-models/node/wrappers/models/transaction/transaction";
import { FieldProto } from "@fintekkers/ledger-models/node/fintekkers/models/position/field_pb";

const transactionService = new ts.TransactionService();
const now = datetime.ZonedDateTime.now();
const filter = new positionFilter.PositionFilter();
filter.addEqualsFilter(FieldProto.ASSET_CLASS, "Fixed Income");

interface TransactionData {
  transactionId: string;
  transactionTradeDate: string;
  transactionQuantity: string;
  transactionSettlementDate: string;
  // transactionTradeName: string;
  transactionIssuerName: string;
}

export async function FetchTransaction(): Promise<TransactionData[]> {
  try {
    const results: Transaction[] = await transactionService.searchTransaction(
      now.toProto(),
      filter
    );

    const transactionData: TransactionData[] = results.map((element) => ({
      transactionId: element.getID().toString(),
      transactionSettlementDate: element.getSettlementDate().toString(),
      transactionIssuerName: element.getIssuerName().toString(),
      transactionQuantity: element.getQuantity().toString(),
      // transactionTradeName: element.getTradeName().toString(),
      transactionTradeDate: element.getTradeDate().toString(),
    }));

    return transactionData;
  } catch (error) {
    console.error("Error fetching transaction data:", error);
    return [];
  }
}
