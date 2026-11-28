/**
 * US-354: /free/corporate-bond/crwv-2030's server load
 * (src/lib/server/free-corporate-bond.ts), with the ISIN lookup and the
 * valuation calls injected.
 * - A blank, zero, negative, over-200 or non-numeric price, or a bad trade
 *   date, is a field error and makes no call; no price at all values the
 *   example price.
 * - valuation-service's strings reach the page data verbatim (no maths);
 *   a missing DV01 is unavailable, never derived.
 * - A failed or late main call makes the calculator and the sweep
 *   unavailable with no numbers; a failed sweep point only the sweep.
 * - The sweep marks the visitor's price once, at the calculator's yield.
 */
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  test,
  vi,
  type Mock,
} from "vitest";
import measure_pkg from "@fintekkers/ledger-models/node/fintekkers/models/position/measure_pb.js";
import type { SecurityProto } from "@fintekkers/ledger-models/node/fintekkers/models/security/security_pb.js";
import type { BondMeasuresResult, CashflowEntry } from "$lib/valuation";
import {
  CALC_FACE,
  CRWV_MEASURES,
  DV01_FACE,
  DV01_MEASURES,
  LOAD_BUDGET_MS,
  SWEEP_MEASURES,
  fetchFreeCorporateBond,
  newYorkToday,
  type CorporateBondDeps,
} from "$lib/server/free-corporate-bond";
import {
  CRWV_ISIN,
  DEFAULT_CLEAN_PRICE,
  PRICE_ERROR,
  SWEEP_PRICES,
  TRADE_DATE_ERROR,
  UNAVAILABLE,
} from "$lib/free/corporateBond";
import { crwvSecurityProto } from "../../scripts/lib/seed-crwv-2030";

const { MeasureProto } = measure_pkg;

const KEY = "test-key";
const NOW = new Date("2026-11-28T15:00:00Z");
const TRADE = "2026-11-25";

// Distinctive strings: any arithmetic or rounding on the way to the page
// data would change them.
const SENTINEL = {
  accrued: "4.52222222222222222217",
  dirty: "85.89722222222222222213",
  ytm: "0.16439983077561642311",
  macaulay: "2.86271906426177853519",
  modified: "2.64527747928710399711",
  convexity: "9.30767467174402624419",
  dv01: "227.22198747776421367513",
};
const CASHFLOWS: CashflowEntry[] = [
  ...[
    "2026-12-01",
    "2027-06-01",
    "2027-12-01",
    "2028-06-01",
    "2028-12-01",
    "2029-06-01",
    "2029-12-01",
    "2030-06-01",
  ].map((date, i) => ({
    date,
    fvAmount: "46.2500",
    pvAmount: `4${i}.1234567890123${i}`,
    couponRate: "9.2500",
  })),
  { date: "2030-06-01", fvAmount: "1000", pvAmount: "574.2290265089666382" },
];

function mainResult(
  overrides: Partial<Record<keyof typeof SENTINEL, string | undefined>> = {}
): BondMeasuresResult {
  const v = { ...SENTINEL, ...overrides };
  return {
    settlementDate: "2026-11-27",
    values: new Map<number, string | undefined>(
      [
        [MeasureProto.ACCRUED_INTEREST, v.accrued],
        [MeasureProto.DIRTY_PRICE, v.dirty],
        [MeasureProto.YIELD_TO_MATURITY, v.ytm],
        [MeasureProto.MACAULAY_DURATION, v.macaulay],
        [MeasureProto.MODIFIED_DURATION, v.modified],
        [MeasureProto.CONVEXITY, v.convexity],
      ].filter(([, value]) => value !== undefined) as [number, string][]
    ),
    cashflows: CASHFLOWS,
  };
}

/** A sweep point's yield: distinct per price, as the service's would be. */
function gridYtm(price: string): string {
  return `0.${price.replace(".", "")}987654321`;
}

