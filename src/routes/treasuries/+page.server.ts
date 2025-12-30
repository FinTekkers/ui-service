import { FetchTransactionWithFilter, type TransactionData } from "$lib/transactions";
import { FieldProto } from "@fintekkers/ledger-models/node/fintekkers/models/position/field_pb.js";
import { PositionFilterOperator } from "@fintekkers/ledger-models/node/fintekkers/models/position/position_util_pb.js";
import { TransactionTypeProto } from "@fintekkers/ledger-models/node/fintekkers/models/transaction/transaction_type_pb.js";
import { PositionFilter } from "@fintekkers/ledger-models/node/wrappers/models/position/positionfilter";
import { PositionService } from '@fintekkers/ledger-models/node/wrappers/services/position-service/PositionService';
import { SecurityService } from "@fintekkers/ledger-models/node/wrappers/services/security-service/SecurityService";
import { QueryPositionRequest } from '@fintekkers/ledger-models/node/wrappers/requests/position/QueryPositionRequest';
import { ZonedDateTime } from '@fintekkers/ledger-models/node/wrappers/models/utils/datetime';
import type { Position } from '@fintekkers/ledger-models/node/wrappers/models/position/position';
import type { FieldProto as FieldProtoType } from '@fintekkers/ledger-models/node/fintekkers/models/position/field_pb';
import type { MeasureProto as MeasureProtoType } from '@fintekkers/ledger-models/node/fintekkers/models/position/measure_pb';
import measurePkg from '@fintekkers/ledger-models/node/fintekkers/models/position/measure_pb.js';
const { MeasureProto } = measurePkg;
import positionPkg from '@fintekkers/ledger-models/node/fintekkers/models/position/position_pb.js';
const { PositionTypeProto, PositionViewProto } = positionPkg;
import { IdentifierProto } from '@fintekkers/ledger-models/node/fintekkers/models/security/identifier/identifier_pb';
import { IdentifierTypeProto } from '@fintekkers/ledger-models/node/fintekkers/models/security/identifier/identifier_type_pb';
import { Identifier } from '@fintekkers/ledger-models/node/wrappers/models/security/identifier';
import type Security from "@fintekkers/ledger-models/node/wrappers/models/security/security";
import type BondSecurity from "@fintekkers/ledger-models/node/wrappers/models/security/BondSecurity";
import { SecurityTypeProto } from "@fintekkers/ledger-models/node/fintekkers/models/security/security_type_pb";

/**
 * Creates a PositionFilter for recent treasury transactions
 * Filters for Fixed Income assets, issued in the last 6 weeks, with BUY transaction type
 */
function createTreasuryTransactionBuyFilter(): PositionFilter {
  const filter = new PositionFilter();
  filter.addEqualsFilter(FieldProto.ASSET_CLASS, "Fixed Income");

  const sixWeeksAgo = new Date();
  sixWeeksAgo.setDate(sixWeeksAgo.getDate() - 42); // 6 weeks = 42 days

  filter.addFilter(FieldProto.ISSUE_DATE, PositionFilterOperator.MORE_THAN, sixWeeksAgo);
  filter.addEqualsFilter(FieldProto.TRANSACTION_TYPE, TransactionTypeProto.BUY);

  return filter;
}

function createTreasuryTransactionMaturityFilter(transactionType: TransactionTypeProto): PositionFilter {
  const filter = new PositionFilter();
  filter.addEqualsFilter(FieldProto.ASSET_CLASS, "Fixed Income");

  const sixWeeksAgo = new Date();
  sixWeeksAgo.setDate(sixWeeksAgo.getDate() - 42); // 6 weeks = 42 days


  filter.addFilter(FieldProto.MATURITY_DATE, PositionFilterOperator.MORE_THAN, sixWeeksAgo);
  // filter.addFilter(FieldProto.TRADE_DATE, PositionFilterOperator.MORE_THAN, sixWeeksAgo);
  filter.addEqualsFilter(FieldProto.TRANSACTION_TYPE, transactionType);

  return filter;
}

/**
 * Fetches transactions using position service and converts to TransactionData format
 */
