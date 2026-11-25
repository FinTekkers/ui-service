import { loadFreeSigma } from "$lib/server/free-sigma";
import type { SigmaPageData } from "$lib/free/sigma";

// US-341: SPY's and TQQQ's stored closes for /free/sigma-moves, with each
// day's σ move computed on the server. A server-held key, read at call time
// (never $env/static/private, which bakes it into the build), as
// /free/tech-vs-sp500 does, so logged-out visitors see it. No `locals`: it
// never uses a visitor's key. An unset key or a failed read makes a fund
// unavailable; nothing falls back to a mock.
export async function load(): Promise<SigmaPageData> {
  return loadFreeSigma(process.env.FT_HOMEPAGE_API_KEY?.trim());
}
