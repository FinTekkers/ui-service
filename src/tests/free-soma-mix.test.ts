/**
 * US-365: /free/soma's Maturity mix over time. Its own Position/Search for
 * every week (TRADE_DATE × PRODUCT_TYPE × MATURITY_DATE, DIRECTED_QUANTITY),
 * started once Holdings over time's unchanged one settles, bucketed by remaining
 * maturity at each H.4.1 Wednesday and read off at each quarter's last
 * week. It is streamed: the rest of the page never waits for it. Both
 * whole-history results are cached per process, keyed by the latest SOMA
 * trade date, and only computed results are cached.
 *
 * On the recorded 2026-11-18 search (fixtures/soma-2026-11-18.ts) the
 * reference weeks match the item's independently computed figures.
 *
 * The position search is stubbed; the e2e spec covers the real backend.
 */
import { render, screen, within } from "@testing-library/svelte";
import { tick } from "svelte";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({ searchPositions: vi.fn() }));

vi.mock("$lib/positions", () => ({ searchPositions: mocks.searchPositions }));

import type { QueryPositionRequestProto } from "@fintekkers/ledger-models/node/fintekkers/requests/position/query_position_request_pb";
import {
  FieldMapEntry,
  MeasureMapEntry,
} from "@fintekkers/ledger-models/node/fintekkers/models/position/position_util_pb.js";
import position_pkg from "@fintekkers/ledger-models/node/fintekkers/models/position/position_pb.js";
import field_pkg from "@fintekkers/ledger-models/node/fintekkers/models/position/field_pb.js";
import measure_pkg from "@fintekkers/ledger-models/node/fintekkers/models/position/measure_pb.js";
import { ProductTypeProto } from "@fintekkers/ledger-models/node/fintekkers/models/security/product_type_pb.js";
import { Position } from "@fintekkers/ledger-models/node/wrappers/models/position/position";
import { pack } from "@fintekkers/ledger-models/node/wrappers/models/utils/serialization.util";
import { toDecimalProto } from "$lib/decimal";
import {
  SOMA_MIX_BUCKETS,
  SOMA_MIX_RANGES,
  mixWindow,
  type Section,
  type SomaHistoryView,
  type SomaMixView,
  type SomaPageWithHistory,
} from "$lib/free/soma";
import { somaMixSpec } from "$lib/free/charts";
import {
  SOMA_FIELDS,
  SOMA_HISTORY_FIELDS,
  SOMA_HISTORY_TIMEOUT_MS,
  SOMA_MIX_FIELDS,
  SOMA_POSITION_FIELDS,
  SOMA_PROBE_FIELDS,
  resetSomaCaches,
  somaHistory,
  somaMixTreasuryRows,
} from "$lib/server/free-soma";
import { SOMA_LATEST_PROBE_MS } from "$lib/server/soma-cache";
import {
  somaMixView,
  somaMixWeeks,
  type SomaMixRow,
  type SomaMixWeeks,
} from "$lib/server/soma-mix";
import { load as loadSoma } from "../routes/free/soma/+page.server";
import { load as loadFree } from "../routes/free/+page.server";
import SomaPage from "../routes/free/soma/+page.svelte";
import SomaMaturityMix from "../components/free/soma/SomaMaturityMix.svelte";
import {
  AS_OF as HISTORY_AS_OF,
  FINE_POSITIONS,
  HISTORY_POSITIONS,
  HISTORY_ROWS,
  PRIOR_POSITIONS,
} from "./fixtures/soma-2026-11-04";
import { MIX_POSITIONS, MIX_REFERENCE } from "./fixtures/soma-2026-11-18";
import historyBefore from "./fixtures/soma-2026-11-04.history-view-before.json";

const { FieldProto } = field_pkg;
const { MeasureProto } = measure_pkg;

const SENTINEL = "sentinel-homepage-key-365";
// A Thursday: the latest H.4.1 week, 2026-11-04, is the day before.
const NOW = new Date("2026-11-05T15:00:00Z");
const unavailable = (label: string) => ({
  ok: false as const,
  message: `Unavailable for ${label}: the live SOMA holdings could not be loaded.`,
});

type Load = (event: { url: URL }) => Promise<SomaPageWithHistory>;

