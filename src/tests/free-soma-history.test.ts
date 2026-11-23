/**
 * US-317: /free/soma's Holdings over time. One Position/Search for every
 * week (TRADE_DATE × TRANSACTION_TYPE × PRODUCT_TYPE, DIRECTED_QUANTITY),
 * cash legs dropped, summed cumulatively and read off at each H.4.1
 * Wednesday, stacked by type. On the recorded 2026-11-04 search
 * (fixtures/soma-2026-11-04.ts) the totals equal soma.prove_positions'
 * ledger par, which matched the NY Fed feed. 1Y, 5Y and All end at the
 * page's week; a range the ledger can't fill is disabled with a note. The
 * search is streamed: the rest of the page never waits for it, and a
 * failed, slow or keyless one says unavailable, with no mock.
 *
 * The position search is stubbed; the e2e spec covers the real backend.
 */
import { fireEvent, render, screen, within } from "@testing-library/svelte";
import { tick } from "svelte";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import Decimal from "decimal.js";
import { readFileSync } from "node:fs";
import path from "node:path";

const mocks = vi.hoisted(() => ({ searchPositions: vi.fn() }));

vi.mock("$lib/positions", () => ({ searchPositions: mocks.searchPositions }));

import type { QueryPositionRequestProto } from "@fintekkers/ledger-models/node/fintekkers/requests/position/query_position_request_pb";
import {
  FieldMapEntry,
  MeasureMapEntry,
  PositionFilterOperator,
} from "@fintekkers/ledger-models/node/fintekkers/models/position/position_util_pb.js";
import position_pkg from "@fintekkers/ledger-models/node/fintekkers/models/position/position_pb.js";
import field_pkg from "@fintekkers/ledger-models/node/fintekkers/models/position/field_pb.js";
import measure_pkg from "@fintekkers/ledger-models/node/fintekkers/models/position/measure_pb.js";
import { ProductTypeProto } from "@fintekkers/ledger-models/node/fintekkers/models/security/product_type_pb.js";
import { TransactionTypeProto } from "@fintekkers/ledger-models/node/fintekkers/models/transaction/transaction_type_pb.js";
import { Position } from "@fintekkers/ledger-models/node/wrappers/models/position/position";
import { pack } from "@fintekkers/ledger-models/node/wrappers/models/utils/serialization.util";
import { toDecimalProto } from "$lib/decimal";
import {
  SOMA_HISTORY_LABEL,
  SOMA_RANGES,
  SOMA_STACKS,
  SOMA_STACK_COLORS,
  SOMA_STACK_LABELS,
  nearestWeek,
  rangeWindow,
  somaXTicks,
  weekLabel,
  weekTooltip,
  type Section,
  type SomaHistoryView,
  type SomaPageWithHistory,
  type SomaXTick,
} from "$lib/free/soma";
import {
  SOMA_HISTORY_FIELDS,
  SOMA_HISTORY_TIMEOUT_MS,
  SOMA_POSITION_FIELDS,
  SOMA_FIELDS,
  fetchSomaHistory,
  somaHistory,
  somaPositions,
  type SomaTradeRow,
} from "$lib/server/free-soma";
import { load as loadSoma } from "../routes/free/soma/+page.server";
import { load as loadFree } from "../routes/free/+page.server";
import SomaHistory from "../components/free/soma/SomaHistory.svelte";
import SomaPage from "../routes/free/soma/+page.svelte";
import {
  AS_OF,
  FINE_POSITIONS,
  FINE_ROWS,
  HISTORY_PAR,
  HISTORY_POSITIONS,
  HISTORY_ROWS,
  LEDGER_PAR,
  PRIOR_POSITIONS,
} from "./fixtures/soma-2026-11-04";

const { PositionTypeProto } = position_pkg;
const { FieldProto } = field_pkg;
const { MeasureProto } = measure_pkg;

const SENTINEL = "sentinel-homepage-key-317";
// A Thursday: the latest H.4.1 week, 2026-11-04, is the day before.
const NOW = new Date("2026-11-05T15:00:00Z");
const UNAVAILABLE =
  "Unavailable for Nov 4, 2026: the live SOMA holdings could not be loaded.";

const LOADS = [
  ["/free/soma", loadSoma],
  ["/free", loadFree],
] as const;

type Load = (event: { url: URL }) => Promise<SomaPageWithHistory>;

function call(load: Load, href: string): Promise<SomaPageWithHistory> {
  return load({ url: new URL(href, "http://localhost") });
}

const isHistory = (request: QueryPositionRequestProto) =>
  request.getFieldsList().includes(FieldProto.TRADE_DATE);

/** The recorded week's three searches, each answered from its recording;
 * `history` overrides Holdings over time's answer. */
function respond(
  history: () => Promise<Position[]> = async () => HISTORY_POSITIONS
) {
  mocks.searchPositions.mockImplementation(
    async (request: QueryPositionRequestProto) => {
      if (isHistory(request)) return history();
      return request.getFieldsList().length === SOMA_POSITION_FIELDS.length
        ? FINE_POSITIONS
        : PRIOR_POSITIONS;
    }
  );
}

/** A trade row as the broker returns it: TRADE_DATE packed, the enums as
 * enum values, DIRECTED_QUANTITY signed. */
