/**
 * US-212 — compact decimals (LM-294 / LM-306); US-220 — LM-318 deleted the
 * decimal string, so the compact form (unscaled bytes + scale) is the only one.
 *
 * ui-service reads and writes DecimalValueProto only through $lib/decimal,
 * which wraps the ledger-models codec. Values, scale and display must not
 * change.
 */
import { createRequire } from "module";
import { beforeEach, describe, expect, test, vi } from "vitest";

const capturedValuations: any[] = [];
const capturedCurves: any[] = [];
let valuationResponse: any = null;

vi.mock(
  "@fintekkers/ledger-models/node/fintekkers/services/valuation-service/valuation_service_grpc_pb.js",
  () => ({
    ValuationClient: vi.fn().mockImplementation(() => ({
      runValuation: (request: any, callback: Function) => {
        capturedValuations.push(request);
        callback(null, valuationResponse);
      },
      runCurve: (request: any, callback: Function) => {
        capturedCurves.push(request);
        callback(null, { getCurveResultsList: () => [] });
      },
    })),
  })
);

let searchResults: any[] = [];
vi.mock(
  "@fintekkers/ledger-models/node/wrappers/services/transaction-service/TransactionService",
  () => ({
    TransactionService: vi.fn().mockImplementation(() => ({
      searchTransaction: async () => searchResults,
    })),
  })
);