function call(
  href = "/free/soma",
  load: Load = loadSoma
): Promise<SomaPageWithHistory> {
  return load({ url: new URL(href, "http://localhost") });
}

type Kind = "week" | "prior" | "history" | "mix" | "probe";

function kindOf(request: QueryPositionRequestProto): Kind {
  const fields = JSON.stringify(request.getFieldsList());
  if (fields === JSON.stringify(SOMA_POSITION_FIELDS)) return "week";
  if (fields === JSON.stringify(SOMA_FIELDS)) return "prior";
  if (fields === JSON.stringify(SOMA_HISTORY_FIELDS)) return "history";
  if (fields === JSON.stringify(SOMA_MIX_FIELDS)) return "mix";
  if (fields === JSON.stringify(SOMA_PROBE_FIELDS)) return "probe";
  throw new Error(`unexpected search ${fields}`);
}

/** How many of each search were made. */
function counts(): Record<Kind, number> {
  const out = { week: 0, prior: 0, history: 0, mix: 0, probe: 0 };
  for (const [request] of mocks.searchPositions.mock.calls) {
    out[kindOf(request)]++;
  }
  return out;
}

const localDate = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
};

/** A mix row as the broker returns it: the dates packed, PRODUCT_TYPE as
 * its enum value, DIRECTED_QUANTITY signed. */
function mixPositionOf(r: SomaMixRow): Position {
  const fields: FieldMapEntry[] = [
    new FieldMapEntry()
      .setField(FieldProto.PRODUCT_TYPE)
      .setEnumValue(
        (ProductTypeProto as unknown as Record<string, number>)[r.productType]
      ),
  ];
  for (const [field, iso] of [
    [FieldProto.TRADE_DATE, r.tradeDate],
    [FieldProto.MATURITY_DATE, r.maturityDate],
  ] as const) {
    if (iso) {
      fields.push(
        new FieldMapEntry()
          .setField(field)
          .setFieldValuePacked(pack(localDate(iso)))
      );
    }
  }
  const measures = r.directedQuantity
    ? [
        new MeasureMapEntry()
          .setMeasure(MeasureProto.DIRECTED_QUANTITY)
          .setMeasureDecimalValue(toDecimalProto(r.directedQuantity)),
      ]
    : [];
  return new Position(
    new position_pkg.PositionProto()
      .setFieldsList(fields)
      .setMeasuresList(measures)
  );
}

/** The probe's answer: one row per trade date. */
function datesPositions(dates: string[]): Position[] {
  return dates.map((iso) =>
    mixPositionOf({
      tradeDate: iso,
      maturityDate: null,
      productType: "TBILL",
      directedQuantity: "1",
    })
  );
}

const mixRow = (
  tradeDate: string | null,
  productType: string,
  maturityDate: string | null,
  directedQuantity: string | null
): SomaMixRow => ({ tradeDate, productType, maturityDate, directedQuantity });

const HISTORY_LATEST = HISTORY_ROWS.map((r) => r.tradeDate as string)
  .sort()
  .pop() as string;

/** A small mix history, 2024-11-13 to the latest history trade date. */
const SMALL_MIX: SomaMixRow[] = [
  mixRow("2024-11-13", "TBILL", "2025-02-13", "100000000000"),
  mixRow("2024-11-13", "CURRENCY", null, "-99000000000"),
  mixRow("2024-11-13", "TREASURY_NOTE", "2030-11-15", "300000000000"),
  mixRow("2025-02-13", "TBILL", "2025-02-13", "-100000000000"),
  mixRow("2025-06-04", "TREASURY_BOND", "2050-05-15", "200000000000"),
  mixRow(HISTORY_LATEST, "TBILL", "2027-01-28", "50000000000"),
];

interface Answers {
  history?: () => Promise<Position[]>;
  mix?: () => Promise<Position[]>;
  probe?: () => Promise<Position[]>;
}

/** Each search answered: the recorded week and history, the small mix and
 * a probe naming the history's latest trade date, unless overridden. */
