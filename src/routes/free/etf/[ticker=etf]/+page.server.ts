import { loadFreeEtf } from "$lib/server/free-etf";
import type { EtfPageData } from "$lib/free/etf";

// US-334: SPY's stored SecurityMetric series for /free/spy, with the flows
// and fee figures derived from them on the server; US-338 serves every fund
// in ETF_FUNDS here. Any other ticker is a 404 before any service call: the
// route's matcher (src/params/etf.ts) rejects it, and so does the loader.
// A server-held key, read at call time (never $env/static/private, which
// bakes it into the build), as /free/soma and /free/tips do, so logged-out
// visitors see them. No `locals`: it never uses a visitor's key. An unset
// key or a failed series makes the sections that need it unavailable;
// nothing falls back to a mock.
export async function load({
  params,
}: {
  params: { ticker: string };
}): Promise<EtfPageData> {
  return loadFreeEtf(
    params.ticker,
    process.env.FT_HOMEPAGE_API_KEY?.trim(),
    new Date()
  );
}
