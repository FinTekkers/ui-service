import { FetchTransactionWithFilter } from "$lib/transactions";
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
  filter.addFilter(FieldProto.TRADE_DATE, PositionFilterOperator.LESS_THAN, sixWeeksAhead);
  filter.addEqualsFilter(FieldProto.TRANSACTION_TYPE, transactionType);

  return filter;
}

/** @type {import('../../../.svelte-kit/types/src/routes').PageServerLoad} */
export async function load({ locals }) {
  const filter = createTreasuryTransactionBuyFilter();
  let transactions = await FetchTransactionWithFilter(filter);

  const filter2 = createTreasuryTransactionMaturityFilter(TransactionTypeProto.MATURATION);
  transactions = transactions.concat(await FetchTransactionWithFilter(filter2));

  const filter3 = createTreasuryTransactionMaturityFilter(TransactionTypeProto.MATURATION_OFFSET);
  transactions = transactions.concat(await FetchTransactionWithFilter(filter3));

  return {
    transactions: transactions,
    user: locals.user
  };
}