function respond(answers: Answers = {}) {
  const history = answers.history ?? (async () => HISTORY_POSITIONS);
  const mix = answers.mix ?? (async () => SMALL_MIX.map(mixPositionOf));
  const probe = answers.probe ?? (async () => datesPositions([HISTORY_LATEST]));
  mocks.searchPositions.mockImplementation(
    async (request: QueryPositionRequestProto) => {
      switch (kindOf(request)) {
        case "week":
          return FINE_POSITIONS;
        case "prior":
          return PRIOR_POSITIONS;
        case "history":
          return history();
        case "mix":
          return mix();
        case "probe":
          return probe();
      }
    }
  );
}

/** Fakes setTimeout too: beforeEach fakes Date only. */
function fakeTimers(now: Date = NOW) {
  vi.useRealTimers();
  vi.useFakeTimers({ toFake: ["Date", "setTimeout", "clearTimeout"] });
  vi.setSystemTime(now);
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(NOW);
  resetSomaCaches();
  mocks.searchPositions.mockReset();
  vi.spyOn(console, "log").mockImplementation(() => undefined);
  process.env.FT_HOMEPAGE_API_KEY = SENTINEL;
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  delete process.env.FT_HOMEPAGE_API_KEY;
});

async function mixOf(data: SomaPageWithHistory): Promise<SomaMixView> {
  const mix = await (data.streamed.mix as Promise<Section<SomaMixView>>);
  if (!mix.ok) throw new Error(mix.message);
  return mix.data;
}

describe("somaMixWeeks", () => {
  test("metric 1: 3 securities over 2 weeks give exact shares and par-weighted years; a security drops out on its maturity date", () => {
    const mix = somaMixWeeks(
      somaMixTreasuryRows([
        // Matures on week 2: in week 1, gone from week 2 with no
        // MATURATION row.
        mixRow("2026-01-07", "TBILL", "2026-01-14", "100"),
        // Exactly 3 years from week 1: the 1–3 bucket includes its edge.
        mixRow("2026-01-07", "TREASURY_NOTE", "2029-01-07", "300"),
        // A day over 20 years from week 2.
        mixRow("2026-01-14", "TREASURY_BOND", "2046-01-15", "600"),
        mixRow("2026-01-07", "CURRENCY", null, "-400"),
        // Zero par: skipped, whatever it lacks.
        mixRow("2026-01-07", "TBILL", null, "0"),
      ]),
      "2026-01-14"
    );
    expect(mix).toEqual({
      badFrom: null,
      weeks: [
        {
          week: "2026-01-07",
          shares: [25, 75, 0, 0, 0, 0],
          // (100 × 7 + 300 × 1,096 days) ÷ 400 ÷ 365.25 = 2.2553…
          avgYears: 2.26,
        },
        {
          week: "2026-01-14",
          shares: [0, 33.33, 0, 0, 0, 66.67],
          // (300 × 1,089 + 600 × 7,306 days) ÷ 900 ÷ 365.25 = 14.3290…
          avgYears: 14.33,
        },
      ],
    });
  });

  test("a row with no maturity leaves out the weeks from its trade date on; one with no trade date leaves out every week", () => {
    const rows = [
      mixRow("2026-01-07", "TBILL", "2026-06-01", "100"),
      mixRow("2026-01-21", "TBILL", null, "5"),
    ];
    const mix = somaMixWeeks(rows, "2026-02-04") as SomaMixWeeks;
    expect(mix.badFrom).toBe("2026-01-21");
    expect(mix.weeks.map((w) => w.week)).toEqual(["2026-01-07", "2026-01-14"]);
    expect(
      somaMixWeeks(
        [...rows, mixRow(null, "TBILL", "2026-06-01", "1")],
        "2026-02-04"
      )
    ).toBeNull();
  });
});

