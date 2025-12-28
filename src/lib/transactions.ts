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

/**
 * Formats a date object to ISO date string (YYYY-MM-DD)
 */
function formatDateToISO(date: any): string {
  if (!date) return '';

  // If it has a toDate method (like ZonedDateTime or LocalDate), use it
  if (typeof date.toDate === 'function') {
    const jsDate = date.toDate();
    return jsDate.toISOString().split('T')[0];
  }

  // If it's already a Date object
  if (date instanceof Date) {
    return date.toISOString().split('T')[0];
  }

  // If it's a string, try to parse it
  if (typeof date === 'string') {
    const parsed = new Date(date);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split('T')[0];
    }
  }

  // Fallback to toString
  return date.toString();
}

interface TransactionData {
  transactionId: string;
  transactionSettlementDate: string;
  transactionIssuerName: string;
  transactionIssueDate: string;
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
        transactionSettlementDate: formatDateToISO(element.getSettlementDate()),
        transactionIssuerName: element.getIssuerName().toString(),
        transactionIssueDate: formatDateToISO(security.getIssueDate()),
        transactionQuantity: element.getQuantity().toString(),
        transactionProductType: security.getProductType(),
        transactionCouponRate: security.proto.getCouponRate()?.getArbitraryPrecisionValue() ?? '',
        transactionCouponType: bondSecurity?.getCouponType().name() ?? '',
        transactionTenor: bondSecurity?.getTenor().getTenorDescription() ?? '',
        transactionCouponFrequency: bondSecurity?.getCouponFrequency()?.toString() ?? '',
        transactionMaturityDate: formatDateToISO(security.getMaturityDate()),
        transactionTradeDate: formatDateToISO(element.getTradeDate()),
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

export { FetchTransactionWithFilter, FetchTransaction };
export type { TransactionData };
