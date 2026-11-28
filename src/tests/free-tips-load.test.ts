/**
 * US-298: /free/tips's server load (src/routes/free/tips/+page.server.ts).
 * It runs with no user session on the server-held FT_HOMEPAGE_API_KEY,
 * values the TIPS at the latest FedInvest price within 7 days with that
 * date's CPI-U readings, asks valuation-service for exactly the five page
 * measures and the cashflows (never CLEAN_PRICE), and makes a failed
 * source's sections unavailable without a mock figure. US-311: it asks for
 * ACCRUED_INTEREST in a second call, whose failure leaves the rest showing.
 * US-328: a third call projects the cashflows at CPI-U's latest 12-month
 * change, or none is made and the table names why.
 *
 * The security lookup, price search, CPI-U lookup and valuation call are
 * stubbed; the e2e spec covers the real backend.
 */
import { render, screen, within } from "@testing-library/svelte";
import Decimal from "decimal.js";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  FetchSecurityProtoByCusip: vi.fn(),
  createPriceSearch: vi.fn(),
  search: vi.fn(),
  fetchCpiReadings: vi.fn(),
  fetchLatestCpiChange: vi.fn(),
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
  fetchLatestCpiChange: mocks.fetchLatestCpiChange,
}));
vi.mock("$lib/grpc-auth", () => ({
  getServiceConnection: mocks.getServiceConnection,
}));
vi.mock("$lib/server/closes", async (importOriginal) => ({
  ...(await importOriginal<typeof import("$lib/server/closes")>()),
  createPriceSearch: mocks.createPriceSearch,
}));
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
import { PriceProto } from "@fintekkers/ledger-models/node/fintekkers/models/price/price_pb.js";
import { QueryPriceResponseProto } from "@fintekkers/ledger-models/node/fintekkers/requests/price/query_price_response_pb.js";
import { LocalTimestampProto } from "@fintekkers/ledger-models/node/fintekkers/models/util/local_timestamp_pb.js";
import { Timestamp } from "google-protobuf/google/protobuf/timestamp_pb.js";
import { fromDecimalProto, toDecimalProto } from "$lib/decimal";
import { twelveMonthCpiChange, type CpiReading } from "$lib/cpi";
import {
  NEXT_COUPON_NOTE,
  UNAVAILABLE,
  type TipsPageData,
} from "$lib/free/tips";
import {
  FREE_TIPS_CUSIP,
  FREE_TIPS_MEASURES,
  fetchLatestRealCleanPrice,
  referenceCpiMonths,
} from "$lib/server/free-tips";
import TipsCalculatorDisplay from "../components/free/TipsCalculatorDisplay.svelte";
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

