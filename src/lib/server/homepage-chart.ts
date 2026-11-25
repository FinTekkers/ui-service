/**
 * US-250: the homepage's "Live from the price service" chart data.
 *
 * Every AAPL daily close the price service holds, oldest first. The
 * caller passes the server-held homepage key (FT_HOMEPAGE_API_KEY), never
 * the visitor's. Lives under src/lib/server/ so SvelteKit refuses any
 * client import of it. Errors propagate; the homepage loader catches them.
 * US-339: the fetch itself is fetchClosesByTicker ($lib/server/closes).
 */
import { fetchClosesByTicker, type Close } from "$lib/server/closes";

export type { Close } from "$lib/server/closes";

export const HOMEPAGE_TICKER = "AAPL";

export async function fetchAaplCloses(apiKey: string): Promise<Close[]> {
  return fetchClosesByTicker(HOMEPAGE_TICKER, apiKey);
}
