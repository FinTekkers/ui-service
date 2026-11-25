import { loadFreeTechVsSp500 } from "$lib/server/free-tech-vs-sp500";
import type { TechVsSp500PageData } from "$lib/free/techVsSp500";

// US-339: XLK's and SPY's stored closes for /free/tech-vs-sp500, with the
// drawdown of their ratio computed on the server. A server-held key, read
// at call time (never $env/static/private, which bakes it into the build),
// as /free/spy does, so logged-out visitors see it. No `locals`: it never
// uses a visitor's key. An unset key or a failed read makes the page
// unavailable; nothing falls back to a mock.
export async function load(): Promise<TechVsSp500PageData> {
  return loadFreeTechVsSp500(process.env.FT_HOMEPAGE_API_KEY?.trim());
}