/** A PriceProto as the price Search streams it. */
function price(isoDateTime: string, value: string) {
  const seconds = Date.parse(isoDateTime) / 1000;
  return new PriceProto()
    .setAsOf(
      new LocalTimestampProto().setTimestamp(
        new Timestamp().setSeconds(seconds)
      )
    )
    .setMid(toDecimalProto(value));
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

function cashflow(
  iso: string,
  fv: string,
  extra: { couponRate?: string; indexRatio?: string } = {}
) {
  const [y, m, d] = iso.split("-").map(Number);
  const decimal = (v?: string) =>
    v === undefined ? undefined : toDecimalProto(v);
  return {
    getCashflowDate: () => ({
      getYear: () => y,
      getMonth: () => m,
      getDay: () => d,
    }),
    getFvAmount: () => toDecimalProto(fv),
    getPvAmount: () => toDecimalProto(fv),
    getCouponRate: () => decimal(extra.couponRate),
    getIndexRatio: () => decimal(extra.indexRatio),
  };
}

/**
 * US-328: CPI-U 300.0 in September 2026 against 291.26 in September 2025,
 * 3.0007% a year.
 */
const CPI_HISTORY: CpiReading[] = [
  { year: 2025, month: 9, label: "CPI-U Sep 2025", value: "291.26" },
  { year: 2026, month: 3, label: "CPI-U Mar 2026", value: "296.5" },
  { year: 2026, month: 9, label: "CPI-U Sep 2026", value: "300.0" },
];

/**
 * US-328: the projection call's cashflows, out of date order. The maturity
 * date has the final coupon and, as its own row with coupon_rate unset, the
 * principal. Each fv_amount is a third of a cent over the dollar, so summing
 * before rounding would show $1,258.01, not $1,258.00.
 */
const PROJECTED = [
  cashflow("2035-04-15", "1234.004", { indexRatio: "1.2345678" }),
  cashflow("2027-04-15", "11.004", {
    couponRate: "2.125",
    indexRatio: "1.0571234",
  }),
  cashflow("2035-04-15", "13.004", {
    couponRate: "2.125",
    indexRatio: "1.2345678",
  }),
];

function projectionResponse(cashflows: unknown[] = PROJECTED) {
  return { getMeasureResultsList: () => [], getCashflowsList: () => cashflows };
}

/** ACCRUED_INTEREST for the accrual call: "$7.43" in LIVE. */
const ACCRUED = "7.4321";

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

/** Whether `request` is the accrual call: it asks for ACCRUED_INTEREST. */
function isAccrual(request: any): boolean {
  return request.getMeasuresList().includes(MeasureProto.ACCRUED_INTEREST);
}

/** Whether `request` is the projection call: it carries an assumed rate. */
function isProjection(request: any): boolean {
  return !!request.getProductInput().getTips()?.hasAssumedInflationRate();
}

function isMain(request: any): boolean {
  return !isAccrual(request) && !isProjection(request);
}

/** Answers the main call with `main`, the accrual call with `accrual` and
 * the projection call with `projection`. */
function answer(
  main: () => [unknown, unknown?],
  accrual: () => [unknown, unknown?] = () => [
    null,
    valuationResponse([[MeasureProto.ACCRUED_INTEREST, ACCRUED]]),
  ],
  projection: () => [unknown, unknown?] = () => [null, projectionResponse()]
) {
  mocks.runValuation.mockImplementation((request: any, callback: Function) => {
    requests.push(request);
    callback(
      ...(isAccrual(request)
        ? accrual()
        : isProjection(request)
        ? projection()
        : main())
    );
  });
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
  // One response holding whatever mocks.search resolves to.
  mocks.createPriceSearch.mockImplementation(() => async (request: unknown) => [
    new QueryPriceResponseProto().setPriceResponseList(
      await mocks.search(request)
    ),
  ]);
  mocks.search.mockResolvedValue(PRICES);
  mocks.fetchCpiReadings.mockResolvedValue({
    readings: READINGS,
    latestMonth: null,
  });
  mocks.fetchLatestCpiChange.mockResolvedValue(
    twelveMonthCpiChange(CPI_HISTORY)
  );
  answer(() => [null, valuationResponse()]);
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
    ...mocks.createPriceSearch.mock.calls.map((c) => c[0]),
    ...mocks.fetchCpiReadings.mock.calls.map((c) => c[1]),
    ...mocks.fetchLatestCpiChange.mock.calls.map((c) => c[0]),
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

  test("the next coupon is the earliest cashflow, dated with its pay date", async () => {
    const data = await load();
    expect(data.valuation.ok && data.valuation.data).toMatchObject({
      nextCoupon: "$10.92",
      nextCouponDate: "April 15, 2027",
    });
  });

  test("with no cashflows, the next coupon and its date are null", async () => {
    answer(() => [
      null,
      { ...valuationResponse(), getCashflowsList: () => [] },
    ]);
    const data = await load();
    expect(data.valuation.ok && data.valuation.data).toMatchObject({
      nextCoupon: null,
      nextCouponDate: null,
    });
  });

  test("the valuation asks for the five measures and the cashflows, never CLEAN_PRICE", async () => {
    await load();
    expect(requests).toHaveLength(3);
    const measures = requests.find(isMain).getMeasuresList();
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
    expect(measures).not.toContain(MeasureProto.ACCRUED_INTEREST);
  });

  test("the valuation uses the FedInvest price, settles on its date and sends that date's CPI-U readings", async () => {
    await load();
    expect(mocks.fetchCpiReadings).toHaveBeenCalledWith("2026-10-23", SENTINEL);
    const request = requests.find(isMain);
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
    for (const section of [
      "security",
      "price",
      "cpi",
      "valuation",
      "projection",
    ] as const) {
      expect(data[section].ok, section).toBe(false);
    }
    expect(mocks.getServiceConnection).not.toHaveBeenCalled();
    expect(mocks.FetchSecurityProtoByCusip).not.toHaveBeenCalled();
    expect(mocks.createPriceSearch).not.toHaveBeenCalled();
    expect(mocks.fetchCpiReadings).not.toHaveBeenCalled();
    expect(mocks.fetchLatestCpiChange).not.toHaveBeenCalled();

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

describe("US-311: /free/tips accrued interest and full value", () => {
  /** The load's valuation figures, or a failure. */
  async function valuation() {
    const data = await load();
    if (!data.valuation.ok) throw new Error(data.valuation.message);
    return data.valuation.data;
  }

  const UNCHANGED = LIVE.valuation.ok && {
    marketValue: LIVE.valuation.data.marketValue,
    indexRatio: LIVE.valuation.data.indexRatio,
    adjustedPrincipal: LIVE.valuation.data.adjustedPrincipal,
    referenceCpi: LIVE.valuation.data.referenceCpi,
    realYield: LIVE.valuation.data.realYield,
    nextCoupon: LIVE.valuation.data.nextCoupon,
  };

  test("asks for ACCRUED_INTEREST alone, on the main call's inputs", async () => {
    await load();
    const accrual = requests.filter(isAccrual);
    expect(accrual).toHaveLength(1);
    expect(accrual[0].getMeasuresList()).toEqual([
      MeasureProto.ACCRUED_INTEREST,
    ]);
    // Same price, settlement date, CPI-U readings, security and quantity:
    // everything but the measures.
    const inputs = (request: any) => {
      const { measuresList: _, ...rest } = request.toObject();
      return rest;
    };
    expect(inputs(accrual[0])).toEqual(inputs(requests.find(isMain)));
  });

  test("passes ACCRUED_INTEREST through unchanged: 5.987 shows $5.99", async () => {
    answer(
      () => [null, valuationResponse()],
      () => [
        null,
        valuationResponse([[MeasureProto.ACCRUED_INTEREST, "5.987"]]),
      ]
    );
    expect(await valuation()).toMatchObject({
      ...UNCHANGED,
      accruedInterest: "$5.99",
      // 1011.5298 → 1,011.53, plus 5.99.
      fullValue: "$1,017.52",
    });
  });

  test("sums clean and accrued after rounding each to cents", async () => {
    // Cents first: 969.36 + 5.99 = 975.35. The raw sum, 969.355 + 5.985 =
    // 975.340, would show $975.34: the tiles would not add up.
    answer(
      () => [
        null,
        valuationResponse(
          MEASURES.map(([m, v]) => [
            m,
            m === MeasureProto.MARKET_VALUE ? "969.355" : v,
          ])
        ),
      ],
      () => [
        null,
        valuationResponse([[MeasureProto.ACCRUED_INTEREST, "5.985"]]),
      ]
    );
    expect(await valuation()).toMatchObject({
      marketValue: "$969.36",
      accruedInterest: "$5.99",
      fullValue: "$975.35",
    });
  });

  test.each<[string, () => [unknown, unknown?]]>([
    [
      "the accrual response lacks ACCRUED_INTEREST",
      () => [null, valuationResponse([])],
    ],
    ["the accrual call is rejected", () => [{ details: "accrual down" }]],
  ])(
    "when %s, accrued and full are null and the rest still shows",
    async (_name, accrual) => {
      answer(() => [null, valuationResponse()], accrual);
      const data = await load();
      expect(data.valuation).toEqual({
        ok: true,
        data: LIVE.valuation.ok && {
          ...LIVE.valuation.data,
          accruedInterest: null,
          fullValue: null,
        },
      });

      const { container } = render(TipsPage, { props: { data } });
      expect(mockFiguresIn(container.innerHTML)).toEqual([]);
      expect(container.innerHTML).not.toContain("NaN");
    }
  );
});

describe("US-328: /free/tips projected cashflows", () => {
  /** The projected cashflows table, found by its title. */
  function flowsTable() {
    return screen.getByRole("region", { name: "Projected cashflows" });
  }

  /** Each body row's cells, as text. */
  function bodyCells(): string[][] {
    return within(flowsTable())
      .getAllByRole("row")
      .slice(1)
      .map((row) =>
        within(row)
          .getAllByRole("cell")
          .map((cell) => cell.textContent ?? "")
      );
  }

  test("sends CPI-U's 12-month change at full precision, in percent a year, for PRESENT_VALUE_CASHFLOWS alone", async () => {
    await load();
    const projection = requests.filter(isProjection);
    expect(projection).toHaveLength(1);
    expect(projection[0].getMeasuresList()).toEqual([
      MeasureProto.PRESENT_VALUE_CASHFLOWS,
    ]);
    // product_inputs.proto: "Assumed annual inflation rate, in percent a
    // year (3.0 = 3% a year)". 300.0 / 291.26 - 1, unrounded: not "3.0".
    const rate = fromDecimalProto(
      projection[0].getProductInput().getTips().getAssumedInflationRate()
    );
    expect(rate).toBe(
      new Decimal("300.0").dividedBy("291.26").minus(1).times(100).toFixed()
    );
    expect(rate).not.toBe("3.0");
    expect(new Decimal(rate!).toFixed(1)).toBe("3.0");
  });

  test("the main and accrual calls are unchanged: no assumed rate, the main measures as before", async () => {
    await load();
    const main = requests.filter(isMain);
    const accrual = requests.filter(isAccrual);
    expect(main).toHaveLength(1);
    expect(accrual).toHaveLength(1);
    for (const request of [...main, ...accrual]) {
      expect(
        request.getProductInput().getTips().hasAssumedInflationRate()
      ).toBe(false);
    }
    expect(main[0].getMeasuresList()).toEqual(FREE_TIPS_MEASURES);
  });

  test("fills one row per returned cashflow, the principal its own row, and totals the rounded totals", async () => {
    const data = await load();
    expect(data.projection).toEqual(LIVE.projection);

    render(TipsCalculatorDisplay, { props: { data } });
    // By date; on the maturity date the final coupon, then the principal.
    // Each figure is the row's own fv_amount and index_ratio: nothing summed.
    expect(bodyCells()).toEqual([
      ["Apr 15, 2027", "1.05712", "$11.00", "—", "$11.00"],
      ["Apr 15, 2035", "1.23457", "$13.00", "—", "$13.00"],
      ["Apr 15, 2035", "1.23457", "—", "$1,234.00", "$1,234.00"],
    ]);
    // 11.00 + 13.00 + 1,234.00; the raw 1,258.012 would read $1,258.01.
    expect(screen.getByText("$1,258.00")).toBeInTheDocument();
    expect(screen.getByText(/^Total received:/)).toHaveTextContent(
      "Total received: $1,258.00"
    );
    expect(
      screen.getByText(
        "Assumes CPI-U keeps rising 3.0% a year, its change over the 12 months to September 2026."
      )
    ).toBeInTheDocument();
    expect(screen.getByText(NEXT_COUPON_NOTE)).toBeInTheDocument();
    expect(screen.queryByText(/Treasury's official TIPS index/)).toBeNull();
  });

  test("no BLS reading for October 2025: Treasury's 325.604 stands in, and the note says so", async () => {
    mocks.fetchLatestCpiChange.mockResolvedValue(
      twelveMonthCpiChange([
        { year: 2025, month: 9, label: "CPI-U Sep 2025", value: "324.8" },
        { year: 2025, month: 11, label: "CPI-U Nov 2025", value: "324.1" },
        { year: 2026, month: 10, label: "CPI-U Oct 2026", value: "334.2" },
      ])
    );
    const data = await load();
    const projection = requests.filter(isProjection);
    expect(projection).toHaveLength(1);
    expect(
      fromDecimalProto(
        projection[0].getProductInput().getTips().getAssumedInflationRate()
      )
    ).toBe(
      new Decimal("334.2").dividedBy("325.604").minus(1).times(100).toFixed()
    );

    render(TipsCalculatorDisplay, { props: { data } });
    expect(
      screen.getByText(
        "Assumes CPI-U keeps rising 2.6% a year, its change over the 12 months to October 2026."
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "October 2025 uses Treasury's official TIPS index (325.604), as BLS published no October 2025 CPI."
      )
    ).toBeInTheDocument();
  });

  test("CPI-U has no reading a year before its latest month: no projection call, and the table says why", async () => {
    // March 2025 is older than a year; it never stands in for September 2025.
    mocks.fetchLatestCpiChange.mockResolvedValue(
      twelveMonthCpiChange([
        { year: 2025, month: 3, label: "CPI-U Mar 2025", value: "288.0" },
        ...CPI_HISTORY.slice(1),
      ])
    );
    const data = await load();
    expect(requests.filter(isProjection)).toHaveLength(0);
    expect(requests).toHaveLength(2);
    expect(data.valuation).toEqual(LIVE.valuation);

    const { container } = render(TipsCalculatorDisplay, { props: { data } });
    const message =
      "Unavailable: CPI-U has no reading for September 2025, a year before its latest month, so there is no 12-month inflation rate.";
    expect(data.projection).toEqual({ ok: false, message });
    expect(within(flowsTable()).getByText(message)).toHaveAttribute(
      "colspan",
      "5"
    );
    expect(screen.queryByText(/doesn't take yet/)).toBeNull();
    expect(container.textContent).not.toContain("Assumes CPI-U");
    expect(container).toHaveTextContent(`Total received: ${UNAVAILABLE.value}`);
  });

  test("CPI-U's latest month is unknown or its lookup failed: no projection call, the generic message", async () => {
    mocks.fetchLatestCpiChange.mockResolvedValue({
      ok: false,
      reason: "no-latest",
    });
    const data = await load();
    expect(requests.filter(isProjection)).toHaveLength(0);
    expect(data.projection).toEqual({
      ok: false,
      message: "Projected cashflows are unavailable right now.",
    });
    render(TipsCalculatorDisplay, { props: { data } });
    expect(
      within(flowsTable()).getByText(UNAVAILABLE.projection)
    ).toBeInTheDocument();
    expect(screen.queryByText(/doesn't take yet/)).toBeNull();
  });

  test("valuation-service returns no cashflows: the table says so", async () => {
    answer(
      () => [null, valuationResponse()],
      undefined,
      () => [null, projectionResponse([])]
    );
    const data = await load();
    expect(requests.filter(isProjection)).toHaveLength(1);
    const message =
      "Unavailable: the valuation service returned no projected cashflows.";
    expect(data.projection).toEqual({ ok: false, message });

    render(TipsCalculatorDisplay, { props: { data } });
    expect(within(flowsTable()).getByText(message)).toBeInTheDocument();
    expect(screen.queryByText(/doesn't take yet/)).toBeNull();
    expect(screen.queryByText(/^Assumes CPI-U/)).toBeNull();
  });
});

describe("/free/tips load when a live source fails", () => {
  const PRICE_GONE = {
    ...liveWithout("price", "cpi", "valuation", "projection"),
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
        ...liveWithout("security", "price", "cpi", "valuation", "projection"),
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
        ...liveWithout("cpi", "valuation", "projection"),
        asOf: { priceDate: "2026-10-23", cpiMonths: null },
      },
      false,
    ],
    [
      "the valuation fails",
      () => answer(() => [{ details: "valuation down" }]),
      liveWithout("valuation"),
      true,
    ],
    [
      "the valuation lacks MARKET_VALUE",
      () =>
        answer(() => [
          null,
          valuationResponse(
            MEASURES.filter(([m]) => m !== MeasureProto.MARKET_VALUE)
          ),
        ]),
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
    expect(mocks.createPriceSearch).toHaveBeenCalledWith(SENTINEL);
  });
});

describe("US-312: referenceCpiMonths, the CPI-U months behind a reference CPI", () => {
  test.each([
    ["2026-11-06", "August–September 2026"],
    ["2026-01-15", "October–November 2025"],
    ["2026-10-23", "July–August 2026"],
    ["2025-04-15", "January–February 2025"],
    ["2026-03-01", "December 2025–January 2026"],
    ["2026-02-28", "November–December 2025"],
  ])("%s → %s", (date, months) => {
    expect(referenceCpiMonths(date)).toBe(months);
  });
});
