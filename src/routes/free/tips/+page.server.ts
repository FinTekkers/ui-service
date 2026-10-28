import { fetchFreeTips } from "$lib/server/free-tips";
import type { TipsPageData } from "$lib/free/tips";

// US-298: live figures for /free/tips. A server-held key, read at call time
// (never $env/static/private, which bakes it into the build), as the
// homepage chart does, so logged-out visitors see them. No `locals`: it
// never uses a visitor's key. An unset key or a failed source makes the
// sections that need it unavailable; nothing falls back to the mock.
export async function load(): Promise<TipsPageData> {
  return fetchFreeTips(process.env.FT_HOMEPAGE_API_KEY?.trim(), new Date());
}