describe("somaMixView", () => {
  // Every Wednesday from 2025-01-01 to 2026-02-04, under-1 share 20% and 9
  // years, except the weeks below.
  const special: Record<string, [number, number]> = {
    "2025-03-19": [0.5, 9], // not Q1's last week
    "2025-03-26": [18, 9.4], // Q1's last week
    "2025-09-17": [1, 9], // not Q3's last week
    "2025-09-24": [5, 9], // Q3's last week
    "2026-02-04": [26.5, 8.2], // the page's week
  };
  const weeks: SomaMixWeeks = { badFrom: null, weeks: [] };
  for (
    let ms = Date.parse("2025-01-01");
    ms <= Date.parse("2026-02-11");
    ms += 7 * 86_400_000
  ) {
    const week = new Date(ms).toISOString().slice(0, 10);
    const [u, years] = special[week] ?? [20, 9];
    weeks.weeks.push({
      week,
      shares: [u, 100 - u, 0, 0, 0, 0],
      avgYears: years,
    });
  }

  test("metric 4: each bar is its quarter's last week on or before the page's week, and the three cards read off those bars", () => {
    const view = somaMixView(weeks, "2026-02-04") as SomaMixView;
    expect(view.points.map((p) => [p.quarter, p.week])).toEqual([
      ["2025Q1", "2025-03-26"],
      ["2025Q2", "2025-06-25"],
      ["2025Q3", "2025-09-24"],
      ["2025Q4", "2025-12-31"],
      ["2026Q1", "2026-02-04"],
    ]);
    expect(view.firstQuarter).toBe("2025Q1");
    expect(view.latest).toEqual({
      week: "2026-02-04",
      under1: 26.5,
      avgYears: 8.2,
    });
    expect(view.findings).toEqual([
      {
        figure: "+8.5 pp",
        title: "Under-1-year share, past year",
        body: "From 18.0% on Mar 26, 2025 to 26.5% on Feb 4, 2026.",
      },
      {
        figure: "8.2 vs 9.4 yrs",
        title: "Average maturity, now vs a year ago",
        body: "Par-weighted average remaining maturity: 8.2 yrs on Feb 4, 2026, 9.4 yrs on Mar 26, 2025.",
      },
      {
        figure: "5.0%",
        title: "Lowest under-1-year share",
        body: "2025Q3, the week of Sep 24, 2025: the least of any quarter since 2025Q1.",
      },
    ]);
  });

  test("metric 4: an early week gives the bars there are, and the year-ago cards say there is not enough history", () => {
    const mix = somaMixWeeks(
      [mixRow("2004-05-19", "TBILL", "2004-12-30", "100")],
      "2004-08-18"
    ) as SomaMixWeeks;
    const view = somaMixView(mix, "2004-08-18") as SomaMixView;
    expect(view.points.map((p) => [p.quarter, p.week])).toEqual([
      ["2004Q2", "2004-06-30"],
      ["2004Q3", "2004-08-18"],
    ]);
    for (const range of SOMA_MIX_RANGES) {
      expect(mixWindow(view, range)).toHaveLength(2);
    }
    const [change, average, lowest] = view.findings;
    for (const card of [change, average]) {
      expect(card.figure).toBe("Not enough history");
      expect(card.body).toBe(
        "Needs a bar a year before 2004Q3; the bars start 2004Q2."
      );
    }
    expect(lowest.figure).toBe("100.0%");
    expect(JSON.stringify(view)).not.toMatch(/NaN|Infinity|null/);
  });

  test("a week before the first one has no mix", () => {
    expect(somaMixView(weeks, "2024-12-25")).toBeNull();
  });
});

