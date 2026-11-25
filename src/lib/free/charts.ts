// US-337: Plotly figures for the free pages' time-series charts, built as
// plain objects so they can be tested without a DOM or Plotly. Each builder
// returns the traces, layout and config PlotlyChart.svelte hands to
// Plotly.react, plus the series its y-axes are fitted to: a level line
// (shares outstanding, month-end AUM) is fitted to the visible dates with
// padding, never from 0; stacked bars and areas always include 0.
import {
  compactDollars,
  dateLabel,
  groupDigits,
  type EtfFeeMonth,
  type EtfMonth,
  type EtfPoint,
} from "./etf";
import {
  SOMA_STACKS,
  SOMA_STACK_COLORS,
  SOMA_STACK_LABELS,
  weekTooltip,
  type SomaHistoryPoint,
} from "./soma";
import { percentLabel, type DrawdownPoint } from "./techVsSp500";
import { sigmaLabel, type SigmaPoint } from "./sigma";

/** One date's extent on a fitted axis. `x` is an ISO date. */
export interface FitRow {
  x: string;
  lo: number;
  hi: number;
}

export interface FitTarget {
  axis: "yaxis" | "yaxis2";
  rows: FitRow[];
  /** Keep 0 in the range: stacked bars and areas. */
  zero: boolean;
}

export interface PlotSpec {
  data: Record<string, unknown>[];
  layout: Record<string, any>;
  config: Record<string, unknown>;
  fit: FitTarget[];
}

/** Share of the visible span added above and below a fitted range. */
export const FIT_PAD = 0.05;

/** The x window that covers every date: an "All" or autorange relayout. */
export const ALL_DATES: [string, string] = ["0000-01-01", "9999-12-31"];

/** Plotly range-selector buttons: back from the latest date shown. */
export const RANGE_BUTTONS = [
  { count: 1, step: "year", stepmode: "backward", label: "1Y" },
  { count: 5, step: "year", stepmode: "backward", label: "5Y" },
  { step: "all", label: "All" },
];

// The free pages' tokens (src/lib/styles/ft-theme.css), as literals: a
// Plotly layout can't read CSS variables.
const INK = "#0d1b2a";
const MUTED = "#4a5565";
const LINE = "#dde1e7";
const GRID = "#eef0f3";
const MONO = '"IBM Plex Mono", monospace';

export const ETF_SHARES_COLOR = "#2f5bb7";
export const ETF_NET_COLOR = "#2f5bb7";
export const ETF_MARKET_COLOR = "#e8a33d";
export const ETF_AUM_COLOR = INK;
export const ETF_FEE_COLOR = "#5b8def";
export const DRAWDOWN_COLOR = "#2f5bb7";
const DRAWDOWN_FILL = "rgba(47, 91, 183, 0.25)";
export const SIGMA_COLOR = "#2f5bb7";
const SIGMA_BAND_FILL = "rgba(47, 91, 183, 0.12)";

const DAY_FORMAT = "%b %-d, %Y";
const MONTH_FORMAT = "%b %Y";

const CONFIG = { responsive: true, displayModeBar: false, scrollZoom: false };

/**
 * The y range showing `t`'s rows dated within [x0, x1] (ISO-like strings,
 * compared as text), padded by `pad` of their span; with `zero`, 0 stays in
 * range and the side at 0 gets no padding. A flat series is padded by 0.5%
 * of its value so the axis never collapses. Null when no row is visible.
 */
export function fitY(
  t: FitTarget,
  x0: string,
  x1: string,
  pad = FIT_PAD
): [number, number] | null {
  let min = Infinity;
  let max = -Infinity;
  for (const r of t.rows) {
    if (r.x < x0 || r.x > x1) continue;
    min = Math.min(min, r.lo);
    max = Math.max(max, r.hi);
  }
  if (min > max) return null;
  if (t.zero) {
    min = Math.min(min, 0);
    max = Math.max(max, 0);
  }
  const span = max - min;
  const p = span ? span * pad : Math.abs(max) * 0.005 || 1;
  return [t.zero && min === 0 ? 0 : min - p, t.zero && max === 0 ? 0 : max + p];
}

/** The relayout update fitting each of `spec`'s axes to [x0, x1]. */
export function refit(
  spec: PlotSpec,
  x0: string,
  x1: string
): Record<string, [number, number]> {
  const update: Record<string, [number, number]> = {};
  for (const t of spec.fit) {
    const range = fitY(t, x0, x1);
    if (range) update[`${t.axis}.range`] = range;
  }
  return update;
}

