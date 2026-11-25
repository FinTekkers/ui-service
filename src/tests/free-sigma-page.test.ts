/**
 * US-341 metrics 2 and 3: /free/sigma-moves from fixed mocked closes. The
 * load turns each fund's closes into [date, σ]; the page shows the latest σ
 * and how many days in the selected range (1Y by default, 5Y, All) fell
 * outside ±3σ, and Plotly draws the σ line, the ±3σ band and a label on
 * each listed outlier. Each fund comes from SIGMA_TICKERS and fails on its
 * own, with "Unavailable" and the reason.
 *
 * The fixture: 2,400 daily returns from 2019-01-01, alternating +1% and
 * −1%, with six spikes 100+ days apart, so each spike's window is the clean
 * alternation (sample stdev 0.01 × √(100/99)). The expected values are
 * hard-coded, worked out outside this code: 1Y has 2 days outside ±3σ,
 * 5Y 4, All 5; one day sits at exactly 3.00σ and is never counted; the
 * latest is −0.94σ on Jul 28, 2025.
 */
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/svelte";
import { readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  fetchClosesByTicker: vi.fn(),
  react: vi.fn(),
  relayout: vi.fn(),
  purge: vi.fn(),
}));

// The broker fetch itself (homepage-aapl-chart.test.ts covers its calls).
vi.mock("$lib/server/closes", () => ({
  fetchClosesByTicker: mocks.fetchClosesByTicker,
}));
// Under Vitest, `svelte` resolves to its SSR build, whose onMount is a
// no-op; PlotlyChart loads Plotly in onMount, so use the real hooks.
vi.mock("svelte", async (importOriginal) => {
  const internal = await import("svelte/internal");
  return {
    ...(await importOriginal<typeof import("svelte")>()),
    onMount: internal.onMount,
    onDestroy: internal.onDestroy,
  };
});
vi.mock("plotly.js-dist", () => ({
  default: {
    react: mocks.react,
    relayout: mocks.relayout,
    purge: mocks.purge,
  },
}));

import { loadFreeSigma } from "$lib/server/free-sigma";
import { load } from "../routes/free/sigma-moves/+page.server";
import Page from "../routes/free/sigma-moves/+page.svelte";
import {
  SIGMA_BAND,
  SIGMA_BASIS,
  SIGMA_FORMULA,
  SIGMA_TICKERS,
  SIGMA_WINDOW,
  type Close,
  type SigmaPageData,
} from "$lib/free/sigma";

const SENTINEL = "sentinel-sigma-key";

