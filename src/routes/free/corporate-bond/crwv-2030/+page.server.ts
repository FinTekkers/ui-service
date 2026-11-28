import { fetchFreeCorporateBond } from "$lib/server/free-corporate-bond";
import type { CorporateBondPageData } from "$lib/free/corporateBond";

// US-354: the CoreWeave 9.25% 2030 calculator, valued by valuation-service
// through the broker. A server-held key, read at call time (never
// $env/static/private, which bakes it into the build), as /free/tips does,
// so logged-out visitors see the figures. No `locals`: it never uses a
// visitor's key. ?price= and ?tradeDate= come from the page's GET form;
// they are checked before any call, and a failed call is "unavailable".
export async function load({
  url,
}: {
  url: URL;
}): Promise<CorporateBondPageData> {
  return fetchFreeCorporateBond(
    process.env.FT_HOMEPAGE_API_KEY?.trim(),
    url.searchParams,
    new Date()
  );
}
