// US-339: /free/tech-vs-sp500, tech's drawdown relative to the S&P 500.
// The XLK ÷ SPY ratio of daily closes, measured against its highest value
// over the trailing 252 sessions. Pure functions only: the server load
// (src/lib/server/free-tech-vs-sp500.ts) feeds them PriceService closes.
import type { Section } from "./tips";

export type { Section } from "./tips";

/** One stored daily close, oldest first. */
export interface Close {
  date: string; // "YYYY-MM-DD" (UTC, as /data/prices shows it)
  close: number;
}

export interface RatioPoint {
  date: string;
  ratio: number;
}

export interface DrawdownPoint {
  date: string;
  /** ratio ÷ trailing max − 1: 0 at a new high, below 0 under one. */
  dd: number;
}

/** The trailing window, in sessions, today included. */
export const DRAWDOWN_WINDOW = 252;

/** An episode is annotated when its trough is deeper than this. */
export const TROUGH_THRESHOLD = -0.1;

/** The zoomed panel starts on the first session on or after this date. */
export const SINCE_2004 = "2004-01-01";

export const TECH_TICKER = "XLK";
export const MARKET_TICKER = "SPY";

/** What the page shows: the series as [date, dd] and the figures from it. */
export interface TechVsSp500Data {
  series: [string, number][];
  troughs: DrawdownPoint[];
  latest: DrawdownPoint;
  /** Last earlier date at least as deep as the latest; null when none, or
   * when the latest is a new high. */
  worstSince: string | null;
}

export type TechVsSp500PageData = Section<TechVsSp500Data>;

const usable = (c: Close) => Number.isFinite(c.close) && c.close > 0;

/**
 * The XLK ÷ SPY ratio on every date both have a usable close, ascending.
 * A date missing either close is dropped, never filled; a repeated date
 * keeps its last close.
 */
export function alignCloses(xlk: Close[], spy: Close[]): RatioPoint[] {
  const market = new Map<string, number>();
  for (const c of spy) if (usable(c)) market.set(c.date, c.close);
  const ratios = new Map<string, number>();
  for (const c of xlk) {
    const m = market.get(c.date);
    if (m !== undefined && usable(c)) ratios.set(c.date, c.close / m);
  }
  return [...ratios.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([date, ratio]) => ({ date, ratio }));
}

/**
 * Each session's drawdown from the highest ratio over the last `window`
 * sessions, today included (sessions i − window + 1 … i). Starts at the
 * window-th session; fewer sessions give []. At a new high it is exactly 0.
 */
export function drawdowns(
  points: RatioPoint[],
  window = DRAWDOWN_WINDOW
): DrawdownPoint[] {
  const out: DrawdownPoint[] = [];
  // Indices of a decreasing run of ratios: the front is the window's max.
  const maxes: number[] = [];
  points.forEach((p, i) => {
    while (maxes.length && points[maxes[maxes.length - 1]].ratio <= p.ratio) {
      maxes.pop();
    }
    maxes.push(i);
    if (maxes[0] <= i - window) maxes.shift();
    if (i < window - 1) return;
    const max = points[maxes[0]].ratio;
    out.push({ date: p.date, dd: p.ratio >= max ? 0 : p.ratio / max - 1 });
  });
  return out;
}

/**
 * One point per episode whose deepest drawdown is below `threshold`, at
 * the first date of that depth. An episode is a run of sessions below 0
 * that ends on a return to 0 (a new high, or the old high leaving the
 * window); a run still open at the latest date counts.
 */
export function troughs(
  series: DrawdownPoint[],
  threshold = TROUGH_THRESHOLD
): DrawdownPoint[] {
  const out: DrawdownPoint[] = [];
  let deepest: DrawdownPoint | null = null;
  const close = () => {
    if (deepest && deepest.dd < threshold) out.push(deepest);
    deepest = null;
  };
  for (const p of series) {
    if (p.dd >= 0) close();
    else if (!deepest || p.dd < deepest.dd) deepest = p;
  }
  close();
  return out;
}

/**
 * The last date before the latest whose drawdown is at least as deep as
 * the latest's. Null when there is none, or when the latest is 0 (a new
 * high: the page says so instead).
 */
export function worstSince(series: DrawdownPoint[]): string | null {
  const latest = series[series.length - 1];
  if (!latest || latest.dd >= 0) return null;
  for (let i = series.length - 2; i >= 0; i--) {
    if (series[i].dd <= latest.dd) return series[i].date;
  }
  return null;
}

/** -0.17234 → "−17.2%" (U+2212); 0 → "0.0%". */
export function percentLabel(dd: number): string {
  const pct = Math.abs(dd * 100).toFixed(1);
  return dd < 0 && pct !== "0.0" ? `−${pct}%` : `${pct}%`;
}

export const TECH_VS_SP500_FORMULA =
  "Drawdown = (XLK close ÷ SPY close) ÷ the highest value of that ratio over the last 252 trading sessions, today included, − 1.";

export const TECH_VS_SP500_BASIS =
  "Closes are the unadjusted daily closes the Fintekkers price service holds. Dividends are not included (none are modelled yet), so this is a price ratio, not a total-return one.";

export const TECH_VS_SP500_SESSIONS =
  "A session is a date with a close for both XLK and SPY; a date missing either is skipped, never filled. An episode ends when the ratio is back at its 252-session high, which also happens when an older high leaves the window.";

export const TECH_VS_SP500_SOURCE =
  "The measure follows the one ARK Invest has published as “Tech's Drawdown Relative to the S&P 500”. The data, calculation and charts here are Fintekkers' own.";