describe("Maturity mix over time on the recorded 2026-11-18 search", () => {
  // The Thursday after the recorded week.
  const AFTER = new Date("2026-11-19T15:00:00Z");

  test("metric 2: the server load matches the reference weeks to 0.2 pp under 1 yr and 0.05 yrs", async () => {
    vi.setSystemTime(AFTER);
    respond({ mix: async () => MIX_POSITIONS });
    for (const [week, ref] of Object.entries(MIX_REFERENCE)) {
      const view = await mixOf(await call(`/free/soma?asOf=${week}`));
      expect(view.latest.week, week).toBe(week);
      expect(
        Math.abs(view.latest.under1 - ref.under1),
        week
      ).toBeLessThanOrEqual(0.2);
      expect(
        Math.abs(view.latest.avgYears - ref.avgYears),
        week
      ).toBeLessThanOrEqual(0.05);
    }
    // One search for all four weeks: each is cut from the cached mix.
    expect(counts().mix).toBe(1);
  });

  test("metric 3: 1Y shows 5 bars, 5Y 21 and All every quarter from 2004Q2 to 2026Q4; each bar sums to 100%", async () => {
    vi.setSystemTime(AFTER);
    respond({ mix: async () => MIX_POSITIONS });
    const view = await mixOf(await call("/free/soma"));
    const [oneYear, fiveYear, all] = SOMA_MIX_RANGES.map((r) =>
      mixWindow(view, r)
    );
    expect(oneYear).toHaveLength(5);
    expect(fiveYear).toHaveLength(21);
    expect(all).toHaveLength(91);
    expect(all[0].quarter).toBe("2004Q2");
    expect(view.firstQuarter).toBe("2004Q2");
    for (const w of [oneYear, fiveYear, all]) {
      expect(w[w.length - 1]).toMatchObject({
        quarter: "2026Q4",
        week: "2026-11-18",
      });
    }
    // Every quarter, in order, none missing.
    const quarters = all.map((p) => p.quarter);
    for (let i = 1; i < quarters.length; i++) {
      const [y, q] = quarters[i - 1].split("Q").map(Number);
      expect(quarters[i]).toBe(q === 4 ? `${y + 1}Q1` : `${y}Q${q + 1}`);
    }
    for (const p of all) {
      const sum = p.shares.reduce((a, s) => a + s, 0);
      expect(Math.abs(sum - 100), p.quarter).toBeLessThanOrEqual(0.1);
    }
    // The chart plots the window's bars, one per bucket, plus the line.
    const spec = somaMixSpec(oneYear);
    expect(spec.data[0].x).toEqual(oneYear.map((p) => p.week));
    expect(spec.layout.yaxis2.range).toEqual([0, 12]);
  });

  test("guardrail: the browser gets quarters, shares and years only", async () => {
    vi.setSystemTime(AFTER);
    respond({ mix: async () => MIX_POSITIONS });
    const view = await mixOf(await call("/free/soma"));
    const wire = JSON.parse(JSON.stringify(view));
    expect(Object.keys(wire).sort()).toEqual([
      "findings",
      "firstQuarter",
      "latest",
      "points",
    ]);
    expect(Object.keys(wire.latest).sort()).toEqual([
      "avgYears",
      "under1",
      "week",
    ]);
    for (const p of wire.points) {
      expect(Object.keys(p).sort()).toEqual([
        "avgYears",
        "quarter",
        "shares",
        "week",
      ]);
      expect(p.shares).toHaveLength(SOMA_MIX_BUCKETS.length);
      for (const s of p.shares) expect(typeof s).toBe("number");
    }
    for (const f of wire.findings) {
      expect(Object.keys(f).sort()).toEqual(["body", "figure", "title"]);
    }
  });
});

describe("Holdings over time, read through the cache", () => {
  const before = historyBefore.views as Record<string, SomaHistoryView>;
  const EARLIER = "2025-06-04";

  test("guardrail: somaHistory's output is unchanged, and an earlier week cut from the cached history equals its own search's", async () => {
    expect(somaHistory(HISTORY_ROWS, HISTORY_AS_OF)).toEqual(
      before[HISTORY_AS_OF]
    );
    respond();
    expect(await (await call("/free/soma")).streamed.history).toEqual({
      ok: true,
      data: before[HISTORY_AS_OF],
    });
    mocks.searchPositions.mockClear();
    const data = await call(`/free/soma?asOf=${EARLIER}`);
    expect(await data.streamed.history).toEqual({
      ok: true,
      data: before[EARLIER],
    });
    expect(counts()).toMatchObject({ history: 0, mix: 0, probe: 0 });
  });

  test("guardrail: an unusable row after the picked week leaves its holdings and mix intact; one on or before it makes both unavailable", async () => {
    const bad = (rows: Position[]) => async () => rows;
    const badTrade = new position_pkg.PositionProto().setFieldsList([
      new FieldMapEntry()
        .setField(FieldProto.PRODUCT_TYPE)
        .setEnumValue(ProductTypeProto.TBILL),
      new FieldMapEntry()
        .setField(FieldProto.TRADE_DATE)
        .setFieldValuePacked(pack(localDate("2026-01-07"))),
    ]);
    respond({
      history: bad([...HISTORY_POSITIONS, new Position(badTrade)]),
      mix: bad([
        ...SMALL_MIX.map(mixPositionOf),
        mixPositionOf(mixRow("2026-01-07", "TBILL", null, "5")),
      ]),
    });
    const picked = await call(`/free/soma?asOf=${EARLIER}`);
    expect(await picked.streamed.history).toEqual({
      ok: true,
      data: before[EARLIER],
    });
    expect((await mixOf(picked)).latest.week).toBe(EARLIER);

    const after = await call("/free/soma?asOf=2026-02-04");
    expect(await after.streamed.history).toEqual(unavailable("Feb 4, 2026"));
    expect(await after.streamed.mix).toEqual(unavailable("Feb 4, 2026"));
  });
});

