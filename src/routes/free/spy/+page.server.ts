import { loadFreeSpy } from "$lib/server/free-spy";
import type { SpyPageData } from "$lib/free/spy";

// US-334: SPY's stored SecurityMetric series for /free/spy, with the flows
// and fee figures derived from them on the server. A server-held key, read
// at call time (never $env/static/private, which bakes it into the build),
// as /free/soma and /free/tips do, so logged-out visitors see them. No
// `locals`: it never uses a visitor's key. An unset key or a failed series
// makes the sections that need it unavailable; nothing falls back to a mock.
export async function load(): Promise<SpyPageData> {
  return loadFreeSpy(process.env.FT_HOMEPAGE_API_KEY?.trim(), new Date());
}