async function fetchTransactionsFromPositions(filter: PositionFilter): Promise<TransactionData[]> {
  try {
    const positionService = new PositionService();
    const securityService = new SecurityService();
    const now = ZonedDateTime.now();

    // Define fields to request: IDENTIFIER and TRANSACTION_TYPE as required
    const fields: FieldProtoType[] = [
      FieldProto.IDENTIFIER,
      FieldProto.TRANSACTION_TYPE,
      FieldProto.TRADE_DATE,
    ];

    // Request DIRECTED_QUANTITY as a measure for quantity
    const measures: MeasureProtoType[] = [MeasureProto.DIRECTED_QUANTITY];

    // Create position request
    const request = new QueryPositionRequest(
      filter,
      PositionTypeProto.TRANSACTION,
      PositionViewProto.DEFAULT_VIEW,
      fields,
      measures,
      now
    );

    // Search positions
    const positions: Position[] = await positionService.search(request);

    if (positions.length === 0) {
      return [];
    }

    // Process positions and fetch security details
    const transactionDataPromises = positions.map(async (position) => {
      // Extract identifier from position using getFieldValue to get the Identifier object
      const identifierField = position.getFields().find(f => f.getField() === FieldProto.IDENTIFIER);
      if (!identifierField) {
        return null;
      }

      // Get the Identifier object from getFieldValue, then extract the value
      const identifierObj = position.getFieldValue(FieldProto.IDENTIFIER) as Identifier | null | undefined;
      if (!identifierObj) {
        return null;
      }

      // Extract the identifier value from the Identifier object
      let identifierStr: string;
      if (typeof identifierObj.getIdentifierValue === 'function') {
        identifierStr = identifierObj.getIdentifierValue();
      } else {
        return null;
      }

      if (!identifierStr || identifierStr.trim() === '' || identifierStr.includes('USD')) {
        return null;
      }

      // Extract other fields from position
      const transactionTypeField = position.getFields().find(f => f.getField() === FieldProto.TRANSACTION_TYPE);
      const transactionType = transactionTypeField ? position.getFieldDisplay(transactionTypeField) : '';

      const tradeDateField = position.getFields().find(f => f.getField() === FieldProto.TRADE_DATE);
      const tradeDate = tradeDateField ? position.getFieldDisplay(tradeDateField) : '';

      const quantity = position.getMeasureValue(MeasureProto.DIRECTED_QUANTITY);

      // Fetch security by identifier
      const securityFilter = new PositionFilter();
      const identifierProto = new IdentifierProto()
        .setIdentifierType(IdentifierTypeProto.CUSIP)
        .setIdentifierValue(identifierStr);
      const identifier = new Identifier(identifierProto);
      securityFilter.addObjectFilter(FieldProto.IDENTIFIER, identifier);

      let security: Security | null = null;
      try {
        const securities = await securityService.searchSecurityAsOfNow(securityFilter);
        if (securities && securities.length > 0) {
          security = securities[0];
        }
      } catch (error) {
        console.error(`Error fetching security for identifier ${identifierStr}:`, error);
      }

      if (!security) {
        return null;
      }

      // Extract security details
      const isBond = security.proto.getSecurityType() === SecurityTypeProto.BOND_SECURITY;
      const bondSecurity = isBond ? (security as BondSecurity) : null;

      const asOfDate = new Date();

      // Build TransactionData
      return {
        transactionId: identifierStr,
        transactionSettlementDate: '',
        transactionIssuerName: security.getIssuerName() ?? '',
        transactionIssueDate: security.getIssueDate()?.toString() ?? '',
        transactionQuantity: quantity?.toString() ?? '0',
        transactionProductType: bondSecurity?.getProductType() ?? '',
        transactionCouponRate: security.proto.getCouponRate()?.getArbitraryPrecisionValue() ?? '',
        transactionCouponType: bondSecurity?.getCouponType().name() ?? '',
        transactionTenor: bondSecurity?.getTenor(asOfDate).getTenorDescription() ?? '',
        transactionCouponFrequency: bondSecurity?.getCouponFrequency()?.toString() ?? '',
        transactionMaturityDate: security.getMaturityDate()?.toString() ?? '',
        transactionTradeDate: tradeDate,
        transactionSide: transactionType ?? ''
      };
    });

    // Wait for all security fetches to complete and filter out nulls
    const transactionData = (await Promise.all(transactionDataPromises)).filter(
      (item): item is TransactionData => item !== null
    );

    return transactionData;
  } catch (error) {
    console.error("Error fetching transaction data from positions:", error);
    return [];
  }
}

