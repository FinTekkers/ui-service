import { FetchTransaction } from "$lib/transactions";
import { FetchPortfolio } from "$lib/portfolios";
import { FetchSecurity } from "$lib/security";
import { FetchPosition } from "$lib/positions";

import { FieldProto } from '@fintekkers/ledger-models/node/fintekkers/models/position/field_pb';
import { MeasureProto } from '@fintekkers/ledger-models/node/fintekkers/models/position/measure_pb';

/** @type {import('./$types').PageServerLoad} */
export async function load() {
  const userFields = [FieldProto.TRADE_DATE];
  const userMeasures = [MeasureProto.DIRECTED_QUANTITY];

  const requestData = { fields: userFields, measures: userMeasures };
  const transactions = await FetchTransaction();
  const portfolios = await FetchPortfolio("Federal Reserve SOMA Holdings");
  const security = await FetchSecurity("Fixed Income", "US Government");
  const positions = await FetchPosition(requestData);
  return { security, portfolios, transactions, positions };
}