/** The ISO date `n` days after 2019-01-01. */
function day(n: number): string {
  const d = new Date(Date.UTC(2019, 0, 1));
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

const SPIKES: Record<number, number> = {
  300: -0.06, // 2019-10-28: All only
  1000: -0.045, // 2021-09-27: 5Y
  1500: 0.05, // 2023-02-09: 5Y
  2100: 0.04, // 2024-10-01: 1Y
  2210: 3 * 0.01 * Math.sqrt(100 / 99), // 2025-01-19: exactly 3σ
  2320: -0.035, // 2025-05-09: 1Y
};

/** 2,401 closes from 100; TQQQ's returns are 3× SPY's (same σ). */
function closes(scale: number): Close[] {
  const out: Close[] = [{ date: day(0), close: 100 }];
  for (let i = 1; i <= 2400; i++) {
    const r = SPIKES[i] ?? (i % 2 ? 0.01 : -0.01);
    out.push({ date: day(i), close: out[i - 1].close * (1 + r * scale) });
  }
  return out;
}

const SPY = closes(1);
const TQQQ = closes(3);

const SUMMARY = {
  "1Y": "Latest: −0.94σ on Jul 28, 2025. 2 days in this range fell outside ±3σ.",
  "5Y": "Latest: −0.94σ on Jul 28, 2025. 4 days in this range fell outside ±3σ.",
  All: "Latest: −0.94σ on Jul 28, 2025. 5 days in this range fell outside ±3σ.",
};

const LATEST_LABEL = "Latest −0.94σ, Jul 28, 2025";
const LABELS = {
  "1Y": ["Oct 1, 2024 · +3.98σ", "May 9, 2025 · −3.48σ"],
  "5Y": [
    "Feb 9, 2023 · +4.97σ",
    "Sep 27, 2021 · −4.48σ",
    "Oct 1, 2024 · +3.98σ",
    "May 9, 2025 · −3.48σ",
  ],
  All: [
    "Oct 28, 2019 · −5.97σ",
    "Feb 9, 2023 · +4.97σ",
    "Sep 27, 2021 · −4.48σ",
    "Oct 1, 2024 · +3.98σ",
    "May 9, 2025 · −3.48σ",
  ],
};

const byTicker =
  (map: Record<string, Close[]>) =>
  async (ticker: string): Promise<Close[]> =>
    map[ticker] ?? [];

const FIXTURE = { SPY, TQQQ };

async function loaded(map: Record<string, Close[]> = FIXTURE) {
  return loadFreeSigma(SENTINEL, byTicker(map));
}

function renderPage(data: SigmaPageData) {
  return render(Page, { props: { data } });
}

/** The figure the last Plotly.react call drew. */
function lastPlot() {
  const call = mocks.react.mock.calls.at(-1);
  if (!call) throw new Error("Plotly.react was not called");
  const [, traces, layout] = call;
  return { traces, layout };
}

const annotations = () =>
  lastPlot().layout.annotations.map((a: { text: string }) => a.text);

beforeEach(() => {
  vi.clearAllMocks();
  mocks.react.mockImplementation(async (el: { on?: unknown }) => {
    el.on = vi.fn();
  });
});

afterEach(() => {
  delete process.env.FT_HOMEPAGE_API_KEY;
});

describe("load", () => {
  test("the route reads each SIGMA_TICKERS fund with FT_HOMEPAGE_API_KEY through the broker fetch only", async () => {
    process.env.FT_HOMEPAGE_API_KEY = ` ${SENTINEL} `;
    mocks.fetchClosesByTicker.mockImplementation(byTicker(FIXTURE));
    const data = await load();
    expect(mocks.fetchClosesByTicker.mock.calls).toEqual(
      SIGMA_TICKERS.map((t) => [t.ticker, SENTINEL])
    );
    expect(data.funds.map((f) => f.ticker)).toEqual(
      SIGMA_TICKERS.map((t) => t.ticker)
    );
    for (const f of data.funds) {
      expect(f.series.ok).toBe(true);
      if (!f.series.ok) continue;
      // 2,400 returns: the first σ is on return 101, day 101.
      expect(f.series.data).toHaveLength(2300);
      expect(f.series.data[0][0]).toBe(day(101));
      expect(f.series.data.at(-1)).toEqual(["2025-07-28", -0.9436]);
    }
    const json = JSON.stringify(data);
    expect(json).not.toContain(SENTINEL);
    expect(json).not.toContain('"close"');
  });

  test.each([
    [
      "key unset",
      () => loadFreeSigma(undefined, byTicker(FIXTURE)),
      "Unavailable: price data is not configured on this server.",
    ],
    [
      "the fetch throws",
      () =>
        loadFreeSigma(SENTINEL, async () => {
          throw new Error("14 UNAVAILABLE: broker down");
        }),
      "Unavailable: the price service could not be read (14 UNAVAILABLE: broker down).",
    ],
  ])(
    "%s: every fund unavailable with that reason",
    async (_n, run, message) => {
      const data = await run();
      for (const f of data.funds) {
        expect(f.series).toEqual({ ok: false, message });
      }
    }
  );

  test.each([
    ["no closes", [], "Unavailable: no closes are stored for TQQQ."],
    [
      "too few closes (101: 100 returns)",
      TQQQ.slice(0, 101),
      "Unavailable: TQQQ has 100 daily returns stored; 101 are needed.",
    ],
    [
      "closes that never move",
      TQQQ.map((c) => ({ ...c, close: 50 })),
      "Unavailable: TQQQ's stored closes never vary over 100 days.",
    ],
  ])(
    "TQQQ with %s fails alone; SPY is unaffected",
    async (_n, tqqq, message) => {
      const data = await loaded({ SPY, TQQQ: tqqq });
      const [spy, t] = data.funds;
      expect(spy.series.ok).toBe(true);
      expect(t.series).toEqual({ ok: false, message });
    }
  );

  test("a throw for one fund leaves the other", async () => {
    const data = await loadFreeSigma(SENTINEL, async (ticker) => {
      if (ticker === "TQQQ") throw new Error("deadline exceeded");
      return SPY;
    });
    expect(data.funds[0].series.ok).toBe(true);
    expect(data.funds[1].series).toEqual({
      ok: false,
      message:
        "Unavailable: the price service could not be read (deadline exceeded).",
    });
  });
});

describe("page: summary, ranges and labels (metric 2)", () => {
  test("1Y is the default: pressed, with the latest σ and the 1Y count", async () => {
    renderPage(await loaded());
    expect(screen.getByRole("button", { name: "1Y" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    for (const name of ["5Y", "All"]) {
      expect(screen.getByRole("button", { name })).toHaveAttribute(
        "aria-pressed",
        "false"
      );
    }
    expect(screen.getByTestId("sigma-summary")).toHaveTextContent(
      SUMMARY["1Y"]
    );
    await waitFor(() => expect(mocks.react).toHaveBeenCalled());
    expect(annotations()).toEqual([...LABELS["1Y"], LATEST_LABEL]);
  });

  test("5Y then All change the count, and the labels follow the range", async () => {
    renderPage(await loaded());
    await waitFor(() => expect(mocks.react).toHaveBeenCalled());

    for (const range of ["5Y", "All", "1Y"] as const) {
      const button = screen.getByRole("button", { name: range });
      await fireEvent.click(button);
      expect(button).toHaveAttribute("aria-pressed", "true");
      expect(screen.getByTestId("sigma-summary")).toHaveTextContent(
        SUMMARY[range]
      );
      await waitFor(() =>
        expect(annotations()).toEqual([...LABELS[range], LATEST_LABEL])
      );
      // The day at exactly 3.00σ is in every range and never labelled.
      expect(annotations().join()).not.toContain("Jan 19, 2025");
      // The same outliers, as text under the chart.
      const list = screen.getByTestId("sigma-spy-outliers");
      expect(
        within(list)
          .getAllByRole("listitem")
          .map((li) => li.textContent?.replace(/\s+/g, " ").trim())
      ).toEqual(LABELS[range].map((l) => l.replace(" · ", " ")));
    }
  });
});

describe("page: funds, band and method (metric 3)", () => {
  test("each SIGMA_TICKERS fund draws its σ line and the ±SIGMA_BAND band", async () => {
    renderPage(await loaded());
    for (const { ticker, name } of SIGMA_TICKERS) {
      mocks.react.mockClear();
      await fireEvent.click(screen.getByRole("button", { name: ticker }));
      expect(screen.getByRole("button", { name: ticker })).toHaveAttribute(
        "aria-pressed",
        "true"
      );
      const region = screen.getByRole("region", {
        name: `${name} (${ticker})`,
      });
      const plot = within(region).getByRole("img");
      expect(plot).toHaveAttribute(
        "aria-label",
        expect.stringContaining(`${ticker} daily σ moves, 1Y`)
      );
      await waitFor(() => expect(mocks.react).toHaveBeenCalled());
      const { traces, layout } = lastPlot();
      expect(traces).toHaveLength(1);
      expect(traces[0]).toMatchObject({ type: "scatter", mode: "lines" });
      expect(traces[0].y.at(-1)).toBeCloseTo(-0.9436, 4);
      expect(layout.shapes).toEqual([
        expect.objectContaining({
          type: "rect",
          y0: -SIGMA_BAND,
          y1: SIGMA_BAND,
          layer: "below",
        }),
      ]);
      expect(layout.xaxis.rangeselector).toBeUndefined();
    }
  });

  test("the formula and price basis come from the constants", async () => {
    const { container } = renderPage(await loaded());
    const note = screen.getByTestId("sigma-note");
    expect(note).toHaveTextContent(SIGMA_FORMULA);
    expect(note).toHaveTextContent(SIGMA_BASIS);
    expect(note).toHaveTextContent(
      `previous ${SIGMA_WINDOW} daily returns (today excluded)`
    );
    expect(note).toHaveTextContent(`±${SIGMA_BAND}σ`);
    expect(note).toHaveTextContent(`starts ${SIGMA_WINDOW + 1} trading days`);
    // LM-493 stores no dividends yet: the page says as-traded.
    expect(note).toHaveTextContent(/as-traded daily closes/);
    expect(container.textContent).not.toMatch(/dividend-adjusted/i);
    expect(container.innerHTML).not.toContain(SENTINEL);
  });

  test("with TQQQ's closes missing: 'Unavailable' and the reason, no chart; SPY still draws", async () => {
    renderPage(await loaded({ SPY, TQQQ: [] }));
    await waitFor(() => expect(mocks.react).toHaveBeenCalled());
    expect(
      within(
        screen.getByRole("region", { name: "SPDR S&P 500 ETF Trust (SPY)" })
      ).getByRole("img")
    ).toBeInTheDocument();

    await fireEvent.click(screen.getByRole("button", { name: "TQQQ" }));
    const region = screen.getByRole("region", {
      name: "ProShares UltraPro QQQ (TQQQ)",
    });
    expect(
      within(region).getByText("Unavailable: no closes are stored for TQQQ.")
    ).toBeInTheDocument();
    expect(within(region).queryByRole("img")).toBeNull();
    expect(screen.queryByTestId("sigma-summary")).toBeNull();
  });

  test("with the key unset, each fund says why", async () => {
    renderPage(await loadFreeSigma(undefined, byTicker(FIXTURE)));
    for (const { ticker, name } of SIGMA_TICKERS) {
      await fireEvent.click(screen.getByRole("button", { name: ticker }));
      expect(
        within(
          screen.getByRole("region", { name: `${name} (${ticker})` })
        ).getByText("Unavailable: price data is not configured on this server.")
      ).toBeInTheDocument();
    }
  });
});

describe("own design: no third-party branding (guardrail 1)", () => {
  const SOURCES = [
    "src/lib/free/sigma.ts",
    "src/lib/server/free-sigma.ts",
    "src/routes/free/sigma-moves/+page.server.ts",
    "src/routes/free/sigma-moves/+page.svelte",
    "src/components/free/sigma/SigmaPanel.svelte",
  ];
  const BRANDS = /trendspider|nvidia/i;

  test("the page's sources name no other publisher or company", () => {
    for (const file of SOURCES) {
      expect(readFileSync(file, "utf8"), file).not.toMatch(BRANDS);
    }
  });

  test("the rendered page names none, and has no image or artwork", async () => {
    const { container } = renderPage(await loaded());
    await waitFor(() => expect(mocks.react).toHaveBeenCalled());
    expect(container.innerHTML).not.toMatch(BRANDS);
    expect(JSON.stringify(lastPlot())).not.toMatch(BRANDS);
    expect(container.querySelectorAll("img, picture, svg, image")).toHaveLength(
      0
    );
  });
});
