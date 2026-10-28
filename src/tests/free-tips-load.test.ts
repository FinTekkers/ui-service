/**
 * US-298: /free/tips's server load (src/routes/free/tips/+page.server.ts).
 * It runs with no user session on the server-held FT_HOMEPAGE_API_KEY,
 * values the TIPS at the latest FedInvest price within 7 days with that
 * date's CPI-U readings, asks valuation-service for exactly the five page
 * measures and the cashflows (never CLEAN_PRICE), and makes a failed
 * source's sections unavailable without a mock figure.
 *
 * The security lookup, price search, CPI-U lookup and valuation call are
 * stubbed; the e2e spec covers the real backend.
 */
import { render, screen } from "@testing-library/svelte";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  FetchSecurityProtoByCusip: vi.fn(),
  PriceService: vi.fn(),
  search: vi.fn(),
  fetchCpiReadings: vi.fn(),
  getServiceConnection: vi.fn(),
  runValuation: vi.fn(),
}));

vi.mock("$lib/security", async (importOriginal) => ({
  ...(await importOriginal<typeof import("$lib/security")>()),
  FetchSecurityProtoByCusip: mocks.FetchSecurityProtoByCusip,
}));
vi.mock("$lib/cpi", async (importOriginal) => ({
  ...(await importOriginal<typeof import("$lib/cpi")>()),
  fetchCpiReadings: mocks.fetchCpiReadings,
}));
vi.mock("$lib/grpc-auth", () => ({
  getServiceConnection: mocks.getServiceConnection,
}));
vi.mock(
  "@fintekkers/ledger-models/node/wrappers/services/price-service/PriceService",
  () => ({ PriceService: mocks.PriceService })
);
vi.mock(
  "@fintekkers/ledger-models/node/fintekkers/services/valuation-service/valuation_service_grpc_pb.js",
  () => ({
    ValuationClient: vi.fn().mockImplementation(() => ({
      runValuation: mocks.runValuation,
    })),
  })
);

import {
  BondDetailsProto,
  SecurityProto,
  TipsExtensionProto,
} from "@fintekkers/ledger-models/node/fintekkers/models/security/security_pb.js";
import { IdentifierProto } from "@fintekkers/ledger-models/node/fintekkers/models/security/identifier/identifier_pb.js";
import { IdentifierTypeProto } from "@fintekkers/ledger-models/node/fintekkers/models/security/identifier/identifier_type_pb.js";
import { ProductTypeProto } from "@fintekkers/ledger-models/node/fintekkers/models/security/product_type_pb.js";
import { CouponFrequencyProto } from "@fintekkers/ledger-models/node/fintekkers/models/security/coupon_frequency_pb.js";
import index_type_pkg from "@fintekkers/ledger-models/node/fintekkers/models/security/index/index_type_pb.js";
import measure_pkg from "@fintekkers/ledger-models/node/fintekkers/models/position/measure_pb.js";
import { InflationIndexInput } from "@fintekkers/ledger-models/node/fintekkers/requests/valuation/product_inputs_pb.js";
import { LocalDateProto } from "@fintekkers/ledger-models/node/fintekkers/models/util/local_date_pb.js";
import { UUID } from "@fintekkers/ledger-models/node/wrappers/models/utils/uuid";
import { fromDecimalProto, toDecimalProto } from "$lib/decimal";
import { UNAVAILABLE, type TipsPageData } from "$lib/free/tips";
import {
  FREE_TIPS_CUSIP,
  fetchLatestRealCleanPrice,
} from "$lib/server/free-tips";
import { load } from "../routes/free/tips/+page.server";
import TipsPage from "../routes/free/tips/+page.svelte";
import { LIVE, liveWithout, mockFiguresIn } from "./fixtures/free-tips-live";

const { MeasureProto } = measure_pkg;
const { IndexTypeProto } = index_type_pkg;

const SENTINEL = "sentinel-homepage-key-298";
const NOW = new Date("2026-10-28T15:00:00Z");
const SECURITY_UUID = "0a10c0ff-ee00-4000-8000-000000000298";

function localDate(iso: string): LocalDateProto {
  const [y, m, d] = iso.split("-").map(Number);
  return new LocalDateProto().setYear(y).setMonth(m).setDay(d);
}

