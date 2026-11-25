/**
 * US-339: /free/tech-vs-sp500's server load. XLK's and SPY's stored daily
 * closes, read from PriceService through the broker with the server-held
 * homepage key (FT_HOMEPAGE_API_KEY), never a visitor's, and the drawdown
 * of their ratio from its 252-session high ($lib/free/techVsSp500).
 *
 * Nothing here throws: an unset key, a failed read, a ticker with no
 * closes, or too little shared history makes the page unavailable with
 * that reason. Nothing is filled or defaulted.
 */
import {
  DRAWDOWN_WINDOW,
  MARKET_TICKER,
  TECH_TICKER,
  alignCloses,
  drawdowns,
  troughs,
  worstSince,
  type Close,
  type TechVsSp500PageData,
} from "$lib/free/techVsSp500";
import { fetchClosesByTicker } from "$lib/server/closes";

export type FetchCloses = (ticker: string, apiKey: string) => Promise<Close[]>;

function errorText(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

/** 5 dp is far below the 0.1% the page shows; never -0. */
function round(dd: number): number {
  return Math.round(dd * 1e5) / 1e5 || 0;
}

export async function loadFreeTechVsSp500(
  apiKey: string | undefined,
  fetchCloses: FetchCloses = fetchClosesByTicker
): Promise<TechVsSp500PageData> {
  const unavailable = (message: string): TechVsSp500PageData => ({
    ok: false,
    message: `Unavailable: ${message}`,
  });
  if (!apiKey)
    return unavailable("price data is not configured on this server.");

  let xlk: Close[];
  let spy: Close[];
  try {
    [xlk, spy] = await Promise.all([
      fetchCloses(TECH_TICKER, apiKey),
      fetchCloses(MARKET_TICKER, apiKey),
    ]);
  } catch (e) {
    return unavailable(
      `the price service could not be read (${errorText(e)}).`
    );
  }
  for (const [ticker, closes] of [
    [TECH_TICKER, xlk],
    [MARKET_TICKER, spy],
  ] as const) {
    if (!closes.length) {
      return unavailable(`no closes are stored for ${ticker}.`);
    }
  }

  const ratios = alignCloses(xlk, spy);
  if (ratios.length < DRAWDOWN_WINDOW) {
    return unavailable(
      `not enough shared ${TECH_TICKER} and ${MARKET_TICKER} history (${ratios.length} sessions; ${DRAWDOWN_WINDOW} needed).`
    );
  }
  const series = drawdowns(ratios);
  const latest = series[series.length - 1];
  return {
    ok: true,
    data: {
      series: series.map((p) => [p.date, round(p.dd)]),
      troughs: troughs(series).map((p) => ({ date: p.date, dd: round(p.dd) })),
      latest: { date: latest.date, dd: round(latest.dd) },
      worstSince: worstSince(series),
    },
  };
}