function tradePositionOf(r: SomaTradeRow): Position {
  const enumOf = (names: object, name: string) =>
    (names as Record<string, number>)[name];
  const fields: FieldMapEntry[] = [
    new FieldMapEntry()
      .setField(FieldProto.TRANSACTION_TYPE)
      .setEnumValue(enumOf(TransactionTypeProto, r.transactionType)),
    new FieldMapEntry()
      .setField(FieldProto.PRODUCT_TYPE)
      .setEnumValue(enumOf(ProductTypeProto, r.productType)),
  ];
  if (r.tradeDate) {
    const [y, m, d] = r.tradeDate.split("-").map(Number);
    fields.push(
      new FieldMapEntry()
        .setField(FieldProto.TRADE_DATE)
        .setFieldValuePacked(pack(new Date(y, m - 1, d)))
    );
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

/** Rows through the broker's encoding and back, then the series. */
async function historyOf(
  rows: SomaTradeRow[],
  asOf: string
): Promise<Section<SomaHistoryView>> {
  mocks.searchPositions.mockResolvedValue(rows.map(tradePositionOf));
  return fetchSomaHistory(SENTINEL, asOf);
}

const trade = (
  tradeDate: string,
  transactionType: string,
  productType: string,
  directedQuantity: string
): SomaTradeRow => ({
  tradeDate,
  transactionType,
  productType,
  directedQuantity,
});

const sum = (values: string[]) =>
  values.reduce((s, v) => s.plus(v), new Decimal(0));

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(NOW);
  mocks.searchPositions.mockReset();
  vi.spyOn(console, "log").mockImplementation(() => undefined);
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  delete process.env.FT_HOMEPAGE_API_KEY;
});

const RECORDED = somaHistory(HISTORY_ROWS, AS_OF) as SomaHistoryView;

describe("Holdings over time on the recorded 2026-11-04 search", () => {
  test("metric 1: the first, middle and last week's totals equal soma.prove_positions' ledger par to $0.001B", () => {
    const weeks = Object.keys(HISTORY_PAR);
    expect(weeks).toEqual(["2024-11-13", "2025-11-12", "2026-11-04"]);
    const points = RECORDED.points;
    expect(points[0].week).toBe(weeks[0]);
    expect(points).toHaveLength(104);
    expect(points[points.length / 2].week).toBe(weeks[1]);
    expect(points[points.length - 1].week).toBe(weeks[2]);
    for (const week of weeks) {
      const point = points.find((p) => p.week === week);
      const diff = new Decimal(point?.total ?? 0).minus(HISTORY_PAR[week]);
      expect(diff.abs().lessThanOrEqualTo(1e6), week).toBe(true);
    }
  });

  test("metric 1: the latest point equals the Positions by CUSIP par total", () => {
    const positions = somaPositions(FINE_ROWS);
    const tablePar = sum(positions?.rows.map((r) => r.par) ?? []);
    const latest = RECORDED.points[RECORDED.points.length - 1];
    expect(latest.week).toBe(AS_OF);
    expect(latest.total).toBe(tablePar.toFixed());
    expect(latest.total).toBe(sum(Object.values(LEDGER_PAR)).toFixed());
  });

  test("metric 2 (R2): the ledger's MATURATION rows are negative and its cash legs are CURRENCY rows", () => {
    const maturations = HISTORY_ROWS.filter(
      (r) => r.transactionType === "MATURATION"
    );
    expect(maturations.length).toBeGreaterThan(0);
    for (const r of maturations) {
      expect(new Decimal(r.directedQuantity ?? 0).isNegative()).toBe(true);
    }
    const cash = HISTORY_ROWS.filter((r) =>
      ["WITHDRAWAL", "DEPOSIT"].includes(r.transactionType)
    );
    expect(cash.length).toBeGreaterThan(0);
    expect(new Set(cash.map((r) => r.productType))).toEqual(
      new Set(["CURRENCY"])
    );
  });

  test("metric 3 (R2): All starts at the ledger's first trade week, a real holdings week, and 5Y is disabled", () => {
    const first = HISTORY_ROWS.map((r) => r.tradeDate as string).sort()[0];
    expect(first).toBe("2024-11-13");
    expect(RECORDED.firstWeek).toBe(first);
    // Not a backdated seed: the first week already holds the feed's par.
    expect(RECORDED.points[0].total).toBe(HISTORY_PAR[first]);

    const [oneYear, fiveYear, all] = SOMA_RANGES.map((r) =>
      rangeWindow(RECORDED, r, AS_OF)
    );
    expect(oneYear.enabled).toBe(true);
    expect(oneYear.points).toHaveLength(53);
    expect(oneYear.points[0].week).toBe("2025-11-05");
    expect(fiveYear.enabled).toBe(false);
    expect(fiveYear.note).toBe(
      "5Y needs history from Nov 10, 2021. The ledger starts Nov 13, 2024."
    );
    expect(all.enabled).toBe(true);
    expect(all.points[0].week).toBe(RECORDED.firstWeek);
    for (const w of [oneYear, fiveYear, all]) {
      expect(w.points[w.points.length - 1].week).toBe(AS_OF);
    }
  });

  test("metric 4: every week's stacks sum to its total", () => {
    for (const p of RECORDED.points) {
      expect(sum(SOMA_STACKS.map((s) => p.par[s])).toFixed(), p.week).toBe(
        p.total
      );
    }
  });
});

