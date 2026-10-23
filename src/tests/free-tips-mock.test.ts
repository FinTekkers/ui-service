/**
 * US-253: every figure in src/lib/free/mock/tips.ts matches the
 * DataExplorerTIPS.dc.html artboard (version 1792630643-19db). The oracle in
 * fixtures/ is the artboard's own compute(), run here on the stored inputs;
 * the mock holds its results as literals.
 */
import { describe, expect, test } from "vitest";
import { tips, tipsMeasure } from "$lib/free/mock/tips";
import { compute } from "./fixtures/tips-artboard-oracle";

const oracle = compute(tips.inputs);

describe("TIPS mock (mock/tips.ts)", () => {
  test("the calculator's INDEX_RATIO and adjusted principal equal the worked example", () => {
    expect(tipsMeasure(tips, "INDEX_RATIO").display).toBe(
      tips.workedExample.indexRatio
    );
    expect(tipsMeasure(tips, "INFLATION_ADJUSTED_PRINCIPAL").display).toBe(
      tips.workedExample.adjustedPrincipal
    );
    expect(tips.valuation.nextCoupon).toBe(tips.workedExample.coupon);
  });

  test("inputs are the artboard's 7 defaults", () => {
    expect(tips.inputs).toEqual({
      face: "10000",
      coupon: "1.875",
      baseCpi: "324.93471",
      refCpi: "332.92643",
      years: "9.5",
      realYield: "2.25",
      inflation: "2.30",
    });
  });

  test("the worked example and security agree with the inputs", () => {
    expect(tips.workedExample.baseCpi).toBe(tips.inputs.baseCpi);
    expect(tips.security.tipsExtension.baseCpi).toBe(tips.inputs.baseCpi);
    expect(tips.workedExample.refCpi).toBe(tips.inputs.refCpi);
    expect(tipsMeasure(tips, "REFERENCE_CPI").display).toBe(tips.inputs.refCpi);
    expect(tips.security.bondDetails.couponRate).toBe(tips.inputs.coupon);
  });

  test("each output tile equals the artboard's compute()", () => {
    expect(tipsMeasure(tips, "INDEX_RATIO").display).toBe(oracle.ir);
    expect(tipsMeasure(tips, "INFLATION_ADJUSTED_PRINCIPAL").display).toBe(
      oracle.adj
    );
    expect(tips.valuation.nextCoupon).toBe(oracle.cpn);
    expect(tipsMeasure(tips, "CLEAN_PRICE").display).toBe(oracle.realPrice);
    expect(tipsMeasure(tips, "MARKET_VALUE").display).toBe(oracle.value);
    expect(tipsMeasure(tips, "YIELD_TO_MATURITY").display).toBe(oracle.nominal);
    expect(tips.valuation.totalReceived).toBe(oracle.total);
  });

  test("the 19 cashflow rows equal the artboard's compute()", () => {
    expect(oracle.rows).toHaveLength(19);
    expect(tips.valuation.cashflows).toEqual(
      oracle.rows.map((r) => ({
        time: r.t,
        indexRatio: r.ir,
        coupon: r.cpn,
        principal: r.prin,
        total: r.tot,
      }))
    );
  });

  test("the oracle is not a pass-through: other inputs change its result", () => {
    const other = compute({ ...tips.inputs, realYield: "3.00" });
    expect(other.realPrice).not.toBe(oracle.realPrice);
  });

  test("each measure's value is its display text in the catalog's units", () => {
    for (const { measure, value, display } of tips.valuation.measureResults) {
      const shown = Number(display.replace(/[$,%]/g, ""));
      const expected = display.endsWith("%") ? shown / 100 : shown;
      expect(Number(value), measure).toBeCloseTo(expected, 10);
    }
  });

  test("tipsMeasure throws for a measure the mock does not store", () => {
    expect(() => tipsMeasure(tips, "CONVEXITY")).toThrow(/CONVEXITY/);
  });
});
