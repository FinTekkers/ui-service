/**
 * US-339 metric 3: /free/tech-vs-sp500 from mocked closes. The load turns
 * XLK and SPY closes into the drawdown series, troughs and 'worst since';
 * the page renders both panels, the latest-value and trough figures, the
 * 'worst since' line and the source note (formula, unadjusted closes).
 * Each missing-data case shows "Unavailable" and its own reason.
 *
 * Vitest renders the SSR build, where onMount never runs, so Plotly never
 * loads here: the figures are asserted as the page's text, and the Plotly
 * figure as drawdownSpec builds it.
 */
import { render, screen, within } from "@testing-library/svelte";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({ fetchClosesByTicker: vi.fn() }));

// The broker fetch itself (homepage-aapl-chart.test.ts covers its calls).
vi.mock("$lib/server/closes", () => ({
  fetchClosesByTicker: mocks.fetchClosesByTicker,
}));

import { loadFreeTechVsSp500 } from "$lib/server/free-tech-vs-sp500";
import { load } from "../routes/free/tech-vs-sp500/+page.server";
import Page from "../routes/free/tech-vs-sp500/+page.svelte";
import { drawdownSpec } from "$lib/free/charts";
import { dateLabel } from "$lib/free/spy";
import type { Close, TechVsSp500PageData } from "$lib/free/techVsSp500";

const SENTINEL = "sentinel-tech-key";

/** The ISO date `n` days after 2003-05-01. */
function day(n: number): string {
  const d = new Date(Date.UTC(2003, 4, 1));
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

// SPY is flat at 100, so the ratio is XLK ÷ 100. After 252 sessions at 1.0
// (day 251 is the first drawdown, 0): a −15% episode that recovers, then
// an open one down to −20%, latest −12%.
const TAIL = [85, 90, 100, 95, 80, 84, 88];
const XLK: Close[] = [...Array(252).fill(100), ...TAIL].map((close, i) => ({
  date: day(i),
  close,
}));
const SPY: Close[] = XLK.map(({ date }) => ({ date, close: 100 }));

const fetchFrom =
  (xlk: Close[], spy: Close[]) =>
  async (ticker: string): Promise<Close[]> =>
    ticker === "XLK" ? xlk : spy;

async function loaded(xlk = XLK, spy = SPY) {
  return loadFreeTechVsSp500(SENTINEL, fetchFrom(xlk, spy));
}

function renderPage(data: TechVsSp500PageData) {
  return render(Page, { props: { data } });
}

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  delete process.env.FT_HOMEPAGE_API_KEY;
});

describe("load", () => {
  test("drawdown series, troughs, latest and worst since from the closes", async () => {
    const data = await loaded();
    expect(data.ok).toBe(true);
    if (!data.ok) return;
    expect(data.data.series[0]).toEqual([day(251), 0]);
    expect(data.data.series).toHaveLength(1 + TAIL.length);
    expect(data.data.troughs).toEqual([
      { date: day(252), dd: -0.15 },
      { date: day(256), dd: -0.2 },
    ]);
    expect(data.data.latest).toEqual({ date: day(258), dd: -0.12 });
    expect(data.data.worstSince).toBe(day(257));
    // No raw closes in the payload, only [date, dd].
    expect(JSON.stringify(data)).not.toContain('"close"');
  });

  test("the route reads XLK and SPY with FT_HOMEPAGE_API_KEY through the broker fetch only", async () => {
    process.env.FT_HOMEPAGE_API_KEY = ` ${SENTINEL} `;
    mocks.fetchClosesByTicker.mockImplementation(fetchFrom(XLK, SPY));
    const data = await load();
    expect(data.ok).toBe(true);
    expect(mocks.fetchClosesByTicker.mock.calls.sort()).toEqual([
      ["SPY", SENTINEL],
      ["XLK", SENTINEL],
    ]);
    expect(JSON.stringify(data)).not.toContain(SENTINEL);
  });

  test("an injected fetch is the only one called", async () => {
    const injected = vi.fn(fetchFrom(XLK, SPY));
    await loadFreeTechVsSp500(SENTINEL, injected);
    expect(injected).toHaveBeenCalledTimes(2);
    expect(mocks.fetchClosesByTicker).not.toHaveBeenCalled();
  });

  test.each([
    [
      "key unset",
      () => loadFreeTechVsSp500(undefined, fetchFrom(XLK, SPY)),
      "Unavailable: price data is not configured on this server.",
    ],
    [
      "the fetch throws",
      () =>
        loadFreeTechVsSp500(SENTINEL, async () => {
          throw new Error("14 UNAVAILABLE: broker down");
        }),
      "Unavailable: the price service could not be read (14 UNAVAILABLE: broker down).",
    ],
    [
      "no XLK closes",
      () => loaded([], SPY),
      "Unavailable: no closes are stored for XLK.",
    ],
    [
      "no SPY closes",
      () => loaded(XLK, []),
      "Unavailable: no closes are stored for SPY.",
    ],
    [
      "fewer than 252 shared sessions",
      () => loaded(XLK.slice(0, 251), SPY),
      "Unavailable: not enough shared XLK and SPY history (251 sessions; 252 needed).",
    ],
  ])("%s: unavailable with its reason", async (_name, run, message) => {
    expect(await run()).toEqual({ ok: false, message });
  });

  test("with the key unset, nothing is fetched", async () => {
    const injected = vi.fn(fetchFrom(XLK, SPY));
    await loadFreeTechVsSp500("", injected);
    expect(injected).not.toHaveBeenCalled();
  });
});

