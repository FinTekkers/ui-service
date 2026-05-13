/**
 * Pure helpers for the term-forward view on /data/curves (#264).
 *
 * Lives here (not in +page.server.ts) because SvelteKit restricts exports
 * from +page.server.ts to its own well-known set; pulling these out keeps
 * them importable from both the page server and unit tests.
 */

export const ALLOWED_FORWARD_TERMS = [1, 2, 5, 10] as const;
export type ForwardTermYears = typeof ALLOWED_FORWARD_TERMS[number];
export const DEFAULT_FORWARD_TERM: ForwardTermYears = 10;

/**
 * Decimal-year tenor label — no bucket snapping. The prior tenorLabel()
 * collapsed 9–14Y to "10Y", losing precision in the chart hover. Whole
 * years render compactly ("5Y"); fractional tenors keep two decimals
 * ("9.95Y"). Non-finite input returns an em-dash so downstream display
 * code doesn't surface "NaNY".
 */
export function formatYears(years: number): string {
  if (!Number.isFinite(years)) return '—';
  const rounded = Math.round(years * 100) / 100;
  return Number.isInteger(rounded) ? `${rounded}Y` : `${rounded.toFixed(2)}Y`;
}

/**
 * Parse the `term` URL param into one of the allowed forward terms. Anything
 * else (including missing) falls back to DEFAULT_FORWARD_TERM — keeps the URL
 * permissive without leaking an invalid request to the backend.
 */
export function parseForwardTerm(raw: string | null): ForwardTermYears {
  if (raw === null) return DEFAULT_FORWARD_TERM;
  const n = Number(raw);
  return (ALLOWED_FORWARD_TERMS as readonly number[]).includes(n)
    ? (n as ForwardTermYears)
    : DEFAULT_FORWARD_TERM;
}
