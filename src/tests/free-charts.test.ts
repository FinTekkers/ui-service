/**
 * US-337: the free pages' time-series charts as Plotly figures. Each spec
 * builder in $lib/free/charts is pure, so its axes, range buttons, colours
 * and names are checked here with no DOM. Level lines (shares outstanding,
 * month-end AUM) are fitted to the visible dates with padding, never from
 * 0; stacked bars and areas stay zero-based. Colours and names are literals
 * copied from the SVG charts on main before US-337.
 */
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, test } from "vitest";
import {
  ALL_DATES,
  FIT_PAD,
  feesSpec,
  fitY,
  flowsSpec,
  refit,
  relayoutWindow,
  sharesSpec,
  somaHistorySpec,
  type PlotSpec,
} from "$lib/free/charts";
import {
  compactDollars,
  type EtfFeeMonth,
  type EtfMonth,
  type EtfPoint,
} from "$lib/free/etf";
import type { SomaHistoryPoint } from "$lib/free/soma";

/** Two years of month-start share counts, flat at 0.9B, then a year rising
 * from 1.00B to 1.07B (the owner's 25 Nov example). */
const SHARES: EtfPoint[] = [
  ...Array.from(
    { length: 12 },
    (_, i): EtfPoint => [
      `2024-${String(i + 1).padStart(2, "0")}-01`,
      "900000000",
    ]
  ),
  ...Array.from(
    { length: 12 },
    (_, i): EtfPoint => [
      `2025-${String(i + 1).padStart(2, "0")}-01`,
      String(1_000_000_000 + Math.round((i * 70_000_000) / 11)),
    ]
  ),
];

function month(
  m: string,
  aumEnd: string | null,
  netFlows: string | null,
  marketMove: string | null
): EtfMonth {
  return { month: m, aumEnd, deltaAum: null, netFlows, marketMove };
}

/** AUM rises from $400B to $600B; flows and market move mixed. */
const FLOWS: EtfMonth[] = [
  month("2026-01", "400000000000", "5000000000", "-2000000000"),
  month("2026-02", "450000000000", "-3000000000", "8000000000"),
  month("2026-03", null, null, null),
  month("2026-04", "600000000000", null, "4000000000"),
];

const FEES: EtfFeeMonth[] = [
  { month: "2026-05", fee: null, days: 31 },
  { month: "2026-06", fee: "30000000", days: 30 },
  { month: "2026-07", fee: "31000000", days: 31 },
];

function week(
  w: string,
  bills: number,
  notesBonds: number,
  tips: number,
  frns: number
): SomaHistoryPoint {
  const T = 1e12;
  const par = {
    bills: String(bills * T),
    notesBonds: String(notesBonds * T),
    tips: String(tips * T),
    frns: String(frns * T),
  };
  return {
    week: w,
    par,
    total: String((bills + notesBonds + tips + frns) * T),
  };
}

const SOMA: SomaHistoryPoint[] = [
  week("2025-11-05", 0.2, 3.5, 0.3, 0.1),
  week("2025-11-12", 0.25, 3.5, 0.3, 0.1),
  week("2026-11-04", 0.5, 3.6, 0.3, 0.07),
];

const SPECS: [string, PlotSpec][] = [
  ["shares", sharesSpec(SHARES)],
  ["flows", flowsSpec(FLOWS)],
  ["fees", feesSpec(FEES)],
  ["SOMA holdings", somaHistorySpec(SOMA)],
];

const range = (spec: PlotSpec, axis: "yaxis" | "yaxis2") =>
  spec.layout[axis].range as [number, number];