describe("somaHistory", () => {
  test("metric 2: a BUY with its WITHDRAWAL leg plots the BUY's par, then zero from its MATURATION week", async () => {
    const history = await historyOf(
      [
        trade("2026-01-05", "BUY", "TBILL", "100000000"),
        trade("2026-01-05", "WITHDRAWAL", "CURRENCY", "-99500000"),
        // Negative, as the ledger records it (see R2 above).
        trade("2026-01-28", "MATURATION", "TBILL", "-100000000"),
        trade("2026-01-28", "DEPOSIT", "CURRENCY", "100000000"),
      ],
      "2026-02-11"
    );
    if (!history.ok) throw new Error(history.message);
    expect(history.data.points.map((p) => [p.week, p.total])).toEqual([
      ["2026-01-07", "100000000"],
      ["2026-01-14", "100000000"],
      ["2026-01-21", "100000000"],
      ["2026-01-28", "0"],
      ["2026-02-04", "0"],
      ["2026-02-11", "0"],
    ]);
    expect(history.data.points[0].par.bills).toBe("100000000");
  });

  test("metric 4: with two types, each stack equals that type's par and the stacks sum to the total", async () => {
    const history = await historyOf(
      [
        trade("2026-03-02", "BUY", "TBILL", "250000000"),
        trade("2026-03-03", "BUY", "TIPS", "40000000"),
        trade("2026-03-10", "SELL", "TIPS", "-15000000"),
        trade("2026-03-10", "BUY", "TBILL", "5000000"),
      ],
      "2026-03-11"
    );
    if (!history.ok) throw new Error(history.message);
    const par = history.data.points.map((p) => ({
      week: p.week,
      ...p.par,
      total: p.total,
    }));
    expect(par).toEqual([
      {
        week: "2026-03-04",
        bills: "250000000",
        notesBonds: "0",
        tips: "40000000",
        frns: "0",
        total: "290000000",
      },
      {
        week: "2026-03-11",
        bills: "255000000",
        notesBonds: "0",
        tips: "25000000",
        frns: "0",
        total: "280000000",
      },
    ]);
  });

  test("notes, bonds and STRIPS share a stack; FRNs have their own; other types are dropped", () => {
    const view = somaHistory(
      [
        trade("2026-03-04", "BUY", "TREASURY_NOTE", "1"),
        trade("2026-03-04", "BUY", "TREASURY_BOND", "2"),
        trade("2026-03-04", "BUY", "STRIPS", "4"),
        trade("2026-03-04", "BUY", "TREASURY_FRN", "8"),
        trade("2026-03-04", "BUY", "CORP_BOND", "16"),
      ],
      "2026-03-04"
    );
    expect(view?.points).toEqual([
      {
        week: "2026-03-04",
        par: { bills: "0", notesBonds: "7", tips: "0", frns: "8" },
        total: "15",
      },
    ]);
  });

  test.each([
    ["a row with no trade date", { tradeDate: null }],
    ["a row with no quantity", { directedQuantity: null }],
  ])("%s makes the whole series unavailable", (_name, patch) => {
    const rows = [
      trade("2026-03-04", "BUY", "TBILL", "1"),
      { ...trade("2026-03-05", "BUY", "TBILL", "1"), ...patch },
    ];
    expect(somaHistory(rows, "2026-03-11")).toBeNull();
  });

  test("a week before the first trade has no series", () => {
    expect(
      somaHistory([trade("2026-03-05", "BUY", "TBILL", "1")], "2026-03-04")
    ).toBeNull();
    expect(somaHistory([], "2026-03-04")).toBeNull();
  });
});

describe("rangeWindow", () => {
  // Two years of weeks, 2024-11-13 to 2026-11-04.
  const view = RECORDED;

  test("metric 3: each range ends at the page's week; one longer than the ledger's history is disabled", () => {
    const asOf = "2026-06-03";
    for (const range of SOMA_RANGES) {
      const w = rangeWindow(view, range, asOf);
      expect(w.points[w.points.length - 1].week, range.label).toBe(asOf);
    }
    const oneYear = rangeWindow(view, SOMA_RANGES[0], asOf);
    expect(oneYear.points[0].week).toBe("2025-06-04");
    expect(rangeWindow(view, SOMA_RANGES[0], "2025-11-05").enabled).toBe(false);
    expect(rangeWindow(view, SOMA_RANGES[0], "2025-11-12").enabled).toBe(true);
  });
});

describe.each(LOADS)("%s server load", (route, load) => {
  test("guardrail (R4): one search for the whole series, three in all, TRANSACTION, trades up to the week, DIRECTED_QUANTITY only", async () => {
    respond();
    process.env.FT_HOMEPAGE_API_KEY = SENTINEL;
    const data = await call(load, route);
    const history = await data.streamed.history;
    expect(history.ok).toBe(true);
    expect(mocks.searchPositions).toHaveBeenCalledTimes(3);
    const requests: QueryPositionRequestProto[] =
      mocks.searchPositions.mock.calls.map(([r]) => r);
    expect(requests.map((r) => r.getFieldsList())).toEqual([
      SOMA_POSITION_FIELDS,
      SOMA_FIELDS,
      SOMA_HISTORY_FIELDS,
    ]);
    const search = requests[2];
    expect(search.getPositionType()).toBe(PositionTypeProto.TRANSACTION);
    expect(search.getFieldsList()).toEqual([
      FieldProto.TRADE_DATE,
      FieldProto.TRANSACTION_TYPE,
      FieldProto.PRODUCT_TYPE,
    ]);
    expect(search.getMeasuresList()).toEqual([MeasureProto.DIRECTED_QUANTITY]);
    const filters = search.getFilterFields()?.getFiltersList() ?? [];
    expect(
      filters
        .find((f) => f.getField() === FieldProto.PORTFOLIO_NAME)
        ?.getStringValue()
    ).toBe("Federal Reserve SOMA Holdings");
    const tradeDate = filters.find(
      (f) => f.getField() === FieldProto.TRADE_DATE
    );
    expect(tradeDate?.getOperator()).toBe(
      PositionFilterOperator.LESS_THAN_OR_EQUALS
    );
    const date = Position.unpackField(tradeDate as never);
    expect([date.getYear(), date.getMonth(), date.getDay()]).toEqual([
      2026, 11, 4,
    ]);
    const seconds = search.getAsOf()?.getTimestamp()?.getSeconds() ?? 0;
    expect(new Date(seconds * 1000).toISOString()).toBe(
      "2026-11-04T23:59:59.000Z"
    );
    expect(mocks.searchPositions.mock.calls[2][1]).toBe(SENTINEL);
  });

  test("guardrail: a rejected history search says unavailable, with no mock series, and the other sections still load", async () => {
    respond(() => Promise.reject(new Error("14 UNAVAILABLE")));
    process.env.FT_HOMEPAGE_API_KEY = SENTINEL;
    const data = await call(load, route);
    expect(data.snapshot.ok && data.positions.ok).toBe(true);
    expect(await data.streamed.history).toEqual({
      ok: false,
      message: UNAVAILABLE,
    });
  });

  test("guardrail (R5): with no key, the history search is never made and the chart says unavailable", async () => {
    respond();
    const data = await call(load, route);
    expect(mocks.searchPositions).not.toHaveBeenCalled();
    expect(await data.streamed.history).toEqual({
      ok: false,
      message: UNAVAILABLE,
    });
  });

  test("guardrail (R3): a history search that never answers doesn't hold up the page, then times out to unavailable", async () => {
    // Re-installed: beforeEach fakes Date only.
    vi.useRealTimers();
    vi.useFakeTimers({ toFake: ["Date", "setTimeout", "clearTimeout"] });
    vi.setSystemTime(NOW);
    respond(() => new Promise<Position[]>(() => undefined));
    process.env.FT_HOMEPAGE_API_KEY = SENTINEL;
    const data = await call(load, route);
    expect(data.snapshot.ok && data.findings.ok && data.positions.ok).toBe(
      true
    );

    let settled: Section<SomaHistoryView> | "pending" = "pending";
    data.streamed.history.then((h) => (settled = h));
    await vi.advanceTimersByTimeAsync(SOMA_HISTORY_TIMEOUT_MS - 1);
    expect(settled).toBe("pending");
    await vi.advanceTimersByTimeAsync(1);
    expect(settled).toEqual({ ok: false, message: UNAVAILABLE });
  });
});