describe("streaming (metric 5)", () => {
  test("a mix search taking 5 s leaves the page and the holdings resolved and the mix pending; then it arrives", async () => {
    fakeTimers();
    respond({
      mix: () =>
        new Promise((resolve) =>
          setTimeout(() => resolve(SMALL_MIX.map(mixPositionOf)), 5_000)
        ),
    });
    const data = await call();
    expect(data.snapshot.ok && data.findings.ok && data.positions.ok).toBe(
      true
    );
    let mix: Section<SomaMixView> | "pending" = "pending";
    data.streamed.mix?.then((m) => (mix = m));
    await vi.advanceTimersByTimeAsync(0);
    expect((await data.streamed.history).ok).toBe(true);
    expect(mix).toBe("pending");
    await vi.advanceTimersByTimeAsync(5_000);
    expect(mix).toMatchObject({ ok: true });
  });

  test("a failing mix search says unavailable; the holdings and the rest still load", async () => {
    respond({ mix: () => Promise.reject(new Error("14 UNAVAILABLE")) });
    for (const load of [loadSoma, loadFree]) {
      resetSomaCaches();
      const data = await call(undefined, load);
      expect(data.snapshot.ok && data.positions.ok).toBe(true);
      expect((await data.streamed.history).ok).toBe(true);
      expect(await data.streamed.mix).toEqual(unavailable("Nov 4, 2026"));
    }
  });

  test("a mix search that never answers is unavailable after SOMA_HISTORY_TIMEOUT_MS, and the next load searches again", async () => {
    fakeTimers();
    respond({ mix: () => new Promise<Position[]>(() => undefined) });
    const data = await call();
    expect((await data.streamed.history).ok).toBe(true);
    let mix: Section<SomaMixView> | "pending" = "pending";
    data.streamed.mix?.then((m) => (mix = m));
    await vi.advanceTimersByTimeAsync(SOMA_HISTORY_TIMEOUT_MS - 1);
    expect(mix).toBe("pending");
    await vi.advanceTimersByTimeAsync(1);
    expect(mix).toEqual(unavailable("Nov 4, 2026"));

    respond();
    const next = await call();
    expect((await next.streamed.mix)?.ok).toBe(true);
    expect(counts()).toMatchObject({ history: 1, mix: 2 });
  });

  test("with no key, neither search is made and the mix says unavailable", async () => {
    delete process.env.FT_HOMEPAGE_API_KEY;
    respond();
    const data = await call();
    expect(mocks.searchPositions).not.toHaveBeenCalled();
    expect(await data.streamed.mix).toEqual(unavailable("Nov 4, 2026"));
  });

  test("page isolation: with the mix pending, then unavailable, every other section renders", async () => {
    respond();
    const data = await call();
    const history = await data.streamed.history;
    const headings = (container: HTMLElement) =>
      [...container.querySelectorAll("h2")].map((h) => h.textContent?.trim());
    const section = (container: HTMLElement) =>
      container.querySelector(
        'section[aria-labelledby="mix-title"]'
      ) as HTMLElement;

    const pending = render(SomaPage, {
      props: {
        data: {
          ...data,
          streamed: {
            history: Promise.resolve(history),
            mix: new Promise<Section<SomaMixView>>(() => undefined),
          },
        },
      },
    });
    await tick();
    await tick();
    expect(headings(pending.container)).toEqual([
      "What is the Federal Reserve SOMA?",
      "Federal Reserve SOMA Holdings",
      "What the portfolio is telling us",
      "When the holdings come due",
      "Holdings over time",
      "Maturity mix over time",
      "Positions by CUSIP",
      "Pull SOMA data from the API",
    ]);
    expect(section(pending.container).textContent).toContain(
      "Loading maturity mix for Nov 4, 2026…"
    );
    expect(
      pending.container.querySelector("[data-testid=hist-plot]")
    ).not.toBeNull();
    pending.unmount();

    const failed = render(SomaPage, {
      props: {
        data: {
          ...data,
          streamed: {
            history: Promise.resolve(history),
            mix: Promise.resolve(unavailable("Nov 4, 2026")),
          },
        },
      },
    });
    await tick();
    await tick();
    expect(section(failed.container).textContent).toContain(
      "Unavailable for Nov 4, 2026"
    );
    expect(failed.container.querySelector("[data-testid=mix-plot]")).toBeNull();
    expect(
      failed.container.querySelector("[data-testid=hist-plot]")
    ).not.toBeNull();
    expect(
      within(failed.container).getByRole("region", {
        name: "Positions by CUSIP",
      })
    ).toBeTruthy();
  });
});

