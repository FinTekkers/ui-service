/**
 * US-307: /free/soma's and /free's server loads
 * (src/routes/free/soma/+page.server.ts, src/routes/free/+page.server.ts).
 * Both read the server-held FT_HOMEPAGE_API_KEY when called, search the
 * ledger's SOMA positions through the broker for the Business date's H.4.1
 * week, and make every section unavailable, naming the week, when the
 * search fails, returns nothing or has no key. No figure from the old SOMA
 * mock ever renders.
 *
 * The position search is stubbed; the e2e spec covers the real backend.
 */
import { fireEvent, render, screen } from "@testing-library/svelte";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  searchPositions: vi.fn(),
  goto: vi.fn(),
}));

vi.mock("$lib/positions", () => ({ searchPositions: mocks.searchPositions }));
vi.mock("$app/navigation", () => ({ goto: mocks.goto }));

import type { QueryPositionRequestProto } from "@fintekkers/ledger-models/node/fintekkers/requests/position/query_position_request_pb";
import field_pkg from "@fintekkers/ledger-models/node/fintekkers/models/position/field_pb.js";
import measure_pkg from "@fintekkers/ledger-models/node/fintekkers/models/position/measure_pb.js";
import { Position } from "@fintekkers/ledger-models/node/wrappers/models/position/position";
import type { Writable } from "svelte/store";
import { page } from "$app/stores";
import type { SomaPageData } from "$lib/free/soma";
import { load as loadSoma } from "../routes/free/soma/+page.server";
import { load as loadFree } from "../routes/free/+page.server";
import SomaPage from "../routes/free/soma/+page.svelte";
import FreePage from "../routes/free/+page.svelte";
import SomaWeekPicker from "../components/free/soma/SomaWeekPicker.svelte";
import {
  AS_OF,
  PRIOR_ROWS,
  ROWS,
  positionOf,
} from "./fixtures/soma-2026-10-14";

const { FieldProto } = field_pkg;
const { MeasureProto } = measure_pkg;

const SENTINEL = "sentinel-homepage-key-307";
// A Thursday: the latest H.4.1 week is the day before.
const NOW = new Date("2026-11-05T15:00:00Z");
const LATEST_WEEK = "2026-11-04";

// The figures the old SOMA mock (src/lib/free/mock/soma.ts, deleted in
// US-307) showed, copied as literals so no test imports it.
const MOCK_FIGURES = [
  "$4.57T",
  "+$373.1B",
  "4,572.9",
  "4,199.8",
  "566.0",
  "3,618.0",
  "106.6",
  "2.9×",
  "$386.5B",
  "79.1%",
  "12.4%",
  "$106.9B",
  "$1,625.3B",
  "35.6%",
  "$1.03T",
];

const LOADS = [
  ["/free/soma", loadSoma, SomaPage],
  ["/free", loadFree, FreePage],
] as const;

type Load = (event: { url: URL }) => Promise<SomaPageData>;

function call(load: Load, href: string): Promise<SomaPageData> {
  return load({ url: new URL(href, "http://localhost") });
}

function requests(): QueryPositionRequestProto[] {
  return mocks.searchPositions.mock.calls.map(([request]) => request);
}

/** The UTC date of a request's as_of. */
function asOfOf(request: QueryPositionRequestProto): string {
  const seconds = request.getAsOf()?.getTimestamp()?.getSeconds() ?? 0;
  return new Date(seconds * 1000).toISOString().slice(0, 10);
}

function respond(rows = ROWS, prior = PRIOR_ROWS) {
  mocks.searchPositions.mockImplementation(
    async (request: QueryPositionRequestProto) =>
      (asOfOf(request) === AS_OF ? rows : prior).map(positionOf)
  );
}

/** Every section of a rendered page: its text. */
function sectionTexts(container: HTMLElement): string[] {
  const snapshot = container.querySelector(
    'section[aria-labelledby="snap-title"]'
  );
  const findings = container.querySelector("article.findings");
  const maturity = container.querySelector(
    'section[aria-labelledby="mat-title"]'
  );
  return [snapshot, findings, maturity].map((s) => s?.textContent ?? "");
}

/** Renders /free/soma's or /free's page; /free's data adds the dataset id. */
function renderRoute(
  Page: typeof SomaPage | typeof FreePage,
  data: SomaPageData
) {
  return render(Page as unknown as typeof FreePage, {
    props: { data: { ...data, dataset: "soma" } },
  });
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(NOW);
  mocks.searchPositions.mockReset();
  mocks.goto.mockReset();
  vi.spyOn(console, "log").mockImplementation(() => undefined);
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  delete process.env.FT_HOMEPAGE_API_KEY;
});