describe("SomaHistory", () => {
  const ok: Section<SomaHistoryView> = { ok: true, data: RECORDED };

  test("metric 3: All is pressed by default; 1Y selects the last 53 weeks; 5Y is disabled with its note", async () => {
    render(SomaHistory, {
      props: { history: ok, asOf: AS_OF, asOfLabel: "Nov 4, 2026" },
    });
    const group = screen.getByRole("group", { name: "Time range" });
    const button = (name: string) =>
      within(group).getByRole("button", { name });
    expect(button("All")).toHaveAttribute("aria-pressed", "true");
    const chart = () => screen.getByRole("img");
    expect(chart()).toHaveAccessibleName(
      /^Holdings over time, All: Treasury par from \$4\.223T on Nov 13, 2024 to \$4\.472T on Nov 4, 2026/
    );

    expect(button("5Y")).toBeDisabled();
    const note = document.getElementById(
      button("5Y").getAttribute("aria-describedby") as string
    );
    expect(note?.textContent).toBe(
      "5Y needs history from Nov 10, 2021. The ledger starts Nov 13, 2024."
    );

    await fireEvent.click(button("1Y"));
    expect(button("1Y")).toHaveAttribute("aria-pressed", "true");
    expect(button("All")).toHaveAttribute("aria-pressed", "false");
    expect(chart()).toHaveAccessibleName(
      /^Holdings over time, 1Y: Treasury par from \$\d\.\d{3}T on Nov 5, 2025 to \$4\.472T on Nov 4, 2026/
    );
    expect(screen.getByText("Latest: $4.472T on Nov 4, 2026")).toBeVisible();
    expect(screen.getByText(new RegExp(SOMA_HISTORY_LABEL))).toBeVisible();
    for (const path of chart().querySelectorAll("path")) {
      expect(path.getAttribute("d")).not.toMatch(/NaN|Infinity/);
    }
    expect(chart().querySelectorAll("path")).toHaveLength(4);
  });

  test("US-322 metric 1: each tick label is slanted -45° about its own x,y, anchored at its end, and sits inside the chart", async () => {
    render(SomaHistory, {
      props: { history: ok, asOf: AS_OF, asOfLabel: "Nov 4, 2026" },
    });
    const chart = screen.getByRole("img");
    const group = screen.getByRole("group", { name: "Time range" });
    const height = Number(chart.getAttribute("viewBox")?.split(" ")[3]);
    expect(height).toBe(304);
    const labels = () => [...chart.querySelectorAll("text[transform]")];
    // The $0 gridline: the plot's bottom edge.
    const axis = () =>
      Math.max(
        ...[...chart.querySelectorAll("line")].map((l) =>
          Number(l.getAttribute("y1"))
        )
      );

    // 2024-11-13 to 2026-11-04: the first week labels its own year (US-330).
    expect(labels().map((t) => t.textContent)).toEqual([
      "2024",
      "2025",
      "2026",
    ]);
    for (const range of ["1Y", "All"]) {
      await fireEvent.click(within(group).getByRole("button", { name: range }));
      expect(labels().length, range).toBeGreaterThan(0);
      for (const text of labels()) {
        const x = text.getAttribute("x");
        const y = text.getAttribute("y");
        expect(text.getAttribute("text-anchor")).toBe("end");
        expect(text.getAttribute("transform")).toBe(`rotate(-45 ${x} ${y})`);
        // "Jan 2026", ~58 px of 12 px text slanted 45°, reaches ~41 px
        // below y.
        expect(Number(y) + 44).toBeLessThanOrEqual(height);
        expect(Number(y)).toBeGreaterThan(axis());
      }
    }
  });

  test("US-327 guardrail: areas and legend keep their colours after the palette moved to $lib/free/soma", () => {
    const { container } = render(SomaHistory, {
      props: { history: ok, asOf: AS_OF, asOfLabel: "Nov 4, 2026" },
    });
    const HEX = {
      bills: "#B9D0FA",
      notesBonds: "#5B8DEF",
      tips: "#2F5BB7",
      frns: "#E8A33D",
    };
    expect(
      [...screen.getByRole("img").querySelectorAll("path[data-stack]")].map(
        (p) => [p.getAttribute("data-stack"), p.getAttribute("fill")]
      )
    ).toEqual(Object.entries(HEX));
    // jsdom reads a hex background back as rgb().
    const rgb = (hex: string) =>
      `rgb(${[1, 3, 5]
        .map((i) => parseInt(hex.slice(i, i + 2), 16))
        .join(", ")})`;
    expect(
      [...container.querySelectorAll(".legend li")].map((li) => [
        li.textContent?.trim(),
        (li.querySelector(".swatch") as HTMLElement).style.background,
      ])
    ).toEqual([
      ["Bills", rgb(HEX.bills)],
      ["Notes & bonds", rgb(HEX.notesBonds)],
      ["TIPS", rgb(HEX.tips)],
      ["FRNs", rgb(HEX.frns)],
    ]);
  });

  test("one week draws without NaN; while loading or unavailable every range is disabled", () => {
    const one = rangeWindow(RECORDED, SOMA_RANGES[2], "2024-11-13");
    const { unmount } = render(SomaHistory, {
      props: {
        history: { ok: true, data: { firstWeek: "2024-11-13", ...one } },
        asOf: "2024-11-13",
        asOfLabel: "Nov 13, 2024",
      },
    });
    for (const path of screen.getByRole("img").querySelectorAll("path")) {
      expect(path.getAttribute("d")).not.toMatch(/NaN|Infinity/);
    }
    unmount();

    for (const history of [null, { ok: false as const, message: "X" }]) {
      const { container, unmount } = render(SomaHistory, {
        props: { history, asOf: AS_OF, asOfLabel: "Nov 4, 2026" },
      });
      const buttons = within(container).getAllByRole("button");
      expect(buttons.map((b) => b.textContent)).toEqual(["1Y", "5Y", "All"]);
      for (const b of buttons) expect(b).toBeDisabled();
      expect(container.querySelector("svg")).toBeNull();
      expect(container.textContent).toContain(
        history ? "X" : "Loading holdings over time for Nov 4, 2026"
      );
      unmount();
    }
  });

  test("the page renders the streamed chart once it resolves", async () => {
    respond();
    process.env.FT_HOMEPAGE_API_KEY = SENTINEL;
    const data = await call(loadSoma, "/free/soma");
    const { container } = render(SomaPage, { props: { data } });
    const section = () =>
      container.querySelector(
        'section[aria-labelledby="hist-title"]'
      ) as HTMLElement;
    expect(section().textContent).toContain("Loading holdings over time");
    await data.streamed.history;
    await tick();
    expect(section().querySelector("svg")).not.toBeNull();
    expect(section().textContent).toContain("Latest: $4.472T on Nov 4, 2026");
  });
});