function stubSecurity(): SecurityProto {
  return new SecurityProto()
    .setUuid(new UUID(UUID.fromString(SECURITY_UUID)).toUUIDProto())
    .setProductType(ProductTypeProto.TIPS)
    .setIssuerName("United States Treasury")
    .setDescription("TII 2⅛ 04/15/35 stub")
    .setIdentifiersList([
      new IdentifierProto()
        .setIdentifierType(IdentifierTypeProto.CUSIP)
        .setIdentifierValue(FREE_TIPS_CUSIP),
    ])
    .setBondDetails(
      new BondDetailsProto()
        .setCouponRate(toDecimalProto("2.125"))
        .setCouponFrequency(CouponFrequencyProto.SEMIANNUALLY)
        .setDatedDate(localDate("2025-04-15"))
        .setMaturityDate(localDate("2035-04-15"))
        .setFaceValue(toDecimalProto("1000"))
    )
    .setTipsExtension(
      new TipsExtensionProto()
        .setBaseCpi(toDecimalProto("319.12345"))
        .setInflationIndexType(IndexTypeProto.CPI_U)
    );
}

/** A Price wrapper as PriceService.search returns it. */
function price(isoDateTime: string, value: string) {
  const ms = Date.parse(isoDateTime);
  return {
    getAsOf: () => ({ toDateTime: () => ({ toMillis: () => ms }) }),
    getPrice: () => ({ toString: () => value }),
  };
}

// Out of order, with one price outside the 7-day window.
const PRICES = [
  price("2026-10-22T00:00:00Z", "97.0001"),
  price("2026-10-14T00:00:00Z", "95.5555"),
  price("2026-10-23T00:00:00Z", "98.4375"),
];

const READINGS = [
  { year: 2026, month: 7, label: "CPI-U Jul 2026", value: "327.111" },
  { year: 2026, month: 8, label: "CPI-U Aug 2026", value: "328.222" },
];

const MEASURES: [number, string][] = [
  [MeasureProto.REFERENCE_CPI, "327.9228064516"],
  [MeasureProto.INDEX_RATIO, "1.0275924"],
  [MeasureProto.INFLATION_ADJUSTED_PRINCIPAL, "1027.5924"],
  [MeasureProto.MARKET_VALUE, "1011.5298"],
  [MeasureProto.YIELD_TO_MATURITY, "0.019872"],
];

function cashflow(iso: string, fv: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return {
    getCashflowDate: () => ({
      getYear: () => y,
      getMonth: () => m,
      getDay: () => d,
    }),
    getFvAmount: () => toDecimalProto(fv),
    getPvAmount: () => toDecimalProto(fv),
    getCouponRate: () => undefined,
  };
}

function valuationResponse(measures: [number, string][] = MEASURES) {
  return {
    getMeasureResultsList: () =>
      measures.map(([measure, value]) => ({
        getMeasure: () => measure,
        getMeasureDecimalValue: () => toDecimalProto(value),
      })),
    getCashflowsList: () => [
      cashflow("2027-10-15", "11.0000"),
      cashflow("2027-04-15", "10.9182"),
    ],
  };
}

const requests: any[] = [];
const consoleLog = console.log;

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(NOW);
  vi.stubEnv("FT_HOMEPAGE_API_KEY", SENTINEL);
  console.log = vi.fn();
  requests.length = 0;
  mocks.getServiceConnection.mockReturnValue({
    url: "localhost:80",
    credentials: {},
  });
  mocks.FetchSecurityProtoByCusip.mockImplementation(async () =>
    stubSecurity()
  );
  mocks.PriceService.mockImplementation(() => ({ search: mocks.search }));
  mocks.search.mockResolvedValue(PRICES);
  mocks.fetchCpiReadings.mockResolvedValue({
    readings: READINGS,
    latestMonth: null,
  });
  mocks.runValuation.mockImplementation((request: any, callback: Function) => {
    requests.push(request);
    callback(null, valuationResponse());
  });
});

afterEach(() => {
  vi.useRealTimers();
  console.log = consoleLog;
  vi.unstubAllEnvs();
  // Calls only: restoring would also drop ValuationClient's implementation.
  vi.clearAllMocks();
});

