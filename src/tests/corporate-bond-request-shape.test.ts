/**
 * US-354: the ValuationRequestProto RunCorporateBondMeasures sends for the
 * seeded CoreWeave 2030 security, captured from a fake valuation client.
 * - It carries the settlement convention (the trade date, T+1, US_SIFMA) so
 *   valuation-service derives the settlement date; nothing here computes it.
 * - The position is the given DIRECTED_QUANTITY.
 * - The security priced has no call or put input: valuation is to maturity,
 *   and neither the loader nor valuation.ts imports the call schedule.
 * - runValuationCore passes a gRPC deadline only when deadlineMs is set, so
 *   every existing caller's call is unchanged.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  runValuation: vi.fn(),
  getServiceConnection: vi.fn(() => ({
    url: "localhost:0",
    credentials: {},
    interceptors: [],
    clientOptions: {},
  })),
}));

vi.mock("$lib/grpc-auth", () => ({
  getServiceConnection: mocks.getServiceConnection,
}));
vi.mock(
  "@fintekkers/ledger-models/node/fintekkers/services/valuation-service/valuation_service_grpc_pb.js",
  () => ({
    ValuationClient: vi.fn().mockImplementation(() => ({
      runValuation: mocks.runValuation,
    })),
  })
);

import measure_pkg from "@fintekkers/ledger-models/node/fintekkers/models/position/measure_pb.js";
import type { ValuationRequestProto } from "@fintekkers/ledger-models/node/fintekkers/requests/valuation/valuation_request_pb.js";
import { ValuationResponseProto } from "@fintekkers/ledger-models/node/fintekkers/requests/valuation/valuation_response_pb.js";
import { CashflowProto } from "@fintekkers/ledger-models/node/fintekkers/models/valuation/cashflow_pb.js";
import { MeasureMapEntry } from "@fintekkers/ledger-models/node/fintekkers/models/position/position_util_pb.js";
import { LocalDateProto } from "@fintekkers/ledger-models/node/fintekkers/models/util/local_date_pb.js";
import { fromDecimalProto, toDecimalProto } from "$lib/decimal";
import { RunCorporateBondMeasures, runValuationCore } from "$lib/valuation";
import { CRWV_MEASURES } from "$lib/server/free-corporate-bond";
import { crwvSecurityProto } from "../../scripts/lib/seed-crwv-2030";

const { MeasureProto } = measure_pkg;

function response(): ValuationResponseProto {
  const r = new ValuationResponseProto();
  r.setSettlementDate(
    new LocalDateProto().setYear(2026).setMonth(11).setDay(27)
  );
  r.addMeasureResults(
    new MeasureMapEntry()
      .setMeasure(MeasureProto.YIELD_TO_MATURITY)
      .setMeasureDecimalValue(toDecimalProto("0.1643998307756164231372087272"))
  );
  r.addCashflows(
    new CashflowProto()
      .setCashflowDate(new LocalDateProto().setYear(2030).setMonth(6).setDay(1))
      .setFvAmount(toDecimalProto("1000"))
      .setPvAmount(toDecimalProto("574.22902650896663824296036499"))
  );
  return r;
}

beforeEach(() => {
  mocks.runValuation.mockReset();
  mocks.runValuation.mockImplementation((...args: any[]) =>
    args[args.length - 1](null, response())
  );
});

function sentRequest(): ValuationRequestProto {
  return mocks.runValuation.mock.calls[0][0];
}

describe("RunCorporateBondMeasures", () => {
  test("sends the settlement convention, the position and the measures; returns the service's settlement date and values", async () => {
    const result = await RunCorporateBondMeasures(
      crwvSecurityProto(),
      "81.375",
      "2026-11-25",
      CRWV_MEASURES,
      "key",
      { directedQuantity: "100" }
    );

    const request = sentRequest();
    const convention = request.getSettlementConvention();
    expect(convention).toBeDefined();
    expect(convention?.getTradeDate()?.toObject()).toEqual({
      year: 2026,
      month: 11,
      day: 25,
    });
    expect(convention?.getSettlementLagBusinessDays()).toBe(1);
    expect(convention?.getCalendarId()).toBe("US_SIFMA");
    expect(request.getMeasuresList()).toEqual(CRWV_MEASURES);
    const quantity = request
      .getPositionInput()
      ?.getMeasuresList()
      .find((m) => m.getMeasure() === MeasureProto.DIRECTED_QUANTITY);
    expect(fromDecimalProto(quantity?.getMeasureDecimalValue())).toBe("100");
    expect(
      fromDecimalProto(request.getProductInput()?.getBond()?.getCleanPrice())
    ).toBe("81.375");

    expect(result.settlementDate).toBe("2026-11-27");
    expect(result.values.get(MeasureProto.YIELD_TO_MATURITY)).toBe(
      "0.1643998307756164231372087272"
    );
    expect(result.cashflows).toEqual([
      {
        date: "2030-06-01",
        fvAmount: "1000",
        pvAmount: "574.22902650896663824296036499",
      },
    ]);
  });

  test("DV01 is sent on the given face, the existing DV01 measure", async () => {
    await RunCorporateBondMeasures(
      crwvSecurityProto(),
      "81.375",
      "2026-11-25",
      [MeasureProto.DV01],
      "key",
      { directedQuantity: "1000000" }
    );
    const request = sentRequest();
    expect(request.getMeasuresList()).toEqual([MeasureProto.DV01]);
    expect(
      fromDecimalProto(
        request
          .getPositionInput()
          ?.getMeasuresList()[0]
          .getMeasureDecimalValue()
      )
    ).toBe("1000000");
  });

  test("the security priced carries no call or put input", async () => {
    await RunCorporateBondMeasures(
      crwvSecurityProto(),
      "81.375",
      "2026-11-25",
      CRWV_MEASURES,
      "key",
      { directedQuantity: "100" }
    );
    const bond = sentRequest()
      .getProductInput()
      ?.getBond()
      ?.getSecurity()
      ?.getBondDetails();
    expect(bond).toBeDefined();
    expect(bond?.getCallable()).toBe(false);
    expect(bond?.hasCallDate()).toBe(false);
    expect(bond?.getMaturityDate()?.toObject()).toEqual({
      year: 2030,
      month: 6,
      day: 1,
    });
  });

  test("a deadlineMs becomes the gRPC call's deadline", async () => {
    const before = Date.now();
    await RunCorporateBondMeasures(
      crwvSecurityProto(),
      "81.375",
      "2026-11-25",
      CRWV_MEASURES,
      "key",
      { directedQuantity: "100", deadlineMs: 5_000 }
    );
    const args = mocks.runValuation.mock.calls[0];
    expect(args).toHaveLength(4);
    const deadline = args[2].deadline as number;
    expect(deadline).toBeGreaterThanOrEqual(before + 5_000);
    expect(deadline).toBeLessThanOrEqual(Date.now() + 5_000);
  });
});

describe("runValuationCore", () => {
  test("without options: no settlement convention and the two-argument call, as before", async () => {
    const productInput = (await import(
      "@fintekkers/ledger-models/node/wrappers/models/security/product_inputs"
    )) as any;
    const { PriceProto } = await import(
      "@fintekkers/ledger-models/node/fintekkers/models/price/price_pb.js"
    );
    await runValuationCore(
      productInput.forSecurity(
        crwvSecurityProto(),
        new PriceProto().setMid(toDecimalProto("81.375")),
        {}
      ),
      [MeasureProto.YIELD_TO_MATURITY],
      "key"
    );
    const args = mocks.runValuation.mock.calls[0];
    expect(args).toHaveLength(2);
    expect((args[0] as ValuationRequestProto).hasSettlementConvention()).toBe(
      false
    );
  });
});

describe("the call schedule is display text only", () => {
  // Import clauses only (robust to reformatting): neither the loader nor
  // valuation.ts may bring in the schedule or the put text.
  const importedNames = (file: string) =>
    [
      ...readFileSync(path.resolve(file), "utf8").matchAll(
        /\bimport\s+(?:type\s+)?\{([^}]*)\}\s*from/g
      ),
    ].flatMap((m) =>
      m[1]
        .split(",")
        .map((name) => name.trim().replace(/^type\s+/, ""))
        .filter(Boolean)
    );

  test.each(["src/lib/server/free-corporate-bond.ts", "src/lib/valuation.ts"])(
    "%s does not import CRWV_CALL_SCHEDULE or CRWV_CHANGE_OF_CONTROL",
    (file) => {
      const names = importedNames(file);
      expect(names.length).toBeGreaterThan(0);
      expect(names).not.toContain("CRWV_CALL_SCHEDULE");
      expect(names).not.toContain("CRWV_CHANGE_OF_CONTROL");
    }
  );
});