describe("US-330 somaXTicks", () => {
  /** `n` weekly ISO dates from `start`, oldest first. */
  const weeksFrom = (start: string, n: number) =>
    Array.from({ length: n }, (_, i) =>
      new Date(Date.parse(start) + i * 7 * 86_400_000)
        .toISOString()
        .slice(0, 10)
    );
  const weeksBetween = (start: string, end: string) =>
    weeksFrom(start, (Date.parse(end) - Date.parse(start)) / 604_800_000 + 1);
  /** Each tick after the first is the first week of a new bucket. */
  const expectFirstOfBucket = (
    weeks: string[],
    ticks: SomaXTick[],
    key: (w: string) => string
  ) => {
    for (const t of ticks.slice(1)) {
      expect(key(weeks[t.index]), weeks[t.index]).not.toBe(
        key(weeks[t.index - 1])
      );
    }
    // And no bucket start is missed after the first tick.
    const starts = weeks
      .map((w, i) => i)
      .filter((i) => i > ticks[0].index && key(weeks[i]) !== key(weeks[i - 1]));
    expect(ticks.slice(1).map((t) => t.index)).toEqual(starts);
  };
  const month = (w: string) => w.slice(0, 7);
  const quarter = (w: string) =>
    `${w.slice(0, 4)}-${Math.ceil(Number(w.slice(5, 7)) / 3)}`;
  const year = (w: string) => w.slice(0, 4);

  const ONE_YEAR = weeksFrom("2025-11-05", 53);
  const FIVE_YEARS = weeksFrom("2021-11-10", 261);
  const ALL_LONG = weeksBetween("2004-07-07", "2026-11-04");

  test("metric 1: 1Y ticks each month start, January with its year", () => {
    expect(ONE_YEAR[52]).toBe("2026-11-04");
    const ticks = somaXTicks(ONE_YEAR, "1Y");
    expect(ticks.length).toBeGreaterThanOrEqual(12);
    expect(ticks.length).toBeLessThanOrEqual(13);
    expectFirstOfBucket(ONE_YEAR, ticks, month);
    expect(ticks.map((t) => t.label)).toEqual([
      "Nov",
      "Dec",
      "Jan 2026",
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
    ]);
    expect(ONE_YEAR[ticks[2].index]).toBe("2026-01-07");
  });

  test("metric 1: a 1Y first label one week from the next month is dropped", () => {
    const weeks = weeksFrom("2025-11-26", 53);
    const ticks = somaXTicks(weeks, "1Y");
    expect(ticks[0].label).toBe("Dec");
    expect(weeks[ticks[0].index]).toBe("2025-12-03");
    expect(ticks.length).toBeGreaterThanOrEqual(12);
    expect(ticks.length).toBeLessThanOrEqual(13);
    expectFirstOfBucket(weeks, ticks, month);
  });

  test("metric 2: 5Y ticks each quarter start, labelled like Q1 2023", () => {
    expect(FIVE_YEARS[260]).toBe("2026-11-04");
    const ticks = somaXTicks(FIVE_YEARS, "5Y");
    expect(ticks.length).toBeGreaterThanOrEqual(20);
    expect(ticks.length).toBeLessThanOrEqual(21);
    expectFirstOfBucket(FIVE_YEARS, ticks, quarter);
    for (const t of ticks.slice(1)) {
      expect(["01", "04", "07", "10"]).toContain(
        FIVE_YEARS[t.index].slice(5, 7)
      );
    }
    for (const t of ticks) expect(t.label).toMatch(/^Q[1-4] \d{4}$/);
    expect(ticks.find((t) => t.label === "Q1 2023")).toBeDefined();
    expect(FIVE_YEARS[ticks[ticks.length - 1].index]).toBe("2026-10-07");
  });

  test("metric 2: a 5Y first label under 8 weeks from the next quarter is dropped; alt alternates", () => {
    const weeks = weeksFrom("2021-11-17", 261);
    const ticks = somaXTicks(weeks, "5Y");
    expect(ticks.map((t) => t.label)).not.toContain("Q4 2021");
    expect(ticks[0].label).toBe("Q1 2022");
    expect(ticks.length).toBeGreaterThanOrEqual(20);
    expect(ticks.length).toBeLessThanOrEqual(21);
    expect(ticks.map((t) => t.alt)).toEqual(ticks.map((_, i) => i % 2 === 1));
  });

  test("metric 3: All ticks once per calendar year, on the first week of each", () => {
    const weeks = weeksBetween("2024-11-13", "2026-11-04");
    const ticks = somaXTicks(weeks, "All");
    expect(ticks.map((t) => t.label)).toEqual(["2024", "2025", "2026"]);
    expect(ticks.map((t) => weeks[t.index])).toEqual([
      "2024-11-13",
      "2025-01-01",
      "2026-01-07",
    ]);
  });

  test("metric 3: a 22-year All series ticks every year 2004 to 2026", () => {
    const ticks = somaXTicks(ALL_LONG, "All");
    expect(ticks.map((t) => t.label)).toEqual(
      Array.from({ length: 23 }, (_, i) => String(2004 + i))
    );
    expectFirstOfBucket(ALL_LONG, ticks, year);
    for (const t of ticks.slice(1)) {
      expect(ALL_LONG[t.index].slice(5, 7)).toBe("01");
      expect(Number(ALL_LONG[t.index].slice(8))).toBeLessThanOrEqual(7);
    }
  });

  test("metric 4: neighbouring slanted labels clear each other by a 12-unit text line", () => {
    // SomaHistory's plot: LEFT 56 to W - RIGHT = 708.
    const PLOT = 720 - 56 - 12;
    // Slanted 45°, neighbours are parallel lines pitch × sin 45° apart.
    const gaps = (weeks: string[], ticks: SomaXTick[]) => {
      const xs = ticks.map((t) => (t.index * PLOT) / (weeks.length - 1));
      return xs.slice(1).map((x, i) => (x - xs[i]) * Math.SQRT1_2);
    };
    const minGap = (weeks: string[], ticks: SomaXTick[]) =>
      Math.min(...gaps(weeks, ticks));
    const cases: [string, string[], "1Y" | "5Y" | "All"][] = [
      ["1Y", ONE_YEAR, "1Y"],
      ["1Y from Nov 26", weeksFrom("2025-11-26", 53), "1Y"],
      ["1Y from Nov 19", weeksFrom("2025-11-19", 53), "1Y"],
      ["5Y", FIVE_YEARS, "5Y"],
      ["5Y from Nov 17", weeksFrom("2021-11-17", 261), "5Y"],
      // The host's 1,175 weeks to 2026-11-18.
      ["All, as on the host", weeksBetween("2004-05-19", "2026-11-18"), "All"],
    ];
    for (const [name, weeks, range] of cases) {
      const ticks = somaXTicks(weeks, range);
      expect(minGap(weeks, ticks), name).toBeGreaterThanOrEqual(12);
      if (range === "5Y") {
        const kept = ticks.filter((t) => !t.alt);
        expect(kept[0]).toBe(ticks[0]);
        expect(minGap(weeks, kept), `${name}, thinned`).toBeGreaterThanOrEqual(
          12
        );
      }
    }
    // All keeps its first year (metric 3), so a short first part-year sits
    // close to the next: the accepted first-label gap. Past it, every pair
    // clears.
    const rest = gaps(ALL_LONG, somaXTicks(ALL_LONG, "All")).slice(1);
    expect(Math.min(...rest)).toBeGreaterThanOrEqual(12);
  });

  test("one week, passed twice as the chart does, gives one tick", () => {
    expect(somaXTicks(["2024-11-13", "2024-11-13"], "1Y")).toEqual([
      { index: 0, label: "Nov", alt: false },
    ]);
  });

  test("guardrail 3: somaXTicks reads the ISO strings, with no Date or locale API", () => {
    const source = readFileSync(path.resolve("src/lib/free/soma.ts"), "utf8");
    const body = source.match(/export function somaXTicks[\s\S]*?\n}\n/)?.[0];
    expect(body).toBeDefined();
    expect(body).not.toMatch(/toLocale|new Date|Date\.|Intl\./);
  });
});

