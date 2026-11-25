/**
 * US-334: /free/spy's server load (src/routes/free/spy/+page.server.ts) and
 * its three charts. The load reads SPY's SHARES_OUTSTANDING, NAV_PER_SHARE
 * and TOTAL_NET_ASSETS through the broker with the server-held
 * FT_HOMEPAGE_API_KEY, via ledger-models' SecurityMetricService (LM-485),
 * and derives the flows on the server. A mocked SecurityMetric Search
 * response flows through the real wrapper into each chart (metric 2).
 * US-336: the fee chart reads EXPENSE_RATIO (history over the AUM range,
 * plus GetLatest on the AUM start) and is filled, or says Unavailable and
 * why, without touching the other charts.
 *
 * The broker's SecurityMetric client and the SPY lookup are stubbed; the
 * e2e spec covers the real backend.
 */
import { render } from "@testing-library/svelte";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { readFileSync } from "node:fs";
import Decimal from "decimal.js";

const mocks = vi.hoisted(() => ({
  lookup: vi.fn(),
  connection: vi.fn(),
  clients: [] as { args: unknown[]; requests: unknown[]; latest: unknown[] }[],
  series: {} as Record<number, [string, string][] | Error>,
  /** GetLatest's point per metric; unset is "no point on or before". */
  latest: {} as Record<number, [string, string] | Error>,
}));

vi.mock("$lib/security", () => ({
  FetchSecurityProtoByIdentifier: mocks.lookup,
}));
vi.mock("$lib/grpc-auth", () => ({ getServiceConnection: mocks.connection }));
vi.mock(
  "@fintekkers/ledger-models/node/fintekkers/services/security-metric-service/security_metric_service_grpc_pb",
  async () => {
    const { EventEmitter } = await import("events");
    const { SearchSecurityMetricResponseProto } = await import(
      "@fintekkers/ledger-models/node/fintekkers/requests/security_metric/search_security_metric_request_pb"
    );
    const { SecurityMetricSeriesProto } = await import(
      "@fintekkers/ledger-models/node/fintekkers/models/security/security_metric_pb"
    );
    const { MetricPoint, pointToProto, toLocalDate } = await import(
      "@fintekkers/ledger-models/node/wrappers/models/security/security_metric"
    );
    const { GetLatestSecurityMetricResponseProto } = await import(
      "@fintekkers/ledger-models/node/fintekkers/requests/security_metric/get_latest_security_metric_request_pb"
    );
    const { Decimal } = await import("decimal.js");
    class SecurityMetricClient {
      requests: any[] = [];
      latest: any[] = [];
      constructor(...args: unknown[]) {
        mocks.clients.push({
          args,
          requests: this.requests,
          latest: this.latest,
        });
      }
      // As the price service answers: one series per pair, with no points
      // when nothing is stored on or before the date.
      getLatest(request: any, callback: (err: unknown, res?: unknown) => void) {
        this.latest.push(request);
        const metric = request.getMetricsList()[0];
        const point = mocks.latest[metric];
        setTimeout(() => {
          if (point instanceof Error) {
            callback(point);
            return;
          }
          const series = new SecurityMetricSeriesProto()
            .setSecurityId(request.getSecurityIdsList()[0])
            .setMetric(metric)
            .setPointsList(
              point
                ? [
                    pointToProto(
                      new MetricPoint(
                        toLocalDate(point[0]),
                        new Decimal(point[1])
                      )
                    ),
                  ]
                : []
            );
          callback(
            null,
            new GetLatestSecurityMetricResponseProto().setSeriesList([series])
          );
        }, 0);
      }
      search(request: any) {
        this.requests.push(request);
        const stream = new EventEmitter();
        const rows = mocks.series[request.getMetricsList()[0]] ?? [];
        setTimeout(() => {
          if (rows instanceof Error) {
            stream.emit("error", rows);
            return;
          }
          const series = new SecurityMetricSeriesProto()
            .setSecurityId(request.getSecurityId())
            .setMetric(request.getMetricsList()[0])
            .setPointsList(
              rows.map(([d, v]) =>
                pointToProto(new MetricPoint(toLocalDate(d), new Decimal(v)))
              )
            );
          stream.emit(
            "data",
            new SearchSecurityMetricResponseProto().setSeries(series)
          );
          stream.emit("end");
        }, 0);
        return stream;
      }
      close() {}
    }
    return { SecurityMetricClient };
  }
);