const own = (o: object, k: string) =>
  Object.prototype.hasOwnProperty.call(o, k);

/** A Plotly date-axis value as an ISO-like string. */
function dateText(v: unknown): string {
  return typeof v === "number"
    ? new Date(v).toISOString().slice(0, 19).replace("T", " ")
    : String(v);
}

/**
 * The x window a `plotly_relayout` event moved to, or null when it didn't
 * move x. A range button, drag-zoom or double-click sends xaxis keys; the
 * y-only updates refit() makes send none, so a refit never refits again.
 */
export function relayoutWindow(
  event: Record<string, unknown> | null | undefined
): [string, string] | null {
  if (!event) return null;
  if (own(event, "xaxis.autorange") && event["xaxis.autorange"]) {
    return ALL_DATES;
  }
  const range = own(event, "xaxis.range") ? event["xaxis.range"] : null;
  if (Array.isArray(range) && range.length === 2) {
    return [dateText(range[0]), dateText(range[1])];
  }
  if (own(event, "xaxis.range[0]") && own(event, "xaxis.range[1]")) {
    return [
      dateText(event["xaxis.range[0]"]),
      dateText(event["xaxis.range[1]"]),
    ];
  }
  return null;
}

function axis(title: string, extra: Record<string, unknown> = {}) {
  return {
    title: { text: title, standoff: 8 },
    gridcolor: GRID,
    linecolor: LINE,
    zerolinecolor: LINE,
    automargin: true,
    ...extra,
  };
}

function layoutFor(
  xTitle: string,
  hoverformat: string,
  yaxes: Record<string, unknown>,
  extra: Record<string, unknown> = {}
): Record<string, any> {
  return {
    height: 320,
    margin: { l: 8, r: 8, t: 44, b: 8 },
    paper_bgcolor: "#ffffff",
    plot_bgcolor: "#ffffff",
    font: { family: MONO, size: 12, color: MUTED },
    showlegend: false,
    hovermode: "x unified",
    hoverlabel: { font: { family: MONO, size: 12, color: INK } },
    xaxis: axis(xTitle, {
      type: "date",
      autorange: true,
      hoverformat,
      rangeselector: {
        buttons: RANGE_BUTTONS,
        x: 0,
        xanchor: "left",
        y: 1.02,
        yanchor: "bottom",
        bgcolor: "#f0f2f5",
        activecolor: "#ffffff",
        bordercolor: LINE,
        font: { family: MONO, size: 12, color: INK },
      },
    }),
    ...yaxes,
    ...extra,
  };
}

/** A y-axis with a fixed range: refit() moves it, never a drag. */
function yAxis(
  title: string,
  range: [number, number] | null,
  extra: Record<string, unknown> = {}
) {
  return axis(title, {
    fixedrange: true,
    autorange: range === null,
    ...(range ? { range } : {}),
    ...extra,
  });
}

function withRanges(
  fit: FitTarget[]
): Record<FitTarget["axis"], [number, number] | null> {
  const out = { yaxis: null, yaxis2: null } as Record<
    FitTarget["axis"],
    [number, number] | null
  >;
  for (const t of fit) out[t.axis] = fitY(t, ...ALL_DATES);
  return out;
}

const num = (v: string | null, unit: number) =>
  v === null ? null : Number(v) / unit;

/** /free/etf/[ticker] chart 1: daily shares outstanding, in billions. */
export function sharesSpec(points: EtfPoint[]): PlotSpec {
  const B = 1e9;
  const fit: FitTarget[] = [
    {
      axis: "yaxis",
      zero: false,
      rows: points.map(([x, v]) => ({
        x,
        lo: Number(v) / B,
        hi: Number(v) / B,
      })),
    },
  ];
  const ranges = withRanges(fit);
  return {
    data: [
      {
        type: "scatter",
        mode: "lines",
        name: "Shares outstanding, daily",
        x: points.map(([d]) => d),
        y: points.map(([, v]) => Number(v) / B),
        customdata: points.map(([, v]) => groupDigits(v)),
        line: { color: ETF_SHARES_COLOR, width: 2 },
        hovertemplate: "Shares outstanding: %{customdata}<extra></extra>",
      },
    ],
    layout: layoutFor("Date", DAY_FORMAT, {
      yaxis: yAxis("Shares outstanding (billions)", ranges.yaxis, {
        ticksuffix: "B",
      }),
    }),
    config: CONFIG,
    fit,
  };
}

