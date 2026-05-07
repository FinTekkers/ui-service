/**
 * Browser-safe type constants for /data/securities filters.
 *
 * Why a separate module? `$lib/security.ts` imports `@grpc/grpc-js` for the
 * server-side search; pulling it into a Svelte component (e.g. SecuritySelect)
 * drags grpc-js into the client bundle, where `process is not defined`
 * crashes load. This file imports only the thin wrappers over proto enums
 * (Identifier, SecurityType, AssetClass) — all proto-only, no grpc.
 *
 * Phase 1 of second-brain#226; updated incrementally:
 *   - 0.1.133: IDENTIFIER_TYPE_NAMES sourced from Identifier.getAllTypeNames().
 *   - 0.1.134: SECURITY_TYPE_NAMES + ASSET_CLASS_NAMES sourced from the new
 *     SecurityType / AssetClass wrappers. Adding a new proto enum entry
 *     now propagates to the dropdown automatically without a UI-side edit.
 *
 * Type-union convention (consistent across all three): hand-typed string
 * literal union for compile-time exhaustive-switch / narrowing, runtime
 * list cast to `readonly <Union>[]` from the wrapper helper. When a new
 * proto enum entry lands, the runtime dropdown picks it up immediately;
 * the literal union lags by one PR — that's a deliberate review hook
 * (TS errors on consumer switch statements remind humans to handle the
 * new case).
 */
import { Identifier } from '@fintekkers/ledger-models/node/wrappers/models/security/identifier';
import { SecurityType } from '@fintekkers/ledger-models/node/wrappers/models/security/security_type';
import { AssetClass } from '@fintekkers/ledger-models/node/wrappers/models/security/asset_class';

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

// ----- SecurityTypeProto -----

// Was hand-typed pre-0.1.134 (only 6 entries: BOND/EQUITY/INDEX/CASH/TIPS/FRN).
// The wrapper now exposes the full 8-entry set (adds FX_SPOT and
// EQUITY_INDEX_SECURITY) — the dropdown picks them up automatically.
export type SecurityTypeName =
  | 'CASH_SECURITY'
  | 'EQUITY_SECURITY'
  | 'BOND_SECURITY'
  | 'TIPS'
  | 'FRN'
  | 'INDEX_SECURITY'
  | 'FX_SPOT'
  | 'EQUITY_INDEX_SECURITY';

export const SECURITY_TYPE_NAMES: readonly SecurityTypeName[] =
  SecurityType.getAllTypeNames() as readonly SecurityTypeName[];

// Friendly UI labels for the dropdown. Hides the `_SECURITY` suffix while
// the URL/proto still carries the canonical name (?securityType=BOND_SECURITY).
export const SECURITY_TYPE_LABELS: Record<SecurityTypeName, string> = {
  BOND_SECURITY: 'Bond',
  EQUITY_SECURITY: 'Equity',
  INDEX_SECURITY: 'Index',
  CASH_SECURITY: 'Cash',
  TIPS: 'TIPS',
  FRN: 'FRN',
  FX_SPOT: 'FX Spot',
  EQUITY_INDEX_SECURITY: 'Equity Index',
};

// ----- AssetClassProto -----

// CASH_ASSET_CLASS is the proto name due to a package-wide enum collision
// with IdentifierTypeProto.CASH; the friendly 'Cash' label below hides
// the wart from end users.
export type AssetClassName =
  | 'FIXED_INCOME'
  | 'EQUITY'
  | 'CASH_ASSET_CLASS'
  | 'INDEX';

export const ASSET_CLASS_NAMES: readonly AssetClassName[] =
  AssetClass.getAllTypeNames() as readonly AssetClassName[];

export const ASSET_CLASS_LABELS: Record<AssetClassName, string> = {
  FIXED_INCOME: 'Fixed Income',
  EQUITY: 'Equity',
  CASH_ASSET_CLASS: 'Cash',
  INDEX: 'Index',
};