import { SecurityProto } from "@fintekkers/ledger-models/node/fintekkers/models/security/security_pb";
import { SecurityMetricTypeProto } from "@fintekkers/ledger-models/node/fintekkers/models/security/security_metric_type_pb";
import { IdentifierTypeProto } from "@fintekkers/ledger-models/node/fintekkers/models/security/identifier/identifier_type_pb";
import { UUID } from "@fintekkers/ledger-models/node/wrappers/models/utils/uuid";
import { load } from "../routes/free/spy/+page.server";
import {
  SPY_FEE_NOTE,
  SPY_FORMULAS,
  type Section,
  type SpyPageData,
} from "$lib/free/spy";
import { feesSpec } from "$lib/free/charts";
import SpyShares from "../components/free/spy/SpyShares.svelte";
import SpyFlows from "../components/free/spy/SpyFlows.svelte";
import SpyFees from "../components/free/spy/SpyFees.svelte";

const SENTINEL = "sentinel-homepage-key-334";
const SPY_UUID = UUID.random();

const DAYS = [
  "2026-08-28",
  "2026-08-31",
  "2026-09-01",
  "2026-09-30",
  "2026-10-01",
  "2026-10-30",
];
const SHARES: [string, string][] = DAYS.map((d, i) => [
  d,
  String(1_000_000_000 + i * 5_000_000),
]);
const NAV: [string, string][] = DAYS.map((d, i) => [d, String(600 + i)]);
const TNA: [string, string][] = DAYS.map((d, i) => [
  d,
  new Decimal(SHARES[i][1]).times(NAV[i][1]).toString(),
]);

const RATIO = SecurityMetricTypeProto.EXPENSE_RATIO;
// Stored in percent: 0.0945 = 0.0945% a year. First point mid-September.
const RATIO_HISTORY: [string, string][] = [["2026-09-15", "0.0945"]];

function stubAll() {
  mocks.series[SecurityMetricTypeProto.SHARES_OUTSTANDING] = SHARES;
  mocks.series[SecurityMetricTypeProto.NAV_PER_SHARE] = NAV;
  mocks.series[SecurityMetricTypeProto.TOTAL_NET_ASSETS] = TNA;
  mocks.series[RATIO] = RATIO_HISTORY;
}

