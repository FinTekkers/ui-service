/**
 * ISSUE #207 — regression test for the TIPS engine-path request shape.
 *
 * Asserts that RunTipsValuation builds a ValuationRequestProto with
 * product_input.tips set (carrying security + clean_price + cpi)
 * and the legacy flat fields NOT set. Mirrors the bond engine-path
 * regression test introduced for #182.
 *
 * US-229: the CPI goes in TipsInput.cpi (InflationIndexInput), never the
 * deprecated current_cpi, and the settlement date is the asof_datetime.
 */
import { describe, expect, test, vi } from "vitest";

const capturedRequests: any[] = [];

vi.mock(
  "@fintekkers/ledger-models/node/fintekkers/services/valuation-service/valuation_service_grpc_pb.js",
  () => ({
    ValuationClient: vi.fn().mockImplementation(() => ({
      runValuation: vi
        .fn()
        .mockImplementation((request: any, callback: Function) => {
          capturedRequests.push(request);
          callback(null, {
            getMeasureResultsList: () => [],
            getCashflowsList: () => [],
          });
        }),
    })),
  })
);

vi.mock("$lib/grpc-auth", () => ({
  getServiceConnection: vi
    .fn()
    .mockReturnValue({ url: "localhost:80", credentials: {} }),
}));

import { InflationIndexInput } from "@fintekkers/ledger-models/node/fintekkers/requests/valuation/product_inputs_pb.js";
import { LookupCurrentCpi, RunTipsValuation } from "$lib/valuation";
import { fromDecimalProto } from "$lib/decimal";
import type { TipsCalculatorInputs } from "$lib/valuation";

const MANUAL_TIPS: TipsCalculatorInputs = {
  mode: "manual",
  price: "98.5",
  currentCpi: "314.175",
  settlementDate: "2026-03-19",
  faceValue: "1000",
  realCouponRate: "0.625",
  couponFrequency: "SEMIANNUALLY",
  referenceCpi: "256.394",
  maturityDate: "2030-01-15",
};

