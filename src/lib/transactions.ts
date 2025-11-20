import * as ts from "@fintekkers/ledger-models/node/wrappers/services/transaction-service/TransactionService";
import * as datetime from "@fintekkers/ledger-models/node/wrappers/models/utils/datetime";
import * as positionFilter from "@fintekkers/ledger-models/node/wrappers/models/position/positionfilter";
import type Transaction from "@fintekkers/ledger-models/node/wrappers/models/transaction/transaction";
import type BondSecurity from "@fintekkers/ledger-models/node/wrappers/models/security/BondSecurity";
import { SecurityTypeProto } from "@fintekkers/ledger-models/node/fintekkers/models/security/security_type_pb";
import pkg from '@fintekkers/ledger-models/node/fintekkers/models/position/field_pb.js';
const { FieldProto } = pkg;

const transactionService = new ts.TransactionService();
const now = datetime.ZonedDateTime.now();

interface TransactionData {
  transactionId: string;
  transactionSettlementDate: string;
  transactionIssuerName: string;
  transactionQuantity: string;
  transactionProductType: string;
  transactionTenor: string;
  transactionCouponFrequency: string;
  transactionCouponRate: string;
  transactionCouponType: string;
  transactionMaturityDate: string;
  transactionTradeDate: string;
  transactionSide: string;
}

let FetchTransactionWithFilter = async function FetchTransactionWithFilter(filter: positionFilter.PositionFilter): Promise<TransactionData[]> {
  try {
    const results: Transaction[] = await transactionService.searchTransaction(
      now.toProto(),
      filter
    );

    results.sort((a, b) => {
      return a.getTradeDate().toDate().getTime() - b.getTradeDate().toDate().getTime();
    });

    const transactionData: TransactionData[] = results.map((element) => {
      const security = element.getSecurity();
      const isBond = security.proto.getSecurityType() === SecurityTypeProto.BOND_SECURITY;
      const bondSecurity = isBond ? (security as BondSecurity) : null;

      return {
        transactionId: security.getSecurityID().getIdentifierValue().toString(),
        transactionSettlementDate: element.getSettlementDate().toString(),
        transactionIssuerName: element.getIssuerName().toString(),
        transactionQuantity: element.getQuantity().toString(),
        transactionProductType: security.getProductType(),
        transactionCouponRate: security.proto.getCouponRate()?.getArbitraryPrecisionValue() ?? '',
        transactionCouponType: bondSecurity?.getCouponType().name() ?? '',
        transactionTenor: bondSecurity?.getTenor().getTenorDescription() ?? '',
        transactionCouponFrequency: bondSecurity?.getCouponFrequency()?.toString() ?? '',
        transactionMaturityDate: security.getMaturityDate().toString(),
        transactionTradeDate: element.getTradeDate().toString(),
        transactionSide: element.getTransactionType().toString()
      };
    });

    return transactionData;
  } catch (error) {
    console.error("Error fetching transaction data:", error);
    return [];
  }
};

let FetchTransaction = async function FetchTransaction(): Promise<TransactionData[]> {
  const filter = new positionFilter.PositionFilter();
  filter.addEqualsFilter(FieldProto.ASSET_CLASS, "Fixed Income");
  return FetchTransactionWithFilter(filter);
};

export { FetchTransactionWithFilter, FetchTransaction, TransactionData };
