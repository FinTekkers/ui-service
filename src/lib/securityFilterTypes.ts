/**
 * Browser-safe type constants for /data/securities filters.
 *
 * Why a separate module? `$lib/security.ts` imports `@grpc/grpc-js` for the
 * server-side search; pulling it into a Svelte component (e.g. SecuritySelect)
 * drags grpc-js into the client bundle, where `process is not defined`
 * crashes load. This file holds just the URL-param type names + their
 * iteration order, with no runtime imports — safe to use from both the
 * client form and the server-side page-server / FetchSecurity helper.
 *
 * Phase 1 of second-brain#226. Adding a new identifier or security type is
 * a one-line edit here plus the proto-mapping switch in security.ts.
 */

export type IdentifierTypeName =
  | 'CUSIP'
  | 'ISIN'
  | 'EXCH_TICKER'
  | 'SERIES_ID'
  | 'OSI'
  | 'FIGI'
  | 'CASH';

export const IDENTIFIER_TYPE_NAMES: readonly IdentifierTypeName[] = [
  'CUSIP',
  'ISIN',
  'EXCH_TICKER',
  'SERIES_ID',
  'OSI',
  'FIGI',
  'CASH',
] as const;

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