describe("metric 1: level lines fit the data with padding, not from 0", () => {
  test("shares: the y-axis starts above 0, within padding below the minimum", () => {
    const spec = sharesSpec(SHARES);
    const [lo, hi] = range(spec, "yaxis");
    const min = 0.9;
    const max = 1.07;
    expect(spec.layout.yaxis.autorange).toBe(false);
    expect(lo).toBeGreaterThan(0);
    expect(lo).toBeLessThan(min);
    expect(lo).toBeCloseTo(min - FIT_PAD * (max - min), 9);
    expect(hi).toBeCloseTo(max + FIT_PAD * (max - min), 9);
  });

  test("shares at 1Y: refit() moves the y-axis to the 1Y minimum and maximum plus padding", () => {
    const spec = sharesSpec(SHARES);
    const update = refit(spec, "2025-01-01", "2025-12-31 23:59:59");
    expect(Object.keys(update)).toEqual(["yaxis.range"]);
    const [lo, hi] = update["yaxis.range"];
    const span = 1.07 - 1.0;
    expect(lo).toBeGreaterThan(0);
    expect(lo).toBeLessThanOrEqual(1.0);
    expect(lo).toBeGreaterThanOrEqual(1.0 - 0.1 * span);
    expect(hi).toBeGreaterThanOrEqual(1.07);
    expect(hi).toBeLessThanOrEqual(1.07 + 0.1 * span);
  });

  test("month-end AUM: fitted on yaxis2, not yaxis; $400B to $600B starts above 0", () => {
    const spec = flowsSpec(FLOWS);
    const [lo, hi] = range(spec, "yaxis2");
    expect(lo).toBeGreaterThan(0);
    expect(lo).toBeCloseTo(400 - FIT_PAD * 200, 9);
    expect(hi).toBeCloseTo(600 + FIT_PAD * 200, 9);
    expect(spec.data[2].yaxis).toBe("y2");
    expect(spec.layout.yaxis2).toMatchObject({
      overlaying: "y",
      side: "right",
    });

    const update = refit(spec, "2026-02-01", "2026-04-01");
    expect(update["yaxis2.range"][0]).toBeGreaterThan(400);
    expect(update["yaxis2.range"][0]).toBeCloseTo(450 - FIT_PAD * 150, 9);
    // The bars' axis is refitted too, and stays zero-based.
    expect(update["yaxis.range"][0]).toBeLessThan(0);
    expect(update["yaxis.range"][1]).toBeGreaterThan(0);
  });
});

describe("metric 1: stacked bars and areas are zero-based", () => {
  test("flows: per-month positive and negative stacks, 0 in range", () => {
    const spec = flowsSpec(FLOWS);
    expect(spec.layout.barmode).toBe("relative");
    const [lo, hi] = range(spec, "yaxis");
    // Jan: +5 up, −2 down; Feb: +8 up, −3 down; Apr: market +4 alone.
    expect(lo).toBeCloseTo(-3 - FIT_PAD * 11, 9);
    expect(hi).toBeCloseTo(8 + FIT_PAD * 11, 9);
  });

  test("flows: every month negative still reaches 0 at the top", () => {
    const spec = flowsSpec([
      month("2026-01", "1", "-5000000000", "-2000000000"),
      month("2026-02", "1", "-1000000000", "-1000000000"),
    ]);
    const [lo, hi] = range(spec, "yaxis");
    expect(hi).toBe(0);
    expect(lo).toBeLessThan(-7);
  });

  test("flows: every month positive starts at exactly 0", () => {
    const spec = flowsSpec([
      month("2026-01", "1", "5000000000", "2000000000"),
      month("2026-02", "1", "1000000000", "1000000000"),
    ]);
    const [lo, hi] = range(spec, "yaxis");
    expect(lo).toBe(0);
    expect(hi).toBeGreaterThan(7);
  });

  test("fees and SOMA holdings start at 0", () => {
    expect(range(feesSpec(FEES), "yaxis")[0]).toBe(0);
    expect(range(feesSpec(FEES), "yaxis")[1]).toBeGreaterThan(31);
    const soma = somaHistorySpec(SOMA);
    expect(range(soma, "yaxis")[0]).toBe(0);
    expect(range(soma, "yaxis")[1]).toBeGreaterThan(4.47);
    for (const trace of soma.data.slice(0, 4)) {
      expect(trace.stackgroup).toBe("soma");
    }
    // Refitted to one late week, the stack is still drawn from 0.
    expect(refit(soma, "2026-11-01", "2026-11-30")["yaxis.range"][0]).toBe(0);
  });
});

