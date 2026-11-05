import { fetchFreeSoma } from "$lib/server/free-soma";
import type { SomaPageData } from "$lib/free/soma";

// US-307: live SOMA Treasury holdings for /free/soma, for the H.4.1 week of
// ?asOf= (the Business date picker). A server-held key, read at call time
// (never $env/static/private, which bakes it into the build), as /free/tips
// does, so logged-out visitors see them. No `locals`: it never uses a
// visitor's key. An unset key or a failed search makes every section
// unavailable; nothing falls back to a mock.
export async function load({ url }: { url: URL }): Promise<SomaPageData> {
  return fetchFreeSoma(
    process.env.FT_HOMEPAGE_API_KEY?.trim(),
    url.searchParams.get("asOf"),
    new Date()
  );
}
