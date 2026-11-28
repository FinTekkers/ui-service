// US-341: /free/sigma-moves, how unusual each day's move is. A fund's daily
// return divided by the sample standard deviation of its previous 100 daily
// returns, today excluded: return_t ÷ stdev(return_{t-100} … return_{t-1}).
// US-360: or, the default, divided by an exponentially weighted volatility
// (EWMA, λ = 0.94, RiskMetrics) of the earlier returns.
// Pure functions only: the server load (src/lib/server/free-sigma.ts) feeds
// them PriceService closes.
import type { Close, Section } from "./techVsSp500";

export type { Close, Section } from "./techVsSp500";

/** How many earlier daily returns each day's standard deviation uses. */
export const SIGMA_WINDOW = 100;

/** The "normal range" band, ± this many standard deviations. */
export const SIGMA_BAND = 3;

/** At most this many days outside the band are labelled on the chart. */
export const SIGMA_TOP_N = 5;

export interface SigmaTicker {
  /** The EXCH_TICKER sent to the broker. */
  ticker: string;
  name: string;
}

/** The funds the page shows, in selector order. Adding one is one entry. */
export const SIGMA_TICKERS: readonly SigmaTicker[] = [
  { ticker: "SPY", name: "SPDR S&P 500 ETF Trust" },
  { ticker: "TQQQ", name: "ProShares UltraPro QQQ" },
];

export type SigmaRange = "1Y" | "5Y" | "All";
export const SIGMA_RANGES: readonly SigmaRange[] = ["1Y", "5Y", "All"];
export const DEFAULT_RANGE: SigmaRange = "1Y";

/** RiskMetrics' daily decay factor: each day back weighs 6% less. */
export const EWMA_LAMBDA = 0.94;

/** How each day's σ is measured: EWMA, or the trailing 100-day window. */
export type SigmaMethod = "ewma" | "100d";

/** The method buttons, in order. `?method=100d` selects the window. */
export const SIGMA_METHODS: readonly { id: SigmaMethod; label: string }[] = [
  { id: "ewma", label: "EWMA (λ 0.94)" },
  { id: "100d", label: "Last 100 days" },
];
export const DEFAULT_METHOD: SigmaMethod = "ewma";

/** The `method` URL parameter: exactly "100d" picks it; anything else EWMA. */
export function parseMethod(raw: string | null): SigmaMethod {
  return raw === "100d" ? "100d" : DEFAULT_METHOD;
}

export interface DailyReturn {
  date: string;
  ret: number;
}

export interface SigmaPoint {
  date: string;
  sigma: number;
}

export interface SigmaFund {
  ticker: string;
  name: string;
  /** Per method, [date, σ] per day, oldest first. */
  series: Record<SigmaMethod, Section<[string, number][]>>;
}

export interface SigmaPageData {
  funds: SigmaFund[];
}

const usable = (c: Close) => Number.isFinite(c.close) && c.close > 0;

/**
 * Each stored day's return, c_t ÷ c_prev − 1, oldest first. A repeated
 * date keeps its last close; a non-finite or ≤ 0 close is dropped. Missing
 * days are skipped, never filled: the return after a gap runs from the
 * last stored close before it.
 */
export function dailyReturns(closes: Close[]): DailyReturn[] {
  const byDate = new Map<string, number>();
  for (const c of closes) {
    if (!usable(c)) continue;
    byDate.delete(c.date);
    byDate.set(c.date, c.close);
  }
  const sorted = [...byDate.entries()].sort(([a], [b]) =>
    a < b ? -1 : a > b ? 1 : 0
  );
  const out: DailyReturn[] = [];
  for (let i = 1; i < sorted.length; i++) {
    out.push({ date: sorted[i][0], ret: sorted[i][1] / sorted[i - 1][1] - 1 });
  }
  return out;
}

/** The sample standard deviation (n − 1 denominator); NaN below 2 values. */
export function sampleStdev(xs: number[]): number {
  const n = xs.length;
  if (n < 2) return NaN;
  let sum = 0;
  for (const x of xs) sum += x;
  const mean = sum / n;
  let sq = 0;
  for (const x of xs) sq += (x - mean) * (x - mean);
  return Math.sqrt(sq / (n - 1));
}

// A window whose spread is only float rounding (every return the same) has
// no meaningful σ: dividing by it would give a huge, meaningless number.
const ROUNDING = 1e-12;

/**
 * σ for each return with `window` earlier returns: return_i ÷ the sample
 * stdev of returns i − window … i − 1 (today excluded). The first value
 * lands on return window + 1; a window with no spread gives no point.
 */
export function sigmaSeries(
  returns: DailyReturn[],
  window = SIGMA_WINDOW
): SigmaPoint[] {
  const out: SigmaPoint[] = [];
  for (let i = window; i < returns.length; i++) {
    const prior = returns.slice(i - window, i).map((r) => r.ret);
    const sd = sampleStdev(prior);
    const scale = Math.max(...prior.map(Math.abs));
    if (!(sd > ROUNDING * scale)) continue;
    const sigma = returns[i].ret / sd;
    if (Number.isFinite(sigma)) out.push({ date: returns[i].date, sigma });
  }
  return out;
}

/**
 * US-360: σ for each return against an exponentially weighted variance
 * (RiskMetrics). The variance starts as the sample variance (n − 1) of the
 * first `window` returns; σ_i = return_i ÷ √variance, from returns before i
 * only (today excluded); then variance ← λ·variance + (1 − λ)·return_i²,
 * zero mean. The first value lands on return window + 1, as sigmaSeries.
 *
 * The rounding guard scales by the largest |return| among the `window`
 * returns before i, as sigmaSeries does: a variance that is only float
 * rounding gives no point, but the variance still updates on that day.
 */