describe.each(LOADS)("%s server load", (route, load, Page) => {
  test("metric 1: reads FT_HOMEPAGE_API_KEY when called, not at import", async () => {
    respond();
    // The module was imported above, before the key existed.
    process.env.FT_HOMEPAGE_API_KEY = ` ${SENTINEL} `;
    await call(load, `${route}?asOf=${AS_OF}`);
    expect(mocks.searchPositions.mock.calls.map(([, key]) => key)).toEqual([
      SENTINEL,
      SENTINEL,
    ]);

    process.env.FT_HOMEPAGE_API_KEY = `${SENTINEL}-rotated`;
    mocks.searchPositions.mockClear();
    await call(load, `${route}?asOf=${AS_OF}`);
    expect(mocks.searchPositions.mock.calls[0][1]).toBe(`${SENTINEL}-rotated`);
  });

  test("searches SOMA for PRODUCT_TYPE × MATURITY_DATE with DIRECTED_QUANTITY and INFLATION_COMPENSATION, for the week and a year before", async () => {
    respond();
    process.env.FT_HOMEPAGE_API_KEY = SENTINEL;
    const data = await call(load, `${route}?asOf=${AS_OF}`);
    expect(data.snapshot.ok).toBe(true);
    const [week, prior] = requests();
    expect(week.getFieldsList()).toEqual([
      FieldProto.PRODUCT_TYPE,
      FieldProto.MATURITY_DATE,
    ]);
    expect(week.getMeasuresList()).toEqual([
      MeasureProto.DIRECTED_QUANTITY,
      MeasureProto.INFLATION_COMPENSATION,
    ]);
    const filters = week.getFilterFields()?.getFiltersList() ?? [];
    expect(
      filters
        .find((f) => f.getField() === FieldProto.PORTFOLIO_NAME)
        ?.getStringValue()
    ).toBe("Federal Reserve SOMA Holdings");
    const tradeDate = filters.find(
      (f) => f.getField() === FieldProto.TRADE_DATE
    );
    const date = Position.unpackField(tradeDate as never);
    expect([date.getYear(), date.getMonth(), date.getDay()]).toEqual([
      2026, 10, 14,
    ]);
    expect(asOfOf(week)).toBe(AS_OF);
    expect(asOfOf(prior)).toBe("2025-10-15");
  });

  test.each([
    [
      "the broker call rejects",
      () =>
        mocks.searchPositions.mockRejectedValue(new Error("14 UNAVAILABLE")),
      SENTINEL,
    ],
    ["the key is unset", () => respond(), undefined],
  ])(
    "metric 2: when %s, every section says unavailable for the week, with no mock figure",
    async (_name, arrange, key) => {
      arrange();
      if (key) process.env.FT_HOMEPAGE_API_KEY = key;
      const data = await call(load, `${route}?asOf=${AS_OF}`);
      if (!key) expect(mocks.searchPositions).not.toHaveBeenCalled();
      expect([data.snapshot.ok, data.findings.ok, data.maturity.ok]).toEqual([
        false,
        false,
        false,
      ]);

      const { container } = renderRoute(Page, data);
      for (const text of sectionTexts(container)) {
        expect(text).toMatch(/Unavailable for Oct 14, 2026/);
      }
      const html = container.innerHTML;
      expect(MOCK_FIGURES.filter((f) => html.includes(f))).toEqual([]);
    }
  );

  test("metric 2: an empty result is unavailable, never $0, 0.0% or NaN", async () => {
    mocks.searchPositions.mockResolvedValue([]);
    process.env.FT_HOMEPAGE_API_KEY = SENTINEL;
    const data = await call(load, `${route}?asOf=${AS_OF}`);
    const { container } = renderRoute(Page, data);
    for (const text of sectionTexts(container)) {
      expect(text).toMatch(/Unavailable for Oct 14, 2026/);
    }
    const text = container.textContent ?? "";
    expect(text).not.toMatch(/\$0\b|0\.0%|NaN/);
  });

  test("metric 4: the picked week is requested, and every section names it", async () => {
    // The test stub ($app/stores in vitest.config.js) is a writable.
    (page as unknown as Writable<{ url: URL }>).set({
      url: new URL(`http://localhost${route}`),
    });
    render(SomaWeekPicker, {
      props: { asOf: LATEST_WEEK, today: "2026-11-05" },
    });
    const input = screen.getByLabelText("Business date") as HTMLInputElement;
    expect(input.max).toBe("2026-11-05");
    await fireEvent.change(input, { target: { value: "2026-10-07" } });
    expect(mocks.goto).toHaveBeenCalledTimes(1);
    const target = mocks.goto.mock.calls[0][0] as string;
    expect(target).toBe(`${route}?asOf=2026-10-07`);

    // The fixture rows stand in for any week's holdings.
    mocks.searchPositions.mockResolvedValue(ROWS.map(positionOf));
    process.env.FT_HOMEPAGE_API_KEY = SENTINEL;
    const data = await call(load, target);
    expect(asOfOf(requests()[0])).toBe("2026-10-07");
    expect(data.asOf).toBe("2026-10-07");
    const { container } = renderRoute(Page, data);
    const texts = sectionTexts(container);
    expect(texts[0]).toContain("As of Oct 7, 2026");
    expect(texts[1]).toContain("As of Oct 7, 2026");
    expect(texts[2]).toContain("as of Oct 7, 2026");
  });

  test.each([
    ["2026-10-16", "2026-10-14"], // a Friday → its week's Wednesday
    ["2026-10-14", "2026-10-14"],
    ["garbage", LATEST_WEEK],
    ["2026-02-30", LATEST_WEEK],
    ["2099-01-01", LATEST_WEEK],
    ["", LATEST_WEEK],
  ])("metric 4: ?asOf=%s requests the week of %s", async (asked, week) => {
    respond();
    process.env.FT_HOMEPAGE_API_KEY = SENTINEL;
    const data = await call(load, `${route}?asOf=${asked}`);
    expect(data.asOf).toBe(week);
    expect(asOfOf(requests()[0])).toBe(week);
  });
});

test("/free's load names the SOMA dataset; /free/soma's does not", async () => {
  const free = (await call(loadFree, "/free")) as SomaPageData & {
    dataset?: string;
  };
  const soma = (await call(loadSoma, "/free/soma")) as SomaPageData & {
    dataset?: string;
  };
  expect(free.dataset).toBe("soma");
  expect(soma.dataset).toBeUndefined();
  expect(free.asOf).toBe(LATEST_WEEK);
});
