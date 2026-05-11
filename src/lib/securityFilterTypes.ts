/**
 * Browser-safe type constants for /data/securities filters.
 *
 * Why a separate module? `$lib/security.ts` imports `@grpc/grpc-js` for the
 * server-side search; pulling it into a Svelte component (e.g. SecuritySelect)
 * drags grpc-js into the client bundle, where `process is not defined`
 * crashes load. This file imports only the thin wrappers over proto enums
 * (Identifier, AssetClass) and the product-hierarchy registry helper — all
 * proto-only, no grpc.
 *
 * History:
 *   - 0.1.133 (PR #134): IDENTIFIER_TYPE_NAMES sourced from Identifier.getAllTypeNames().
 *   - 0.1.134 (PR #136): SECURITY_TYPE_NAMES + ASSET_CLASS_NAMES sourced from
 *     the SecurityType / AssetClass wrappers.
 *   - 0.2.1 (M5 / #260): SecurityType wrapper RETIRED — the SecurityTypeProto
 *     enum was replaced by ProductTypeProto + InstrumentTypeProto + a richer
 *     asset_class hierarchy. PRODUCT_TYPE_NAMES is now sourced from
 *     `product_hierarchy.activeProductTypes()` (status=active leaves from
 *     hierarchy.json); ASSET_CLASS_NAMES is sourced from
 *     `product_hierarchy.allAssetClasses()` (tree view, includes internal
 *     nodes FIXED_INCOME / COMMODITY alongside leaves RATES / METALS).
 *     INSTRUMENT_TYPE_NAMES is new — drives the InstrumentTypeFilter primitive.
 *
 * Type-union convention: hand-typed string literal union for compile-time
 * exhaustive-switch / narrowing, runtime list cast to `readonly <Union>[]`
 * from the wrapper helper. When a new proto enum entry lands, the runtime
 * dropdown picks it up immediately; the literal union lags by one PR —
 * deliberate review hook (TS errors on consumer switch statements remind
 * humans to handle the new case).
 */
import { Identifier } from '@fintekkers/ledger-models/node/wrappers/models/security/identifier';
import { AssetClass } from '@fintekkers/ledger-models/node/wrappers/models/security/asset_class';
import {
  activeProductTypes,
  allAssetClasses,
  allInstrumentTypes,
  labelOf,
  assetClassLabelOf,
} from '@fintekkers/ledger-models/node/wrappers/models/security/product_hierarchy';

// ----- IdentifierTypeProto -----

export type IdentifierTypeName =
  | 'CUSIP'
  | 'ISIN'
  | 'EXCH_TICKER'
  | 'SERIES_ID'
  | 'OSI'
  | 'FIGI'
  | 'CASH';

// Proto-declaration order: EXCH_TICKER, ISIN, CUSIP, OSI, FIGI, SERIES_ID, CASH.
// (Differs from the pre-0.1.133 hand-typed CUSIP-first order; documented
// trade-off for losing the source-of-drift between this file and the proto.)
export const IDENTIFIER_TYPE_NAMES: readonly IdentifierTypeName[] =
  Identifier.getAllTypeNames() as readonly IdentifierTypeName[];

// Friendly UI labels for the dropdown. Centralized here so consumers
// (IdentifierFilter today; future autocomplete / detail views tomorrow)
// don't duplicate the strings. Ledger-models could host these long-term
// next to getAllTypeNames(); this file is the right place until then.
export const IDENTIFIER_TYPE_LABELS: Record<IdentifierTypeName, string> = {
  CUSIP: 'CUSIP',
  ISIN: 'ISIN',
  EXCH_TICKER: 'Ticker',
  SERIES_ID: 'Series ID',
  OSI: 'OSI',
  FIGI: 'FIGI',
  CASH: 'Cash',
};

// Placeholder examples per identifier type. Same centralization rationale
// as IDENTIFIER_TYPE_LABELS — IdentifierFilter consumes these today;
// future search/autocomplete consumers will too.
export const IDENTIFIER_TYPE_PLACEHOLDERS: Record<IdentifierTypeName, string> = {
  CUSIP: 'e.g. 912828ZT0',
  ISIN: 'e.g. GB0002404557',
  EXCH_TICKER: 'e.g. AAPL',
  SERIES_ID: 'e.g. CPIAUCSL',
  OSI: 'e.g. AAPL  240119C00150000',
  FIGI: 'e.g. BBG000B9XRY4',
  CASH: 'e.g. USD',
};

// ----- ProductTypeProto (M5 / #260) -----