describe("page", () => {
  test("renders both panels, the latest value, troughs, worst since and the note", async () => {
    const { container } = renderPage(await loaded());

    expect(
      screen.getByRole("heading", {
        name: "Tech's drawdown relative to the S&P 500",
      })
    ).toBeInTheDocument();
    for (const [name, testid] of [
      ["Full history", "tech-full-plot"],
      ["Since 2004", "tech-2004-plot"],
    ]) {
      const region = screen.getByRole("region", { name });
      expect(within(region).getByTestId(testid)).toHaveAttribute(
        "aria-label",
        expect.stringContaining("latest −12.0%")
      );
    }

    expect(screen.getByTestId("tech-headline")).toHaveTextContent(
      `On ${dateLabel(
        day(258)
      )} the XLK ÷ SPY ratio was −12.0% from its 52-week high: worst since ${dateLabel(
        day(257)
      )}.`
    );
    expect(screen.getByTestId("tech-latest")).toHaveTextContent(
      `Latest: −12.0% on ${dateLabel(day(258))}`
    );
    const troughs = within(screen.getByTestId("tech-troughs")).getAllByRole(
      "listitem"
    );
    expect(
      troughs.map((li) => li.textContent?.replace(/\s+/g, " ").trim())
    ).toEqual([
      `${dateLabel(day(252))} −15.0%`,
      `${dateLabel(day(256))} −20.0%`,
    ]);

    const note = screen.getByTestId("tech-note");
    expect(note).toHaveTextContent(
      "Drawdown = (XLK close ÷ SPY close) ÷ the highest value of that ratio over the last 252 trading sessions, today included, − 1."
    );
    expect(note).toHaveTextContent(/unadjusted daily closes/);
    expect(note.textContent).not.toMatch(/dividend-adjusted/i);
    expect(container.textContent).not.toMatch(/dividend-adjusted/i);
    expect(container.innerHTML).not.toContain(SENTINEL);
  });

  test("no image or ARK artwork; ARK is named only in the source note", async () => {
    const { container } = renderPage(await loaded());
    expect(container.querySelectorAll("img, picture, svg, image")).toHaveLength(
      0
    );
    expect(container.innerHTML).not.toMatch(/ark-?invest|\.png|\.jpe?g|\.svg/i);
    const note = screen.getByTestId("tech-note");
    expect(note.textContent).toMatch(/\bARK Invest\b/);
    const outside = (container.textContent ?? "").replace(
      note.textContent ?? "",
      ""
    );
    expect(outside).not.toMatch(/\bARK\b/);
  });

  test("a latest drawdown of 0 says 'at a 52-week relative high', not worst since", async () => {
    const xlk = XLK.map((c, i) =>
      i === XLK.length - 1 ? { ...c, close: 101 } : c
    );
    const data = await loaded(xlk);
    renderPage(data);
    expect(screen.getByTestId("tech-headline")).toHaveTextContent(
      "at a 52-week relative high"
    );
    expect(screen.getByTestId("tech-headline")).not.toHaveTextContent(
      "worst since"
    );
  });

  test("a latest drawdown deeper than any before says 'deepest on record'", async () => {
    const xlk = XLK.map((c, i) =>
      i === XLK.length - 1 ? { ...c, close: 70 } : c
    );
    renderPage(await loaded(xlk));
    expect(screen.getByTestId("tech-headline")).toHaveTextContent(
      "−30.0% from its 52-week high: the deepest on record."
    );
  });

  test("with closes missing: 'Unavailable' and the reason, in each panel, and no chart", async () => {
    const data = await loaded([], SPY);
    const { container } = renderPage(data);
    for (const name of ["Full history", "Since 2004"]) {
      expect(
        within(screen.getByRole("region", { name })).getByText(
          "Unavailable: no closes are stored for XLK."
        )
      ).toBeInTheDocument();
    }
    expect(container.querySelector('[role="img"]')).toBeNull();
    expect(screen.queryByTestId("tech-headline")).toBeNull();
  });
});

describe("drawdownSpec", () => {
  test("a filled area in %, with one annotation per trough plus the latest", async () => {
    const data = await loaded();
    if (!data.ok) throw new Error("expected data");
    const spec = drawdownSpec(data.data.series, data.data, 10);
    expect(spec.data).toHaveLength(1);
    expect(spec.data[0]).toMatchObject({ fill: "tozeroy" });
    expect((spec.data[0].y as number[]).at(-1)).toBeCloseTo(-12);
    expect(spec.layout.yaxis).toMatchObject({ ticksuffix: "%", dtick: 10 });
    expect(spec.layout.yaxis.range[1]).toBe(0);
    const texts = spec.layout.annotations.map((a: { text: string }) => a.text);
    expect(texts).toEqual([
      `−15.0%<br>${dateLabel(day(252))}`,
      `−20.0%<br>${dateLabel(day(256))}`,
      `Latest −12.0%, ${dateLabel(day(258))}`,
    ]);
  });
});
