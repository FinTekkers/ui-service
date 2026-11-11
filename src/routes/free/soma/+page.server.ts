import { loadFreeSoma } from "$lib/server/free-soma";
import type { SomaPageWithHistory } from "$lib/free/soma";

// US-307: live SOMA Treasury holdings for /free/soma, for the H.4.1 week of
// ?asOf= (the Business date picker). A server-held key, read at call time
// (never $env/static/private, which bakes it into the build), as /free/tips
// does, so logged-out visitors see them. No `locals`: it never uses a
// visitor's key. An unset key or a failed search makes every section
// unavailable; nothing falls back to a mock. US-317: Holdings over time is
// streamed after the rest (data.streamed.history).
export async function load({
  url,
}: {
  url: URL;
}): Promise<SomaPageWithHistory> {
  return loadFreeSoma(
    process.env.FT_HOMEPAGE_API_KEY?.trim(),
    url.searchParams.get("asOf"),
    new Date()
  );
}