let priceResponses: any[] = [];
vi.mock(
  "@fintekkers/ledger-models/node/fintekkers/services/price-service/price_service_grpc_pb.js",
  async () => {
    const { EventEmitter } = await import("events");
    return {
      PriceClient: vi.fn().mockImplementation(() => ({
        search: () => {
          const stream = new EventEmitter();
          setTimeout(() => {
            stream.emit("data", {
              getPriceResponseList: () => priceResponses,
            });
            stream.emit("end");
          });
          return stream;
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

import { DecimalValueProto } from "@fintekkers/ledger-models/node/fintekkers/models/util/decimal_value_pb.js";
import { TransactionProto } from "@fintekkers/ledger-models/node/fintekkers/models/transaction/transaction_pb.js";
import { PriceProto } from "@fintekkers/ledger-models/node/fintekkers/models/price/price_pb.js";
import { SecurityProto } from "@fintekkers/ledger-models/node/fintekkers/models/security/security_pb.js";
import measure_pkg from "@fintekkers/ledger-models/node/fintekkers/models/position/measure_pb.js";
import Transaction from "@fintekkers/ledger-models/node/wrappers/models/transaction/transaction";
import { UUID } from "@fintekkers/ledger-models/node/wrappers/models/utils/uuid";
import { ZonedDateTime } from "@fintekkers/ledger-models/node/wrappers/models/utils/datetime";
import { decodeDecimal } from "@fintekkers/ledger-models/node/wrappers/models/utils/decimal";
import { fromDecimalProto, toDecimalProto } from "$lib/decimal";
import { RunValuation } from "$lib/valuation";
import type { BondCalculatorInputs } from "$lib/valuation";
import { FetchTransactionWithFilter } from "$lib/transactions";
import { runCurveParYieldsByTenor } from "$lib/runCurve";
import { fetchPricesForSecurity } from "$lib/curvePrices";
import type { CurveConstituent } from "$lib/treasuryCurveData";
import { formatAmount, formatPercent } from "$lib/formatUtils";
import { expectLedgerModelsAtLeast } from "./ledgerModelsPin";

const { MeasureProto } = measure_pkg;

/** First @fintekkers/ledger-models release with the LM-306 JS codec. */
const FIRST_LM_306_RELEASE = "0.4.39";

const BIG = "12345678901234567890123456.789012"; // 32 digits, scale 6

function expectCompact(proto: DecimalValueProto, scale: number) {
  expect(proto.getUnscaledValue_asU8().length).toBeGreaterThan(0);
  expect(proto.getScale()).toBe(scale);
}

const MANUAL_BOND: BondCalculatorInputs = {
  mode: "manual",
  price: "98.5",
  faceValue: "100",
  couponRate: "5",
  couponFrequency: "SEMIANNUALLY",
  maturityDate: "2030-01-15",
};

/** A valuation response carrying `decimal` as YTM and as every cash-flow field. */
function respondWith(decimal: DecimalValueProto | undefined) {
  valuationResponse = {
    getMeasureResultsList: () => [
      {
        getMeasure: () => MeasureProto.YIELD_TO_MATURITY,
        getMeasureDecimalValue: () => decimal,
      },
    ],
    getCashflowsList: () => [
      {
        getCashflowDate: () => ({
          getYear: () => 2030,
          getMonth: () => 1,
          getDay: () => 15,
        }),
        getFvAmount: () => decimal,
        getPvAmount: () => decimal,
        getCouponRate: () => decimal,
      },
    ],
  };
}

async function valueThroughValuation(decimal: DecimalValueProto | undefined) {
  respondWith(decimal);
  const result = await RunValuation(MANUAL_BOND);
  expect(result.error).toBeUndefined();
  return { measure: result.yieldToMaturity, cashflow: result.cashflows![0] };
}

/** One transaction row read back through transactions.ts. */
async function rowThroughTransactions(
  price: DecimalValueProto,
  quantity: DecimalValueProto
) {
  const proto = new TransactionProto();
  proto.setUuid(UUID.random().toUUIDProto());
  proto.setAsOf(ZonedDateTime.now().toProto());
  proto.setSecurity(new SecurityProto());
  proto.setPrice(new PriceProto().setPrice(price));
  proto.setQuantity(quantity);
  searchResults = [new Transaction(proto)];
  const rows = await FetchTransactionWithFilter({} as any);
  expect(rows).toHaveLength(1);
  return rows[0];
}

beforeEach(() => {
  capturedValuations.length = 0;
  capturedCurves.length = 0;
});

describe("US-212 metric 1: ledger-models pin", () => {
  test(`package-lock resolves ledger-models at ${FIRST_LM_306_RELEASE} or later`, () => {
    expectLedgerModelsAtLeast(FIRST_LM_306_RELEASE);
  });
});

describe("US-220 metric 3: decimals round-trip exactly through the compact helpers", () => {
  test.each([
    ["123.4500", 4, "12d644"],
    ["0.000000000000000000000001", 24, "01"],
    ["12345678901234567890.123456789", 9, "27e41b3246bec9b16e398115"],
  ])("%s keeps scale %i", (value, scale, unscaledHex) => {
    const proto = toDecimalProto(value);
    expect(Buffer.from(proto.getUnscaledValue_asU8()).toString("hex")).toBe(
      unscaledHex
    );
    expect(proto.getScale()).toBe(scale);
    const decoded = DecimalValueProto.deserializeBinary(
      proto.serializeBinary()
    );
    expect(decoded.getScale()).toBe(scale);
    expect(fromDecimalProto(decoded)).toBe(value);
  });

  test("123.4500 keeps its trailing zeros", () => {
    expect(fromDecimalProto(toDecimalProto("123.4500"))).toBe("123.4500");
    expect(fromDecimalProto(toDecimalProto("123.4500"))).not.toBe("123.45");
  });

  test("a value beyond float precision is not rounded", () => {
    const value = "12345678901234567890.123456789";
    expect(String(parseFloat(value))).not.toBe(value);
    expect(fromDecimalProto(toDecimalProto(value))).toBe(value);
  });
});

describe("US-212 metric 4: new data round-trips through write and read paths", () => {
  test.each([
    ["1.50", 2],
    ["0", 0],
    ["-42.125", 3],
    [BIG, 6],
  ])("%s encodes and decodes with scale %i", (value, scale) => {
    const proto = toDecimalProto(value);
    expectCompact(proto, scale);
    expect(fromDecimalProto(proto)).toBe(value);
    expect(decodeDecimal(proto).scale).toBe(scale);
  });

  test.each(["1.50", "0", "-42.125", BIG])(
    "%s read back through valuation.ts and transactions.ts",
    async (value) => {
      const { measure, cashflow } = await valueThroughValuation(
        toDecimalProto(value)
      );
      expect(measure).toBe(value);
      expect(cashflow.fvAmount).toBe(value);
      const row = await rowThroughTransactions(
        toDecimalProto(value),
        toDecimalProto("1000000.00")
      );
      expect(row.transactionPrice).toBe(value);
    }
  );

  test("valuation.ts writes the clean price 1.50", async () => {
    respondWith(toDecimalProto("4.25"));
    await RunValuation({ ...MANUAL_BOND, price: "1.50" });
    expect(capturedValuations).toHaveLength(1);
    const cleanPrice = capturedValuations[0]
      .getProductInput()
      .getBond()
      .getCleanPrice();
    expectCompact(cleanPrice, 2);
    expect(fromDecimalProto(cleanPrice)).toBe("1.50");
  });

  test("runCurve.ts writes each clean price", async () => {
    // cleanPrice is a number on CurveConstituent (pre-existing), so trailing
    // zeros cannot reach this path; 99.25 still shows scale 2 is kept.
    const constituent = (tenor: string, cleanPrice: number) =>
      ({
        tenor,
        bond: { proto: new SecurityProto() },
        cleanPrice,
      } as unknown as CurveConstituent);
    await runCurveParYieldsByTenor(
      [constituent("2Y", 99.25), constituent("10Y", 101.5)],
      new Date("2026-10-09T00:00:00Z")
    );
    expect(capturedCurves).toHaveLength(1);
    const [first, second] = capturedCurves[0].getCurveInputsList();
    expectCompact(first.getCleanPrice(), 2);
    expect(fromDecimalProto(first.getCleanPrice())).toBe("99.25");
    expectCompact(second.getCleanPrice(), 1);
    expect(fromDecimalProto(second.getCleanPrice())).toBe("101.5");
  });
});

describe("US-212 metric 5: display is unchanged", () => {
  // Recorded on the pre-change code (ledger-models 0.4.31, string accessors).
  // The 32-digit rows record the existing parseFloat rounding in formatUtils,
  // which is out of scope here.
  const DISPLAY: Array<[string, string, string]> = [
    ["101.250", "$101.25", "101.25%"],
    ["-12345.6700", "-$12,345.67", "-12,345.67%"],
    ["1.50", "$1.50", "1.50%"],
    ["0", "$0.00", "0.00%"],
    ["-42.125", "-$42.13", "-42.13%"],
    [
      BIG,
      "$12,345,678,901,234,568,000,000,000.00",
      "12,345,678,901,234,569,000,000,000.00%",
    ],
  ];

  const build = toDecimalProto;

  describe("compact form", () => {
    test.each(DISPLAY)(
      "%s shows as %s and %s",
      async (value, amount, percent) => {
        const { measure, cashflow } = await valueThroughValuation(build(value));
        expect(formatPercent(measure!)).toBe(percent);
        expect(formatAmount(cashflow.fvAmount)).toBe(amount);
        const row = await rowThroughTransactions(
          build(value),
          build("1000000.00")
        );
        expect(formatAmount(row.transactionPrice)).toBe(amount);
        expect(formatAmount(row.transactionQuantity)).toBe("$1,000,000.00");
      }
    );
  });
});

describe("US-212 guardrail: absent and unset decimals read as before", () => {
  test("an unset proto reads as an empty string", async () => {
    expect(fromDecimalProto(new DecimalValueProto())).toBe("");
    const { measure } = await valueThroughValuation(new DecimalValueProto());
    expect(measure).toBe("");
  });

  test("an absent proto falls back to 0 in parseCashflows", async () => {
    expect(fromDecimalProto(undefined)).toBeUndefined();
    const { measure, cashflow } = await valueThroughValuation(undefined);
    expect(measure).toBeUndefined();
    expect(cashflow.fvAmount).toBe("0");
    expect(cashflow.pvAmount).toBe("0");
    expect(cashflow).not.toHaveProperty("couponRate");
  });

  test("a malformed price is skipped in the price stream, not thrown", async () => {
    const priceRow = (decimal: DecimalValueProto, seconds: number) => ({
      getAsOf: () => ({ getTimestamp: () => ({ getSeconds: () => seconds }) }),
      getPrice: () => decimal,
    });
    priceResponses = [
      // Scale over the codec's 4096 limit: decoding throws.
      priceRow(
        new DecimalValueProto()
          .setUnscaledValue(new Uint8Array([1]))
          .setScale(5000),
        1_700_000_000
      ),
      priceRow(toDecimalProto("99.250"), 1_700_086_400),
    ];
    const prices = await fetchPricesForSecurity(UUID.random().toString());
    expect(prices).toHaveLength(1);
    expect(prices[0].date).toBe("2023-11-15");
  });
});

describe("US-212: the src/scripts/*.cjs encode helpers resolve", () => {
  test("require() finds encodeDecimal and parseDecimalString", () => {
    const require = createRequire(import.meta.url);
    const {
      encodeDecimal,
      parseDecimalString,
    } = require("@fintekkers/ledger-models/node/wrappers/models/utils/decimal");
    expect(typeof encodeDecimal).toBe("function");
    expect(typeof parseDecimalString).toBe("function");
    expectCompact(encodeDecimal(parseDecimalString("1.50")), 2);
  });
});
