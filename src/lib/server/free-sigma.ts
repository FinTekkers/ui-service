/**
 * US-341: /free/sigma-moves's server load. Each fund in SIGMA_TICKERS: its
 * stored daily closes, read from PriceService through the broker with the
 * server-held homepage key (FT_HOMEPAGE_API_KEY), never a visitor's, and
 * each day's return in standard deviations of the previous 100
 * ($lib/free/sigma). The browser gets [date, σ] pairs, not closes.
 *
 * Nothing here throws, and each fund fails on its own: an unset key, a
 * failed read, a fund with no closes, or too little history makes that
 * fund unavailable with the reason. Nothing is filled or defaulted.
 */
import {
  SIGMA_TICKERS,
  SIGMA_WINDOW,
  dailyReturns,
  sigmaSeries,
  type Close,
  type SigmaFund,
  type SigmaPageData,
  type SigmaTicker,
} from "$lib/free/sigma";
import { fetchClosesByTicker } from "$lib/server/closes";

export type FetchCloses = (ticker: string, apiKey: string) => Promise<Close[]>;

function errorText(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

/** 4 dp is far below the 2 the page shows; never -0. */
function round(sigma: number): number {
  return Math.round(sigma * 1e4) / 1e4 || 0;
}

async function loadFund(
  { ticker, name }: SigmaTicker,
  apiKey: string | undefined,
  fetchCloses: FetchCloses
): Promise<SigmaFund> {
  const unavailable = (message: string): SigmaFund => ({
    ticker,
    name,
    series: { ok: false, message: `Unavailable: ${message}` },
  });
  if (!apiKey) {
    return unavailable("price data is not configured on this server.");
  }
  let closes: Close[];
  try {
    closes = await fetchCloses(ticker, apiKey);
  } catch (e) {
    return unavailable(
      `the price service could not be read (${errorText(e)}).`
    );
  }
  if (!closes.length) return unavailable(`no closes are stored for ${ticker}.`);

  const returns = dailyReturns(closes);
  if (returns.length <= SIGMA_WINDOW) {
    return unavailable(
      `${ticker} has ${returns.length} daily returns stored; ${
        SIGMA_WINDOW + 1
      } are needed.`
    );
  }
  const points = sigmaSeries(returns);
  if (!points.length) {
    return unavailable(
      `${ticker}'s stored closes never vary over ${SIGMA_WINDOW} days.`
    );
  }
  return {
    ticker,
    name,
    series: { ok: true, data: points.map((p) => [p.date, round(p.sigma)]) },
  };
}

export async function loadFreeSigma(
  apiKey: string | undefined,
  fetchCloses: FetchCloses = fetchClosesByTicker
): Promise<SigmaPageData> {
  return {
    funds: await Promise.all(
      SIGMA_TICKERS.map((t) => loadFund(t, apiKey, fetchCloses))
    ),
  };
}