describe("the cache (metric 6)", () => {
  test("two loads, and two concurrent ones, for the same latest week make each whole-history search once", async () => {
    respond();
    await Promise.all(
      [call(), call("/free", loadFree)].map(async (p) => {
        const data = await p;
        await data.streamed.history;
        await data.streamed.mix;
      })
    );
    expect(counts()).toMatchObject({ history: 1, mix: 1, probe: 0 });
    const again = await call();
    expect((await again.streamed.history).ok).toBe(true);
    expect((await again.streamed.mix)?.ok).toBe(true);
    // An earlier week is cut from the same results.
    const earlier = await call("/free/soma?asOf=2025-06-04");
    expect((await earlier.streamed.mix)?.ok).toBe(true);
    expect(counts()).toMatchObject({ history: 1, mix: 1, probe: 0 });
  });

  test("a newer week, found by one probe, recomputes each once, however many loads ask at the same time", async () => {
    respond();
    await (
      await call()
    ).streamed.mix;
    // Still the same week after the check window: one probe, no search.
    vi.setSystemTime(NOW.getTime() + SOMA_LATEST_PROBE_MS + 1);
    await (
      await call()
    ).streamed.mix;
    expect(counts()).toMatchObject({ history: 1, mix: 1, probe: 1 });

    // The Friday load: trades for 2026-11-11.
    const extra = mixRow("2026-11-11", "TBILL", "2027-02-11", "7000000000");
    const NEXT = new Date("2026-11-13T15:00:00Z");
    vi.setSystemTime(NEXT);
    respond({
      // A TBILL trade row: somaTradeRowOf reads it as a BUY-like row.
      history: async () => [...HISTORY_POSITIONS, mixPositionOf(extra)],
      mix: async () => [...SMALL_MIX, extra].map(mixPositionOf),
      probe: async () => datesPositions([HISTORY_LATEST, "2026-11-11"]),
    });
    mocks.searchPositions.mockClear();
    const loads = await Promise.all([call(), call(), call()]);
    for (const data of loads) {
      expect((await data.streamed.mix)?.ok).toBe(true);
      expect((await data.streamed.history).ok).toBe(true);
    }
    expect(counts()).toMatchObject({ history: 1, mix: 1, probe: 1 });
    const view = await mixOf(loads[0]);
    expect(view.latest.week).toBe("2026-11-11");

    // Cached again for the new week.
    await (
      await call()
    ).streamed.mix;
    expect(counts()).toMatchObject({ history: 1, mix: 1, probe: 1 });
  });

  test("a failed probe serves the cached results with no search, and the next window checks again", async () => {
    respond();
    await (
      await call()
    ).streamed.mix;
    respond({ probe: () => Promise.reject(new Error("14 UNAVAILABLE")) });
    mocks.searchPositions.mockClear();
    vi.setSystemTime(NOW.getTime() + SOMA_LATEST_PROBE_MS + 1);
    const data = await call();
    expect((await data.streamed.history).ok).toBe(true);
    expect((await data.streamed.mix)?.ok).toBe(true);
    // One probe, shared by both caches; no whole-history search.
    expect(counts()).toMatchObject({ history: 0, mix: 0, probe: 1 });
    await (
      await call()
    ).streamed.mix;
    expect(counts().probe).toBe(1);

    respond();
    vi.setSystemTime(NOW.getTime() + 2 * (SOMA_LATEST_PROBE_MS + 1));
    await (
      await call()
    ).streamed.mix;
    expect(counts()).toMatchObject({ history: 0, mix: 0, probe: 2 });
  });

  test("a failed mix is not cached: the next load searches for the mix again, and not the cached holdings", async () => {
    let fail = true;
    respond({
      mix: async () => {
        if (fail) throw new Error("14 UNAVAILABLE");
        return SMALL_MIX.map(mixPositionOf);
      },
    });
    const first = await call();
    expect((await first.streamed.history).ok).toBe(true);
    expect(await first.streamed.mix).toEqual(unavailable("Nov 4, 2026"));
    fail = false;
    const second = await call();
    expect((await second.streamed.mix)?.ok).toBe(true);
    expect(counts()).toMatchObject({ history: 1, mix: 2, probe: 0 });
    await (
      await call()
    ).streamed.mix;
    expect(counts()).toMatchObject({ history: 1, mix: 2, probe: 0 });
  });

  test("on a cold cache the holdings search starts before the mix's, after the week's two", async () => {
    respond();
    await (
      await call()
    ).streamed.mix;
    expect(mocks.searchPositions.mock.calls.map(([r]) => kindOf(r))).toEqual([
      "week",
      "prior",
      "history",
      "mix",
    ]);
    for (const [, key] of mocks.searchPositions.mock.calls) {
      expect(key).toBe(SENTINEL);
    }
  });
});