/** Every API key a service entry point was given. */
function keysUsed(): unknown[] {
  return [
    ...mocks.FetchSecurityProtoByCusip.mock.calls.map((c) => c[1]),
    ...mocks.PriceService.mock.calls.map((c) => c[0]),
    ...mocks.fetchCpiReadings.mock.calls.map((c) => c[1]),
    ...mocks.getServiceConnection.mock.calls.map((c) => c[0]),
  ];
}

describe("/free/tips load", () => {
  test("with no session, it loads every section with FT_HOMEPAGE_API_KEY", async () => {
    // No event and no locals: the load takes none.
    const data = await (load as () => Promise<TipsPageData>)();
    expect(data).toEqual(LIVE);
    expect(mocks.FetchSecurityProtoByCusip).toHaveBeenCalledWith(
      FREE_TIPS_CUSIP,
      SENTINEL
    );
    expect(keysUsed().length).toBeGreaterThanOrEqual(4);
    expect(new Set(keysUsed())).toEqual(new Set([SENTINEL]));
  });

  test("the valuation asks for the five measures and the cashflows, never CLEAN_PRICE", async () => {
    await load();
    expect(requests).toHaveLength(1);
    const measures = requests[0].getMeasuresList();
    expect([...measures].sort((a, b) => a - b)).toEqual(
      [
        MeasureProto.REFERENCE_CPI,
        MeasureProto.INDEX_RATIO,
        MeasureProto.INFLATION_ADJUSTED_PRINCIPAL,
        MeasureProto.MARKET_VALUE,
        MeasureProto.YIELD_TO_MATURITY,
        MeasureProto.PRESENT_VALUE_CASHFLOWS,
      ].sort((a, b) => a - b)
    );
    expect(measures).not.toContain(MeasureProto.CLEAN_PRICE);
  });

  test("the valuation uses the FedInvest price, settles on its date and sends that date's CPI-U readings", async () => {
    await load();
    expect(mocks.fetchCpiReadings).toHaveBeenCalledWith("2026-10-23", SENTINEL);
    const request = requests[0];
    const tips = request.getProductInput().getTips();
    expect(fromDecimalProto(tips.getCleanPrice())).toBe("98.4375");
    expect(
      new Date(request.getAsofDatetime().getTimestamp().getSeconds() * 1000)
        .toISOString()
        .slice(0, 10)
    ).toBe("2026-10-23");
    const cpi = tips.getCpi();
    expect(cpi.getCpiCase()).toBe(InflationIndexInput.CpiCase.READINGS);
    expect(
      cpi
        .getReadings()
        .getReadingsList()
        .map((r: any) => [
          r.getYear(),
          r.getMonth(),
          fromDecimalProto(r.getValue()),
        ])
    ).toEqual([
      [2026, 7, "327.111"],
      [2026, 8, "328.222"],
    ]);
    // The prefetched security, and MARKET_VALUE's quantity: its face.
    expect(mocks.FetchSecurityProtoByCusip).toHaveBeenCalledTimes(1);
    const quantity = request
      .getPositionInput()
      .getMeasuresList()
      .map((m: any) => [
        m.getMeasure(),
        fromDecimalProto(m.getMeasureDecimalValue()),
      ]);
    expect(quantity).toEqual([[MeasureProto.DIRECTED_QUANTITY, "1000"]]);
  });

  test("the serialised result never holds the key", async () => {
    const data = await load();
    expect(JSON.stringify(data)).not.toContain(SENTINEL);
  });

  test("with no key set, nothing is called and every section is unavailable", async () => {
    vi.stubEnv("FT_HOMEPAGE_API_KEY", "");
    const data = await load();
    for (const section of ["security", "price", "cpi", "valuation"] as const) {
      expect(data[section].ok, section).toBe(false);
    }
    expect(mocks.getServiceConnection).not.toHaveBeenCalled();
    expect(mocks.FetchSecurityProtoByCusip).not.toHaveBeenCalled();
    expect(mocks.PriceService).not.toHaveBeenCalled();
    expect(mocks.fetchCpiReadings).not.toHaveBeenCalled();

    const { container } = render(TipsPage, { props: { data } });
    expect(
      screen.getByRole("region", { name: FREE_TIPS_CUSIP })
    ).toHaveTextContent(UNAVAILABLE.security);
    expect(
      screen.getByRole("article", { name: "How this bond tracks inflation" })
    ).toHaveTextContent(UNAVAILABLE.security);
    expect(
      screen.getByRole("region", { name: "Value a TIPS position" })
    ).toHaveTextContent(UNAVAILABLE.valuation);
    expect(mockFiguresIn(container.innerHTML)).toEqual([]);
  });
});

