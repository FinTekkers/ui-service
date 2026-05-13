import pkg from '@fintekkers/ledger-models/node/fintekkers/models/position/field_pb.js';
const { FieldProto } = pkg;
import type { FieldProto as FieldProtoType } from '@fintekkers/ledger-models/node/fintekkers/models/position/field_pb';

import measure_pkg from "@fintekkers/ledger-models/node/fintekkers/models/position/measure_pb.js";
const { MeasureProto } = measure_pkg;

import { FetchPosition } from "$lib/positions";
import { IDENTIFIER_TYPE_NAMES, type IdentifierTypeName } from "$lib/securityFilterTypes";
import { FetchPortfolioUniverse, type PortfolioUniverseEntry } from "$lib/portfolios";

import position_pkg from '@fintekkers/ledger-models/node/fintekkers/models/position/position_pb.js';
const { PositionViewProto, PositionTypeProto } = position_pkg;

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
  PROFIT_LOSS: MeasureProto.PROFIT_LOSS,
  PROFIT_LOSS_PERCENT: MeasureProto.PROFIT_LOSS_PERCENT,
  ACCRUED_INTEREST: MeasureProto.ACCRUED_INTEREST,
  DIRTY_PRICE: MeasureProto.DIRTY_PRICE,
  CLEAN_PRICE: MeasureProto.CLEAN_PRICE,
  CONVEXITY: MeasureProto.CONVEXITY,
  MODIFIED_DURATION: MeasureProto.MODIFIED_DURATION,
  DV01: MeasureProto.DV01,
  PRESENT_VALUE_CASHFLOWS: MeasureProto.PRESENT_VALUE_CASHFLOWS,
};

/** @type {import('../../../../../.svelte-kit/types/src/routes').PageServerLoad} */
export async function load({ locals, request }) {
  const searchParams = new URLSearchParams(request.url.split("?")[1]);
  const positionView = searchParams.get('positionView');
  const positionType = searchParams.get('positionType');
  const fields = searchParams.get('fields');
  const measures = searchParams.get('measures');
  // Identifier filter — second-brain#227. Canonical shape:
  //   ?identifier=<value>&identifierType=<CUSIP|ISIN|EXCH_TICKER|…>
  // The pre-#227 ?cusip=<value> shim shipped in PR #134 with an
  // explicit one-release plan and was dropped in this commit (the
  // window has long since elapsed: shim shipped on ledger-models
  // v0.1.133, current is v0.1.137). A stale bookmark with ?cusip=
  // now no-ops at this layer — the page renders the default-landing
  // state without crashing.
  const identifier = searchParams.get('identifier');
  const rawIdentifierType = searchParams.get('identifierType');
  const identifierType: IdentifierTypeName | undefined =
    rawIdentifierType && (IDENTIFIER_TYPE_NAMES as readonly string[]).includes(rawIdentifierType)
      ? (rawIdentifierType as IdentifierTypeName)
      : undefined;
  const tradeDate = searchParams.get('tradeDate');
  // Operator passes through untransformed — PositionFilterOperator's
  // fromName (in $lib/positions) is the only validator (#229 review).
  const tradeDateOperator = searchParams.get('tradeDateOperator');
  const assetClass = searchParams.get('assetClass');
  const portfolioId = searchParams.get('portfolioId');
  // Sort is now handled client-side, but we keep these for backward compatibility
  const sortBy = searchParams.get('sortBy');
  const sortDirection = searchParams.get('sortDirection') || 'asc';

  // Phase 3 of #226 (PR-A): PortfolioFilter primitive needs the
  // (id, name) universe + the resolved display name for the inbound
  // portfolioId. The universe is cached for 5 min in $lib/portfolios so
  // the per-Fetch cost is bounded; we await it here so a single render
  // pass has both the autocomplete data and the resolved name. Empty
  // universe (e.g. portfolio service unavailable) leaves the autocomplete
  // empty but doesn't break the page.
  const portfolioUniverse: PortfolioUniverseEntry[] = await FetchPortfolioUniverse(locals.user?.apiKey).catch(
    () => [],
  );
  const portfolioName =
    portfolioId && portfolioUniverse.find((p) => p.portfolioId === portfolioId)?.portfolioName || '';

  const positionViewEnumValue = PositionViewProto[positionView as keyof typeof PositionViewProto];
  const positionTypeEnumValue = PositionTypeProto[positionType as keyof typeof PositionTypeProto];

  if (!positionView || !positionType || !fields || !measures) {
    console.log('Required parameters missing. No request will be made.');
    return {
      positions: [],
      portfolioId: portfolioId || null,
      portfolioName,
      portfolioUniverse,
      user: locals.user,
    };
  }

  // If either fields or measures is missing, return early
  if (!fields || !measures) {
    console.log("Fields or measures missing. No request will be made.");
    return {
      positions: [],
      portfolioId: portfolioId || null,
      portfolioName,
      portfolioUniverse,
      user: locals.user,
    };
  }

  const fieldMeasure = { fields, measures };

  console.log({ fields, measures });

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

  // Sort is now handled client-side, but we optionally support server-side sorting for backward compatibility
  let mappedSortBy: FieldProtoType | undefined = undefined;
  let validSortDirection: 'asc' | 'desc' = 'asc';

  if (sortBy) {
    // Map sortBy field (take first field if comma-separated, since only one field is allowed)
    const sortByField = stripQuotes(sortBy).split(",")[0].trim();
    const sortByFieldName = sortByField as keyof typeof fieldLookup;
    mappedSortBy = fieldLookup[sortByFieldName];

    if (!mappedSortBy) {
      throw new Error(`Invalid sort field: ${sortByField}`);
    }

    // Validate sort direction
    validSortDirection = sortDirection === 'desc' ? 'desc' : 'asc';
  }

  // The position-search aggregates measures via valuation-service, and
  // valuation-service throws INVALID_ARGUMENT on partial security data
  // (e.g. "FRN requires spread on security" when an FRN in the portfolio
  // is missing its spread field). A single such security in the requested
  // portfolio used to take down the whole page render with a SvelteKit
  // 500 — surfaced as M6 #263 bug 1 (SOMA portfolio link). Catch the
  // gRPC error here and surface it as a structured page-level message so
  // the rest of the page (autocomplete, header, back link) still renders.
  let positions: any = [];
  let fetchError: string | null = null;
  try {
    positions = await FetchPosition(
      requestData,
      positionViewEnumValue,
      positionTypeEnumValue,
      mappedSortBy,
      validSortDirection,
      identifier || undefined,
      tradeDate || undefined,
      tradeDateOperator ?? undefined,
      assetClass || undefined,
      portfolioId || undefined,
      locals.user?.apiKey,
      identifierType,
    );
  } catch (e: any) {
    const detail = e?.details || e?.message || String(e);
    console.error('Error fetching positions:', detail);
    fetchError = detail
      ? `Could not load positions: ${detail}`
      : 'Could not load positions (backend returned an empty error).';
  }

  const metadata = { fields: userFields, measures: userMeasures };
  return {
    positions: positions,
    requestData: requestData,
    fieldMeasure: fieldMeasure,
    metadata: metadata,
    portfolioId: portfolioId || null,
    portfolioName,
    portfolioUniverse,
    error: fetchError,
    user: locals.user
  };
}