/** Every weekday from `from` to `to`, ISO. */
function weekdays(from: string, to: string): string[] {
  const days: string[] = [];
  for (
    let d = new Date(`${from}T00:00:00Z`);
    d.toISOString().slice(0, 10) <= to;
    d.setUTCDate(d.getUTCDate() + 1)
  ) {
    const dow = d.getUTCDay();
    if (dow !== 0 && dow !== 6) days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

/** May–Jul 2026 TNA at 365,000 a day: 1 a day at 0.1%. */
const TNA_MAY_JUL: [string, string][] = weekdays(
  "2026-05-01",
  "2026-07-31"
).map((d) => [d, "365000"]);

function requestedMetrics(): number[] {
  return mocks.clients.flatMap((c) =>
    c.requests.map((r: any) => r.getMetricsList()[0])
  );
}

function latestRequests(): any[] {
  return mocks.clients.flatMap((c) => c.latest);
}

function iso(d: any): string {
  return `${d.getYear()}-${String(d.getMonth()).padStart(2, "0")}-${String(
    d.getDay()
  ).padStart(2, "0")}`;
}

async function callLoad(): Promise<SpyPageData> {
  return load();
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-11-03T12:00:00Z"));
  process.env.FT_HOMEPAGE_API_KEY = SENTINEL;
  mocks.lookup.mockResolvedValue(
    new SecurityProto().setUuid(SPY_UUID.toUUIDProto())
  );
  mocks.connection.mockImplementation(() => ({
    url: "broker.test:80",
    credentials: {},
    interceptors: [],
    clientOptions: {},
  }));
  stubAll();
});

afterEach(() => {
  vi.useRealTimers();
  delete process.env.FT_HOMEPAGE_API_KEY;
  mocks.lookup.mockReset();
  mocks.connection.mockReset();
  mocks.clients.length = 0;
  for (const k of Object.keys(mocks.series)) delete mocks.series[Number(k)];
  for (const k of Object.keys(mocks.latest)) delete mocks.latest[Number(k)];
});

describe("guardrail 1: SecurityMetricService through the broker, with the key", () => {
  test("the server-held key reaches the SPY lookup and the SecurityMetric client", async () => {
    await callLoad();
    expect(mocks.lookup).toHaveBeenCalledWith(
      IdentifierTypeProto.EXCH_TICKER,
      "SPY",
      SENTINEL
    );
    expect(mocks.connection).toHaveBeenCalledWith(SENTINEL);
    expect(mocks.clients).toHaveLength(1);
    expect(mocks.clients[0].args[0]).toBe("broker.test:80");
  });

  test("the three series and EXPENSE_RATIO are searched for SPY's ID, and nothing else", async () => {
    await callLoad();
    expect(requestedMetrics().sort()).toEqual(
      [
        SecurityMetricTypeProto.SHARES_OUTSTANDING,
        SecurityMetricTypeProto.NAV_PER_SHARE,
        SecurityMetricTypeProto.TOTAL_NET_ASSETS,
        RATIO,
      ].sort()
    );
    for (const c of mocks.clients) {
      for (const r of c.requests as any[]) {
        expect(UUID.fromUUIDProto(r.getSecurityId())?.toString()).toBe(
          SPY_UUID.toString()
        );
      }
    }
  });

  test("an unset key makes every section unavailable, with no calls", async () => {
    delete process.env.FT_HOMEPAGE_API_KEY;
    const data = await callLoad();
    for (const section of [data.latest, data.shares, data.flows, data.fees]) {
      expect(section.ok).toBe(false);
    }
    expect(mocks.lookup).not.toHaveBeenCalled();
    expect(mocks.clients).toHaveLength(0);
  });
});

describe("guardrail 2: the ratio comes only from the stored EXPENSE_RATIO series", () => {
  test("history from the AUM start to the page's date, and GetLatest on the AUM start, for SPY", async () => {
    await callLoad();
    const [search] = mocks.clients
      .flatMap((c) => c.requests as any[])
      .filter((r) => r.getMetricsList()[0] === RATIO);
    expect(UUID.fromUUIDProto(search.getSecurityId())?.toString()).toBe(
      SPY_UUID.toString()
    );
    expect(iso(search.getStartDate())).toBe(TNA[0][0]);
    expect(iso(search.getEndDate())).toBe("2026-11-03");

    const latest = latestRequests();
    expect(latest).toHaveLength(1);
    expect(latest[0].getMetricsList()).toEqual([RATIO]);
    expect(
      latest[0]
        .getSecurityIdsList()
        .map((u: any) => UUID.fromUUIDProto(u)?.toString())
    ).toEqual([SPY_UUID.toString()]);
    expect(iso(latest[0].getDate())).toBe(TNA[0][0]);
  });

  test("without TOTAL_NET_ASSETS no ratio is read, and fees carry the TNA reason", async () => {
    mocks.series[SecurityMetricTypeProto.TOTAL_NET_ASSETS] = [];
    const data = await callLoad();
    expect(data.fees).toEqual({
      ok: false,
      message: "Unavailable: no TOTAL_NET_ASSETS values are stored for SPY.",
    });
    expect(requestedMetrics()).not.toContain(RATIO);
    expect(latestRequests()).toHaveLength(0);
  });
});

describe("metric 2: the fee chart from mocked EXPENSE_RATIO and AUM series", () => {
  test("filled, with no bar and a note for the months before the first ratio point", async () => {
    // First point 15 May, nothing before it (GetLatest's empty series).
    mocks.series[SecurityMetricTypeProto.TOTAL_NET_ASSETS] = TNA_MAY_JUL;
    mocks.series[RATIO] = [["2026-05-15", "0.1"]];
    const data = await callLoad();
    expect(data.fees).toEqual({
      ok: true,
      data: {
        months: [
          { month: "2026-05", fee: null },
          { month: "2026-06", fee: "30" },
          { month: "2026-07", fee: "31" },
        ],
        ratioFrom: "2026-05-15",
      },
    });
    const { container, getByTestId } = render(SpyFees, {
      props: { fees: data.fees },
    });
    expect(getByTestId("spy-fees-plot")).toBeTruthy();
    expect(container.querySelector("svg")).toBeNull();
    // May has no bar: a null value, never 0 (US-337: the Plotly trace).
    expect(
      feesSpec(data.fees.ok ? data.fees.data.months : []).data[0].y
    ).toEqual([null, 30 / 1e6, 31 / 1e6]);
    expect(getByTestId("spy-fee-gap-note").textContent).toBe(
      "No estimate before Jun 2026: SPY's first stored expense ratio is dated May 15, 2026."
    );
  });

  test("a prior point alone (no history in range) applies from the first day", async () => {
    mocks.series[SecurityMetricTypeProto.TOTAL_NET_ASSETS] = TNA_MAY_JUL;
    mocks.series[RATIO] = [];
    mocks.latest[RATIO] = ["2026-04-20", "0.1"];
    const data = await callLoad();
    expect(data.fees.ok).toBe(true);
    if (!data.fees.ok) return;
    expect(data.fees.data.months[0]).toEqual({ month: "2026-05", fee: "31" });
    expect(data.fees.data.ratioFrom).toBe("2026-04-20");
    const { queryByTestId } = render(SpyFees, { props: { fees: data.fees } });
    expect(queryByTestId("spy-fee-gap-note")).toBeNull();
  });

  // The shares, latest and flows sections with the ratio read as stubbed.
  async function baseline() {
    const { latest, shares, flows } = await callLoad();
    mocks.clients.length = 0;
    return { latest, shares, flows };
  }

  test("an empty series: Unavailable with the reason; the other charts unchanged", async () => {
    const before = await baseline();
    mocks.series[RATIO] = [];
    const data = await callLoad();
    expect(data.fees).toEqual({
      ok: false,
      message: "Unavailable: no EXPENSE_RATIO values are stored for SPY.",
    });
    expect({
      latest: data.latest,
      shares: data.shares,
      flows: data.flows,
    }).toEqual(before);
    const { container } = render(SpyFees, { props: { fees: data.fees } });
    expect(container.textContent).toContain(
      "Unavailable: no EXPENSE_RATIO values are stored for SPY."
    );
    expect(container.querySelector("svg")).toBeNull();
    expect(container.querySelector("[data-testid$=plot]")).toBeNull();
  });

  test.each([
    [
      "the history search",
      () => (mocks.series[RATIO] = new Error("14 UNAVAILABLE: broker down")),
    ],
    [
      "GetLatest",
      () => (mocks.latest[RATIO] = new Error("14 UNAVAILABLE: broker down")),
    ],
  ])(
    "%s erroring: Unavailable with the reason; the other charts unchanged",
    async (_name, fail) => {
      const before = await baseline();
      fail();
      const data = await callLoad();
      expect(data.fees).toEqual({
        ok: false,
        message:
          "Unavailable: EXPENSE_RATIO could not be read (14 UNAVAILABLE: broker down).",
      });
      expect({
        latest: data.latest,
        shares: data.shares,
        flows: data.flows,
      }).toEqual(before);
      expect(data.shares.ok && data.flows.ok && data.latest.ok).toBe(true);
      const { container } = render(SpyFees, { props: { fees: data.fees } });
      expect(container.textContent).toContain(
        "Unavailable: EXPENSE_RATIO could not be read (14 UNAVAILABLE: broker down)."
      );
      expect(container.querySelector("svg")).toBeNull();
      expect(container.querySelector("[data-testid$=plot]")).toBeNull();
    }
  );
});

describe("metric 2: each chart renders from a mocked SecurityMetric response", () => {
  test("the load turns the response into shares, latest and flows", async () => {
    const data = await callLoad();
    expect(data.asOf).toBe("2026-11-03");
    expect(data.shares).toEqual({ ok: true, data: SHARES });
    expect(data.latest).toEqual({
      ok: true,
      data: {
        date: "2026-10-30",
        value: "1025000000",
        ageDays: 4,
        stale: false,
      },
    });
    expect(data.flows.ok).toBe(true);
    if (!data.flows.ok) return;
    expect(data.flows.data.map((m) => m.month)).toEqual([
      "2026-08",
      "2026-09",
      "2026-10",
    ]);
    // Sep: (1,010M − 1,005M) × 602 + (1,015M − 1,010M) × 603 = 6,025M.
    expect(data.flows.data[1].netFlows).toBe("6025000000");
  });

  test("shares chart: a Plotly plot, its name and legend (axes and range buttons: free-charts.test.ts)", async () => {
    const data = await callLoad();
    const { container, getByText, getByTestId } = render(SpyShares, {
      props: { shares: data.shares, asOf: data.asOf },
    });
    expect(getByTestId("spy-shares-plot")).toHaveAccessibleName(
      "Shares outstanding: from 1,000,000,000 on Aug 28, 2026 to 1,025,000,000 on Oct 30, 2026"
    );
    expect(getByText("Shares outstanding, daily")).toBeTruthy();
    expect(container.querySelector("svg")).toBeNull();
    // The fixture spans two months, so 1Y and 5Y can't be filled: notes.
    expect(container.querySelector("#spy-shares-note-1Y")?.textContent).toBe(
      "1Y needs history from Nov 3, 2025. The series starts Aug 28, 2026."
    );
  });

  test("flows chart: a Plotly plot, legend and formulas", async () => {
    const data = await callLoad();
    const { container, getByText, getByTestId } = render(SpyFlows, {
      props: { flows: data.flows },
    });
    expect(getByTestId("spy-flows-plot")).toHaveAccessibleName(
      /^Monthly change in SPY's assets under management, Aug 2026 to Oct 2026, stacked/
    );
    expect(container.querySelector("svg")).toBeNull();
    expect(getByText("Net flows")).toBeTruthy();
    expect(getByText("Market move")).toBeTruthy();
    expect(getByText("Month-end AUM (right axis)")).toBeTruthy();
    for (const formula of [
      SPY_FORMULAS.aum,
      SPY_FORMULAS.flows,
      SPY_FORMULAS.market,
    ]) {
      expect(getByText(formula)).toBeTruthy();
    }
  });

  test("fee chart: a Plotly plot, legend, formula, and it says it is an estimate", async () => {
    const data = await callLoad();
    expect(data.fees.ok).toBe(true);
    const { getByText, getByTestId } = render(SpyFees, {
      props: { fees: data.fees },
    });
    expect(getByTestId("spy-fees-plot")).toHaveAccessibleName(
      "Estimated SPY sponsor fee revenue per month, Aug 2026 to Oct 2026"
    );
    expect(getByText(/Estimated gross fee\s+revenue/)).toBeTruthy();
    expect(getByText(SPY_FORMULAS.fee)).toBeTruthy();
    expect(getByText(SPY_FEE_NOTE)).toBeTruthy();
    expect(SPY_FEE_NOTE).toMatch(/^Estimate\./);
    expect(SPY_FORMULAS.fee).toContain(
      "weekends and holidays use the prior trading day's AUM"
    );
  });
});

describe("metric 2: with its data missing, each chart says Unavailable and why", () => {
  // No plot and no 0 figure: a gap is never shown as zero.
  function expectNoFigure(container: HTMLElement) {
    expect(container.querySelector("svg")).toBeNull();
    expect(container.querySelector("[data-testid$=plot]")).toBeNull();
    expect(container.textContent).not.toMatch(/\$0\b|(^|\s)0(\s|$|[.,])/);
  }

  test("shares: a failed SHARES_OUTSTANDING search", async () => {
    mocks.series[SecurityMetricTypeProto.SHARES_OUTSTANDING] = new Error(
      "14 UNAVAILABLE: broker down"
    );
    const data = await callLoad();
    expect(data.shares.ok).toBe(false);
    expect(data.latest.ok).toBe(false);
    const reason = (data.shares as { message: string }).message;
    expect(reason).toMatch(
      /^Unavailable: SHARES_OUTSTANDING could not be read/
    );
    const { container } = render(SpyShares, {
      props: { shares: data.shares, asOf: data.asOf },
    });
    expect(container.textContent).toContain(reason);
    expectNoFigure(container);
  });

  test("flows: no NAV_PER_SHARE stored, while shares still render", async () => {
    mocks.series[SecurityMetricTypeProto.NAV_PER_SHARE] = [];
    const data = await callLoad();
    expect(data.shares.ok).toBe(true);
    expect(data.flows).toEqual({
      ok: false,
      message: "Unavailable: no NAV_PER_SHARE values are stored for SPY.",
    });
    const { container } = render(SpyFlows, { props: { flows: data.flows } });
    expect(container.textContent).toContain(
      "Unavailable: no NAV_PER_SHARE values are stored for SPY."
    );
    expectNoFigure(container);
  });

  test("fees: no EXPENSE_RATIO stored", async () => {
    mocks.series[RATIO] = [];
    const data = await callLoad();
    const { container } = render(SpyFees, { props: { fees: data.fees } });
    expect(container.textContent).toContain(
      "Unavailable: no EXPENSE_RATIO values are stored for SPY."
    );
    expect(container.textContent).toContain("Estimate.");
    expectNoFigure(container);
  });

  test.each([
    ["SpyShares", SpyShares, "shares"],
    ["SpyFlows", SpyFlows, "flows"],
    ["SpyFees", SpyFees, "fees"],
  ] as const)("%s shows any reason it is given", (_name, Component, prop) => {
    const section: Section<never> = {
      ok: false,
      message: "Unavailable: SPY could not be found (NOT_FOUND).",
    };
    const { container } = render(Component as any, {
      props:
        prop === "shares"
          ? { shares: section, asOf: "2026-11-03" }
          : { [prop]: section },
    });
    expect(container.textContent).toContain(
      "Unavailable: SPY could not be found (NOT_FOUND)."
    );
    expectNoFigure(container);
  });

  test("a failed SPY lookup makes every section unavailable, naming it", async () => {
    mocks.lookup.mockRejectedValue(
      new Error("No security found for EXCH_TICKER: SPY")
    );
    const data = await callLoad();
    for (const section of [data.latest, data.shares, data.flows]) {
      expect(section).toEqual({
        ok: false,
        message:
          "Unavailable: SPY could not be found (No security found for EXCH_TICKER: SPY).",
      });
    }
    expect(mocks.clients).toHaveLength(0);
  });
});

describe("guardrail 3: no chart library", () => {
  test("package.json gains no chart package (plotly.js-dist is the homepage's, from before)", () => {
    const pkg = JSON.parse(readFileSync("package.json", "utf-8"));
    const names = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies });
    expect(
      names.filter((n) =>
        /chart|d3|plotly|echarts|highcharts|vega|nivo|apex|victory|recharts|layercake/i.test(
          n
        )
      )
    ).toEqual(["plotly.js-dist"]);
  });
});
