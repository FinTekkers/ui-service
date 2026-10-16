/**
 * US-229: the TIPS Pricer's Current CPI comes from the price service's
 * CPI-U NSA readings (SERIES_ID CUUR0000SA0) for months m-3 and m-2, read
 * with the existing price `Search`, and valuation-service turns them into
 * REFERENCE_CPI. Covers the month windows, series selection, the page
 * `load` (lookup, preview, manual override, service down) and that only
 * `search` is ever called on the price and security services.
 *
 * @vitest-environment node
 */
import { beforeEach, describe, expect, test, vi } from "vitest";

const SERIES_UUID = "11111111-1111-4111-8111-111111111111";
const DECOY_UUID = "22222222-2222-4222-8222-222222222222";

// Price rows by series UUID: { at: ISO instant, value }.
const priceRows: Record<string, { at: string; value: string }[]> = {};
const priceRequests: any[] = [];
const priceMethodsUsed: string[] = [];
const securityMethodsUsed: string[] = [];
const valuationRequests: any[] = [];
let priceServiceDown = false;
let securityServiceDown = false;
let referenceCpiResponse = "321.46512";

function recordingProxy<T extends object>(target: T, log: string[]): T {
  return new Proxy(target, {
    get(t, prop) {
      if (typeof prop === "string") log.push(prop);
      return (t as any)[prop];
    },
  });
}

vi.mock(
  "@fintekkers/ledger-models/node/fintekkers/services/price-service/price_service_grpc_pb.js",
  async () => {
    const { EventEmitter } = await import("events");
    const { UUID } = await import(
      "@fintekkers/ledger-models/node/wrappers/models/utils/uuid"
    );
    const { toDecimalProto } = await import("$lib/decimal");
    return {
      PriceClient: vi.fn().mockImplementation(() =>
        recordingProxy(
          {
            search: (request: any) => {
              priceRequests.push(request);
              const stream = new EventEmitter();
              setTimeout(() => {
                if (priceServiceDown) {
                  stream.emit("error", { details: "price service down" });
                  return;
                }
                const bytes = Buffer.from(request.serializeBinary());
                const uuid = [SERIES_UUID, DECOY_UUID].find((u) =>
                  bytes.includes(Buffer.from(UUID.fromString(u)))
                );
                const rows = (uuid && priceRows[uuid]) || [];
                stream.emit("data", {
                  getPriceResponseList: () =>
                    rows.map((r) => ({
                      getAsOf: () => ({
                        getTimestamp: () => ({
                          getSeconds: () => Date.parse(r.at) / 1000,
                        }),
                      }),
                      getPrice: () => toDecimalProto(r.value),
                    })),
                });
                stream.emit("end");
              }, 0);
              return stream;
            },
          },
          priceMethodsUsed
        )
      ),
    };
  }
);

vi.mock(
  "@fintekkers/ledger-models/node/wrappers/services/security-service/SecurityService",
  async () => {
    const { ProductTypeProto } = await import(
      "@fintekkers/ledger-models/node/fintekkers/models/security/product_type_pb.js"
    );
    const { IdentifierTypeProto } = await import(
      "@fintekkers/ledger-models/node/fintekkers/models/security/identifier/identifier_type_pb.js"
    );
    const { IdentifierProto } = await import(
      "@fintekkers/ledger-models/node/fintekkers/models/security/identifier/identifier_pb.js"
    );
    const series = (uuid: string, seriesId: string) => ({
      proto: {
        getProductType: () => ProductTypeProto.CPI_SERIES,
        getIdentifiersList: () => [
          new IdentifierProto()
            .setIdentifierType(IdentifierTypeProto.SERIES_ID)
            .setIdentifierValue(seriesId),
        ],
      },
      getID: () => ({ toString: () => uuid }),
    });
    return {
      SecurityService: vi.fn().mockImplementation(() =>
        recordingProxy(
          {
            searchSecurityAsOfNow: async () => {
              if (securityServiceDown) throw new Error("security down");
              // The decoy is a CPI_U-indexed series too (CPI-U SA), listed
              // first so a match on index type would pick it.
              return [
                series(DECOY_UUID, "CUSR0000SA0"),
                series(SERIES_UUID, "CUUR0000SA0"),
              ];
            },
          },
          securityMethodsUsed
        )
      ),
    };
  }
);

