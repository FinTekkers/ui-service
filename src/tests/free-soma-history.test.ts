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
  rangeWindow,
  type Section,
  type SomaHistoryView,
  type SomaPageWithHistory,
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
