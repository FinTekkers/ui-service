/**
 * US-365: /free/soma's Maturity mix over time, from the ledger's SOMA trades
 * by TRADE_DATE, PRODUCT_TYPE and MATURITY_DATE (DIRECTED_QUANTITY, so par
 * excluding inflation compensation). Pure maths: the search, its Treasury
 * scope and its cache live in free-soma.ts and soma-cache.ts.
 *
 * Par is summed cumulatively per maturity date and read off at every H.4.1
 * Wednesday, as Holdings over time reads its stacks. At each week a
 * security maturing on or before it is excluded; the rest go into six
 * remaining-maturity buckets, and their par-weighted average remaining
 * maturity is taken. The page gets one bar per quarter: that quarter's last
 * week, from 2004Q2 on. Only percentages and years leave this module.
 */
import Decimal from "decimal.js";
import { formatOneDecimal } from "$lib/free/format";
import {
  SOMA_MIX_BUCKETS,
  weekLabel,
  type SomaFinding,
  type SomaMixPoint,
  type SomaMixView,
} from "$lib/free/soma";

/** The first quarter the chart shows. */
export const SOMA_MIX_FIRST_QUARTER = "2004Q2";

/** Each bucket's upper edge, in years from the week; the last bucket has
 * none. One fewer than SOMA_MIX_BUCKETS. */
const BUCKET_YEARS = [1, 3, 5, 10, 20];

const DAY_MS = 24 * 60 * 60 * 1000;
const YEAR_DAYS = 365.25;

/** One grouped trade row of the mix's search. */
export interface SomaMixRow {
  /** ISO date. */
  tradeDate: string | null;
  /** ISO date. */
  maturityDate: string | null;
  productType: string;
  /** Dollars of face, signed: negative for a SELL or MATURATION. */
  directedQuantity: string | null;
}

/** One H.4.1 Wednesday's mix. */
export interface SomaMixWeek {
  /** ISO date, a Wednesday. */
  week: string;
  /** % of par per SOMA_MIX_BUCKETS entry, to 2 decimal places. */
  shares: number[];
  /** Par-weighted average remaining maturity, years, to 2 decimal places. */
  avgYears: number;
}

/** Every week's mix, and the trade date of the earliest row that could not
 * be used ("" when one had no trade date): no week on or after it has a
 * mix. */
export interface SomaMixWeeks {
  weeks: SomaMixWeek[];
  badFrom: string | null;
}

/** ISO date `years` calendar years after `iso`. */
function addYears(iso: string, years: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y + years, m - 1, d)).toISOString().slice(0, 10);
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * The mix at every Wednesday from the first one on or after the earliest
 * trade to `upTo`, from Treasury rows only (the caller drops the rest).
 * Zero-par rows are skipped. A row with no trade date, maturity or quantity
 * is never filled in: the weeks from its trade date on are left out, so a
 * bad row in 2026 can't blank a 2007 week. Null when no week has par.
 */
export function somaMixWeeks(
  rows: SomaMixRow[],
  upTo: string
): SomaMixWeeks | null {
  let badFrom: string | null = null;
  const usable: { tradeDate: string; maturity: string; par: Decimal }[] = [];
  for (const row of rows) {
    if (row.directedQuantity && new Decimal(row.directedQuantity).isZero()) {
      continue;
    }
    if (!row.tradeDate || !row.maturityDate || !row.directedQuantity) {
      console.log("SOMA trade row unusable for Maturity mix over time", row);
      const from = row.tradeDate ?? "";
      if (badFrom === null || from < badFrom) badFrom = from;
      continue;
    }
    if (row.tradeDate > upTo) continue;
    usable.push({
      tradeDate: row.tradeDate,
      maturity: row.maturityDate,
      par: new Decimal(row.directedQuantity),
    });
  }
  usable.sort((a, b) => (a.tradeDate < b.tradeDate ? -1 : 1));
  if (usable.length === 0) return null;
  // The first Wednesday on or after the earliest trade.
  const start = Date.parse(usable[0].tradeDate);
  const ahead = (3 - new Date(start).getUTCDay() + 7) % 7;

  // Par per maturity date: exact, then as a number for the shares.
  const held = new Map<string, Decimal>();
  const heldNumber = new Map<string, number>();
  const weeks: SomaMixWeek[] = [];
  let next = 0;
  for (
    let ms = start + ahead * DAY_MS;
    ms <= Date.parse(upTo);
    ms += 7 * DAY_MS
  ) {
    const week = new Date(ms).toISOString().slice(0, 10);
    if (badFrom !== null && week >= badFrom) break;
    for (; next < usable.length && usable[next].tradeDate <= week; next++) {
      const { maturity, par } = usable[next];
      const sum = (held.get(maturity) ?? new Decimal(0)).plus(par);
      held.set(maturity, sum);
      heldNumber.set(maturity, sum.toNumber());
    }
    const edges = BUCKET_YEARS.map((n) => addYears(week, n));
    const buckets = SOMA_MIX_BUCKETS.map(() => 0);
    let total = 0;
    let parDays = 0;
    for (const [maturity, par] of heldNumber) {
      if (maturity <= week) {
        // Matured: out of this week and every later one.
        held.delete(maturity);
        heldNumber.delete(maturity);
        continue;
      }
      const i = edges.findIndex((edge) => maturity <= edge);
      buckets[i === -1 ? edges.length : i] += par;
      total += par;
      parDays += (par * (Date.parse(maturity) - ms)) / DAY_MS;
    }
    if (total <= 0) continue;
    weeks.push({
      week,
      shares: buckets.map((b) => round2((b / total) * 100)),
      avgYears: round2(parDays / total / YEAR_DAYS),
    });
  }
  return weeks.length ? { weeks, badFrom } : null;
}

