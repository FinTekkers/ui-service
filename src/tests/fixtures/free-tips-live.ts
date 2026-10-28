/**
 * US-298: a /free/tips load result for stubbed security, price, CPI-U and
 * valuation responses. Every figure differs from src/lib/free/mock/tips.ts,
 * so a test that finds one on the page knows it came from the load, not the
 * mock. free-tips-load.test.ts stubs the services so load() returns exactly
 * this.
 */
import { tips } from "../../lib/free/mock/tips";
import { UNAVAILABLE, type TipsPageData } from "../../lib/free/tips";

export const LIVE: TipsPageData = {
  cusip: "91282CPU9",
  asOf: { priceDate: "2026-10-23", cpiMonths: "CPI-U Jul 2026 and Aug 2026" },
  security: {
    ok: true,
    data: {
      cusip: "91282CPU9",
      description: "TII 2⅛ 04/15/35 stub",
      issuer: "United States Treasury",
      product: "TIPS",
      couponRate: "2.125",
      frequency: "Semiannual",
      payDates: "Apr 15 / Oct 15",
      datedDate: "2025-04-15",
      datedDateLong: "April 15, 2025",
      maturityDate: "2035-04-15",
      maturityDateLong: "April 15, 2035",
      index: "CPI-U NSA",
      baseCpi: "319.12345",
      faceValue: "1000",
      faceDisplay: "$1,000",
    },
  },
  price: {
    ok: true,
    data: {
      value: "98.4375",
      date: "2026-10-23",
      dateLong: "October 23, 2026",
      monthYear: "October 2026",
      monthName: "October",
      nextMonthName: "November",
    },
  },
  cpi: {
    ok: true,
    data: {
      readings: [
        { label: "CPI-U Jul 2026", monthName: "July", value: "327.111" },
        { label: "CPI-U Aug 2026", monthName: "August", value: "328.222" },
      ],
      months: "CPI-U Jul 2026 and Aug 2026",
    },
  },
  valuation: {
    ok: true,
    data: {
      referenceCpi: "327.92281",
      indexRatio: "1.02759",
      inflationVerb: "rose",
      inflationPct: "2.76%",
      adjustedPrincipal: "$1,027.59",
      marketValue: "$1,011.53",
      realYield: "1.987",
      nextCoupon: "$10.92",
    },
  },
  calculator: { years: "8.48", inflation: "2.30" },
};

/** Labels, not figures: the live security shares them with the mock. */
const SHARED_LABELS = new Set<string>([
  tips.security.identifiersList[0].identifierValue,
  tips.security.productType,
  // "TIPS are US Treasury bonds…": the page's own copy.
  tips.security.issuerName,
  tips.securityLabels.frequency,
  tips.securityLabels.index,
  // The labelled inflation assumption stays 2.30 by design.
  tips.inputs.inflation,
  "—",
]);

function strings(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(strings);
  if (value && typeof value === "object") {
    return Object.values(value).flatMap(strings);
  }
  return [];
}

/**
 * Every figure the mock holds, built from the module rather than listed by
 * hand, plus the mock's fixed as-of in the forms the old page showed it.
 * Enum names ("CPI_U", "INDEX_RATIO") are not figures.
 */
export const MOCK_FIGURES: string[] = [
  ...new Set([
    ...strings(tips).filter(
      (s) => !SHARED_LABELS.has(s) && !/^[A-Z_]+$/.test(s)
    ),
    tips.asOf,
    "Jun 30",
    "June 30",
    "June 2026",
  ]),
];

/** The mock figures found in `text`. */
export function mockFiguresIn(text: string): string[] {
  return MOCK_FIGURES.filter((figure) => text.includes(figure));
}

/** LIVE with each of `sections` failed, with the load's messages. */
export function liveWithout(
  ...sections: ("security" | "price" | "cpi" | "valuation")[]
): TipsPageData {
  const data: TipsPageData = structuredClone(LIVE);
  for (const section of sections) {
    data[section] = { ok: false, message: UNAVAILABLE[section] };
  }
  return data;
}
