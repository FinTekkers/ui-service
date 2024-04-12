import { FieldProto } from '@fintekkers/ledger-models/node/fintekkers/models/position/field_pb';
import { MeasureProto } from '@fintekkers/ledger-models/node/fintekkers/models/position/measure_pb';
import { FetchPosition } from "$lib/positions";

/** @type {import('./$types').PageServerLoad} */
export async function load() {
  const userFields = [FieldProto.TRADE_DATE];
  const userMeasures = [MeasureProto.DIRECTED_QUANTITY];

  const requestData = { fields: userFields, measures: userMeasures };
  const positions = await FetchPosition(requestData);
  return { positions };
}