/** "2026-11-18" → "2026Q4". */
export function quarterOf(iso: string): string {
  const [y, m] = iso.split("-").map(Number);
  return `${y}Q${Math.ceil(m / 3)}`;
}

const pct1 = (n: number) => `${formatOneDecimal(n)}%`;
const years1 = (n: number) => `${formatOneDecimal(n)} yrs`;

/** +6.7 → "+6.7 pp", −1.2 → "−1.2 pp" (U+2212). */
function signedPoints(n: number): string {
  const r = Math.round(n * 10) / 10;
  return `${r < 0 ? "−" : "+"}${formatOneDecimal(Math.abs(r))} pp`;
}

function findingCards(points: SomaMixPoint[]): SomaFinding[] {
  const latest = points[points.length - 1];
  // A year ago: the bar four quarters back, the first bar of 1Y.
  const ago = points.length > 4 ? points[points.length - 5] : null;
  const missing = `Needs a bar a year before ${latest.quarter}; the bars start ${points[0].quarter}.`;
  const lowest = points.reduce((low, p) =>
    p.shares[0] < low.shares[0] ? p : low
  );
  return [
    ago
      ? {
          figure: signedPoints(latest.shares[0] - ago.shares[0]),
          title: "Under-1-year share, past year",
          body: `From ${pct1(ago.shares[0])} on ${weekLabel(
            ago.week
          )} to ${pct1(latest.shares[0])} on ${weekLabel(latest.week)}.`,
        }
      : {
          figure: "Not enough history",
          title: "Under-1-year share, past year",
          body: missing,
        },
    ago
      ? {
          figure: `${formatOneDecimal(latest.avgYears)} vs ${years1(
            ago.avgYears
          )}`,
          title: "Average maturity, now vs a year ago",
          body: `Par-weighted average remaining maturity: ${years1(
            latest.avgYears
          )} on ${weekLabel(latest.week)}, ${years1(
            ago.avgYears
          )} on ${weekLabel(ago.week)}.`,
        }
      : {
          figure: "Not enough history",
          title: "Average maturity, now vs a year ago",
          body: missing,
        },
    {
      figure: pct1(lowest.shares[0]),
      title: "Lowest under-1-year share",
      body: `${lowest.quarter}, the week of ${weekLabel(
        lowest.week
      )}: the least of any quarter since ${points[0].quarter}.`,
    },
  ];
}

/**
 * The chart's bars for the page's week `asOf`: each quarter's last week on
 * or before it, from SOMA_MIX_FIRST_QUARTER, so the latest quarter's bar is
 * `asOf` itself; then the Latest line and the three finding cards. Null
 * when no week up to `asOf` has a mix, or a row the weeks could not use is
 * dated on or before it.
 */
export function somaMixView(
  mix: SomaMixWeeks,
  asOf: string
): SomaMixView | null {
  if (mix.badFrom !== null && mix.badFrom <= asOf) return null;
  const byQuarter = new Map<string, SomaMixWeek>();
  for (const w of mix.weeks) {
    const quarter = quarterOf(w.week);
    if (w.week > asOf || quarter < SOMA_MIX_FIRST_QUARTER) continue;
    // Weeks are oldest first, so the last one kept is the quarter's last.
    byQuarter.set(quarter, w);
  }
  const points: SomaMixPoint[] = [...byQuarter].map(([quarter, w]) => ({
    quarter,
    week: w.week,
    shares: w.shares,
    avgYears: w.avgYears,
  }));
  if (points.length === 0) return null;
  const latest = points[points.length - 1];
  return {
    firstQuarter: points[0].quarter,
    points,
    latest: {
      week: latest.week,
      under1: latest.shares[0],
      avgYears: latest.avgYears,
    },
    findings: findingCards(points),
  };
}
