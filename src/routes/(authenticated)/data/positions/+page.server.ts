import { error } from "@sveltejs/kit";
import pkg from "@fintekkers/ledger-models/node/fintekkers/models/position/field_pb.js";
const { FieldProto } = pkg;
import type { FieldProto as FieldProtoType } from "@fintekkers/ledger-models/node/fintekkers/models/position/field_pb";

import measure_pkg from "@fintekkers/ledger-models/node/fintekkers/models/position/measure_pb.js";
const { MeasureProto } = measure_pkg;

import { FetchPosition } from "$lib/positions";
import { IDENTIFIER_TYPE_NAMES } from "$lib/securityFilterTypes";
import {
  businessDateFilter,
  resolveBusinessDate,
  todayUtc,
} from "$lib/filters/businessDate";
import {
  FetchPortfolioUniverse,
  type PortfolioUniverseEntry,
} from "$lib/portfolios";

import position_pkg from "@fintekkers/ledger-models/node/fintekkers/models/position/position_pb.js";
const { PositionViewProto, PositionTypeProto } = position_pkg;
import { MEASURES } from "$lib/measureCatalog";

// gRPC status UNIMPLEMENTED.
const GRPC_UNIMPLEMENTED = 12;

// US-242: measures the ledger-models catalog marks `implemented: false`
// (e.g. ADJUSTED_COST_BASIS until VS-110). The catalog is the source, so no
// measure is named here.
const unimplementedMeasures = new Set(
  MEASURES.filter((m) => m.implemented === false).map((m) => m.name)
);

function notSupportedText(measure: string): string {
  return `${measure} is not supported yet`;
}

// US-276: map a URL name straight onto the generated FieldProto /
// MeasureProto enum, so newer values (e.g. INDEX_RATIO) work without a
// hand-kept copy. Own keys only, so `toString` / `__proto__` don't match;
// UNKNOWN_* is not a requestable value. Anything else is a 400, not a 500.
function toEnum<E extends { [key: string]: string | number }>(
  enumObj: E,
  name: string,
  kind: string
): E[keyof E] {
  if (
    Object.hasOwn(enumObj, name) &&
    typeof enumObj[name] === "number" &&
    !name.startsWith("UNKNOWN_")
  ) {
    return enumObj[name] as E[keyof E];
  }
  throw error(400, `Invalid ${kind}: ${name}`);
}

