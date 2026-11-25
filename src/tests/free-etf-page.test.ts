/**
 * US-334 metric 3: /free/spy (since US-338, /free/etf/spy) shows SPY's latest stored share count and its
 * date, and warns when that date is more than 14 days old: the warning
 * shows at 15 days and not at 14. The load runs with a fixed clock on a
 * stubbed SecurityMetric response; NAV and TNA are empty, as on the host
 * today, so the flows chart is unavailable while the count still shows.
 *
 * US-338 metric 1: every word about the fund comes from its config entry.
 * TQQQ names ProShares and shows the split-adjusted note; SPY keeps its
 * exact US-334 wording and shows no note.
 */
import { render } from "@testing-library/svelte";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  shares: [] as [string, string][],
}));

vi.mock("$lib/security", () => ({
  FetchSecurityProtoByIdentifier: vi.fn(async () => {
    const { SecurityProto } = await import(
      "@fintekkers/ledger-models/node/fintekkers/models/security/security_pb"
    );
    const { UUID } = await import(
      "@fintekkers/ledger-models/node/wrappers/models/utils/uuid"
    );
    return new SecurityProto().setUuid(UUID.random().toUUIDProto());
  }),
}));
vi.mock("$lib/grpc-auth", () => ({
  getServiceConnection: () => ({
    url: "broker.test:80",
    credentials: {},
    interceptors: [],
    clientOptions: {},
  }),
}));
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
    const { SecurityMetricTypeProto } = await import(
      "@fintekkers/ledger-models/node/fintekkers/models/security/security_metric_type_pb"
    );
    const { MetricPoint, pointToProto, toLocalDate } = await import(
      "@fintekkers/ledger-models/node/wrappers/models/security/security_metric"
    );
    const { Decimal } = await import("decimal.js");
    class SecurityMetricClient {
      search(request: any) {
        const metric = request.getMetricsList()[0];
        const rows =
          metric === SecurityMetricTypeProto.SHARES_OUTSTANDING
            ? mocks.shares
            : [];
        const stream = new EventEmitter();
        setTimeout(() => {
          const series = new SecurityMetricSeriesProto()
            .setMetric(metric)
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

import { load } from "../routes/free/etf/[ticker=etf]/+page.server";
import EtfPage from "../routes/free/etf/[ticker=etf]/+page.svelte";
import { isStale } from "$lib/free/etf";

const LATEST = "2026-11-06";

async function renderAt(now: string, ticker = "spy") {
  vi.setSystemTime(new Date(now));
  const data = await load({ params: { ticker } });
  return { data, ...render(EtfPage, { props: { data } }) };
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  process.env.FT_HOMEPAGE_API_KEY = "sentinel-homepage-key-334";
  mocks.shares = [
    ["2026-11-05", "1068000000"],
    [LATEST, "1068532116"],
  ];
});

afterEach(() => {
  vi.useRealTimers();
  delete process.env.FT_HOMEPAGE_API_KEY;
});

describe("metric 3: latest share count and the stale warning", () => {
  test("shows the latest count and its date", async () => {
    const { getByText } = await renderAt("2026-11-09T15:00:00Z");
    expect(getByText("Latest shares outstanding")).toBeTruthy();
    expect(getByText("1,068,532,116")).toBeTruthy();
    expect(getByText("As of Nov 6, 2026")).toBeTruthy();
  });

  test("14 days old: no warning", async () => {
    const now = "2026-11-20T23:30:00Z";
    expect(isStale(LATEST, new Date(now))).toBe(false);
    const { container, data } = await renderAt(now);
    expect(data.latest).toMatchObject({
      ok: true,
      data: { ageDays: 14, stale: false },
    });
    expect(container.querySelector("[data-testid=etf-stale]")).toBeNull();
  });

  test("15 days old: the warning names the age", async () => {
    const now = "2026-11-21T00:30:00Z";
    expect(isStale(LATEST, new Date(now))).toBe(true);
    const { container } = await renderAt(now);
    const warning = container.querySelector("[data-testid=etf-stale]");
    expect(warning).not.toBeNull();
    expect(warning?.textContent).toMatch(/15 days old, more than 14\s+days/);
  });

  test("the page still renders every chart heading when flows can't be built", async () => {
    const { getByRole, container } = await renderAt("2026-11-09T15:00:00Z");
    for (const name of [
      "Shares outstanding over time",
      "Monthly AUM change: net flows vs market move",
      "Sponsor fee revenue over time",
    ]) {
      expect(getByRole("heading", { name })).toBeTruthy();
    }
    expect(container.textContent).toContain(
      "Unavailable: no NAV_PER_SHARE values are stored for SPY."
    );
  });
});

describe("US-338 metric 1: per-fund text comes from the config", () => {
  const NOW = "2026-11-21T00:30:00Z"; // 15 days: the stale note shows

  test("SPY: State Street, no split note, and its US-334 wording", async () => {
    const { container, getByRole, getByText } = await renderAt(NOW, "spy");
    expect(container.querySelector("[data-testid=etf-split-note]")).toBeNull();
    expect(getByRole("heading", { name: "What is SPY?" })).toBeTruthy();
    for (const text of [
      "The SPDR S&P 500 ETF Trust (SPY) was the first US exchange-traded fund and is still one of the largest. It holds the stocks of the S&P 500 index. It is State Street's fund, part of its SPDR family, not an iShares fund from BlackRock.",
      "Authorised participants create and redeem SPY shares in large blocks, so the share count moves with investor demand. Its assets change for two reasons: money flowing in or out, and the market value of the stocks it holds. The charts below separate the two.",
      "SPDR S&P 500 ETF Trust, ticker SPY",
      "State Street (SPDR)",
      "Estimate. SPY is a unit investment trust: its expense ratio pays the trustee (State Street), the S&P index licence and marketing costs.",
    ]) {
      expect(getByText(text)).toBeTruthy();
    }
    const source = getByRole("link", { name: "State Street SPY fund data" });
    expect(source.getAttribute("href")).toBe(
      "https://www.ssga.com/us/en/intermediary/etfs/spdr-sp-500-etf-trust-spy"
    );
    expect(source.parentElement?.textContent?.replace(/\s+/g, " ").trim()).toBe(
      "State Street SPY fund data, daily from May 31, 2006"
    );
    expect(
      container.querySelector("[data-testid=etf-stale]")?.textContent
    ).toMatch(/Newer State Street figures have not been loaded yet\./);
    expect(container.textContent?.replace(/\s+/g, " ")).toContain(
      "Source: State Street, via the Fintekkers SecurityMetric service."
    );
    expect(container.textContent).not.toMatch(/ProShares|TQQQ/);
  });

  test("TQQQ: ProShares and the split-adjusted note", async () => {
    const { container, getByRole, getByText, getByTestId } = await renderAt(
      NOW,
      "tqqq"
    );
    expect(getByRole("heading", { name: "What is TQQQ?" })).toBeTruthy();
    const note = getByTestId("etf-split-note");
    expect(note.getAttribute("role")).toBe("note");
    expect(note.textContent).toMatch(/^\s*Split-adjusted history: ProShares/);
    expect(getByText("ProShares UltraPro QQQ, ticker TQQQ")).toBeTruthy();
    expect(getByText(/^Estimate\. TQQQ is an open-end fund: /)).toBeTruthy();
    expect(
      getByRole("link", { name: "ProShares TQQQ fund data" }).parentElement
        ?.textContent
    ).toMatch(/daily from Feb 9, 2010/);
    expect(getByTestId("etf-stale").textContent).toMatch(
      /Newer ProShares figures/
    );
    expect(container.textContent?.replace(/\s+/g, " ")).toContain(
      "Source: ProShares, via the Fintekkers SecurityMetric service."
    );
    expect(container.textContent).toContain(
      "Unavailable: no NAV_PER_SHARE values are stored for TQQQ."
    );
    expect(container.textContent).not.toMatch(/State Street|SPDR/);
  });
});
