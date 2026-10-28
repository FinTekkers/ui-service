// /free/tips's mock: the January 2036 TIPS from DataExplorerTIPS.dc.html
// (version 1792630643-19db) and its calculator's default result. No
// arithmetic here or on the page: every figure is a literal, captured once
// from the artboard's own compute(). src/tests/free-tips-mock.test.ts runs a
// test-only copy of that compute() and checks each literal against it.
// US-298: test-only. /free/tips loads live figures; tests use these
// literals to prove no mock figure reaches the page. No page or server code
// imports this file (src/tests/free-tips-guard.test.ts).
import type { MeasureProto } from "@fintekkers/ledger-models/node/fintekkers/models/position/measure_pb";
import type { MockMeasureResult, TipsResponse } from "./types";

export const tips: TipsResponse = {
  asOf: "2026-06-30",
  security: {
    productType: "TIPS",
    issuerName: "US Treasury",
    description: "TII 1⅞ 01/15/36 · 10-Year TIPS, Series A-2036",
    identifiersList: [
      { identifierType: "CUSIP", identifierValue: "91282CPU9" },
    ],
    bondDetails: {
      couponRate: "1.875",
      couponFrequency: "SEMIANNUALLY",
      datedDate: "2026-01-15",
      maturityDate: "2036-01-15",
    },
    tipsExtension: { baseCpi: "324.93471", inflationIndexType: "CPI_U" },
  },
  securityLabels: {
    frequency: "Semiannual",
    payDates: "Jan 15 / Jul 15",
    index: "CPI-U NSA",
  },
  inputs: {
    face: "10000",
    coupon: "1.875",
    baseCpi: "324.93471",
    refCpi: "332.92643",
    years: "9.5",
    realYield: "2.25",
    inflation: "2.30",
  },
  workedExample: {
    baseCpi: "324.93471",
    refCpi: "332.92643",
    indexRatio: "1.02459",
    adjustedPrincipal: "$10,245.90",
    coupon: "$96.06",
  },
  valuation: {
    // value follows the measure's units in ledger-models' measure catalog
    // (YIELD_TO_MATURITY is a decimal); display is the artboard's text.
    measureResults: [
      { measure: "REFERENCE_CPI", value: "332.92643", display: "332.92643" },
      { measure: "INDEX_RATIO", value: "1.02459", display: "1.02459" },
      {
        measure: "INFLATION_ADJUSTED_PRINCIPAL",
        value: "10245.90",
        display: "$10,245.90",
      },
      // The real price per 100.
      { measure: "CLEAN_PRICE", value: "96.8086", display: "96.8086" },
      { measure: "MARKET_VALUE", value: "9918.91", display: "$9,918.91" },
      // The nominal yield that prices the projected cashflows at MARKET_VALUE.
      { measure: "YIELD_TO_MATURITY", value: "0.04563", display: "4.563%" },
    ],
    nextCoupon: "$96.06",
    totalReceived: "$14,765.31",
    cashflows: [
      {
        time: "0.5 yr",
        indexRatio: "1.03631",
        coupon: "$97.15",
        principal: "—",
        total: "$97.15",
      },
      {
        time: "1.0 yr",
        indexRatio: "1.04816",
        coupon: "$98.26",
        principal: "—",
        total: "$98.26",
      },
      {
        time: "1.5 yr",
        indexRatio: "1.06014",
        coupon: "$99.39",
        principal: "—",
        total: "$99.39",
      },
      {
        time: "2.0 yr",
        indexRatio: "1.07226",
        coupon: "$100.52",
        principal: "—",
        total: "$100.52",
      },
      {
        time: "2.5 yr",
        indexRatio: "1.08452",
        coupon: "$101.67",
        principal: "—",
        total: "$101.67",
      },
      {
        time: "3.0 yr",
        indexRatio: "1.09693",
        coupon: "$102.84",
        principal: "—",
        total: "$102.84",
      },
      {
        time: "3.5 yr",
        indexRatio: "1.10947",
        coupon: "$104.01",
        principal: "—",
        total: "$104.01",
      },
      {
        time: "4.0 yr",
        indexRatio: "1.12215",
        coupon: "$105.20",
        principal: "—",
        total: "$105.20",
      },
      {
        time: "4.5 yr",
        indexRatio: "1.13499",
        coupon: "$106.40",
        principal: "—",
        total: "$106.40",
      },
      {
        time: "5.0 yr",
        indexRatio: "1.14796",
        coupon: "$107.62",
        principal: "—",
        total: "$107.62",
      },
      {
        time: "5.5 yr",
        indexRatio: "1.16109",
        coupon: "$108.85",
        principal: "—",
        total: "$108.85",
      },
      {
        time: "6.0 yr",
        indexRatio: "1.17437",
        coupon: "$110.10",
        principal: "—",
        total: "$110.10",
      },
      {
        time: "6.5 yr",
        indexRatio: "1.18780",
        coupon: "$111.36",
        principal: "—",
        total: "$111.36",
      },
      {
        time: "7.0 yr",
        indexRatio: "1.20138",
        coupon: "$112.63",
        principal: "—",
        total: "$112.63",
      },
      {
        time: "7.5 yr",
        indexRatio: "1.21511",
        coupon: "$113.92",
        principal: "—",
        total: "$113.92",
      },
      {
        time: "8.0 yr",
        indexRatio: "1.22901",
        coupon: "$115.22",
        principal: "—",
        total: "$115.22",
      },
      {
        time: "8.5 yr",
        indexRatio: "1.24306",
        coupon: "$116.54",
        principal: "—",
        total: "$116.54",
      },
      {
        time: "9.0 yr",
        indexRatio: "1.25728",
        coupon: "$117.87",
        principal: "—",
        total: "$117.87",
      },
      {
        time: "9.5 yr",
        indexRatio: "1.27165",
        coupon: "$119.22",
        principal: "$12,716.53",
        total: "$12,835.75",
      },
    ],
  },
};

/** The stored result for `name` in `data`. A lookup only; throws if it
 * isn't stored. */
export function tipsMeasure(
  data: TipsResponse,
  name: keyof typeof MeasureProto
): MockMeasureResult {
  const result = data.valuation.measureResults.find((r) => r.measure === name);
  if (!result) throw new Error(`No ${name} result in the TIPS mock`);
  return result;
}