// The TIPS itself, for CUSIP mode.
vi.mock(
  "@fintekkers/ledger-models/node/fintekkers/services/security-service/security_service_grpc_pb.js",
  async () => {
    const { EventEmitter } = await import("events");
    const { Decimal } = await import("decimal.js");
    const TIPSBond = (
      await import(
        "@fintekkers/ledger-models/node/wrappers/models/security/TIPSBond"
      )
    ).default;
    const { CouponTypeProto } = await import(
      "@fintekkers/ledger-models/node/fintekkers/models/security/coupon_type_pb.js"
    );
    const { CouponFrequencyProto } = await import(
      "@fintekkers/ledger-models/node/fintekkers/models/security/coupon_frequency_pb.js"
    );
    const index_type_pkg = (
      await import(
        "@fintekkers/ledger-models/node/fintekkers/models/security/index/index_type_pb.js"
      )
    ).default;
    return {
      SecurityClient: vi.fn().mockImplementation(() =>
        recordingProxy(
          {
            search: () => {
              const stream = new EventEmitter();
              const tips = TIPSBond.fromPricerInputs({
                faceValue: new Decimal("1000"),
                couponRate: new Decimal("0.625"),
                couponType: CouponTypeProto.FIXED,
                couponFrequency: CouponFrequencyProto.SEMIANNUALLY,
                issueDate: new Date("2020-01-15"),
                maturityDate: new Date("2030-01-15"),
                baseCpi: new Decimal("256.394"),
                indexDate: new Date("2020-01-15"),
                inflationIndexType: index_type_pkg.IndexTypeProto.CPI_U,
              });
              setTimeout(() => {
                stream.emit("data", { getSecurityResponseList: () => [tips] });
                stream.emit("end");
              }, 0);
              return stream;
            },
          },
          securityMethodsUsed
        )
      ),
    };
  }
);

vi.mock(
  "@fintekkers/ledger-models/node/fintekkers/services/valuation-service/valuation_service_grpc_pb.js",
  async () => {
    const { toDecimalProto } = await import("$lib/decimal");
    return {
      ValuationClient: vi.fn().mockImplementation(() => ({
        runValuation: (request: any, callback: Function) => {
          valuationRequests.push(request);
          callback(null, {
            getMeasureResultsList: () => [
              {
                getMeasure: () => 28, // REFERENCE_CPI
                getMeasureDecimalValue: () =>
                  toDecimalProto(referenceCpiResponse),
              },
              {
                getMeasure: () => 29, // INDEX_RATIO
                getMeasureDecimalValue: () => toDecimalProto("1.07486"),
              },
            ],
            getCashflowsList: () => [],
          });
        },
      })),
    };
  }
);

vi.mock("$lib/grpc-auth", () => ({
  getServiceConnection: vi
    .fn()
    .mockReturnValue({ url: "localhost:80", credentials: {} }),
}));

vi.mock("$lib/security", async (importOriginal) => ({
  ...(await importOriginal<typeof import("$lib/security")>()),
  FetchSecurity: vi.fn().mockResolvedValue([]),
}));

import { fromDecimalProto } from "$lib/decimal";
import {
  CPI_U_NSA_SERIES_ID,
  cpiReadingLabel,
  fetchCpiReadings,
  monthWindow,
  readingMonthsFor,
} from "$lib/cpi";
import { load } from "../routes/(authenticated)/data/calculators/+page.server";

function runLoad(query: Record<string, string>) {
  const qs = new URLSearchParams({ tab: "tips", ...query }).toString();
  return (load as any)({
    locals: { user: { apiKey: "test-key" } },
    request: { url: `http://localhost/data/calculators?${qs}` },
  });
}

