// US-354: /free/corporate-bond/crwv-2030, the CoreWeave 9.25% 2030 notes.
// What its server load (src/lib/server/free-corporate-bond.ts) returns, the
// terms and call schedule shown as text, and the input checks the load runs
// before any valuation call. Every figure on the page is valuation-service's,
// formatted on the server: nothing here does bond maths. The call schedule
// and the change-of-control put are display text only, never a pricing input.
import type { PlotSpec } from "./charts";

export const CRWV_ISIN = "USU2069EAA83";

/** The terms panel, as text. Valuation is to maturity only. */
export const CRWV_TERMS: readonly { label: string; value: string }[] = [
  { label: "Issuer", value: "CoreWeave, Inc." },
  { label: "ISIN", value: CRWV_ISIN },
  { label: "Ranking", value: "Senior unsecured notes" },
  { label: "Coupon", value: "9.25% fixed" },
  { label: "Frequency", value: "Semiannual, Jun 1 / Dec 1" },
  { label: "Day count", value: "30/360 (US)" },
  { label: "Issue date", value: "May 27, 2025" },
  { label: "Maturity", value: "June 1, 2030" },
  { label: "Denominations", value: "$2,000 and multiples of $1,000" },
];

/** Optional redemption, as text. Not used for pricing. */
export const CRWV_CALL_SCHEDULE: readonly { from: string; price: string }[] = [
  {
    from: "Before June 1, 2027",
    price:
      "Make-whole (Treasury + 50 bp); up to 40% at 109.250 from equity offerings",
  },
  { from: "June 1, 2027", price: "104.625" },
  { from: "June 1, 2028", price: "102.313" },
  { from: "June 1, 2029 and after", price: "100.000" },
];

export const CRWV_CHANGE_OF_CONTROL =
  "On a change of control, holders may require CoreWeave to buy the notes back at 101% of face plus accrued interest.";

export const VALUATION_NOTE =
  "Valued to maturity: the call schedule and the change-of-control put are shown for reference and are not pricing inputs.";

/** The calculator's price when the URL has none, labelled as an example. */
export const DEFAULT_CLEAN_PRICE = "81.375";

/** The price/yield sweep's grid: 60 to 110 in steps of 2.5. The visitor's
 * price is added (and marked) when it is not on the grid. */
export const SWEEP_PRICES: readonly string[] = [
  "60",
  "62.5",
  "65",
  "67.5",
  "70",
  "72.5",
  "75",
  "77.5",
  "80",
  "82.5",
  "85",
  "87.5",
  "90",
  "92.5",
  "95",
  "97.5",
  "100",
  "102.5",
  "105",
  "107.5",
  "110",
];

export const PRICE_ERROR = "Enter a clean price above 0 and at most 200.";
export const TRADE_DATE_ERROR =
  "Enter a trade date as YYYY-MM-DD, within a year of today.";

/** No digits: an unavailable section shows no numbers. */
export const UNAVAILABLE = {
  calc: "Unavailable: valuation-service did not return these figures. Try again later.",
  sweep:
    "Unavailable: valuation-service did not return the price/yield sweep. Try again later.",
  measure: "Unavailable",
};

/** One valuation-service measure: `value` exactly as the service returned
 * it, `display` that value formatted on the server. Null when the service
 * did not return it. */
export interface BondMeasureView {
  value: string;
  display: string;
}

/** One PRESENT_VALUE_CASHFLOWS row: a coupon (coupon_rate set) or the
 * principal. `fv` and `pv` exactly as returned, per bond of `face`. */
export interface CashflowView {
  date: string;
  kind: "coupon" | "principal";
  fv: string;
  pv: string;
  fvDisplay: string;
  pvDisplay: string;
}

export interface CalcView {
  /** ValuationResponseProto.settlement_date, ISO. */
  settlementDate: string;
  /** The bond's face, the basis of the cash-flow amounts, e.g. "$1,000". */
  faceDisplay: string;
  accrued: BondMeasureView | null;
  dirtyPrice: BondMeasureView | null;
  ytm: BondMeasureView | null;
  macaulayDuration: BondMeasureView | null;
  modifiedDuration: BondMeasureView | null;
  convexity: BondMeasureView | null;
  /** DV01 for a position of $1,000,000 face. */
  dv01: BondMeasureView | null;
  cashflows: CashflowView[];
}

/** One sweep point: valuation-service's YIELD_TO_MATURITY at `price`
 * (`ytm` as returned, `ytmPct` in percent for the chart and table). */
export interface SweepPoint {
  price: string;
  ytm: string;
  ytmPct: string;
  marked: boolean;
}

export type CalcSection =
  | { status: "not-run" }
  | { status: "unavailable"; message: string }
  | { status: "ok"; data: CalcView };

export type SweepSection =
  | { status: "not-run" }
  | { status: "unavailable"; message: string }
  | { status: "ok"; points: SweepPoint[] };

export interface CorporateBondPageData {
  /** The form's values, as typed (or the defaults). */
  input: { price: string; tradeDate: string };
  fieldErrors: { price?: string; tradeDate?: string };
  calc: CalcSection;
  sweep: SweepSection;
}

const PRICE_TEXT = /^\d+(\.\d+)?$/;
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const DAY_MS = 86_400_000;
const WINDOW_DAYS = 366;

/**
 * The clean price to value, or the field error. No `price` parameter at all
 * means the example price; a blank one is an error. Plain decimals only:
 * above 0 and at most 200.
 */
