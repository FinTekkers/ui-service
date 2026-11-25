import { findEtf } from "$lib/free/etf/funds";

// US-338: /free/etf/[ticker=etf] matches only the slugs in ETF_FUNDS, so any
// other ticker is SvelteKit's 404 for the page and its __data.json alike.
// findEtf stays the one allowlist; the page's loader checks it again.
export function match(param: string): boolean {
  return findEtf(param) !== undefined;
}