test("metric 5 (timing, log only): a 1,200-week history loads well within the page's budget", async () => {
  // ~12 rows a week, as the ledger groups them: buys, maturities, cash legs.
  const types = ["TBILL", "TREASURY_NOTE", "TREASURY_BOND", "TIPS"];
  const rows: SomaTradeRow[] = [];
  const start = Date.parse("2003-12-17");
  for (let w = 0; w < 1200; w++) {
    const day = new Date(start + w * 7 * 86_400_000).toISOString().slice(0, 10);
    for (const type of types) {
      rows.push(trade(day, "BUY", type, "1000000000"));
      rows.push(trade(day, "MATURATION", type, "-400000000"));
      rows.push(trade(day, "WITHDRAWAL", "CURRENCY", "-1000000000"));
    }
  }
  const asOf = rows[rows.length - 1].tradeDate as string;
  const positions = rows.map(tradePositionOf);
  mocks.searchPositions.mockResolvedValue(positions);
  const started = performance.now();
  const history = await fetchSomaHistory(SENTINEL, asOf);
  const ms = performance.now() - started;
  vi.mocked(console.log).mockRestore();
  console.log(
    `US-317 metric 5: ${positions.length} rows, 1,200 weeks: ${ms.toFixed(
      0
    )} ms; payload ${JSON.stringify(history).length} bytes`
  );
  if (!history.ok) throw new Error(history.message);
  expect(history.data.points).toHaveLength(1200);
  // Loose: the host is shared.
  expect(ms).toBeLessThan(2000);
});