export function ewmaSigmaSeries(
  returns: DailyReturn[],
  window = SIGMA_WINDOW,
  lambda = EWMA_LAMBDA
): SigmaPoint[] {
  const out: SigmaPoint[] = [];
  if (returns.length <= window) return out;
  let variance = sampleStdev(returns.slice(0, window).map((r) => r.ret)) ** 2;
  for (let i = window; i < returns.length; i++) {
    const ret = returns[i].ret;
    const sd = Math.sqrt(variance);
    const scale = Math.max(
      ...returns.slice(i - window, i).map((r) => Math.abs(r.ret))
    );
    const sigma = ret / sd;
    if (sd > ROUNDING * scale && Number.isFinite(sigma)) {
      out.push({ date: returns[i].date, sigma });
    }
    variance = lambda * variance + (1 - lambda) * ret * ret;
  }
  return out;
}

/** The ISO date `years` calendar years before `iso`. */
function yearsBefore(iso: string, years: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCFullYear(d.getUTCFullYear() - years);
  return d.toISOString().slice(0, 10);
}

/**
 * The points in `range`, back from the latest one: 1Y keeps dates after
 * the latest minus one calendar year, 5Y minus five; All keeps every point.
 */
export function inRange(points: SigmaPoint[], range: SigmaRange): SigmaPoint[] {
  if (range === "All" || !points.length) return points;
  const from = yearsBefore(
    points[points.length - 1].date,
    range === "1Y" ? 1 : 5
  );
  return points.filter((p) => p.date > from);
}

/** How many points lie outside ±band, strictly: exactly band is inside. */
export function countOutside(points: SigmaPoint[], band = SIGMA_BAND): number {
  return points.filter((p) => Math.abs(p.sigma) > band).length;
}

/** The days outside ±band, largest |σ| first (ties: oldest first), at most n. */
export function topOutliers(
  points: SigmaPoint[],
  n = SIGMA_TOP_N,
  band = SIGMA_BAND
): SigmaPoint[] {
  return points
    .filter((p) => Math.abs(p.sigma) > band)
    .sort(
      (a, b) =>
        Math.abs(b.sigma) - Math.abs(a.sigma) ||
        (a.date < b.date ? -1 : a.date > b.date ? 1 : 0)
    )
    .slice(0, n);
}

/** -6.1 → "−6.10σ" (U+2212), 4.2 → "+4.20σ", 0 → "0.00σ". */
export function sigmaLabel(sigma: number): string {
  const abs = Math.abs(sigma).toFixed(2);
  if (abs === "0.00") return "0.00σ";
  return `${sigma < 0 ? "−" : "+"}${abs}σ`;
}

/** "1 day", "3 days". */
export function daysLabel(n: number): string {
  return `${n} ${n === 1 ? "day" : "days"}`;
}

export const SIGMA_FORMULA = `σ move = today's daily return ÷ the sample standard deviation of the previous ${SIGMA_WINDOW} daily returns (today excluded). The shaded band is ±${SIGMA_BAND}σ.`;

export const SIGMA_RETURNS = `A daily return is the change from one stored close to the next. A day with no stored close is skipped, never filled, so a series starts ${
  SIGMA_WINDOW + 1
} trading days after its first close. A ${SIGMA_WINDOW}-day window whose returns never vary gives no value for the next day.`;

export const SIGMA_BASIS =
  "Price basis: Daily closes adjusted for dividends and splits (Yahoo Finance adjusted closes, as stored by the Fintekkers price service), so each return includes dividends.";

/** US-360: the method note's opening sentence for EWMA. */
export const SIGMA_FORMULA_EWMA = `σ move = today's daily return ÷ an exponentially weighted volatility (EWMA, λ = ${EWMA_LAMBDA}) of the earlier daily returns (today excluded). It weights recent days more: each day back counts ${Math.round(
  (1 - EWMA_LAMBDA) * 100
)}% less, so the last month or two dominate. It starts from the sample standard deviation of the first ${SIGMA_WINDOW} returns, with no mean subtracted after that. The shaded band is ±${SIGMA_BAND}σ.`;

export const SIGMA_SOURCE_EWMA =
  "Source: J.P. Morgan/Reuters, RiskMetrics Technical Document, 4th ed., 1996.";

/** The narrative's "each day's return is divided by …", per method. */
export const SIGMA_INTRO: Record<SigmaMethod, string> = {
  ewma: "an exponentially weighted volatility of its earlier daily returns, which weights recent days more",
  "100d": `the standard deviation of its previous ${SIGMA_WINDOW} daily returns`,
};

/** US-360: what σ compares a day with, per method (US-359's opening clause). */
export const SIGMA_COMPARES: Record<SigmaMethod, string> = {
  ewma: "σ compares a day with recent volatility, weighted toward the last month or two.",
  "100d": `σ compares a day with the previous ${SIGMA_WINDOW} trading days.`,
};

/** US-359's caveat, the same under either method. */
export const SIGMA_NOT_PROBABILITY_REASON = `It is not a probability: market returns have fat tails, so moves beyond ±${SIGMA_BAND}σ happen far more often than a normal distribution predicts.`;

export const SIGMA_NOT_PROBABILITY = `${SIGMA_COMPARES["100d"]} ${SIGMA_NOT_PROBABILITY_REASON}`;
