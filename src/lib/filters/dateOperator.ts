/**
 * Date filter operator vocabulary — proto enum names that mirror
 * PositionFilterOperator (the source of truth in ledger-models 0.1.135+).
 *
 * Standardized in second-brain#229 (replaces the snake_case URL convention
 * we used pre-0.1.135, where the UI emitted ?tradeDateOperator=greater_than
 * and the lib code mapped that to PositionFilterOperator.MORE_THAN — an
 * asymmetric translation that ledger-models PR #190 dropped).
 *
 * The deprecation shim (normalizeDateOperator) accepts ONE release of the
 * old shape with a console.warn so existing bookmarks / outbound links
 * survive the cutover. Mirrors the ?cusip= alias shim from #227.
 */

export type DateOperator = 'MORE_THAN' | 'LESS_THAN' | 'LESS_THAN_OR_EQUALS';

export const DEFAULT_DATE_OPERATORS: readonly DateOperator[] = [
  'MORE_THAN',
  'LESS_THAN',
  'LESS_THAN_OR_EQUALS',
] as const;

export const DEFAULT_DATE_OPERATOR_LABELS: Record<DateOperator, string> = {
  MORE_THAN: 'Greater than',
  LESS_THAN: 'Less than',
  LESS_THAN_OR_EQUALS: 'Less than or equals',
};

const DEPRECATED_DATE_OPERATOR_MAP: Record<string, DateOperator> = {
  greater_than: 'MORE_THAN',
  lesser_than: 'LESS_THAN',
  lesser_than_or_equals: 'LESS_THAN_OR_EQUALS',
};

/**
 * Normalize a URL-supplied date operator string to the canonical proto
 * enum name. Returns null when absent or unrecognized.
 *
 * Accepts:
 *  - canonical proto names ('MORE_THAN', 'LESS_THAN', 'LESS_THAN_OR_EQUALS')
 *  - deprecated snake_case names ('greater_than', 'lesser_than',
 *    'lesser_than_or_equals') — logs a console.warn so we can audit live
 *    traffic and remove the shim one release after #229.
 *
 * `paramName` is purely cosmetic for the warning message (different pages
 * use different URL key names: tradeDateOperator vs issueDateOperator).
 */
export function normalizeDateOperator(
  raw: string | null | undefined,
  paramName = 'tradeDateOperator',
): DateOperator | null {
  if (!raw) return null;

  if (raw === 'MORE_THAN' || raw === 'LESS_THAN' || raw === 'LESS_THAN_OR_EQUALS') {
    return raw;
  }

  const mapped = DEPRECATED_DATE_OPERATOR_MAP[raw];
  if (mapped) {
    console.warn(
      `[deprecation] ${paramName}=${raw} is deprecated; use ${mapped}. Will be removed one release after #229.`,
    );
    return mapped;
  }

  return null;
}