describe("/free/tips load when a live source fails", () => {
  const PRICE_GONE = {
    ...liveWithout("price", "cpi", "valuation"),
    asOf: { priceDate: null, cpiMonths: null },
    calculator: { years: null, inflation: "2.30" },
  };

  test.each<[string, () => void, TipsPageData, boolean]>([
    [
      "the price search rejects",
      () => mocks.search.mockRejectedValue(new Error("price down")),
      PRICE_GONE,
      false,
    ],
    [
      "no price is within 7 days",
      () => mocks.search.mockResolvedValue([PRICES[1]]),
      PRICE_GONE,
      false,
    ],
    [
      "the security lookup rejects",
      () =>
        mocks.FetchSecurityProtoByCusip.mockRejectedValue(
          new Error("ledger down")
        ),
      {
        ...liveWithout("security", "price", "cpi", "valuation"),
        asOf: { priceDate: null, cpiMonths: null },
        calculator: { years: null, inflation: "2.30" },
      },
      false,
    ],
    [
      "the CPI-U lookup has no readings",
      () =>
        mocks.fetchCpiReadings.mockResolvedValue({
          readings: null,
          latestMonth: "Jun 2026",
        }),
      {
        ...liveWithout("cpi", "valuation"),
        asOf: { priceDate: "2026-10-23", cpiMonths: null },
      },
      false,
    ],
    [
      "the valuation fails",
      () =>
        mocks.runValuation.mockImplementation((_r: any, cb: Function) =>
          cb({ details: "valuation down" })
        ),
      liveWithout("valuation"),
      true,
    ],
    [
      "the valuation lacks MARKET_VALUE",
      () =>
        mocks.runValuation.mockImplementation((_r: any, cb: Function) =>
          cb(
            null,
            valuationResponse(
              MEASURES.filter(([m]) => m !== MeasureProto.MARKET_VALUE)
            )
          )
        ),
      liveWithout("valuation"),
      true,
    ],
  ])("%s", async (_name, fail, expected, valued) => {
    fail();
    const data = await load();
    expect(data).toEqual(expected);
    expect(
      requests.length > 0 || mocks.runValuation.mock.calls.length > 0
    ).toBe(valued);

    const { container } = render(TipsPage, { props: { data } });
    expect(mockFiguresIn(container.innerHTML)).toEqual([]);
    expect(container.innerHTML).not.toContain("NaN");
  });
});

describe("fetchLatestRealCleanPrice: the 7-day lookback", () => {
  const TODAY = new Date("2026-10-28T09:00:00Z");

  test.each<[string, ReturnType<typeof price>[], unknown]>([
    [
      "a price exactly 7 days old is included",
      [price("2026-10-21T00:00:00Z", "99.1")],
      { value: "99.1", date: "2026-10-21" },
    ],
    [
      "a price 8 days old is excluded",
      [price("2026-10-20T00:00:00Z", "99.1")],
      null,
    ],
    [
      "out of order, the latest wins",
      [
        price("2026-10-24T00:00:00Z", "99.2"),
        price("2026-10-27T00:00:00Z", "99.4"),
        price("2026-10-22T00:00:00Z", "99.3"),
      ],
      { value: "99.4", date: "2026-10-27" },
    ],
    [
      "a future-dated price is ignored",
      [
        price("2026-10-29T00:00:00Z", "99.9"),
        price("2026-10-28T00:00:00Z", "99.5"),
      ],
      { value: "99.5", date: "2026-10-28" },
    ],
  ])("%s", async (_name, prices, expected) => {
    mocks.search.mockResolvedValue(prices);
    expect(
      await fetchLatestRealCleanPrice(SECURITY_UUID, SENTINEL, TODAY)
    ).toEqual(expected);
    expect(mocks.PriceService).toHaveBeenCalledWith(SENTINEL);
  });
});
