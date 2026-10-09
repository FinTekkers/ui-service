/**
 * Browser-safe values and labels for the /data/securities filters.
 *
 * Why a separate module? `$lib/security.ts` imports `@grpc/grpc-js` for the
 * server-side search; pulling it into a Svelte component (e.g. SecuritySelect)
 * drags grpc-js into the client bundle, where `process is not defined`
 * crashes load. This file imports only the thin wrappers over proto enums
 * (Identifier, AssetClass) and the product-hierarchy registry helper — all
 * proto-only, no grpc.
 *
 * US-207: every value list, label and placeholder comes from ledger-models
 * (hierarchy.json via product_hierarchy, LM-275 / 0.4.29+). This file
 * declares no unions, label maps or fallbacks of its own — it only
 * re-exports. A missing value or label is fixed in ledger-models, never
 * here.
 *
 * History:
 *   - 0.1.133 (PR #134): IDENTIFIER_TYPE_NAMES sourced from Identifier.getAllTypeNames().
 *   - 0.2.1 (M5 / #260): PRODUCT_TYPE_NAMES / ASSET_CLASS_NAMES /
 *     INSTRUMENT_TYPE_NAMES sourced from product_hierarchy.
 *   - 0.4.29 (US-207): labels and placeholders sourced from product_hierarchy;
 *     the hand-typed unions and label maps were removed.
 */
import { Identifier } from "@fintekkers/ledger-models/node/wrappers/models/security/identifier";
import { AssetClass } from "@fintekkers/ledger-models/node/wrappers/models/security/asset_class";
import { IdentifierTypeProto } from "@fintekkers/ledger-models/node/fintekkers/models/security/identifier/identifier_type_pb";
import {
  activeProductTypes,
  allAssetClasses,
  allInstrumentTypes,
  identifierTypeLabelOf,
  identifierTypePlaceholderOf,
} from "@fintekkers/ledger-models/node/wrappers/models/security/product_hierarchy";

export {
  labelOf,
  assetClassLabelOf,
  assetClassMatches,
  instrumentTypeCodeLabelOf,
} from "@fintekkers/ledger-models/node/wrappers/models/security/product_hierarchy";

// ----- IdentifierTypeProto -----

// Proto-declaration order, excluding UNKNOWN_IDENTIFIER_TYPE.
export const IDENTIFIER_TYPE_NAMES: readonly string[] =
  Identifier.getAllTypeNames();

// The identifier helpers take the proto enum value; the dropdown holds the
// enum name. Resolve through the generated enum (own keys only).
function identifierTypeOf(name: string): IdentifierTypeProto | null {
  return Object.prototype.hasOwnProperty.call(IdentifierTypeProto, name)
    ? IdentifierTypeProto[name as keyof typeof IdentifierTypeProto]
    : null;
}

/** ledger-models display label for an identifier type name, or null. */
export function identifierTypeNameLabelOf(name: string): string | null {
  const v = identifierTypeOf(name);
  return v === null ? null : identifierTypeLabelOf(v);
}

/** ledger-models input placeholder for an identifier type name, or null. */
export function identifierTypeNamePlaceholderOf(name: string): string | null {
  const v = identifierTypeOf(name);
  return v === null ? null : identifierTypePlaceholderOf(v);
}

// ----- ProductTypeProto (M5 / #260) -----

// Active leaf product types from hierarchy.json. Abstract nodes
// (BOND, GOV_BOND, OPTION, …) are NOT in this set — only entries that
// can be assigned to a concrete security.
export const PRODUCT_TYPE_NAMES: readonly string[] = activeProductTypes();

// ----- AssetClassProto + asset-class hierarchy (M5 / #260) -----

// Tree-view asset class codes. Includes both internal nodes
// (FIXED_INCOME, COMMODITY) and leaves (RATES, CREDIT, METALS, …).
// Selecting an internal node matches its descendants via
// assetClassMatches().
export const ASSET_CLASS_NAMES: readonly string[] = allAssetClasses();

// Flat proto enum view (legacy / migration aid). Consumers should prefer
// the hierarchy view above.
export const FLAT_ASSET_CLASS_NAMES: readonly string[] =
  AssetClass.getAllTypeNames();

// ----- InstrumentTypeProto (M5 / #260) -----

export const INSTRUMENT_TYPE_NAMES: readonly string[] = allInstrumentTypes();
