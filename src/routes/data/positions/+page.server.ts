import { FieldProto } from "@fintekkers/ledger-models/node/fintekkers/models/position/field_pb";
import { MeasureProto } from "@fintekkers/ledger-models/node/fintekkers/models/position/measure_pb";
import { FetchPosition } from "$lib/positions";
import { redirect } from "@sveltejs/kit";
import { PositionTypeProto, PositionViewProto } from "@fintekkers/ledger-models/node/fintekkers/models/position/position_pb";

const fieldLookup = {
  ID: FieldProto.ID,
  AS_OF: FieldProto.AS_OF,
  EFFECTIVE_DATE: FieldProto.EFFECTIVE_DATE,
  STRATEGY: FieldProto.STRATEGY,
  SECURITY: FieldProto.SECURITY,
  SECURITY_DESCRIPTION: FieldProto.SECURITY_DESCRIPTION,
  SECURITY_ISSUER_NAME: FieldProto.SECURITY_ISSUER_NAME,
  CASH_IMPACT_SECURITY: FieldProto.CASH_IMPACT_SECURITY,
  ASSET_CLASS: FieldProto.ASSET_CLASS,
  PRODUCT_CLASS: FieldProto.PRODUCT_CLASS,
  PRODUCT_TYPE: FieldProto.PRODUCT_TYPE,
  SECURITY_ID: FieldProto.SECURITY_ID,
  IDENTIFIER: FieldProto.IDENTIFIER,
  TENOR: FieldProto.TENOR,
  ISSUE_DATE: FieldProto.ISSUE_DATE,
  MATURITY_DATE: FieldProto.MATURITY_DATE,
  ADJUSTED_TENOR: FieldProto.ADJUSTED_TENOR,
  PORTFOLIO: FieldProto.PORTFOLIO,
  PORTFOLIO_ID: FieldProto.PORTFOLIO_ID,
  PORTFOLIO_NAME: FieldProto.PORTFOLIO_NAME,
  PRICE: FieldProto.PRICE,
  PRICE_ID: FieldProto.PRICE_ID,
  IS_CANCELLED: FieldProto.IS_CANCELLED,
  POSITION_STATUS: FieldProto.POSITION_STATUS,
  TRADE_DATE: FieldProto.TRADE_DATE,
  SETTLEMENT_DATE: FieldProto.SETTLEMENT_DATE,
  TRANSACTION_TYPE: FieldProto.TRANSACTION_TYPE,
  TAX_LOT_OPEN_DATE: FieldProto.TAX_LOT_OPEN_DATE,
  TAX_LOT_CLOSE_DATE: FieldProto.TAX_LOT_CLOSE_DATE,
};

const measureLookup = {
  UNKNOWN_MEASURE: MeasureProto.UNKNOWN_MEASURE,
  DIRECTED_QUANTITY: MeasureProto.DIRECTED_QUANTITY,
  MARKET_VALUE: MeasureProto.MARKET_VALUE,
  UNADJUSTED_COST_BASIS: MeasureProto.UNADJUSTED_COST_BASIS,
  ADJUSTED_COST_BASIS: MeasureProto.ADJUSTED_COST_BASIS,
  CURRENT_YIELD: MeasureProto.CURRENT_YIELD,
  YIELD_TO_MATURITY: MeasureProto.YIELD_TO_MATURITY,
};

/** @type {import('./$types').PageServerLoad} */
const loadUserSession = async (user: any) => {
  if (!user) {
    console.log("You must be logged in");
    throw redirect(303, "/login");
  }
  return {
    user,
  };
};

/** @type {import('./$types').PageServerLoad} */
export async function load({ locals: { user }, request }) {
  const searchParams = new URLSearchParams(request.url.split("?")[1]);
  const positionView = searchParams.get('positionView');
  const positionType = searchParams.get('positionType');
  const rows = searchParams.get('rows');
  const columns = searchParams.get('columns');
  const measures = searchParams.get('measures');

  const positionViewEnumValue = PositionViewProto[positionView as keyof typeof PositionViewProto];
  const positionTypeEnumValue = PositionTypeProto[positionType as keyof typeof PositionTypeProto];

  if (!positionView || !positionType || !rows || !columns || !measures) {
    console.log('Required parameters missing. No request will be made.');
    return { positions: [] };
  }

  const userData = await loadUserSession(user);

  const stripQuotes = (str: string) => str.replace(/^"(.*)"$/, "$1");

  const userRows = stripQuotes(rows).split(",");
  const userColumns = stripQuotes(columns).split(",");
  const userMeasures = stripQuotes(measures).split(",");

  const combinedFields = [...userRows, ...userColumns];

  const fieldMeasure = { rows, columns, measures };

  const mappedFields = combinedFields.map((field) => {
    const fieldName = field as keyof typeof fieldLookup;
    if (fieldLookup[fieldName]) {
      return fieldLookup[fieldName];
    } else {
      throw new Error(`Invalid field: ${field}`);
    }
  });

  const mappedMeasures = userMeasures.map((measure) => {
    const measureName = measure as keyof typeof measureLookup;
    if (measureLookup[measureName]) {
      return measureLookup[measureName];
    } else {
      throw new Error(`Invalid measure: ${measure}`);
    }
  });

  const requestData = { fields: mappedFields, measures: mappedMeasures };
  // console.log({ requestData });
  const positions = await FetchPosition(requestData, positionViewEnumValue, positionTypeEnumValue);

  const metadata = { rows: userRows, columns: userColumns, measures: userMeasures };
  return { positions, requestData,fieldMeasure, metadata, userData };
}