describe("TIPS engine-path request shape (#207)", () => {
  test("RunTipsValuation sets product_input.tips, not security_input / price_input / cpi_price_input", async () => {
    capturedRequests.length = 0;
    await RunTipsValuation(MANUAL_TIPS);
    expect(capturedRequests.length).toBe(1);
    const req = capturedRequests[0];

    // Engine path is set: product_input.tips carries security + clean_price + cpi.
    expect(req.hasProductInput()).toBe(true);
    const tipsInput = req.getProductInput()?.getTips();
    expect(tipsInput).toBeDefined();
    expect(tipsInput.getSecurity()).toBeDefined();
    expect(tipsInput.getCleanPrice()).toBeDefined();
    expect(fromDecimalProto(tipsInput.getCleanPrice())).toBe("98.5");
    // US-229: the typed CPI is the reference CPI, sent in TipsInput.cpi.
    expect(tipsInput.hasCurrentCpi()).toBe(false);
    expect(tipsInput.getCurrentCpi()).toBeUndefined();
    const cpi = tipsInput.getCpi();
    expect(cpi).toBeInstanceOf(InflationIndexInput);
    expect(cpi.getCpiCase()).toBe(InflationIndexInput.CpiCase.REFERENCE_CPI);
    expect(fromDecimalProto(cpi.getReferenceCpi())).toBe("314.175");
    expect(cpi.hasReadings()).toBe(false);

    // Legacy flat fields are NOT set on TIPS requests.
    expect(req.hasSecurityInput()).toBe(false);
    expect(req.hasPriceInput()).toBe(false);
    expect(req.hasCpiPriceInput()).toBe(false);

    // BOND oneof case is NOT chosen.
    expect(req.getProductInput()?.getBond()).toBeUndefined();
  });

  test("RunTipsValuation still preserves the standard request envelope", async () => {
    capturedRequests.length = 0;
    await RunTipsValuation(MANUAL_TIPS);
    const req = capturedRequests[0];

    expect(req.hasAsofDatetime()).toBe(true);
    expect(req.getMeasuresList().length).toBeGreaterThan(0);
    expect(req.getOperationType()).toBeGreaterThan(0);
  });

  test("US-229: the settlement date is sent as asof_datetime (00:00 UTC)", async () => {
    capturedRequests.length = 0;
    await RunTipsValuation(MANUAL_TIPS);
    const ts = capturedRequests[0].getAsofDatetime().getTimestamp();
    expect(new Date(ts.getSeconds() * 1000).toISOString()).toBe(
      "2026-03-19T00:00:00.000Z"
    );
  });

  test("US-229: price-service readings are sent as MonthlyIndexReadings, not reference_cpi", async () => {
    capturedRequests.length = 0;
    const result = await RunTipsValuation({
      ...MANUAL_TIPS,
      currentCpi: undefined,
      settlementDate: "2026-10-15",
      cpiReadings: [
        { year: 2026, month: 7, label: "CPI-U Jul 2026", value: "322.132" },
        { year: 2026, month: 8, label: "CPI-U Aug 2026", value: "322.551" },
      ],
    });
    expect(result.error).toBeUndefined();
    expect(result.cpiSource).toBe("Price service");
    const tipsInput = capturedRequests[0].getProductInput().getTips();
    expect(tipsInput.hasCurrentCpi()).toBe(false);
    const cpi = tipsInput.getCpi();
    expect(cpi.getCpiCase()).toBe(InflationIndexInput.CpiCase.READINGS);
    expect(cpi.hasReferenceCpi()).toBe(false);
    const readings = cpi
      .getReadings()
      .getReadingsList()
      .map((r: any) => ({
        year: r.getYear(),
        month: r.getMonth(),
        value: fromDecimalProto(r.getValue()),
      }));
    expect(readings).toEqual([
      { year: 2026, month: 7, value: "322.132" },
      { year: 2026, month: 8, value: "322.551" },
    ]);
  });

  test("US-229: a typed CPI reports CPI source Manual entry", async () => {
    capturedRequests.length = 0;
    const result = await RunTipsValuation(MANUAL_TIPS);
    expect(result.cpiSource).toBe("Manual entry");
  });

  test("US-229: LookupCurrentCpi asks only for REFERENCE_CPI, for the settlement date", async () => {
    capturedRequests.length = 0;
    await LookupCurrentCpi({
      ...MANUAL_TIPS,
      currentCpi: undefined,
      settlementDate: "2026-10-15",
      cpiReadings: [
        { year: 2026, month: 7, label: "CPI-U Jul 2026", value: "322.132" },
        { year: 2026, month: 8, label: "CPI-U Aug 2026", value: "322.551" },
      ],
    });
    expect(capturedRequests.length).toBe(1);
    const req = capturedRequests[0];
    expect(req.getMeasuresList()).toEqual([28]); // MeasureProto.REFERENCE_CPI
    expect(
      new Date(
        req.getAsofDatetime().getTimestamp().getSeconds() * 1000
      ).toISOString()
    ).toBe("2026-10-15T00:00:00.000Z");
    expect(req.getProductInput().getTips().getCpi().hasReadings()).toBe(true);
  });

  test("US-229: LookupCurrentCpi needs readings and a price; it sends nothing otherwise", async () => {
    capturedRequests.length = 0;
    const noReadings = await LookupCurrentCpi(MANUAL_TIPS);
    const noPrice = await LookupCurrentCpi({
      ...MANUAL_TIPS,
      price: "",
      cpiReadings: [
        { year: 2026, month: 7, label: "CPI-U Jul 2026", value: "322.132" },
        { year: 2026, month: 8, label: "CPI-U Aug 2026", value: "322.551" },
      ],
    });
    expect(noReadings.error).toBeDefined();
    expect(noPrice.error).toContain("price");
    expect(capturedRequests.length).toBe(0);
  });
});