describe("US-331 nearestWeek", () => {
  // The chart's plot: LEFT 56 to W - RIGHT = 708 of a 720-wide viewBox.
  const L = 56;
  const R = 708;

  test("metric 1: an x maps to the closest week; left of the first or right of the last clamps to that week", () => {
    // Five weeks, 163 units apart: 56, 219, 382, 545, 708.
    expect(nearestWeek(219, 5, L, R)).toBe(1);
    expect(nearestWeek(219 + 81, 5, L, R)).toBe(1);
    expect(nearestWeek(219 + 82, 5, L, R)).toBe(2);
    expect(nearestWeek(545 - 81, 5, L, R)).toBe(3);
    expect(nearestWeek(L, 5, L, R)).toBe(0);
    expect(nearestWeek(R, 5, L, R)).toBe(4);
    expect(nearestWeek(0, 5, L, R)).toBe(0);
    expect(nearestWeek(-50, 5, L, R)).toBe(0);
    expect(nearestWeek(720, 5, L, R)).toBe(4);
    expect(nearestWeek(5000, 5, L, R)).toBe(4);
    for (const x of [0, 300, 720]) expect(nearestWeek(x, 1, L, R)).toBe(0);
  });
});

describe("US-331 SomaHistory tooltip", () => {
  const ok: Section<SomaHistoryView> = { ok: true, data: RECORDED };
  const points = RECORDED.points;
  const W = 720;
  const xOf = (i: number, n = points.length) => 56 + (i * 652) / (n - 1);

  // jsdom 22 has no PointerEvent, and its stand-in drops clientX.
  const hadPointerEvent = "PointerEvent" in window;
  beforeEach(() => {
    if (hadPointerEvent) return;
    class PointerEvent extends MouseEvent {
      pointerType: string;
      constructor(type: string, init: PointerEventInit = {}) {
        super(type, init);
        this.pointerType = init.pointerType ?? "";
      }
    }
    vi.stubGlobal("PointerEvent", PointerEvent);
  });
  afterEach(() => {
    if (!hadPointerEvent) vi.unstubAllGlobals();
  });

  function setup(history: Section<SomaHistoryView> = ok, asOf = AS_OF) {
    const result = render(SomaHistory, {
      props: { history, asOf, asOfLabel: weekLabel(asOf) },
    });
    const plot = screen.getByRole("group", {
      name: "Holdings over time, by week",
    });
    // The chart's box is the viewBox at 1 px a unit.
    plot.getBoundingClientRect = () =>
      ({
        left: 0,
        top: 0,
        width: W,
        height: 304,
        right: W,
        bottom: 304,
      } as DOMRect);
    const guide = () =>
      result.container.querySelector('[data-testid="hist-guide"]');
    const tooltip = () =>
      result.container.querySelector(
        '[data-testid="hist-tooltip"]'
      ) as HTMLElement | null;
    const live = () =>
      result.container
        .querySelector('[data-testid="hist-live"]')
        ?.textContent?.trim();
    /** The tooltip as shown: its date, rows and total. */
    const shown = () => {
      const tip = tooltip() as HTMLElement;
      const rows = [...tip.querySelectorAll("li")].map((li) => ({
        label: li.querySelector(".tip-label")?.textContent,
        value: li.querySelector(".tip-value")?.textContent as string,
        swatch: (li.querySelector(".swatch") as HTMLElement).style.background,
      }));
      return {
        date: tip.querySelector(".tip-date")?.textContent,
        rows,
        total: tip.querySelector(".tip-total .tip-value")
          ?.textContent as string,
      };
    };
    /** What the tooltip DOM says, in the live region's words. */
    const shownText = () => {
      const s = shown();
      return `${s.date}. ${s.rows
        .map((r) => `${r.label} ${r.value}`)
        .join(", ")}. Total ${s.total}.`;
    };
    return { ...result, plot, guide, tooltip, live, shown, shownText };
  }

  const rgb = (hex: string) =>
    `rgb(${[1, 3, 5]
      .map((i) => parseInt(hex.slice(i, i + 2), 16))
      .join(", ")})`;
  const cents = (v: string) => {
    expect(v).toMatch(/^\$[\d,]+\.\d{2}B$/);
    return Math.round(Number(v.replace(/[$,B]/g, "")) * 100);
  };

  test("guardrail 3: before any interaction there is no guide or tooltip, and the chart is as before", () => {
    const { guide, tooltip, live } = setup();
    expect(guide()).toBeNull();
    expect(tooltip()).toBeNull();
    expect(live()).toBe("");
    const chart = screen.getByRole("img");
    expect(chart.querySelectorAll("path")).toHaveLength(4);
    expect(chart).toHaveAccessibleName(
      /^Holdings over time, All: Treasury par from \$4\.223T on Nov 13, 2024 to \$4\.472T on Nov 4, 2026/
    );
  });

  test("metric 2: hovering shows the guide and the week's date, the four stacks in legend order with swatches, and their total; leaving with a mouse or pen hides it", async () => {
    const { plot, guide, tooltip, shown } = setup();
    for (const pointerType of ["mouse", "pen"]) {
      await fireEvent.pointerMove(plot, { clientX: xOf(50) + 2, pointerType });
      expect(guide()).not.toBeNull();
      expect(Number(guide()?.getAttribute("x1"))).toBeCloseTo(xOf(50), 5);
      expect(tooltip()).toBeVisible();
      const s = shown();
      expect(s.date).toBe(weekLabel(points[50].week));
      expect(s.rows.map((r) => r.label)).toEqual([
        "Bills",
        "Notes & bonds",
        "TIPS",
        "FRNs",
      ]);
      expect(s.rows.map((r) => r.swatch)).toEqual(
        SOMA_STACKS.map((k) => rgb(SOMA_STACK_COLORS[k]))
      );
      const sum = s.rows.reduce((a, r) => a + cents(r.value), 0);
      expect(cents(s.total)).toBe(sum);
      expect(sum).toBeGreaterThan(0);

      await fireEvent.pointerLeave(plot, { pointerType });
      expect(guide()).toBeNull();
      expect(tooltip()).toBeNull();
    }
  });

  test("metric 2: weekTooltip lists SOMA_STACKS in order and totals the values shown", () => {
    const tip = weekTooltip(points[points.length - 1]);
    expect(tip.rows.map((r) => r.label)).toEqual(
      SOMA_STACKS.map((k) => SOMA_STACK_LABELS[k])
    );
    expect(cents(tip.total)).toBe(
      tip.rows.reduce((a, r) => a + cents(r.value), 0)
    );
    expect(tip.text).toBe(
      `${tip.date}. ${tip.rows
        .map((r) => `${r.label} ${r.value}`)
        .join(", ")}. Total ${tip.total}.`
    );
  });

  test("metric 3: focus lands on the last week; ArrowLeft and ArrowRight step one week, stop at the ends, and the live region matches the tooltip", async () => {
    const { plot, shown, shownText, live } = setup();
    const last = points.length - 1;
    const expectWeek = (i: number) => {
      expect(shown().date).toBe(weekLabel(points[i].week));
      expect(live()).toBe(shownText());
    };
    const press = async (key: string) => {
      // fireEvent returns false once the default is prevented.
      expect(await fireEvent.keyDown(plot, { key }), key).toBe(false);
    };

    await fireEvent.focus(plot);
    expectWeek(last);
    await press("ArrowLeft");
    expectWeek(last - 1);
    await press("ArrowRight");
    expectWeek(last);
    expect(live()).toBe(weekTooltip(points[last]).text);
    await press("ArrowRight");
    expectWeek(last);
    for (let i = last - 1; i >= 0; i--) {
      await press("ArrowLeft");
      expectWeek(i);
    }
    await press("ArrowLeft");
    expectWeek(0);
    await press("ArrowRight");
    expectWeek(1);
  });

  test("metric 3: with one week the arrow keys leave the date alone and the guide sits at the first x", async () => {
    const one = rangeWindow(RECORDED, SOMA_RANGES[2], "2024-11-13");
    const { plot, guide, shown, live, shownText } = setup(
      { ok: true, data: { firstWeek: "2024-11-13", ...one } },
      "2024-11-13"
    );
    await fireEvent.focus(plot);
    for (const key of ["ArrowLeft", "ArrowRight", "ArrowRight"]) {
      await fireEvent.keyDown(plot, { key });
      expect(shown().date).toBe("Nov 13, 2024");
      expect(guide()?.getAttribute("x1")).toBe("56");
      expect(live()).toBe(shownText());
    }
  });

  test("guardrail 3: hovering a late week in All, then picking 1Y, clears the tooltip and draws without NaN", async () => {
    const { plot, tooltip, guide } = setup();
    await fireEvent.pointerMove(plot, {
      clientX: xOf(100),
      pointerType: "mouse",
    });
    expect(tooltip()).not.toBeNull();
    await fireEvent.click(screen.getByRole("button", { name: "1Y" }));
    expect(tooltip()).toBeNull();
    expect(guide()).toBeNull();
    const chart = screen.getByRole("img");
    expect(chart.querySelectorAll("path")).toHaveLength(4);
    for (const p of chart.querySelectorAll("path")) {
      expect(p.getAttribute("d")).not.toMatch(/NaN|Infinity/);
    }
    // The next hover reads the 1Y window: its first week, not All's.
    await fireEvent.pointerMove(plot, { clientX: 0, pointerType: "mouse" });
    const oneYear = rangeWindow(RECORDED, SOMA_RANGES[0], AS_OF).points;
    expect(tooltip()?.querySelector(".tip-date")?.textContent).toBe(
      weekLabel(oneYear[0].week)
    );
  });

  test("guardrail 4: a tap is not prevented and stays after its pointerleave; only the arrow keys are prevented; no touch-action", async () => {
    const { plot, tooltip, live, shownText } = setup();
    expect(
      await fireEvent.pointerDown(plot, { clientX: 700, pointerType: "touch" })
    ).toBe(true);
    await fireEvent.pointerLeave(plot, { pointerType: "touch" });
    expect(tooltip()).not.toBeNull();
    expect(live()).toBe(shownText());
    expect(await fireEvent.keyDown(plot, { key: "ArrowDown" })).toBe(true);
    expect(await fireEvent.keyDown(plot, { key: "ArrowUp" })).toBe(true);

    // A moving mouse updates the tooltip but not the live region.
    const said = live();
    await fireEvent.pointerMove(plot, { clientX: 100, pointerType: "mouse" });
    expect(live()).toBe(said);

    await fireEvent.blur(plot);
    expect(tooltip()).toBeNull();

    const source = readFileSync(
      path.resolve("src/components/free/soma/SomaHistory.svelte"),
      "utf8"
    );
    expect(source).not.toMatch(/touch-action/);
  });
});
