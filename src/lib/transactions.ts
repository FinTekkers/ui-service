import * as ts from "@fintekkers/ledger-models/node/wrappers/services/transaction-service/TransactionService";
import * as datetime from "@fintekkers/ledger-models/node/wrappers/models/utils/datetime";
import * as positionFilter from "@fintekkers/ledger-models/node/wrappers/models/position/positionfilter";
import type Transaction from "@fintekkers/ledger-models/node/wrappers/models/transaction/transaction";
import type BondSecurity from "@fintekkers/ledger-models/node/wrappers/models/security/BondSecurity";
import { SecurityTypeProto } from "@fintekkers/ledger-models/node/fintekkers/models/security/security_type_pb";
import pkg from '@fintekkers/ledger-models/node/fintekkers/models/position/field_pb.js';
import type Security from "@fintekkers/ledger-models/node/wrappers/models/security/security";
import { UUID } from '@fintekkers/ledger-models/node/wrappers/models/utils/uuid';
import { PositionFilterOperator } from '@fintekkers/ledger-models/node/fintekkers/models/position/position_util_pb.js';
const { FieldProto } = pkg;

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
  uuidHex?: string;
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
  transactionPrice: string;
}

let FetchTransactionWithFilter = async function FetchTransactionWithFilter(filter: positionFilter.PositionFilter, apiKey?: string): Promise<TransactionData[]> {
  try {
    const now = datetime.ZonedDateTime.now();
    const service = new ts.TransactionService(apiKey);
    const results: Transaction[] = await service.searchTransaction(
      now.toProto(),
      filter,
      1000
    );

    results.sort((a, b) => {
      return a.getTradeDate().toDate().getTime() - b.getTradeDate().toDate().getTime();
    });

    // Map per-element and skip the row on any wrapper-side throw. The
    // ledger-models Security wrapper throws e.g. "Issue date is required"
    // for instruments that legitimately have no issue date (CASH legs in
    // bond purchases). Without this guard, a single malformed row tanks the
    // entire transaction list. Mirrors the per-row try/catch in
    // positions.ts:elementsToReturn.
    const safe = <T>(fn: () => T, fallback: T): T => {
      try {
        return fn();
      } catch {
        return fallback;
      }
    };
    const transactionData: TransactionData[] = [];
    for (const element of results) {
      try {
        const security: Security = element.getSecurity();
        const isBond = security.proto.getSecurityType() === SecurityTypeProto.BOND_SECURITY;
        const bondSecurity = isBond ? (security as BondSecurity) : null;

        const txnUuid = element.proto?.getUuid?.();
        const uuidHex = txnUuid ? Buffer.from(txnUuid.serializeBinary()).toString('hex') : undefined;

        transactionData.push({
          transactionId: safe(() => security.getSecurityID().getIdentifierValue().toString(), ''),
          uuidHex,
          transactionSettlementDate: safe(() => formatDateToISO(element.getSettlementDate()), ''),
          transactionIssuerName: safe(() => element.getIssuerName().toString(), ''),
          transactionIssueDate: safe(() => formatDateToISO(security.getIssueDate()), ''),
          transactionQuantity: safe(() => element.getQuantity().toString(), ''),
          transactionProductType: safe(() => bondSecurity?.getProductType() ?? security.getProductType() ?? '', ''),
          transactionCouponRate: safe(() => security.proto.getCouponRate()?.getArbitraryPrecisionValue() ?? '', ''),
          transactionCouponType: safe(() => bondSecurity?.getCouponType().name() ?? '', ''),
          transactionTenor: safe(() => bondSecurity?.getTenor().getTenorDescription() ?? '', ''),
          transactionCouponFrequency: safe(() => bondSecurity?.getCouponFrequency()?.toString() ?? '', ''),
          transactionMaturityDate: safe(() => formatDateToISO(security.getMaturityDate()), ''),
          transactionTradeDate: safe(() => formatDateToISO(element.getTradeDate()), ''),
          transactionSide: safe(() => element.getTransactionType().toString(), ''),
          transactionPrice: safe(() => element.getPrice()?.getPrice()?.getArbitraryPrecisionValue() ?? '', ''),
        });
      } catch (rowErr: any) {
        console.warn('Skipping transaction row due to wrapper error:', rowErr?.message ?? rowErr);
      }
    }

    return transactionData;
  } catch (error: any) {
    console.error("Error fetching transaction data:", error?.message ?? error);
    if (error?.stack) console.error(error.stack);
    return [];
  }
};

let FetchTransaction = async function FetchTransaction(apiKey?: string): Promise<TransactionData[]> {
  const filter = new positionFilter.PositionFilter();
  filter.addEqualsFilter(FieldProto.ASSET_CLASS, "Fixed Income");
  return FetchTransactionWithFilter(filter, apiKey);
};

let FetchTransactionByPortfolio = async function FetchTransactionByPortfolio(portfolioId: string, apiKey?: string): Promise<TransactionData[]> {
  const filter = new positionFilter.PositionFilter();
  const portfolioUuid = new UUID(UUID.fromString(portfolioId.trim()));
  filter.addFilter(FieldProto.PORTFOLIO_ID, PositionFilterOperator.EQUALS, portfolioUuid);
  const results = await FetchTransactionWithFilter(filter, apiKey);
  // Sort descending by trade date (most recent first)
  results.sort((a, b) => b.transactionTradeDate.localeCompare(a.transactionTradeDate));
  return results;
};

export { FetchTransactionWithFilter, FetchTransaction, FetchTransactionByPortfolio };
export type { TransactionData };