export function validateCleanPrice(raw: string | null): {
  value?: string;
  error?: string;
} {
  if (raw === null) return { value: DEFAULT_CLEAN_PRICE };
  const text = raw.trim();
  if (!PRICE_TEXT.test(text)) return { error: PRICE_ERROR };
  const n = Number(text);
  if (!(n > 0) || n > 200) return { error: PRICE_ERROR };
  return { value: text };
}

function utcDay(iso: string): number | null {
  const m = ISO_DATE.exec(iso);
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const ms = Date.UTC(y, mo - 1, d);
  const back = new Date(ms);
  if (
    back.getUTCFullYear() !== y ||
    back.getUTCMonth() !== mo - 1 ||
    back.getUTCDate() !== d
  ) {
    return null;
  }
  return ms;
}

/**
 * The trade date to send, or the field error. No `tradeDate` parameter means
 * `today`. A real YYYY-MM-DD date within a year of `today`; weekends and
 * holidays are valuation-service's to roll, not checked here.
 */
export function validateTradeDate(
  raw: string | null,
  today: string
): { value?: string; error?: string } {
  if (raw === null) return { value: today };
  const text = raw.trim();
  const day = utcDay(text);
  const now = utcDay(today);
  if (day === null || now === null) return { error: TRADE_DATE_ERROR };
  if (Math.abs(day - now) > WINDOW_DAYS * DAY_MS) {
    return { error: TRADE_DATE_ERROR };
  }
  return { value: text };
}

// The free pages' tokens (src/lib/styles/ft-theme.css), as literals.
const INK = "#0d1b2a";
const MUTED = "#4a5565";
const LINE = "#dde1e7";
const GRID = "#eef0f3";
const MONO = '"IBM Plex Mono", monospace';
export const CASHFLOW_COLOR = "#c9d3e3";
export const PV_COLOR = "#2f5bb7";
export const SWEEP_COLOR = "#2f5bb7";
export const MARK_COLOR = "#e8a33d";

const CONFIG = { responsive: true, displayModeBar: false, scrollZoom: false };

function axis(title: string, extra: Record<string, unknown> = {}) {
  return {
    title: { text: title, standoff: 8 },
    gridcolor: GRID,
    linecolor: LINE,
    zerolinecolor: LINE,
    automargin: true,
    fixedrange: true,
    ...extra,
  };
}

function layout(
  xaxis: Record<string, unknown>,
  yaxis: Record<string, unknown>
) {
  return {
    height: 320,
    margin: { l: 8, r: 8, t: 36, b: 8 },
    paper_bgcolor: "#ffffff",
    plot_bgcolor: "#ffffff",
    font: { family: MONO, size: 12, color: MUTED },
    showlegend: true,
    legend: { orientation: "h", x: 0, y: 1.02, yanchor: "bottom" },
    hoverlabel: { font: { family: MONO, size: 12, color: INK } },
    xaxis,
    yaxis,
  };
}

/** A cash-flow row's bar label: its date, and "principal" on that row. */
export function cashflowLabel(row: CashflowView): string {
  return row.kind === "principal" ? `${row.date} principal` : row.date;
}

/** Each payment's amount and its present value, side by side. */
export function cashflowSpec(rows: CashflowView[], face: string): PlotSpec {
  const x = rows.map(cashflowLabel);
  return {
    data: [
      {
        type: "bar",
        name: "Cash flow",
        x,
        y: rows.map((r) => Number(r.fv)),
        customdata: rows.map((r) => r.fvDisplay),
        marker: { color: CASHFLOW_COLOR },
        hovertemplate: "%{x}<br>Cash flow %{customdata}<extra></extra>",
      },
      {
        type: "bar",
        name: "Present value",
        x,
        y: rows.map((r) => Number(r.pv)),
        customdata: rows.map((r) => r.pvDisplay),
        marker: { color: PV_COLOR },
        hovertemplate: "%{x}<br>Present value %{customdata}<extra></extra>",
      },
    ],
    layout: {
      ...layout(
        axis("Payment date", { type: "category" }),
        axis(`Dollars per ${face} face`, { rangemode: "tozero" })
      ),
      barmode: "group",
    },
    config: CONFIG,
    fit: [],
  };
}

/** Yield to maturity across clean prices, with the visitor's price marked. */
export function sweepSpec(points: SweepPoint[]): PlotSpec {
  const marked = points.filter((p) => p.marked);
  return {
    data: [
      {
        type: "scatter",
        mode: "lines+markers",
        name: "Yield to maturity",
        x: points.map((p) => Number(p.price)),
        y: points.map((p) => Number(p.ytmPct)),
        customdata: points.map((p) => [p.price, p.ytmPct]),
        line: { color: SWEEP_COLOR, width: 2 },
        marker: { color: SWEEP_COLOR, size: 5 },
        hovertemplate:
          "Clean %{customdata[0]}<br>YTM %{customdata[1]}%<extra></extra>",
      },
      {
        type: "scatter",
        mode: "markers",
        name: marked.length ? `Your price ${marked[0].price}` : "Your price",
        x: marked.map((p) => Number(p.price)),
        y: marked.map((p) => Number(p.ytmPct)),
        customdata: marked.map((p) => [p.price, p.ytmPct]),
        marker: { color: MARK_COLOR, size: 12, line: { color: INK, width: 1 } },
        hovertemplate:
          "Your price %{customdata[0]}<br>YTM %{customdata[1]}%<extra></extra>",
      },
    ],
    layout: layout(
      axis("Clean price (per 100 face)"),
      axis("Yield to maturity (%)")
    ),
    config: CONFIG,
    fit: [],
  };
}