describe("SomaMaturityMix", () => {
  const view = somaMixView(
    somaMixWeeks(somaMixTreasuryRows(SMALL_MIX), "2026-11-04") as SomaMixWeeks,
    "2026-11-04"
  ) as SomaMixView;

  test("loading, unavailable, then the switch, the Latest line and three cards", async () => {
    const loading = render(SomaMaturityMix, {
      props: { mix: null, asOfLabel: "Nov 4, 2026" },
    });
    expect(loading.container.textContent).toContain(
      "Loading maturity mix for Nov 4, 2026…"
    );
    loading.unmount();

    const failed = render(SomaMaturityMix, {
      props: { mix: unavailable("Nov 4, 2026"), asOfLabel: "Nov 4, 2026" },
    });
    expect(failed.container.textContent).toContain(
      "Unavailable for Nov 4, 2026"
    );
    expect(failed.container.querySelector("[data-testid=mix-plot]")).toBeNull();
    failed.unmount();

    const { container } = render(SomaMaturityMix, {
      props: { mix: { ok: true, data: view }, asOfLabel: "Nov 4, 2026" },
    });
    const buttons = within(container).getAllByRole("button");
    expect(buttons.map((b) => b.textContent)).toEqual(["1Y", "5Y", "All"]);
    expect(buttons[2]).toHaveAttribute("aria-pressed", "true");
    expect(
      screen.getByText(/^Latest: /).textContent?.replace(/\s+/g, " ")
    ).toBe(
      `Latest: ${view.latest.under1.toFixed(
        1
      )}% under 1 yr, average maturity ${view.latest.avgYears.toFixed(
        1
      )} yrs, on Nov 4, 2026`
    );
    expect(screen.getByTestId("mix-plot")).toHaveAccessibleName(
      /^Maturity mix over time, All: .* from 2024Q4 to 2026Q4/
    );
    await buttons[0].click();
    await tick();
    expect(buttons[0]).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByTestId("mix-plot")).toHaveAccessibleName(
      /^Maturity mix over time, 1Y: .* from 2025Q4 to 2026Q4/
    );
    expect(container.querySelectorAll(".finding")).toHaveLength(3);
    const text = container.textContent?.replace(/\s+/g, " ");
    expect(text).toContain("Par, excluding inflation compensation.");
    expect(text).toContain(
      "Treasuries only: bills, notes, bonds, TIPS and FRNs."
    );
    expect(text).toContain("Source: the Fintekkers ledger.");
  });
});