describe("metric 1: range buttons, colours and names", () => {
  test.each(SPECS)(
    "%s: 1Y, 5Y and All range-selector buttons on a date axis",
    (_name, spec) => {
      const xaxis = spec.layout.xaxis;
      expect(xaxis.type).toBe("date");
      expect(
        xaxis.rangeselector.buttons.map((b: { label: string }) => b.label)
      ).toEqual(["1Y", "5Y", "All"]);
      expect(xaxis.rangeselector.buttons.slice(0, 2)).toEqual([
        { count: 1, step: "year", stepmode: "backward", label: "1Y" },
        { count: 5, step: "year", stepmode: "backward", label: "5Y" },
      ]);
      expect(spec.layout.hovermode).toBe("x unified");
      expect(spec.config).toMatchObject({
        responsive: true,
        displayModeBar: false,
      });
    }
  );

  const colorOf = (t: Record<string, any>) =>
    t.type === "bar" ? t.marker.color : t.fillcolor ?? t.line.color;

  test("trace names and colours equal the SVG charts'", () => {
    const named = (spec: PlotSpec) =>
      spec.data.map((t) => [t.name, colorOf(t)]);
    expect(named(sharesSpec(SHARES))).toEqual([
      ["Shares outstanding, daily", "#2f5bb7"],
    ]);
    expect(named(flowsSpec(FLOWS))).toEqual([
      ["Net flows", "#2f5bb7"],
      ["Market move", "#e8a33d"],
      ["Month-end AUM (right axis)", "#0d1b2a"],
    ]);
    expect(named(feesSpec(FEES))).toEqual([
      ["Estimated gross fee revenue", "#5b8def"],
      ["Annualised run rate (right axis)", "#e8a33d"],
    ]);
    expect(named(somaHistorySpec(SOMA)).slice(0, 4)).toEqual([
      ["Bills", "#B9D0FA"],
      ["Notes & bonds", "#5B8DEF"],
      ["TIPS", "#2F5BB7"],
      ["FRNs", "#E8A33D"],
    ]);
  });

  test("axis titles are the SVG charts'", () => {
    const title = (spec: PlotSpec, axis: string) =>
      spec.layout[axis].title.text;
    const shares = sharesSpec(SHARES);
    expect(title(shares, "yaxis")).toBe("Shares outstanding (billions)");
    expect(title(shares, "xaxis")).toBe("Date");
    const flows = flowsSpec(FLOWS);
    expect(title(flows, "yaxis")).toBe("Monthly change in AUM");
    expect(title(flows, "yaxis2")).toBe("Month-end AUM");
    expect(title(flows, "xaxis")).toBe("Month");
    expect(title(feesSpec(FEES), "yaxis")).toBe("Monthly fee");
  });

  test("hover shows the page's figures: grouped digits, compact dollars, the SOMA week's values and total", () => {
    const shares = sharesSpec(SHARES).data[0];
    expect((shares.customdata as string[])[12]).toBe("1,000,000,000");
    expect(sharesSpec(SHARES).layout.xaxis.hoverformat).toBe("%b %-d, %Y");
    const flows = flowsSpec(FLOWS);
    expect(flows.layout.xaxis.hoverformat).toBe("%b %Y");
    expect((flows.data[0].customdata as string[])[0]).toBe("$5.0B");
    expect((flows.data[2].customdata as string[])[3]).toBe("$600.0B");
    const soma = somaHistorySpec(SOMA).data;
    expect(soma.map((t) => (t.customdata as string[])[2])).toEqual([
      "$500.00B",
      "$3,600.00B",
      "$300.00B",
      "$70.00B",
      "$4,470.00B",
    ]);
    expect(soma[4].name).toBe("Total");
  });

  test("a null month is a null value, a gap, never 0", () => {
    const flows = flowsSpec(FLOWS);
    expect(flows.data[0].y).toEqual([5, -3, null, null]);
    expect(flows.data[1].y).toEqual([-2, 8, null, 4]);
    expect(flows.data[2].y).toEqual([400, 450, null, 600]);
    expect(flows.data[2].connectgaps).toBe(false);
    expect(feesSpec(FEES).data[0].y).toEqual([null, 30, 31]);
  });
});

describe("US-346: the fee chart's annualised run-rate line", () => {
  test("metric 2: bars on the left axis, the run rate on a right axis", () => {
    const spec = feesSpec(FEES);
    expect(spec.layout.yaxis.title.text).toBe("Monthly fee");
    expect(spec.layout.yaxis2.title.text).toBe(
      "Annualised run rate ($ per year)"
    );
    expect(spec.layout.yaxis2).toMatchObject({
      side: "right",
      overlaying: "y",
    });
    expect(spec.data[1].yaxis).toBe("y2");
    expect([undefined, "y"]).toContain(spec.data[0].yaxis);
    expect(spec.data[0].y).toEqual([null, 30, 31]);
    expect(spec.data[0].hovertemplate).toBe(
      "Estimated fee revenue: %{customdata}<extra></extra>"
    );
    // June: 30M over 30 days × 365 = 365M; July: 31M over 31 days.
    expect(spec.data[1].y).toEqual([null, 365, 365]);
  });

  test("metric 2: a blank mid-series month is a gap in the line, not 0", () => {
    const spec = feesSpec([
      { month: "2026-05", fee: "30000000", days: 31 },
      { month: "2026-06", fee: null, days: 30 },
      { month: "2026-07", fee: "31000000", days: 31 },
    ]);
    const y = spec.data[1].y as (number | null)[];
    expect(y[1]).toBeNull();
    expect(typeof y[0]).toBe("number");
    expect(typeof y[2]).toBe("number");
    expect(spec.data[1].connectgaps).not.toBe(true);
  });

  test("metric 3: one unified hover shows the month's fee and its run rate", () => {
    const spec = feesSpec(FEES);
    expect(spec.layout.hovermode).toBe("x unified");
    expect(spec.data[1].hovertemplate).toBe(
      "Annualised run rate: %{customdata} a year<extra></extra>"
    );
    expect(spec.data[0].hovertemplate).not.toBe(spec.data[1].hovertemplate);
    expect((spec.data[0].customdata as string[])[1]).toBe("$30.0M");
    expect((spec.data[1].customdata as string[])[1]).toBe(
      compactDollars((30_000_000 / 30) * 365)
    );
    expect((spec.data[1].customdata as string[])[0]).toBe("");
  });

  test("guardrail 4: both axes refit to the visible months, from 0", () => {
    const spec = feesSpec(FEES);
    expect(spec.fit.map((t) => t.axis)).toEqual(["yaxis", "yaxis2"]);
    expect(range(spec, "yaxis2")[0]).toBe(0);
    const update = refit(spec, "2026-06-01", "2026-06-30");
    expect(update["yaxis.range"][0]).toBe(0);
    expect(update["yaxis2.range"][0]).toBe(0);
    expect(update["yaxis2.range"][1]).toBeGreaterThan(365);
  });
});