const CUSIP_QUERY = {
  tipsMode: "cusip",
  tipsCusip: "912810RL4",
  settlementDate: "2026-10-15", // m-3 = Jul 2026, m-2 = Aug 2026
};

const JUL_AUG_ROWS = [
  // CPI rows are stamped 08:30 America/New_York on the 1st (MDI-72).
  { at: "2026-07-01T12:30:00Z", value: "322.132" },
  { at: "2026-08-01T12:30:00Z", value: "322.551" },
];

function readingsSent(request: any) {
  return request
    .getProductInput()
    .getTips()
    .getCpi()
    .getReadings()
    .getReadingsList()
    .map((r: any) => ({
      year: r.getYear(),
      month: r.getMonth(),
      value: fromDecimalProto(r.getValue()),
    }));
}

beforeEach(() => {
  for (const k of Object.keys(priceRows)) delete priceRows[k];
  priceRequests.length = 0;
  priceMethodsUsed.length = 0;
  securityMethodsUsed.length = 0;
  valuationRequests.length = 0;
  priceServiceDown = false;
  securityServiceDown = false;
  referenceCpiResponse = "321.46512";
});

describe("US-229: whole-month windows for m-3 and m-2", () => {
  test.each([
    ["2026-11-14", [2026, 8], [2026, 9]],
    ["2027-01-15", [2026, 10], [2026, 11]], // year boundary
    ["2026-11-01", [2026, 8], [2026, 9]],
    ["2026-11-30", [2026, 8], [2026, 9]], // last day = same months as the 1st
    ["2026-03-31", [2025, 12], [2026, 1]],
  ])("%s reads %j and %j", (date, m3, m2) => {
    const [a, b] = readingMonthsFor(date);
    expect([a.year, a.month]).toEqual(m3);
    expect([b.year, b.month]).toEqual(m2);
  });

  test("2026-11-14: windows are [2026-08-01, 2026-09-01) and [2026-09-01, 2026-10-01)", () => {
    const iso = (ms: number) => new Date(ms).toISOString().slice(0, 10);
    const [a, b] = readingMonthsFor("2026-11-14").map(monthWindow);
    expect([iso(a.start), iso(a.end)]).toEqual(["2026-08-01", "2026-09-01"]);
    expect([iso(b.start), iso(b.end)]).toEqual(["2026-09-01", "2026-10-01"]);
  });

  test("2027-01-15: windows and labels cross the year boundary", () => {
    const iso = (ms: number) => new Date(ms).toISOString().slice(0, 10);
    const months = readingMonthsFor("2027-01-15");
    expect(
      months.map(monthWindow).map((w) => [iso(w.start), iso(w.end)])
    ).toEqual([
      ["2026-10-01", "2026-11-01"],
      ["2026-11-01", "2026-12-01"],
    ]);
    expect(months.map(cpiReadingLabel)).toEqual([
      "CPI-U Oct 2026",
      "CPI-U Nov 2026",
    ]);
  });

  test("labels are by month only", () => {
    expect(cpiReadingLabel({ year: 2026, month: 7 })).toBe("CPI-U Jul 2026");
  });
});