type ValueFn = CorporateBondDeps["value"];

/** A `value` stub answering each kind of call like valuation-service. */
function fakeValue(
  opts: {
    main?: () => Promise<BondMeasuresResult>;
    dv01?: () => Promise<BondMeasuresResult>;
    sweep?: (price: string) => Promise<BondMeasuresResult>;
  } = {}
) {
  return vi.fn<Parameters<ValueFn>, ReturnType<ValueFn>>(
    async (_security, price, _trade, measures) => {
      if (measures === DV01_MEASURES) {
        return opts.dv01
          ? opts.dv01()
          : {
              settlementDate: "2026-11-27",
              values: new Map([[MeasureProto.DV01, SENTINEL.dv01]]),
              cashflows: [],
            };
      }
      if (measures === SWEEP_MEASURES) {
        return opts.sweep
          ? opts.sweep(price)
          : {
              settlementDate: "2026-11-27",
              values: new Map([
                [MeasureProto.YIELD_TO_MATURITY, gridYtm(price)],
              ]),
              cashflows: [],
            };
      }
      return opts.main ? opts.main() : mainResult();
    }
  );
}

function params(query: Record<string, string>): URLSearchParams {
  return new URLSearchParams(query);
}

let security: SecurityProto;
let lookup: Mock<[string, string], Promise<SecurityProto>>;