/**
 * /free/etf/[ticker] chart 2: each month's net flows and market move as bars
 * stacked up from 0 (positive) and down from 0 (negative), with month-end
 * AUM as a line on the right axis. Values in $ billions; a null month is a
 * gap, never a zero bar.
 */
export function flowsSpec(months: EtfMonth[]): PlotSpec {
  const B = 1e9;
  const x = months.map((m) => `${m.month}-01`);
  const bars: FitRow[] = [];
  const aum: FitRow[] = [];
  months.forEach((m, i) => {
    const parts = [num(m.netFlows, B), num(m.marketMove, B)].filter(
      (v): v is number => v !== null
    );
    if (parts.length) {
      bars.push({
        x: x[i],
        lo: parts.filter((v) => v < 0).reduce((a, v) => a + v, 0),
        hi: parts.filter((v) => v > 0).reduce((a, v) => a + v, 0),
      });
    }
    const end = num(m.aumEnd, B);
    if (end !== null) aum.push({ x: x[i], lo: end, hi: end });
  });
  const fit: FitTarget[] = [
    { axis: "yaxis", zero: true, rows: bars },
    { axis: "yaxis2", zero: false, rows: aum },
  ];
  const ranges = withRanges(fit);
  const bar = (
    name: string,
    key: "netFlows" | "marketMove",
    color: string
  ) => ({
    type: "bar",
    name,
    x,
    y: months.map((m) => num(m[key], B)),
    customdata: months.map((m) =>
      m[key] === null ? "" : compactDollars(m[key] as string)
    ),
    marker: { color },
    hovertemplate: `${name}: %{customdata}<extra></extra>`,
  });
  return {
    data: [
      bar("Net flows", "netFlows", ETF_NET_COLOR),
      bar("Market move", "marketMove", ETF_MARKET_COLOR),
      {
        type: "scatter",
        mode: "lines",
        name: "Month-end AUM (right axis)",
        x,
        y: months.map((m) => num(m.aumEnd, B)),
        customdata: months.map((m) =>
          m.aumEnd === null ? "" : compactDollars(m.aumEnd)
        ),
        yaxis: "y2",
        connectgaps: false,
        line: { color: ETF_AUM_COLOR, width: 1.5 },
        hovertemplate: "Month-end AUM: %{customdata}<extra></extra>",
      },
    ],
    layout: layoutFor(
      "Month",
      MONTH_FORMAT,
      {
        yaxis: yAxis("Monthly change in AUM", ranges.yaxis, {
          tickprefix: "$",
          ticksuffix: "B",
          zerolinecolor: MUTED,
        }),
        yaxis2: yAxis("Month-end AUM", ranges.yaxis2, {
          overlaying: "y",
          side: "right",
          showgrid: false,
          tickprefix: "$",
          ticksuffix: "B",
        }),
      },
      { barmode: "relative", bargap: 0.3 }
    ),
    config: CONFIG,
    fit,
  };
}

/** /free/etf/[ticker] chart 3: estimated fee revenue per month, in $ millions. */
export function feesSpec(months: EtfFeeMonth[]): PlotSpec {
  const M = 1e6;
  const x = months.map((m) => `${m.month}-01`);
  const fit: FitTarget[] = [
    {
      axis: "yaxis",
      zero: true,
      rows: months.flatMap((m, i) =>
        m.fee === null
          ? []
          : [{ x: x[i], lo: Number(m.fee) / M, hi: Number(m.fee) / M }]
      ),
    },
  ];
  const ranges = withRanges(fit);
  return {
    data: [
      {
        type: "bar",
        name: "Estimated gross fee revenue",
        x,
        y: months.map((m) => num(m.fee, M)),
        customdata: months.map((m) =>
          m.fee === null ? "" : compactDollars(m.fee)
        ),
        marker: { color: ETF_FEE_COLOR },
        hovertemplate: "Estimated fee revenue: %{customdata}<extra></extra>",
      },
    ],
    layout: layoutFor(
      "Month",
      MONTH_FORMAT,
      {
        yaxis: yAxis("Fee revenue per month", ranges.yaxis, {
          tickprefix: "$",
          ticksuffix: "M",
        }),
      },
      { bargap: 0.3 }
    ),
    config: CONFIG,
    fit,
  };
}