describe("US-229: fetchCpiReadings", () => {
  test("selects CUUR0000SA0 by SERIES_ID; the decoy CPI_U series is never queried", async () => {
    priceRows[SERIES_UUID] = JUL_AUG_ROWS;
    priceRows[DECOY_UUID] = [
      { at: "2026-07-01T12:30:00Z", value: "999.000" },
      { at: "2026-08-01T12:30:00Z", value: "999.000" },
    ];
    const { UUID } = await import(
      "@fintekkers/ledger-models/node/wrappers/models/utils/uuid"
    );
    const lookup = await fetchCpiReadings("2026-10-15");
    expect(CPI_U_NSA_SERIES_ID).toBe("CUUR0000SA0");
    expect(lookup.readings).toEqual([
      { year: 2026, month: 7, label: "CPI-U Jul 2026", value: "322.132" },
      { year: 2026, month: 8, label: "CPI-U Aug 2026", value: "322.551" },
    ]);
    const decoy = Buffer.from(UUID.fromString(DECOY_UUID));
    expect(priceRequests.length).toBe(2);
    for (const r of priceRequests) {
      expect(Buffer.from(r.serializeBinary()).includes(decoy)).toBe(false);
      expect(r.hasDateRange()).toBe(true);
    }
  });

  test("window edges: a row on the 1st is in its month, one on the next 1st is not; two rows send one reading", async () => {
    priceRows[SERIES_UUID] = [
      // Jul: an old 00:00Z duplicate and the 08:30 New York row.
      { at: "2026-07-01T00:00:00Z", value: "322.000" },
      { at: "2026-07-01T12:30:00Z", value: "322.132" },
      // Aug: only a row on 1 Sep 00:00Z, which belongs to Sep.
      { at: "2026-09-01T00:00:00Z", value: "323.000" },
    ];
    const lookup = await fetchCpiReadings("2026-10-15");
    expect(lookup.readings).toBeNull();

    priceRows[SERIES_UUID].push({
      at: "2026-08-01T00:00:00Z",
      value: "322.551",
    });
    const again = await fetchCpiReadings("2026-10-15");
    expect(again.readings?.map((r) => [r.label, r.value])).toEqual([
      ["CPI-U Jul 2026", "322.132"],
      ["CPI-U Aug 2026", "322.551"],
    ]);
  });

  test("only one of m-3 / m-2: no readings, latest loaded month reported", async () => {
    priceRows[SERIES_UUID] = [{ at: "2026-07-01T12:30:00Z", value: "322.132" }];
    const lookup = await fetchCpiReadings("2026-10-15");
    expect(lookup).toEqual({ readings: null, latestMonth: "Jul 2026" });
  });

  test("price service down: no readings, latest month unknown", async () => {
    priceServiceDown = true;
    expect(await fetchCpiReadings("2026-10-15")).toEqual({
      readings: null,
      latestMonth: null,
    });
  });
});