/**
 * Adjusts transaction quantity to be directional based on transaction type.
 * BUY and MATURATION_OFFSET should be positive, MATURATION should be negative.
 * The server provides absolute numbers, so we apply the appropriate sign.
 */
function adjustQuantityDirection(transactions: TransactionData[], shouldBeNegative: boolean): TransactionData[] {
  return transactions.map(txn => {
    const quantity = parseFloat(txn.transactionQuantity || '0');
    const absoluteQuantity = Math.abs(quantity);
    const directionalQuantity = shouldBeNegative ? -absoluteQuantity : absoluteQuantity;
    return {
      ...txn,
      transactionQuantity: directionalQuantity.toString()
    };
  });
}

/**
 * Combines two transaction lists by CUSIP, summing quantities where there are duplicates.
 * Returns a single entry per CUSIP with the summed quantity.
 */
function combineTransactionsByCusip(transactions1: TransactionData[], transactions2: TransactionData[]): TransactionData[] {
  // Create a map to group by CUSIP (transactionId)
  const cusipMap = new Map<string, TransactionData>();

  // Process first list
  for (const txn of transactions1) {
    const cusip = txn.transactionId;
    const quantity = parseFloat(txn.transactionQuantity || '0');

    if (cusipMap.has(cusip)) {
      // Add to existing quantity
      const existing = cusipMap.get(cusip)!;
      const existingQuantity = parseFloat(existing.transactionQuantity || '0');
      existing.transactionQuantity = (existingQuantity + quantity).toString();
    } else {
      // Create new entry
      cusipMap.set(cusip, { ...txn });
    }
  }

  // Process second list
  for (const txn of transactions2) {
    const cusip = txn.transactionId;
    const quantity = parseFloat(txn.transactionQuantity || '0');

    if (cusipMap.has(cusip)) {
      // Add to existing quantity
      const existing = cusipMap.get(cusip)!;
      const existingQuantity = parseFloat(existing.transactionQuantity || '0');
      existing.transactionQuantity = (existingQuantity + quantity).toString();
    } else {
      // Create new entry
      cusipMap.set(cusip, { ...txn });
    }
  }

  // Convert map values to array
  return Array.from(cusipMap.values());
}

/** @type {import('../../../.svelte-kit/types/src/routes').PageServerLoad} */
export async function load({ locals }) {
  // Fetch BUY transactions - should be positive
  const filter = createTreasuryTransactionBuyFilter();
  let buyTransactions = await FetchTransactionWithFilter(filter);
  buyTransactions = adjustQuantityDirection(buyTransactions, false);

  // Fetch MATURATION transactions - should be negative (using position service)
  const filter2 = createTreasuryTransactionMaturityFilter(TransactionTypeProto.MATURATION);
  let maturationTransactions = await fetchTransactionsFromPositions(filter2);
  maturationTransactions = adjustQuantityDirection(maturationTransactions, true);

  // Fetch MATURATION_OFFSET transactions - should be positive (using position service)
  const filter3 = createTreasuryTransactionMaturityFilter(TransactionTypeProto.MATURATION_OFFSET);
  let maturationTransactions2 = await fetchTransactionsFromPositions(filter3);
  maturationTransactions2 = adjustQuantityDirection(maturationTransactions2, false);

  // Combine MATURATION and MATURATION_OFFSET transactions by CUSIP, summing quantities
  const combinedMaturationTransactions = combineTransactionsByCusip(maturationTransactions, maturationTransactions2);

  // Concatenate all transactions
  const transactions = buyTransactions.concat(combinedMaturationTransactions);

  return {
    transactions: transactions,
    user: locals.user
  };
}