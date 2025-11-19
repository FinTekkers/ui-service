import { FetchTransactionWithFilter } from "$lib/transactions";
import { FieldProto } from "@fintekkers/ledger-models/node/fintekkers/models/position/field_pb.js";
import { PositionFilterOperator } from "@fintekkers/ledger-models/node/fintekkers/models/position/position_util_pb.js";
import { PositionFilter } from "@fintekkers/ledger-models/node/wrappers/models/position/positionfilter";

/** @type {import('../../../.svelte-kit/types/src/routes').PageServerLoad} */
export async function load({ locals }) {

  const filter = new PositionFilter();
  filter.addEqualsFilter(FieldProto.ASSET_CLASS, "Fixed Income");

  let oneWeekAgo = new Date("2025-09-01");
  // oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  //TODO: How do to range filters?
  filter.addFilter(FieldProto.TRADE_DATE, PositionFilterOperator.MORE_THAN, oneWeekAgo);
  // filter.addFilter(FieldProto.TRADE_DATE, PositionFilterOperator.LESS_THAN, new Date());

  const transactions = await FetchTransactionWithFilter(filter);
  return {
    transactions: transactions,
    user: locals.user
  };
}