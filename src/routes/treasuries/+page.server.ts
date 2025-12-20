import { FetchTransactionWithFilter, type TransactionData } from "$lib/transactions";
import { FieldProto } from "@fintekkers/ledger-models/node/fintekkers/models/position/field_pb.js";
import { PositionFilterOperator } from "@fintekkers/ledger-models/node/fintekkers/models/position/position_util_pb.js";
import { TransactionTypeProto } from "@fintekkers/ledger-models/node/fintekkers/models/transaction/transaction_type_pb.js";
import { PositionFilter } from "@fintekkers/ledger-models/node/wrappers/models/position/positionfilter";

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

  const sixWeeksAhead = new Date();
  sixWeeksAhead.setDate(sixWeeksAhead.getDate() + 42); // 6 weeks = 42 days

  filter.addFilter(FieldProto.TRADE_DATE, PositionFilterOperator.MORE_THAN, sixWeeksAgo);
  // filter.addFilter(FieldProto.TRADE_DATE, PositionFilterOperator.LESS_THAN, sixWeeksAhead);
  filter.addEqualsFilter(FieldProto.TRANSACTION_TYPE, transactionType);

  return filter;
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

/** @type {import('../../../.svelte-kit/types/src/routes').PageServerLoad} */
export async function load({ locals }) {
  // Fetch BUY transactions - should be positive
  const filter = createTreasuryTransactionBuyFilter();
  let buyTransactions = await FetchTransactionWithFilter(filter);
  buyTransactions = adjustQuantityDirection(buyTransactions, false);

  // Fetch MATURATION transactions - should be negative
  const filter2 = createTreasuryTransactionMaturityFilter(TransactionTypeProto.MATURATION);
  let maturationTransactions = await FetchTransactionWithFilter(filter2);
  maturationTransactions = adjustQuantityDirection(maturationTransactions, true);

  // Fetch MATURATION transactions - should be positive
  const filter3 = createTreasuryTransactionMaturityFilter(TransactionTypeProto.MATURATION);
  let maturationTransactions2 = await FetchTransactionWithFilter(filter3);
  maturationTransactions2 = adjustQuantityDirection(maturationTransactions2, false);

  // Concatenate all transactions
  const transactions = buyTransactions.concat(maturationTransactions, maturationTransactions2);

  return {
    transactions: transactions,
    user: locals.user
  };
}