/**
 * /free/soma Holdings over time: weekly Treasury par stacked by
 * SOMA_STACKS from 0, in $ trillions. Hover shows each stack and the
 * week's total in $ billions, as weekTooltip() adds them up.
 */
export function somaHistorySpec(points: SomaHistoryPoint[]): PlotSpec {
  const T = 1e12;
  const x = points.map((p) => p.week);
  const tips = points.map(weekTooltip);
  const fit: FitTarget[] = [
    {
      axis: "yaxis",
      zero: true,
      rows: points.map((p) => ({ x: p.week, lo: 0, hi: Number(p.total) / T })),
    },
  ];
  const ranges = withRanges(fit);
  const stacks = SOMA_STACKS.map((stack, s) => ({
    type: "scatter",
    mode: "lines",
    name: SOMA_STACK_LABELS[stack],
    stackgroup: "soma",
    x,
    y: points.map((p) => Number(p.par[stack]) / T),
    customdata: tips.map((t) => t.rows[s].value),
    line: { color: SOMA_STACK_COLORS[stack], width: 0.5 },
    fillcolor: SOMA_STACK_COLORS[stack],
    hovertemplate: `${SOMA_STACK_LABELS[stack]}: %{customdata}<extra></extra>`,
  }));
  // The week's total, drawn along the top of the stack with no line: it
  // only adds a row to the hover.
  const total = {
    type: "scatter",
    mode: "lines",
    name: "Total",
    x,
    y: points.map((p) => Number(p.total) / T),
    customdata: tips.map((t) => t.total),
    line: { color: INK, width: 0 },
    hovertemplate: "Total: %{customdata}<extra></extra>",
  };
  return {
    data: [...stacks, total],
    // No axis titles, as before: the caption says what is plotted.
    layout: layoutFor("", DAY_FORMAT, {
      yaxis: yAxis("", ranges.yaxis, {
        tickprefix: "$",
        ticksuffix: "T",
      }),
    }),
    config: CONFIG,
    fit,
  };
}

/**
 * US-339 /free/tech-vs-sp500: the XLK ÷ SPY drawdown in %, filled down
 * from 0, with the latest value and each trough annotated (date and %).
 * `dtick` sets the y-axis step: the since-2004 panel's is finer.
 */
export function drawdownSpec(
  series: [string, number][],
  marks: { latest: DrawdownPoint; troughs: DrawdownPoint[] },
  dtick: number
): PlotSpec {
  const fit: FitTarget[] = [
    {
      axis: "yaxis",
      zero: true,
      rows: series.map(([x, dd]) => ({ x, lo: dd * 100, hi: dd * 100 })),
    },
  ];
  const ranges = withRanges(fit);
  // A deep trough's label sits above it, inside the fill; a shallow one's
  // below it, where there is room down to the axis floor, so neither runs
  // into the top margin. Two distances in turn keep neighbours apart; near
  // either end a label leans inward, so it never widens the x range. The latest's sits in the top margin on
  // the right, clear of the range buttons, with a line down to its point.
  const first = series.length ? series[0][0] : "";
  const last = series.length ? series[series.length - 1][0] : "";
  const span = Date.parse(last) - Date.parse(first) || 1;
  const lean = (date: string) => {
    const at = (Date.parse(date) - Date.parse(first)) / span;
    return at < 0.1 ? "left" : at > 0.9 ? "right" : "center";
  };
  const floor = series.reduce((m, [, dd]) => Math.min(m, dd), 0);
  const font = { family: MONO, size: 11, color: INK };
  const trough = (t: DrawdownPoint, i: number) => ({
    x: t.date,
    y: t.dd * 100,
    text: `${percentLabel(t.dd)}<br>${dateLabel(t.date)}`,
    showarrow: true,
    arrowhead: 0,
    arrowcolor: MUTED,
    ax: 0,
    ay: (i % 2 ? 58 : 26) * (t.dd < floor / 2 ? -1 : 1),
    xanchor: lean(t.date),
    font,
    bgcolor: "rgba(255, 255, 255, 0.85)",
  });
  const latest = {
    x: marks.latest.date,
    y: marks.latest.dd * 100,
    text: `Latest ${percentLabel(marks.latest.dd)}, ${dateLabel(
      marks.latest.date
    )}`,
    showarrow: true,
    arrowhead: 0,
    arrowcolor: MUTED,
    ax: 0,
    ayref: "y",
    ay: 0,
    xanchor: "right",
    yanchor: "bottom",
    font,
  };
  return {
    data: [
      {
        type: "scatter",
        mode: "lines",
        name: "Drawdown",
        x: series.map(([d]) => d),
        y: series.map(([, dd]) => dd * 100),
        fill: "tozeroy",
        fillcolor: DRAWDOWN_FILL,
        line: { color: DRAWDOWN_COLOR, width: 1 },
        hovertemplate: "Drawdown: %{y:.1f}%<extra></extra>",
      },
    ],
    layout: layoutFor(
      "",
      DAY_FORMAT,
      {
        yaxis: yAxis("", ranges.yaxis, {
          ticksuffix: "%",
          dtick,
          zerolinecolor: MUTED,
        }),
      },
      {
        annotations: [...marks.troughs.map(trough), latest],
      }
    ),
    config: CONFIG,
    fit,
  };
}

