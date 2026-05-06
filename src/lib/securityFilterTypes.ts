/**
 * Browser-safe type constants for /data/securities filters.
 *
 * Why a separate module? `$lib/security.ts` imports `@grpc/grpc-js` for the
 * server-side search; pulling it into a Svelte component (e.g. SecuritySelect)
 * drags grpc-js into the client bundle, where `process is not defined`
 * crashes load. This file imports only `Identifier` (a thin wrapper over
 * proto enums) and `SecurityTypeProto` — both proto-only, no grpc.
 *
 * Phase 1 of second-brain#226; updated for ledger-models 0.1.133 to source
 * IDENTIFIER_TYPE_NAMES from the wrapper's `Identifier.getAllTypeNames()`
 * helper. Adding a new IdentifierTypeProto enum entry now propagates to
 * the dropdown automatically without a UI-side edit.
 */
import { Identifier } from '@fintekkers/ledger-models/node/wrappers/models/security/identifier';

// Compile-time literal union — kept hand-typed so consumers get
// exhaustive-switch / narrowing in TS. Mirrors the proto enum keys
// returned by Identifier.getAllTypeNames(). If the proto adds a new
// enum entry, the runtime list below picks it up immediately and the
// dropdown shows it; the string literal here will lag by one PR but
// that's a deliberate review hook (TS errors on switch statements
// remind humans to handle the new case).
export type IdentifierTypeName =
  | 'CUSIP'
  | 'ISIN'
  | 'EXCH_TICKER'
  | 'SERIES_ID'
  | 'OSI'
  | 'FIGI'
  | 'CASH';

// Runtime list driving UI dropdowns. Sourced from Identifier.getAllTypeNames()
// (ledger-models 0.1.133+) — proto-declaration order, excludes the
// UNKNOWN_IDENTIFIER_TYPE sentinel. NOTE: the dropdown order changes vs
// the previous hand-typed array (was CUSIP-first; now matches proto
// order: EXCH_TICKER, ISIN, CUSIP, OSI, FIGI, SERIES_ID, CASH). This is
// the deliberate trade-off for losing the source-of-drift between this
// file and the proto.
export const IDENTIFIER_TYPE_NAMES: readonly IdentifierTypeName[] =
  Identifier.getAllTypeNames() as readonly IdentifierTypeName[];

// SecurityTypeProto names supported by /data/securities filtering. The
// FX_SPOT / EQUITY_INDEX_SECURITY / UNKNOWN_SECURITY_TYPE entries exist on
// the proto but aren't user-facing today; add here if/when the seed grows.
export type SecurityTypeName =
  | 'BOND_SECURITY'
  | 'EQUITY_SECURITY'
  | 'INDEX_SECURITY'
  | 'CASH_SECURITY'
  | 'TIPS'
  | 'FRN';

export const SECURITY_TYPE_NAMES: readonly SecurityTypeName[] = [
  'BOND_SECURITY',
  'EQUITY_SECURITY',
  'INDEX_SECURITY',
  'CASH_SECURITY',
  'TIPS',
  'FRN',
] as const;
