/**
 * US-334: /free/spy's server load (src/routes/free/spy/+page.server.ts) and
 * its three charts. The load reads SPY's SHARES_OUTSTANDING, NAV_PER_SHARE
 * and TOTAL_NET_ASSETS through the broker with the server-held
 * FT_HOMEPAGE_API_KEY, via ledger-models' SecurityMetricService (LM-485),
 * and derives the flows on the server. A mocked SecurityMetric Search
 * response flows through the real wrapper into each chart (metric 2). The
 * fee chart is always unavailable live: no expense-ratio series is read,
 * even though the enum now has EXPENSE_RATIO, and no ratio is defaulted.
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
  clients: [] as { args: unknown[]; requests: unknown[] }[],
  series: {} as Record<number, [string, string][] | Error>,
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
    const { Decimal } = await import("decimal.js");
    class SecurityMetricClient {
      requests: any[] = [];
      constructor(...args: unknown[]) {
        mocks.clients.push({ args, requests: this.requests });
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
import { feeRevenue, tradingCalendar } from "$lib/server/free-spy";
import {
  SPY_FEE_NOTE,
  SPY_FEE_UNAVAILABLE,
  SPY_FORMULAS,
  type Section,
  type SpyPageData,
} from "$lib/free/spy";
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

function stubAll() {
  mocks.series[SecurityMetricTypeProto.SHARES_OUTSTANDING] = SHARES;
  mocks.series[SecurityMetricTypeProto.NAV_PER_SHARE] = NAV;
  mocks.series[SecurityMetricTypeProto.TOTAL_NET_ASSETS] = TNA;
}

function requestedMetrics(): number[] {
  return mocks.clients.flatMap((c) =>
    c.requests.map((r: any) => r.getMetricsList()[0])
  );
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

  test("the three series are searched for SPY's ID, and nothing else", async () => {
    await callLoad();
    expect(requestedMetrics().sort()).toEqual(
      [
        SecurityMetricTypeProto.SHARES_OUTSTANDING,
        SecurityMetricTypeProto.NAV_PER_SHARE,
        SecurityMetricTypeProto.TOTAL_NET_ASSETS,
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

describe("guardrail 2: the expense ratio is never read or defaulted", () => {
  test("with EXPENSE_RATIO in the enum, fees stay unavailable and no ratio search is made", async () => {
    expect("EXPENSE_RATIO" in SecurityMetricTypeProto).toBe(true);
    const ratio = (SecurityMetricTypeProto as unknown as Record<string, number>)
      .EXPENSE_RATIO;
    mocks.series[ratio] = [["2026-01-01", "0.000945"]];
    const data = await callLoad();
    expect(data.fees).toEqual({ ok: false, message: SPY_FEE_UNAVAILABLE });
    expect(requestedMetrics()).not.toContain(ratio);
  });
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

  test("shares chart: axes, legend, range buttons", async () => {
    const data = await callLoad();
    const { container, getByRole, getByText } = render(SpyShares, {
      props: { shares: data.shares, asOf: data.asOf },
    });
    expect(container.querySelector("svg")).not.toBeNull();
    expect(
      container.querySelector("[data-testid=spy-shares-line]")
    ).not.toBeNull();
    expect(getByText("Shares outstanding (billions)")).toBeTruthy();
    expect(getByText("Date")).toBeTruthy();
    expect(getByText("Shares outstanding, daily")).toBeTruthy();
    expect(getByRole("button", { name: "All" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    // The fixture spans two months, so 1Y and 5Y can't be filled.
    expect(getByRole("button", { name: "1Y" })).toBeDisabled();
  });

  test("flows chart: axes, legend, stacked bars, AUM line and formulas", async () => {
    const data = await callLoad();
    const { container, getByText } = render(SpyFlows, {
      props: { flows: data.flows },
    });
    expect(container.querySelector("svg")).not.toBeNull();
    expect(getByText("Monthly change in AUM")).toBeTruthy();
    expect(getByText("Month-end AUM")).toBeTruthy();
    expect(getByText("Month")).toBeTruthy();
    expect(getByText("Net flows")).toBeTruthy();
    expect(getByText("Market move")).toBeTruthy();
    expect(getByText("Month-end AUM (right axis)")).toBeTruthy();
    expect(container.querySelectorAll("rect[data-kind=net]").length).toBe(2);
    expect(container.querySelectorAll("rect[data-kind=market]").length).toBe(2);
    expect(
      container.querySelector("[data-testid=spy-aum-line]")?.getAttribute("d")
    ).toMatch(/^M.*L.*L/);
    for (const formula of [
      SPY_FORMULAS.aum,
      SPY_FORMULAS.flows,
      SPY_FORMULAS.market,
    ]) {
      expect(getByText(formula)).toBeTruthy();
    }
  });

  test("fee chart: axes, legend, formula, and it says it is an estimate", () => {
    // The live section is always unavailable, so drive the chart with the
    // TNA the mocked response returns and a fixed ratio series.
    const fees = feeRevenue(
      TNA,
      [["2026-08-01", "0.000945"]],
      tradingCalendar(SHARES, NAV, TNA)
    );
    const { container, getByText } = render(SpyFees, {
      props: { fees: { ok: true, data: fees } },
    });
    expect(container.querySelectorAll("rect").length).toBeGreaterThan(0);
    expect(getByText("Fee revenue per month")).toBeTruthy();
    expect(getByText("Month")).toBeTruthy();
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

  test("fees: the missing expense-ratio series", async () => {
    const data = await callLoad();
    const { container } = render(SpyFees, { props: { fees: data.fees } });
    expect(container.textContent).toContain(SPY_FEE_UNAVAILABLE);
    expect(SPY_FEE_UNAVAILABLE).toMatch(
      /^Unavailable: no expense-ratio series/
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