// Active leaf product types from hierarchy.json. Abstract nodes
// (BOND, GOV_BOND, OPTION, …) are NOT in this set — only entries that
// can be assigned to a concrete security. Adding a new leaf upstream
// auto-propagates here; the literal union below lags by one PR
// (deliberate review hook — TS will flag consumer switches that don't
// handle the new case).
export type ProductTypeName =
  // GOV_BOND leaves
  | 'TBILL'
  | 'TREASURY_NOTE'
  | 'TREASURY_BOND'
  | 'TIPS'
  | 'TREASURY_FRN'
  | 'STRIPS'
  | 'SOVEREIGN_BOND'
  // CREDIT_BOND leaves
  | 'CORP_BOND'
  | 'MUNI_BOND'
  // STOCK leaves
  | 'COMMON_STOCK'
  | 'PREFERRED_STOCK'
  | 'ADR'
  | 'ETF'
  // INDEX leaves
  | 'EQUITY_INDEX'
  | 'BOND_INDEX'
  | 'COMMODITY_INDEX'
  | 'VIX_SPOT'
  | 'CPI_SERIES'
  | 'SOFR_SERIES'
  // CASH_INSTRUMENT leaves
  | 'CURRENCY'
  | 'FX_SPOT'
  | 'MONEY_MARKET_FUND'
  // CRYPTO leaves
  | 'CRYPTOCURRENCY'
  | 'STABLECOIN'
  // COMMODITY_SPOT leaves
  | 'GOLD'
  | 'SILVER';

export const PRODUCT_TYPE_NAMES: readonly ProductTypeName[] =
  activeProductTypes() as readonly ProductTypeName[];

// Friendly labels from the wrapper (hierarchy.json's `label` field).
// Fall back to the proto name for any active leaf without a label
// (shouldn't happen for active entries, but defensive).
export const PRODUCT_TYPE_LABELS: Record<string, string> = Object.fromEntries(
  PRODUCT_TYPE_NAMES.map((name) => [name, labelOf(name) ?? name]),
);

// ----- AssetClassProto + asset-class hierarchy (M5 / #260) -----

// Tree-view asset class names. Includes both internal nodes
// (FIXED_INCOME, COMMODITY) and leaves (RATES, CREDIT, METALS, ENERGY,
// AGRICULTURAL). Selecting an internal node in the AssetClassFilter
// expands to its descendants on the server side via
// assetClassDescendantsOf().
//
// The flat proto enum (AssetClass.getAllTypeNames()) still exists for
// back-compat — exported below as FLAT_ASSET_CLASS_NAMES — but the
// dropdown should drive off the tree view so users can pick at any
// level of the hierarchy.
export type AssetClassName =
  | 'FIXED_INCOME'
  | 'RATES'
  | 'CREDIT'
  | 'EQUITY'
  | 'VOLATILITY'
  | 'CASH'
  | 'FX'
  | 'CRYPTO'
  | 'COMMODITY'
  | 'METALS'
  | 'ENERGY'
  | 'AGRICULTURAL'
  | 'REAL_ESTATE'
  | 'ALTERNATIVE';

export const ASSET_CLASS_NAMES: readonly AssetClassName[] =
  allAssetClasses() as readonly AssetClassName[];

// Flat proto enum view (legacy / migration aid). Producers writing the
// canonical asset_class STRING field on SecurityProto can still use this
// to validate against the proto vocabulary. Consumers should prefer the
// hierarchy view above.
export const FLAT_ASSET_CLASS_NAMES: readonly string[] = AssetClass.getAllTypeNames();

export const ASSET_CLASS_LABELS: Record<string, string> = Object.fromEntries(
  ASSET_CLASS_NAMES.map((name) => [name, assetClassLabelOf(name) ?? name]),
);

// ----- InstrumentTypeProto (NEW in M5 / #260) -----

export type InstrumentTypeName =
  | 'CASH'
  | 'DERIVATIVE'
  | 'REFERENCE_INDEX';

export const INSTRUMENT_TYPE_NAMES: readonly InstrumentTypeName[] =
  allInstrumentTypes() as readonly InstrumentTypeName[];

// Friendly labels. Short names because the dropdown shows them
// inline. The motivating examples (.SPX vs SPY vs ES future from
// #256's spec) make these short labels meaningful in context.
export const INSTRUMENT_TYPE_LABELS: Record<InstrumentTypeName, string> = {
  CASH: 'Cash',
  DERIVATIVE: 'Derivative',
  REFERENCE_INDEX: 'Reference Index',
};