describe("metric 3: the relayout loop guard", () => {
  test("yaxis-only updates (refit's own) cause no refit", () => {
    expect(relayoutWindow({ "yaxis.range": [1, 2] })).toBeNull();
    expect(relayoutWindow({ "yaxis2.range[0]": 1 })).toBeNull();
    expect(
      relayoutWindow({ "yaxis.range": [1, 2], "yaxis2.range": [3, 4] })
    ).toBeNull();
    expect(relayoutWindow({})).toBeNull();
    expect(relayoutWindow(null)).toBeNull();
  });

  test("a range button, drag-zoom or double-click refits", () => {
    expect(
      relayoutWindow({
        "xaxis.range[0]": "2025-11-23 12:00",
        "xaxis.range[1]": "2026-11-23",
      })
    ).toEqual(["2025-11-23 12:00", "2026-11-23"]);
    expect(relayoutWindow({ "xaxis.autorange": true })).toEqual(ALL_DATES);
    expect(
      relayoutWindow({ "xaxis.range": ["2024-01-01", "2025-01-01"] })
    ).toEqual(["2024-01-01", "2025-01-01"]);
    expect(
      relayoutWindow({
        "xaxis.range[0]": Date.UTC(2025, 0, 1),
        "xaxis.range[1]": Date.UTC(2026, 0, 1),
      })
    ).toEqual(["2025-01-01 00:00:00", "2026-01-01 00:00:00"]);
  });

  test("inherited keys are not read as an x move", () => {
    const event = Object.create({ "xaxis.autorange": true });
    expect(relayoutWindow(event)).toBeNull();
  });
});

describe("fitY edges", () => {
  const target = (values: number[], zero = false) => ({
    axis: "yaxis" as const,
    zero,
    rows: values.map((v, i) => ({
      x: `2026-01-${String(i + 1).padStart(2, "0")}`,
      lo: v,
      hi: v,
    })),
  });

  test("one point gets a range that doesn't collapse", () => {
    const [lo, hi] = fitY(target([1.02]), ...ALL_DATES) as [number, number];
    expect(lo).toBeLessThan(1.02);
    expect(hi).toBeGreaterThan(1.02);
    expect(lo).toBeGreaterThan(1);
  });

  test("a window with no rows gives null, and refit() leaves that axis alone", () => {
    expect(fitY(target([1, 2]), "2027-01-01", "2027-12-31")).toBeNull();
    expect(refit(sharesSpec(SHARES), "2030-01-01", "2030-12-31")).toEqual({});
  });

  test("a month with null net flows but a market move fits by the market move alone", () => {
    const spec = flowsSpec([month("2026-04", "1", null, "-4000000000")]);
    expect(range(spec, "yaxis")).toEqual([-4 - FIT_PAD * 4, 0]);
  });
});

describe("guardrail 1: plotly.js-dist loads lazily, from one component", () => {
  function sources(dir: string): string[] {
    return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
      const p = path.join(dir, e.name);
      return e.isDirectory() ? sources(p) : /\.(ts|svelte)$/.test(p) ? [p] : [];
    });
  }

  test("only PlotlyChart.svelte names it, and only inside await import(", () => {
    const naming = [
      ...sources("src/components/free"),
      ...sources("src/lib/free"),
    ].filter((f) => readFileSync(f, "utf8").includes("plotly.js-dist"));
    expect(naming).toEqual([
      path.join("src/components/free", "PlotlyChart.svelte"),
    ]);
    const source = readFileSync(naming[0], "utf8");
    const all = source.match(/plotly\.js-dist/g) ?? [];
    const lazy =
      source.match(/await\s+import\(\s*["']plotly\.js-dist["']\s*\)/g) ?? [];
    expect(lazy.length).toBeGreaterThan(0);
    expect(lazy.length).toBe(all.length);
    // Inside onMount: never at module top level or during SSR.
    expect(source).toMatch(
      /onMount\(\s*async\s*\(\)\s*=>\s*\{[\s\S]*?await\s+import\(\s*["']plotly\.js-dist["']/
    );
  });
});
