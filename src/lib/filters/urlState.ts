/**
 * URL-state helper for filter forms.
 *
 * Phase 0 of second-brain#226. Extracts the inherit-and-override URL-param
 * pattern that PR #123 introduced in PositionSelect (closing #220, where the
 * Run button silently dropped the inbound portfolioId and widened the query
 * back to all portfolios). The same shape will surface in every other filter
 * panel as we adopt #226's Option-B primitives — having one place to change
 * the rules avoids re-fixing the same bug-shape per page.
 *
 * Behavior contract:
 *   buildFilterUrl(path, current, overrides, inheritKeys)
 *
 *   - `overrides` are the form's authoritative view: a non-empty string sets
 *     the param; null deletes it (even if it would otherwise inherit);
 *     undefined/empty-string falls through (treat the override as absent).
 *   - `inheritKeys` are param names that should carry over from the current
 *     URL when the override is absent. This is the #220 fix made generic:
 *     the form preserves scope params (portfolioId today; tomorrow whatever
 *     other ambient context the page lives in).
 *   - Insertion order in the returned URL: keys in `overrides` first (in the
 *     order the caller declared them), then any inherited keys not yet set.
 *     This makes the URL readable and gives the call site control over
 *     ordering for tests.
 */

export type FilterOverrides = Record<string, string | null | undefined>;

export function buildFilterUrl(
  pathname: string,
  current: URLSearchParams,
  overrides: FilterOverrides,
  inheritKeys: readonly string[] = [],
): string {
  const params = new URLSearchParams();

  // Apply overrides in declaration order. Empty strings are treated as
  // "param absent" — matches the PositionSelect convention where empty
  // text inputs don't appear in the URL. null is a sentinel meaning
  // "explicitly remove this from the inherited set" (no-op when there's
  // nothing to inherit).
  const explicitlyRemoved = new Set<string>();
  for (const [key, value] of Object.entries(overrides)) {
    if (value === null) {
      explicitlyRemoved.add(key);
      continue;
    }
    if (value === undefined || value === '') continue;
    params.set(key, value);
  }

  // Inherit any requested keys from the current URL that the overrides
  // didn't already set or explicitly remove.
  for (const key of inheritKeys) {
    if (params.has(key)) continue;
    if (explicitlyRemoved.has(key)) continue;
    const inbound = current.get(key);
    if (inbound !== null && inbound !== '') {
      params.set(key, inbound);
    }
  }

  const qs = params.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}