beforeEach(() => {
  security = crwvSecurityProto();
  lookup = vi.fn<[string, string], Promise<SecurityProto>>(
    async () => security
  );
  vi.spyOn(console, "log").mockImplementation(() => {});
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

/** Every digit in the calc section, as JSON. */
function digitsIn(section: unknown): string[] {
  return JSON.stringify(section).match(/\d/g) ?? [];
}

describe("input checks: a field error and no service call", () => {
  test.each([
    ["blank", ""],
    ["zero", "0"],
    ["negative", "-1"],
    ["over 200", "200.01"],
    ["not a number", "abc"],
    ["spaces only", "   "],
    ["an exponent", "1e2"],
    ["a comma", "81,375"],
  ])("price %s (%j)", async (_name, price) => {
    const value = fakeValue();
    const data = await fetchFreeCorporateBond(
      KEY,
      params({ price, tradeDate: TRADE }),
      NOW,
      { lookup, value }
    );
    expect(data.fieldErrors).toEqual({ price: PRICE_ERROR });
    expect(data.calc).toEqual({ status: "not-run" });
    expect(data.sweep).toEqual({ status: "not-run" });
    expect(data.input.price).toBe(price);
    expect(lookup).not.toHaveBeenCalled();
    expect(value).not.toHaveBeenCalled();
  });

  test.each([
    "2026-13-01",
    "2026-02-30",
    "abc",
    "",
    "2028-01-01",
    "2025-11-01",
  ])("trade date %j", async (tradeDate) => {
    const value = fakeValue();
    const data = await fetchFreeCorporateBond(
      KEY,
      params({ price: "81.375", tradeDate }),
      NOW,
      { lookup, value }
    );
    expect(data.fieldErrors).toEqual({ tradeDate: TRADE_DATE_ERROR });
    expect(data.calc).toEqual({ status: "not-run" });
    expect(lookup).not.toHaveBeenCalled();
    expect(value).not.toHaveBeenCalled();
  });

  test("200 and 0.0001 are valid boundaries", async () => {
    for (const price of ["200", "0.0001", " 81.375 "]) {
      const data = await fetchFreeCorporateBond(
        KEY,
        params({ price, tradeDate: TRADE }),
        NOW,
        { lookup, value: fakeValue() }
      );
      expect(data.fieldErrors).toEqual({});
      expect(data.input.price).toBe(price.trim());
    }
  });

  test("blank is not absent: no price parameter values the example price, today in New York", async () => {
    const value = fakeValue();
    const data = await fetchFreeCorporateBond(KEY, params({}), NOW, {
      lookup,
      value,
    });
    expect(data.fieldErrors).toEqual({});
    expect(data.input).toEqual({
      price: DEFAULT_CLEAN_PRICE,
      tradeDate: "2026-11-28",
    });
    expect(value).toHaveBeenCalledWith(
      security,
      DEFAULT_CLEAN_PRICE,
      "2026-11-28",
      CRWV_MEASURES,
      KEY,
      expect.objectContaining({ directedQuantity: CALC_FACE })
    );
  });

  test("today is New York's date, not UTC's", () => {
    expect(newYorkToday(new Date("2026-11-28T03:00:00Z"))).toBe("2026-11-27");
    expect(newYorkToday(new Date("2026-11-28T06:00:00Z"))).toBe("2026-11-28");
  });
});

describe("valuation-service's figures, verbatim", () => {
  test("the calculator carries each measure as returned, with its display text", async () => {
    const value = fakeValue();
    const data = await fetchFreeCorporateBond(
      KEY,
      params({ price: "81.375", tradeDate: TRADE }),
      NOW,
      { lookup, value }
    );
    expect(lookup).toHaveBeenCalledWith(CRWV_ISIN, KEY);
    expect(data.calc.status).toBe("ok");
    if (data.calc.status !== "ok") return;
    const calc = data.calc.data;
    expect(calc.settlementDate).toBe("2026-11-27");
    expect(calc.faceDisplay).toBe("$1,000");
    expect(calc.accrued).toEqual({ value: SENTINEL.accrued, display: "4.522" });
    expect(calc.dirtyPrice).toEqual({
      value: SENTINEL.dirty,
      display: "85.897",
    });
    expect(calc.ytm).toEqual({ value: SENTINEL.ytm, display: "16.44%" });
    expect(calc.macaulayDuration?.value).toBe(SENTINEL.macaulay);
    expect(calc.modifiedDuration).toEqual({
      value: SENTINEL.modified,
      display: "2.65",
    });
    expect(calc.convexity?.value).toBe(SENTINEL.convexity);
    expect(calc.dv01).toEqual({ value: SENTINEL.dv01, display: "$227.22" });
    expect(calc.cashflows).toHaveLength(9);
    expect(calc.cashflows.map((r) => [r.date, r.kind, r.fv, r.pv])).toEqual(
      CASHFLOWS.map((r) => [
        r.date,
        r.couponRate ? "coupon" : "principal",
        r.fvAmount,
        r.pvAmount,
      ])
    );
  });

  test("the calls: the measures on 100 face, DV01 alone on $1,000,000 face, one yield per sweep price, each at the trade date and within the budget", async () => {
    const value = fakeValue();
    await fetchFreeCorporateBond(
      KEY,
      params({ price: "81.375", tradeDate: TRADE }),
      NOW,
      { lookup, value }
    );
    const calls = value.mock.calls;
    expect(calls).toHaveLength(2 + SWEEP_PRICES.length);
    for (const [, , trade, , key, options] of calls) {
      expect(trade).toBe(TRADE);
      expect(key).toBe(KEY);
      expect(options.deadlineMs).toBeGreaterThan(0);
      expect(options.deadlineMs).toBeLessThanOrEqual(LOAD_BUDGET_MS);
    }
    const main = calls.filter(([, , , m]) => m === CRWV_MEASURES);
    expect(main).toHaveLength(1);
    expect(main[0][1]).toBe("81.375");
    expect(main[0][5].directedQuantity).toBe(CALC_FACE);
    const dv01 = calls.filter(([, , , m]) => m === DV01_MEASURES);
    expect(dv01).toHaveLength(1);
    expect(dv01[0][5].directedQuantity).toBe(DV01_FACE);
    expect(DV01_MEASURES).toEqual([MeasureProto.DV01]);
    expect(CRWV_MEASURES).not.toContain(MeasureProto.DV01);
    const sweep = calls.filter(([, , , m]) => m === SWEEP_MEASURES);
    expect(sweep.map(([, price]) => price)).toEqual([...SWEEP_PRICES]);
  });

  test("a missing DV01 is unavailable, not derived from duration", async () => {
    const data = await fetchFreeCorporateBond(
      KEY,
      params({ price: "81.375", tradeDate: TRADE }),
      NOW,
      {
        lookup,
        value: fakeValue({
          dv01: async () => ({
            settlementDate: "2026-11-27",
            values: new Map(),
            cashflows: [],
          }),
        }),
      }
    );
    expect(data.calc.status).toBe("ok");
    if (data.calc.status !== "ok") return;
    expect(data.calc.data.dv01).toBeNull();
    expect(data.calc.data.modifiedDuration?.value).toBe(SENTINEL.modified);
  });

  test("a failed DV01 call leaves the other figures showing", async () => {
    const data = await fetchFreeCorporateBond(
      KEY,
      params({ price: "81.375", tradeDate: TRADE }),
      NOW,
      {
        lookup,
        value: fakeValue({ dv01: () => Promise.reject(new Error("boom")) }),
      }
    );
    expect(data.calc.status).toBe("ok");
    if (data.calc.status !== "ok") return;
    expect(data.calc.data.dv01).toBeNull();
    expect(data.calc.data.ytm?.value).toBe(SENTINEL.ytm);
  });

  test("a missing measure in the main call is only that tile's", async () => {
    const data = await fetchFreeCorporateBond(
      KEY,
      params({ price: "81.375", tradeDate: TRADE }),
      NOW,
      {
        lookup,
        value: fakeValue({
          main: async () => mainResult({ convexity: undefined }),
        }),
      }
    );
    expect(data.calc.status).toBe("ok");
    if (data.calc.status !== "ok") return;
    expect(data.calc.data.convexity).toBeNull();
    expect(data.calc.data.accrued?.value).toBe(SENTINEL.accrued);
  });
});

describe("the sweep", () => {
  test("an off-grid price is added once, marked, at the calculator's yield", async () => {
    const data = await fetchFreeCorporateBond(
      KEY,
      params({ price: "81.375", tradeDate: TRADE }),
      NOW,
      { lookup, value: fakeValue() }
    );
    expect(data.sweep.status).toBe("ok");
    if (data.sweep.status !== "ok") return;
    const { points } = data.sweep;
    expect(points).toHaveLength(SWEEP_PRICES.length + 1);
    const marked = points.filter((p) => p.marked);
    expect(marked).toEqual([
      { price: "81.375", ytm: SENTINEL.ytm, ytmPct: "16.44", marked: true },
    ]);
    // Ordered by price, each grid yield as returned.
    expect(points.map((p) => p.price)).toEqual(
      [...SWEEP_PRICES, "81.375"].sort((a, b) => Number(a) - Number(b))
    );
    for (const p of points.filter((p) => !p.marked)) {
      expect(p.ytm).toBe(gridYtm(p.price));
    }
  });

  test("an on-grid price marks that grid point, not a second one", async () => {
    const data = await fetchFreeCorporateBond(
      KEY,
      params({ price: "85.0", tradeDate: TRADE }),
      NOW,
      { lookup, value: fakeValue() }
    );
    if (data.sweep.status !== "ok") throw new Error(data.sweep.status);
    expect(data.sweep.points).toHaveLength(SWEEP_PRICES.length);
    expect(data.sweep.points.filter((p) => p.marked)).toEqual([
      expect.objectContaining({
        price: "85",
        ytm: gridYtm("85"),
        marked: true,
      }),
    ]);
  });

  test("one failed sweep point makes the sweep unavailable and keeps the calculator", async () => {
    const value = fakeValue({
      sweep: async (price) => {
        if (price === "95") throw new Error("deadline exceeded");
        return {
          values: new Map([[MeasureProto.YIELD_TO_MATURITY, gridYtm(price)]]),
          cashflows: [],
        };
      },
    });
    const data = await fetchFreeCorporateBond(
      KEY,
      params({ price: "81.375", tradeDate: TRADE }),
      NOW,
      { lookup, value }
    );
    expect(data.sweep).toEqual({
      status: "unavailable",
      message: UNAVAILABLE.sweep,
    });
    expect(data.calc.status).toBe("ok");
  });
});

describe("unavailable: no numbers", () => {
  const down = {
    status: "unavailable",
    message: UNAVAILABLE.calc,
  };
  const sweepDown = { status: "unavailable", message: UNAVAILABLE.sweep };

  test("the messages have no digits", () => {
    for (const message of Object.values(UNAVAILABLE)) {
      expect(message).not.toMatch(/\d/);
    }
  });

  test("no key: no call", async () => {
    const value = fakeValue();
    const data = await fetchFreeCorporateBond(
      undefined,
      params({ price: "81.375", tradeDate: TRADE }),
      NOW,
      { lookup, value }
    );
    expect(data.calc).toEqual(down);
    expect(data.sweep).toEqual(sweepDown);
    expect(lookup).not.toHaveBeenCalled();
    expect(value).not.toHaveBeenCalled();
  });

  test("the ISIN lookup fails", async () => {
    lookup.mockRejectedValue(new Error("No security found for ISIN"));
    const data = await fetchFreeCorporateBond(
      KEY,
      params({ price: "81.375", tradeDate: TRADE }),
      NOW,
      { lookup, value: fakeValue() }
    );
    expect(data.calc).toEqual(down);
    expect(data.sweep).toEqual(sweepDown);
  });

  test("the main call errors", async () => {
    const data = await fetchFreeCorporateBond(
      KEY,
      params({ price: "81.375", tradeDate: TRADE }),
      NOW,
      {
        lookup,
        value: fakeValue({
          main: () => Promise.reject(new Error("14 UNAVAILABLE")),
        }),
      }
    );
    expect(data.calc).toEqual(down);
    expect(data.sweep).toEqual(sweepDown);
    expect(digitsIn(data.calc)).toEqual([]);
  });

  test("no settlement date in the response", async () => {
    const data = await fetchFreeCorporateBond(
      KEY,
      params({ price: "81.375", tradeDate: TRADE }),
      NOW,
      {
        lookup,
        value: fakeValue({
          main: async () => ({ ...mainResult(), settlementDate: undefined }),
        }),
      }
    );
    expect(data.calc).toEqual(down);
  });

  test("a main call that never answers is unavailable at the load budget", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    const never = () => new Promise<BondMeasuresResult>(() => {});
    const value = fakeValue({ main: never, dv01: never, sweep: never });
    let settled = false;
    const pending = fetchFreeCorporateBond(
      KEY,
      params({ price: "81.375", tradeDate: TRADE }),
      NOW,
      { lookup, value }
    ).then((data) => {
      settled = true;
      return data;
    });
    await vi.advanceTimersByTimeAsync(LOAD_BUDGET_MS - 1);
    expect(settled).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    const data = await pending;
    expect(settled).toBe(true);
    expect(data.calc).toEqual(down);
    expect(data.sweep).toEqual(sweepDown);
    expect(digitsIn(data.calc)).toEqual([]);
  });

  test("a sweep that never finishes is unavailable at the budget; the calculator stays", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    const value = fakeValue({
      sweep: () => new Promise<BondMeasuresResult>(() => {}),
    });
    const pending = fetchFreeCorporateBond(
      KEY,
      params({ price: "81.375", tradeDate: TRADE }),
      NOW,
      { lookup, value }
    );
    await vi.advanceTimersByTimeAsync(LOAD_BUDGET_MS);
    const data = await pending;
    expect(data.calc.status).toBe("ok");
    expect(data.sweep).toEqual(sweepDown);
  });
});
