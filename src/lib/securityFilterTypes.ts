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

// ----- SecurityTypeProto -----

// Was hand-typed pre-0.1.134 (only 6 entries: BOND/EQUITY/INDEX/CASH/TIPS/FRN).
// The wrapper now exposes the full 8-entry set (adds FX_SPOT and
// EQUITY_INDEX_SECURITY) — the dropdown picks them up automatically.
// Friendly labels live with the consumer primitive (SecurityTypeFilter.svelte).
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

// ----- AssetClassProto -----

// CASH_ASSET_CLASS is the proto name due to package-wide enum collision
// with IdentifierTypeProto.CASH; the friendly 'Cash' label in
// AssetClassFilter hides the wart from end users.
export type AssetClassName =
  | 'FIXED_INCOME'
  | 'EQUITY'
  | 'CASH_ASSET_CLASS'
  | 'INDEX';

export const ASSET_CLASS_NAMES: readonly AssetClassName[] =
  AssetClass.getAllTypeNames() as readonly AssetClassName[];
