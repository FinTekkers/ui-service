// What /free/etf/[ticker]'s server load (src/lib/server/free-etf.ts)
// returns, and the display helpers its charts share. Every figure is built
// on the server from the fund's stored SecurityMetric series; values cross
// as exact decimal strings. A missing day or month is null, never 0, and a
// section that can't be built carries the reason instead of figures.
import type { Section } from "./tips";
import { weekLabel } from "./soma";
import type { EtfFund } from "./etf/funds";

export type { Section } from "./tips";

/** One stored observation: [ISO date, exact decimal string]. */
export type EtfPoint = [string, string];

/** One calendar month of the flows chart. */
export interface EtfMonth {
  /** "2026-10". */
  month: string;
  /** Total net assets on the month's last trading day, else null. */
  aumEnd: string | null;
  /** aumEnd − the prior month's aumEnd, else null. */
  deltaAum: string | null;
  /** Σ over the month's trading days of Δ shares outstanding × that day's NAV. */
  netFlows: string | null;
  /** deltaAum − netFlows. */
  marketMove: string | null;
}

/** One calendar month of estimated sponsor fee revenue, in dollars. */
export interface EtfFeeMonth {
  month: string;
  fee: string | null;
  /** Calendar days the fee covers; the latest month is month to date. */
  days: number;
}

/** The fee chart: its months, and where the stored ratio series starts. */
export interface EtfFees {
  months: EtfFeeMonth[];
  /** ISO date of the earliest EXPENSE_RATIO point used. */
  ratioFrom: string;
}

export interface EtfLatest {
  /** ISO date of the latest stored share count. */
  date: string;
  value: string;
  /** Whole days from `date` to the page's date. */
  ageDays: number;
  /** More than ETF_STALE_DAYS old. */
  stale: boolean;
}

export interface EtfPageData {
  /** The fund's config entry: the page's wording comes from here. */
  fund: EtfFund;
  /** The page's date (ISO, UTC): every range ends here. */
  asOf: string;
  latest: Section<EtfLatest>;
  shares: Section<EtfPoint[]>;
  flows: Section<EtfMonth[]>;
  fees: Section<EtfFees>;
}

/** The formulas each derived chart states. */
export const ETF_FORMULAS = {
  aum: "ΔAUM = net flows + market move",
  flows: "Net flows = Σ (Δ shares outstanding × that day's NAV per share)",
  market: "Market move = ΔAUM − net flows",
  fee: "Fee ≈ Σ daily AUM × expense ratio in force that day ÷ 365, over every calendar day; weekends and holidays use the prior trading day's AUM",
  runRate: "Annualised run rate = (month's fee ÷ days covered) × 365",
} as const;

/** The latest share count is flagged once it is more than this many days old. */
export const ETF_STALE_DAYS = 14;

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const DAY_MS = 24 * 60 * 60 * 1000;

/** Whole UTC days from the ISO date `date` to `now`'s UTC date. */
export function daysOld(date: string, now: Date): number {
  const m = ISO_DATE.exec(date);
  if (!m) return NaN;
  const then = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const today = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate()
  );
  return Math.round((today - then) / DAY_MS);
}

/** True when `date` is more than ETF_STALE_DAYS whole UTC days before `now`. */
export function isStale(date: string, now: Date): boolean {
  return daysOld(date, now) > ETF_STALE_DAYS;
}

export type EtfRangeLabel = "1Y" | "5Y" | "All";

export const ETF_RANGES: { label: EtfRangeLabel; years: number | null }[] = [
  { label: "1Y", years: 1 },
  { label: "5Y", years: 5 },
  { label: "All", years: null },
];

/** `asOf` (ISO) moved back `years` calendar years. */
function yearsBefore(asOf: string, years: number): string {
  return `${String(Number(asOf.slice(0, 4)) - years).padStart(
    4,
    "0"
  )}${asOf.slice(4)}`;
}

/**
 * The points `range` shows, ending at `asOf`. All starts at the first
 * stored day; 1Y and 5Y start that many years before `asOf` and are enabled
 * only when the series reaches back that far.
 */
export function etfRangeWindow(
  points: EtfPoint[],
  range: { label: EtfRangeLabel; years: number | null },
  asOf: string
): { enabled: boolean; note: string | null; points: EtfPoint[] } {
  const first = points.length ? points[0][0] : asOf;
  const start = range.years === null ? first : yearsBefore(asOf, range.years);
  const enabled = points.length > 0 && first <= start;
  return {
    enabled,
    note:
      enabled || !points.length
        ? null
        : `${range.label} needs history from ${dateLabel(
            start
          )}. The series starts ${dateLabel(first)}.`,
    points: points.filter(([d]) => d >= start && d <= asOf),
  };
}

/** "2026-10-14" → "Oct 14, 2026". */
export function dateLabel(iso: string): string {
  return weekLabel(iso);
}

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/** "2026-10" → "Oct 2026". */
export function monthLabel(month: string): string {
  return `${MONTHS[Number(month.slice(5, 7)) - 1]} ${month.slice(0, 4)}`;
}

/**
 * Why the fee chart's early months have no bars, or null when every month
 * is after the first stored ratio. The month holding that point is blank
 * too (its earlier days have no ratio), so the note names the first full
 * month.
 */
export function etfFeeGapNote(fees: EtfFees, ticker: string): string | null {
  if (!fees.months.length || `${fees.months[0].month}-01` >= fees.ratioFrom) {
    return null;
  }
  const y = Number(fees.ratioFrom.slice(0, 4));
  const m = Number(fees.ratioFrom.slice(5, 7));
  const firstFull = fees.ratioFrom.endsWith("-01")
    ? fees.ratioFrom.slice(0, 7)
    : m === 12
    ? `${y + 1}-01`
    : `${y}-${String(m + 1).padStart(2, "0")}`;
  return `No estimate before ${monthLabel(
    firstFull
  )}: ${ticker}'s first stored expense ratio is dated ${dateLabel(
    fees.ratioFrom
  )}.`;
}

/** "1021382116" → "1,021,382,116". */
export function groupDigits(value: string): string {
  const [int, frac] = value.replace(/^-/, "").split(".");
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${value.startsWith("-") ? "−" : ""}${grouped}${
    frac ? `.${frac}` : ""
  }`;
}

/**
 * A month's fee at a yearly pace: (fee ÷ days covered) × 365, so a month
 * to date and months of different lengths compare. Null for a blank month
 * or no days, never 0.
 */
export function feeRunRate(fee: string | null, days: number): number | null {
  if (fee === null || !(days > 0)) return null;
  return (Number(fee) / days) * 365;
}

/** Dollars, compact: "$612.3B", "−$4.1B", "$1.02T", "$812.5M". */
export function compactDollars(value: string | number): string {
  const n = Number(value);
  const abs = Math.abs(n);
  const sign = n < 0 ? "−" : "";
  const [div, unit] =
    abs >= 1e12 ? [1e12, "T"] : abs >= 1e9 ? [1e9, "B"] : [1e6, "M"];
  const digits = abs >= 1e12 ? 2 : 1;
  return `${sign}$${(abs / div).toFixed(digits)}${unit}`;
}