/** @type {import('../../../../../.svelte-kit/types/src/routes').PageServerLoad} */
export async function load({ locals, request }) {
  const searchParams = new URLSearchParams(request.url.split("?")[1]);
  const positionView = searchParams.get("positionView");
  const positionType = searchParams.get("positionType");
  const fields = searchParams.get("fields");
  const measures = searchParams.get("measures");
  // Identifier filter — second-brain#227. Canonical shape:
  //   ?identifier=<value>&identifierType=<CUSIP|ISIN|EXCH_TICKER|…>
  // The pre-#227 ?cusip=<value> shim shipped in PR #134 with an
  // explicit one-release plan and was dropped in this commit (the
  // window has long since elapsed: shim shipped on ledger-models
  // v0.1.133, current is v0.1.137). A stale bookmark with ?cusip=
  // now no-ops at this layer — the page renders the default-landing
  // state without crashing.
  const identifier = searchParams.get("identifier");
  const rawIdentifierType = searchParams.get("identifierType");
  const identifierType: string | undefined =
    rawIdentifierType && IDENTIFIER_TYPE_NAMES.includes(rawIdentifierType)
      ? rawIdentifierType
      : undefined;
  // US-291: the Business date control. "Today" is fixed here, once per
  // request, so the query and the rendered control show one date. Tax lots
  // never get a trade-date filter. Old ?tradeDate=…&tradeDateOperator=…
  // links still apply as before (the operator is validated by
  // PositionFilterOperator.fromName in $lib/positions, #229).
  const businessDate = resolveBusinessDate(
    searchParams,
    todayUtc(),
    positionType
  );
  const { tradeDate, tradeDateOperator } = businessDateFilter(businessDate);
  const assetClass = searchParams.get("assetClass");
  const portfolioId = searchParams.get("portfolioId");
  // Sort is now handled client-side, but we keep these for backward compatibility
  const sortBy = searchParams.get("sortBy");
  const sortDirection = searchParams.get("sortDirection") || "asc";

  // Phase 3 of #226 (PR-A): PortfolioFilter primitive needs the
  // (id, name) universe + the resolved display name for the inbound
  // portfolioId. The universe is cached for 5 min in $lib/portfolios so
  // the per-Fetch cost is bounded; we await it here so a single render
  // pass has both the autocomplete data and the resolved name. Empty
  // universe (e.g. portfolio service unavailable) leaves the autocomplete
  // empty but doesn't break the page.
  const portfolioUniverse: PortfolioUniverseEntry[] =
    await FetchPortfolioUniverse(locals.user?.apiKey).catch(() => []);
  const portfolioName =
    (portfolioId &&
      portfolioUniverse.find((p) => p.portfolioId === portfolioId)
        ?.portfolioName) ||
    "";

  const positionViewEnumValue =
    PositionViewProto[positionView as keyof typeof PositionViewProto];
  const positionTypeEnumValue =
    PositionTypeProto[positionType as keyof typeof PositionTypeProto];

  if (!positionView || !positionType || !fields || !measures) {
    console.log("Required parameters missing. No request will be made.");
    return {
      positions: [],
      portfolioId: portfolioId || null,
      portfolioName,
      portfolioUniverse,
      businessDate,
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
      businessDate,
      user: locals.user,
    };
  }

  const fieldMeasure = { fields, measures };

  console.log({ fields, measures });

  // Function to strip quotation marks
  const stripQuotes = (str: string) => str.replace(/^"(.*)"$/, "$1");

  const userFields = stripQuotes(fields).split(",");
  const userMeasures = stripQuotes(measures).split(",");
  const unsupportedMeasures = userMeasures.filter((m) =>
    unimplementedMeasures.has(m)
  );

  // Map user fields and measures to their respective Protos
  const mappedFields = userFields.map((field) =>
    toEnum(FieldProto, field, "field")
  );

  const mappedMeasures = userMeasures.map((measure) =>
    toEnum(MeasureProto, measure, "measure")
  );

  const requestData = { fields: mappedFields, measures: mappedMeasures };
  console.log({ requestData });

  // Sort is now handled client-side, but we optionally support server-side sorting for backward compatibility
  let mappedSortBy: FieldProtoType | undefined = undefined;
  let validSortDirection: "asc" | "desc" = "asc";

  if (sortBy) {
    // Map sortBy field (take first field if comma-separated, since only one field is allowed)
    const sortByField = stripQuotes(sortBy).split(",")[0].trim();
    mappedSortBy = toEnum(FieldProto, sortByField, "sort field");

    // Validate sort direction
    validSortDirection = sortDirection === "desc" ? "desc" : "asc";
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
      tradeDate,
      tradeDateOperator,
      assetClass || undefined,
      portfolioId || undefined,
      locals.user?.apiKey,
      identifierType
    );
  } catch (e: any) {
    const detail = e?.details || e?.message || String(e);
    console.error("Error fetching positions:", detail);
    if (e?.code === GRPC_UNIMPLEMENTED) {
      // US-242: valuation-service names the measure, e.g.
      // "ADJUSTED_COST_BASIS is not supported yet"; show it as sent.
      fetchError =
        e?.details ||
        notSupportedText(unsupportedMeasures[0] ?? "This measure");
    } else {
      fetchError = detail
        ? `Could not load positions: ${detail}`
        : "Could not load positions (backend returned an empty error).";
    }
  }
  // US-242: an unimplemented measure can also come back as no value at all
  // (or no rows), which would read as a blank cell; say why instead.
  if (!fetchError && unsupportedMeasures.length > 0) {
    fetchError = unsupportedMeasures.map(notSupportedText).join("; ");
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
    unsupportedMeasures,
    businessDate,
    user: locals.user,
  };
}
