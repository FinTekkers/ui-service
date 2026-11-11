// What /free/soma's and /free's server loads (src/lib/server/free-soma.ts)
// return: display strings and numbers only, built on the server from the
// ledger's SOMA Treasury positions. Each section loads on its own; a failed
// one carries a message naming its week instead of figures, never a mock.
import type { Section } from "./tips";

export type { Section } from "./tips";

/** Shown next to the headline whether or not the figures loaded. */
export const SOMA_SCOPE_NOTE =
  "Excludes SOMA's mortgage-backed securities (MBS).";

/** The snapshot table's last row. */
export const SOMA_TOTAL_LABEL = "Total held outright, excluding MBS";

/** H.4.1 Table 2's remaining-maturity buckets, in order. */
export const SOMA_BUCKET_LABELS = [
  "Within 15 days",
  "16–90 days",
  "91 days–1 yr",
  "1–5 yrs",
  "5–10 yrs",
  "Over 10 yrs",
] as const;

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

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const DAY_MS = 24 * 60 * 60 * 1000;

/** "2026-10-14" → its UTC midnight in ms, or null when not a real date. */
function isoMillis(iso: string): number | null {
  const m = ISO_DATE.exec(iso);
  if (!m) return null;
  const ms = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return new Date(ms).toISOString().slice(0, 10) === iso ? ms : null;
}

/** The Wednesday (H.4.1 week) on or before the UTC date at `ms`. */
function wednesdayOnOrBefore(ms: number): string {
  const back = (new Date(ms).getUTCDay() - 3 + 7) % 7;
  return new Date(ms - back * DAY_MS).toISOString().slice(0, 10);
}

/**
 * The H.4.1 week (a Wednesday) to show for a requested date: the Wednesday
 * on or before it. A missing, invalid or future date gives the latest
 * Wednesday on or before `today` (ISO).
 */
export function somaWeek(requested: string | null, today: string): string {
  const todayMs = isoMillis(today) as number;
  const ms = requested ? isoMillis(requested) : null;
  return wednesdayOnOrBefore(ms === null || ms > todayMs ? todayMs : ms);
}

/** "2026-10-14" → "Oct 14, 2026". */
export function weekLabel(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  return `${MONTHS[month - 1]} ${day}, ${year}`;
}

/** The section message when a week's holdings could not be loaded. */
export function somaUnavailable(asOfLabel: string): string {
  return `Unavailable for ${asOfLabel}: the live SOMA holdings could not be loaded.`;
}

/** One row of the snapshot table, in $ billions; prior and change are null
 * when the year-ago week did not load. */
export interface SomaTableRow {
  label: string;
  current: number;
  prior: number | null;
  change: number | null;
}

/** One slice of the snapshot's composition bar. */
export interface SomaSlice {
  /** Legend text, e.g. "Notes & bonds". */
  label: string;
  /** The same slice in words, for the bar's accessible name. */
  spoken: string;
  /** Share of the Treasury total, %, to 1 decimal place. */
  pct: number;
  color: string;
}

export interface SomaSnapshotView {
  /** e.g. "$4.57T". */
  total: string;
  /** e.g. "+$373.1B vs a year ago"; null without the year-ago week. */
  change: string | null;
  composition: SomaSlice[];
  /** Column headings: the week, and the year-ago week or null. */
  columns: [string, string | null];
  rows: SomaTableRow[];
  totalRow: SomaTableRow;
}

/** One card of "What the portfolio is telling us". */
export interface SomaFinding {
  figure: string;
  title: string;
  body: string;
  link?: { href: string; label: string };
}

export interface SomaFindingsView {
  cards: SomaFinding[];
}

/** One remaining-maturity bucket. */
export interface SomaBucket {
  /** Holdings in $ millions, inflation compensation included. */
  valueM: number;
  /** Share of the Treasury total, %, to 1 decimal place; also the bar
   * width. */
  sharePct: number;
}

export interface SomaMaturityView {
  note: string;
  /** The Treasury total in $ millions: what the buckets sum to. */
  totalM: number;
  /** One per SOMA_BUCKET_LABELS entry, in the same order. */
  buckets: SomaBucket[];
}

/** One row of Positions by CUSIP. */
export interface SomaPosition {
  cusip: string;
  /** Bill, Note, Bond, TIPS, FRN or STRIPS. */
  type: string;
  /** ISO date. */
  maturity: string;
  /** Dollars of face, exact; inflation compensation excluded. */
  par: string;
  /** Par in $ billions, to 2 decimal places (1 would show many CUSIPs as
   * $0.0B). */
  parB: number;
  /** Par over the week's table total, %, to 2 decimal places. */
  weightPct: number;
}

export interface SomaPositionsView {
  /** Par descending, then CUSIP ascending. */
  rows: SomaPosition[];
}