/**
 * US-341 /free/sigma-moves: each day's σ move as a line over a shaded
 * ±`band` "normal range", with the latest value and each listed outlier
 * annotated (date and σ). The page's own 1Y / 5Y / All buttons pick the
 * points, so the chart has no range buttons of its own.
 */
export function sigmaSpec(
  points: SigmaPoint[],
  marks: { latest: SigmaPoint; outliers: SigmaPoint[] },
  band: number
): PlotSpec {
  const fit: FitTarget[] = [
    {
      axis: "yaxis",
      zero: false,
      rows: points.map((p) => ({
        x: p.date,
        lo: Math.min(p.sigma, -band),
        hi: Math.max(p.sigma, band),
      })),
    },
  ];
  const ranges = withRanges(fit);
  const first = points.length ? points[0].date : "";
  const last = points.length ? points[points.length - 1].date : "";
  const span = Date.parse(last) - Date.parse(first) || 1;
  const font = { family: MONO, size: 11, color: INK };
  // Beside its point, towards the middle of the chart so it never widens
  // the x range, and hanging inward from the point's height so it stays
  // clear of the latest's label in the top margin.
  const outlier = (p: SigmaPoint) => {
    const right = (Date.parse(p.date) - Date.parse(first)) / span > 0.5;
    return {
      x: p.date,
      y: p.sigma,
      text: `${dateLabel(p.date)} · ${sigmaLabel(p.sigma)}`,
      showarrow: true,
      arrowhead: 0,
      arrowcolor: MUTED,
      ax: right ? -16 : 16,
      ay: 0,
      xanchor: right ? "right" : "left",
      yanchor: p.sigma < 0 ? "bottom" : "top",
      font,
      bgcolor: "rgba(255, 255, 255, 0.85)",
    };
  };
  const latest = {
    x: marks.latest.date,
    y: marks.latest.sigma,
    text: `Latest ${sigmaLabel(marks.latest.sigma)}, ${dateLabel(
      marks.latest.date
    )}`,
    showarrow: true,
    arrowhead: 0,
    arrowcolor: MUTED,
    ax: 0,
    ayref: "y",
    ay: ranges.yaxis ? ranges.yaxis[1] : band,
    xanchor: "right",
    yanchor: "bottom",
    font,
  };
  // The latest's own label already gives its date and σ.
  const listed = marks.outliers.filter((p) => p.date !== marks.latest.date);
  const layout = layoutFor(
    "",
    DAY_FORMAT,
    {
      yaxis: yAxis("", ranges.yaxis, {
        ticksuffix: "σ",
        zerolinecolor: MUTED,
      }),
    },
    {
      margin: { l: 8, r: 8, t: 28, b: 8 },
      shapes: [
        {
          type: "rect",
          xref: "paper",
          x0: 0,
          x1: 1,
          yref: "y",
          y0: -band,
          y1: band,
          fillcolor: SIGMA_BAND_FILL,
          line: { width: 0 },
          layer: "below",
        },
      ],
      annotations: [...listed.map(outlier), latest],
    }
  );
  const xaxis = { ...layout.xaxis };
  delete xaxis.rangeselector;
  return {
    data: [
      {
        type: "scatter",
        mode: "lines",
        name: "σ move",
        x: points.map((p) => p.date),
        y: points.map((p) => p.sigma),
        line: { color: SIGMA_COLOR, width: 1 },
        hovertemplate: "σ move: %{y:.2f}σ<extra></extra>",
      },
    ],
    layout: { ...layout, xaxis },
    config: CONFIG,
    fit,
  };
}