describe("US-229: calculators load, TIPS Current CPI", () => {
  test("M1: readings for m-3 and m-2 → returned REFERENCE_CPI, from price service", async () => {
    priceRows[SERIES_UUID] = JUL_AUG_ROWS;
    const data = await runLoad({
      ...CUSIP_QUERY,
      tipsPrice: "98.5",
      cpiPreview: "1",
    });
    expect(data.tipsResult).toBeNull();
    expect(data.tipsCpi).toEqual({
      source: "price-service",
      value: "321.46512",
      readings: [
        { year: 2026, month: 7, label: "CPI-U Jul 2026", value: "322.132" },
        { year: 2026, month: 8, label: "CPI-U Aug 2026", value: "322.551" },
      ],
      note: null,
    });
    expect(valuationRequests.length).toBe(1);
    const req = valuationRequests[0];
    expect(req.getMeasuresList()).toEqual([28]);
    expect(readingsSent(req)).toEqual([
      { year: 2026, month: 7, value: "322.132" },
      { year: 2026, month: 8, value: "322.551" },
    ]);
  });

  test("M1: without a Price there is no REFERENCE_CPI call (valuation needs clean_price)", async () => {
    priceRows[SERIES_UUID] = JUL_AUG_ROWS;
    const data = await runLoad(CUSIP_QUERY);
    expect(data.tipsCpi.source).toBe("price-service");
    expect(data.tipsCpi.value).toBe("");
    expect(valuationRequests.length).toBe(0);
  });

  test("M1/M4: Calculate sends the readings and the settlement date; the field shows REFERENCE_CPI", async () => {
    priceRows[SERIES_UUID] = JUL_AUG_ROWS;
    const data = await runLoad({ ...CUSIP_QUERY, tipsPrice: "98.5" });
    expect(data.tipsResult.error).toBeUndefined();
    expect(data.tipsResult.cpiSource).toBe("Price service");
    expect(data.tipsResult.indexRatio).toBe("1.07486");
    expect(data.tipsCpi.value).toBe("321.46512");
    const req = valuationRequests[0];
    expect(
      new Date(
        req.getAsofDatetime().getTimestamp().getSeconds() * 1000
      ).toISOString()
    ).toBe("2026-10-15T00:00:00.000Z");
    expect(readingsSent(req).length).toBe(2);
  });

  test("M2: no reading → empty, manual entry, exact note, no REFERENCE_CPI call", async () => {
    priceRows[SERIES_UUID] = [{ at: "2026-08-01T12:30:00Z", value: "322.551" }];
    const data = await runLoad({
      ...CUSIP_QUERY,
      settlementDate: "2026-12-01",
      tipsPrice: "98.5",
      cpiPreview: "1",
    });
    expect(data.tipsCpi).toEqual({
      source: "manual",
      value: "",
      readings: [],
      note: "No CPI-U reading for 2026-12-01 in the price service (latest loaded: Aug 2026). Enter it to calculate. It is not saved.",
    });
    expect(valuationRequests.length).toBe(0);
  });

  test("M2: security service down → page renders, manual, latest loaded: unknown", async () => {
    securityServiceDown = true;
    const data = await runLoad(CUSIP_QUERY);
    expect(data.activeTab).toBe("tips");
    expect(data.tipsCpi.source).toBe("manual");
    expect(data.tipsCpi.note).toContain("(latest loaded: unknown)");
  });

  test("M2: price service down → page renders, manual, latest loaded: unknown", async () => {
    priceServiceDown = true;
    const data = await runLoad(CUSIP_QUERY);
    expect(data.tipsCpi.source).toBe("manual");
    expect(data.tipsCpi.note).toBe(
      "No CPI-U reading for 2026-10-15 in the price service (latest loaded: unknown). Enter it to calculate. It is not saved."
    );
  });

  test("M3: currentCpiSource=manual → no lookup; reference_cpi sent, no readings; CPI source Manual entry", async () => {
    priceRows[SERIES_UUID] = JUL_AUG_ROWS;
    const data = await runLoad({
      ...CUSIP_QUERY,
      tipsPrice: "98.5",
      currentCpi: "330.5",
      currentCpiSource: "manual",
    });
    expect(priceRequests.length).toBe(0);
    expect(securityMethodsUsed).not.toContain("searchSecurityAsOfNow");
    expect(data.tipsCpi).toBeNull();
    expect(valuationRequests.length).toBe(1); // Calculate only, no preview
    const cpi = valuationRequests[0].getProductInput().getTips().getCpi();
    expect(cpi.hasReadings()).toBe(false);
    expect(fromDecimalProto(cpi.getReferenceCpi())).toBe("330.5");
    expect(data.tipsResult.cpiSource).toBe("Manual entry");
  });

  test("an invalid settlement date runs no lookup", async () => {
    const data = await runLoad({
      ...CUSIP_QUERY,
      settlementDate: "2026-02-30",
    });
    expect(data.tipsCpi).toBeNull();
    expect(priceRequests.length).toBe(0);
  });

  test("guardrail: only search is called on the price and security services, also on a manual Calculate", async () => {
    priceRows[SERIES_UUID] = [{ at: "2026-07-01T12:30:00Z", value: "322.132" }];
    await runLoad({ ...CUSIP_QUERY, tipsPrice: "98.5", cpiPreview: "1" });
    await runLoad({
      ...CUSIP_QUERY,
      tipsPrice: "98.5",
      currentCpi: "330.5",
      currentCpiSource: "manual",
    });
    await runLoad({ ...CUSIP_QUERY, tipsPrice: "98.5", currentCpi: "330.5" });
    expect(priceMethodsUsed.length).toBeGreaterThan(0);
    expect(new Set(priceMethodsUsed)).toEqual(new Set(["search"]));
    expect(new Set(securityMethodsUsed.filter((m) => m !== "then"))).toEqual(
      new Set(["searchSecurityAsOfNow", "search"])
    );
  });
});