/** Positions by CUSIP's rows per page: 100 (owner, 11 Nov; US-316).
 * Previous and Next show only for a finite page size. */
export const SOMA_PAGE_SIZE = 100;

/** The rows whose CUSIP contains `query`, ignoring case and surrounding
 * spaces; every row for a blank query. */
export function filterPositions(
  rows: SomaPosition[],
  query: string
): SomaPosition[] {
  const q = query.trim().toUpperCase();
  return q ? rows.filter((r) => r.cusip.toUpperCase().includes(q)) : rows;
}

/** Page `page` (0-based, clamped to the pages there are) of `rows`, `size`
 * per page (Infinity: all on one page), and where it starts and ends,
 * 1-based; from and to are 0 when there are no rows. */
export function pageOf<T>(
  rows: T[],
  page: number,
  size: number
): { page: number; pages: number; from: number; to: number; rows: T[] } {
  const pages = Math.max(1, Math.ceil(rows.length / size));
  const p = Math.min(Math.max(0, page), pages - 1);
  const start = Number.isFinite(size) ? p * size : 0;
  const slice = rows.slice(start, start + size);
  return {
    page: p,
    pages,
    from: slice.length ? start + 1 : 0,
    to: start + slice.length,
    rows: slice,
  };
}

/** "Showing 1–25 of 434 positions"; "Showing 0 of 0 positions" when none.
 * `to` never passes `n`. */
export function showingLabel(from: number, to: number, n: number): string {
  if (n === 0 || from === 0) return `Showing 0 of ${n} positions`;
  return `Showing ${from}–${Math.min(to, n)} of ${n} positions`;
}

/** US-317: Holdings over time's stacks, bottom to top. */
export const SOMA_STACKS = ["bills", "notesBonds", "tips", "frns"] as const;
export type SomaStack = (typeof SOMA_STACKS)[number];

export const SOMA_STACK_LABELS: Record<SomaStack, string> = {
  bills: "Bills",
  notesBonds: "Notes & bonds",
  tips: "TIPS",
  frns: "FRNs",
};

/** The chart's caption: TIPS are principal only, unlike the headline. */
export const SOMA_HISTORY_LABEL = "Par, excluding inflation compensation";

/** One H.4.1 Wednesday of Holdings over time. */
export interface SomaHistoryPoint {
  /** ISO date, a Wednesday. */
  week: string;
  /** Dollars of face held that week, exact, per stack. */
  par: Record<SomaStack, string>;
  /** The stacks' exact sum. */
  total: string;
}

export interface SomaHistoryView {
  /** The first week the ledger holds (ISO): where All starts. */
  firstWeek: string;
  /** Every week from firstWeek to the page's week, oldest first. */
  points: SomaHistoryPoint[];
}

export interface SomaRange {
  label: string;
  /** Weeks back from the page's week; null for All. */
  weeks: number | null;
}

export const SOMA_RANGES: SomaRange[] = [
  { label: "1Y", weeks: 52 },
  { label: "5Y", weeks: 260 },
  { label: "All", weeks: null },
];

/**
 * The weeks `range` shows, ending at `asOf` (the page's week). All starts at
 * the first loaded week; 1Y and 5Y start `weeks` Wednesdays before `asOf`,
 * and are enabled only when the ledger holds that week. A disabled range
 * gets a note saying how far back it needs.
 */
export function rangeWindow(
  view: SomaHistoryView,
  range: SomaRange,
  asOf: string
): { enabled: boolean; note: string | null; points: SomaHistoryPoint[] } {
  const start =
    range.weeks === null
      ? view.firstWeek
      : new Date(Date.parse(asOf) - range.weeks * 7 * DAY_MS)
          .toISOString()
          .slice(0, 10);
  const enabled = view.firstWeek <= start;
  return {
    enabled,
    note: enabled
      ? null
      : `${range.label} needs history from ${weekLabel(
          start
        )}. The ledger starts ${weekLabel(view.firstWeek)}.`,
    points: view.points.filter((p) => p.week >= start && p.week <= asOf),
  };
}

export interface SomaPageData {
  /** The H.4.1 week shown (a Wednesday, ISO) and the same in words. */
  asOf: string;
  asOfLabel: string;
  /** Today (UTC, ISO): the Business date picker's latest date. */
  today: string;
  snapshot: Section<SomaSnapshotView>;
  findings: Section<SomaFindingsView>;
  maturity: Section<SomaMaturityView>;
  positions: Section<SomaPositionsView>;
}

/** US-317: the server loads' data. Holdings over time arrives after the
 * rest of the page: SvelteKit streams a promise nested in the data (a
 * top-level one it awaits), and this one never rejects. */
export type SomaPageWithHistory = SomaPageData & {
  streamed: { history: Promise<Section<SomaHistoryView>> };
};
