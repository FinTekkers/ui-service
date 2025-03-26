import pkg from "@fintekkers/ledger-models/node/fintekkers/models/position/field_pb.js";
const { FieldProto } = pkg;

import measure_pkg from '@fintekkers/ledger-models/node/fintekkers/models/position/measure_pb.js';
const { MeasureProto } = measure_pkg;

import position_pkg from "@fintekkers/ledger-models/node/fintekkers/models/position/position_pb.js";
const { PositionTypeProto, PositionViewProto } = position_pkg;

import { FetchPosition } from "$lib/positions";
import { redirect } from "@sveltejs/kit";

//**session info */
import { deleteSessionCookie } from '$lib/database/authUtils.server';
import { lucia } from '$lib/database/luciaAuth.server';

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
  // **********session data handling function
  console.log('what does the user contains', user)
  if (!user) {
    console.log("you must be logged in");
    throw redirect(303, "/login");
  }
  return {
    user
  };
};


export const actions = {

  logout: async ({ cookies, locals }) => {
    if (!locals.session?.id) return;

    await lucia.invalidateSession(locals.session.id);

    await deleteSessionCookie(lucia, cookies);

    throw redirect(303, "/login");
  }

}


/** @type {import('./$types').PageServerLoad} */
export async function load({ locals: { user }, request }) {
  const searchParams = new URLSearchParams(request.url.split("?")[1]);
  const positionView = searchParams.get('positionView');
  const positionType = searchParams.get('positionType');
  const fields = searchParams.get('fields');
  const measures = searchParams.get('measures');

  const positionViewEnumValue = PositionViewProto[positionView as keyof typeof PositionViewProto];
  const positionTypeEnumValue = PositionTypeProto[positionType as keyof typeof PositionTypeProto];

  const userData = await loadUserSession(user);
  console.log('testing user data', userData)



  if (!positionView || !positionType || !fields || !measures) {
    console.log('Required parameters missing. No request will be made.');
    return { positions: [], userData }; // Return an empty array or appropriate value
  }

  // session user


  // If either fields or measures is missing, return early
  if (!fields || !measures) {
    console.log("Fields or measures missing. No request will be made.");
    return { positions: [] }; // Return an empty array or appropriate value
  }

  const fieldMeasure = { fields, measures };


  // Function to strip quotation marks
  const stripQuotes = (str: string) => str.replace(/^"(.*)"$/, "$1");

  const userFields = stripQuotes(fields).split(",");
  const userMeasures = stripQuotes(measures).split(",");

  // Map user fields and measures to their respective Protos
  const mappedFields = userFields.map((field) => {
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
  console.log({ requestData });
  const positions = await FetchPosition(requestData, positionViewEnumValue, positionTypeEnumValue);

  const metadata = { fields: userFields, measures: userMeasures };
  return { positions, requestData, fieldMeasure, metadata, userData };
}
