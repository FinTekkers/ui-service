// What /free/tips's server load (src/routes/free/tips/+page.server.ts)
// returns: display strings only, formatted on the server. Each section loads
// on its own; a failed one carries a message instead of figures, never the
// mock in ./mock/tips.ts, which only tests read.

/** One live section: its figures, or the message to show instead. */
export type Section<T> = { ok: true; data: T } | { ok: false; message: string };

/** The security panel, from the ledger security master. */
export interface TipsSecurityView {
  cusip: string;
  description: string;
  issuer: string;
  product: string;
  /** Percent, e.g. "1.875". */
  couponRate: string;
  frequency: string;
  /** e.g. "Jan 15 / Jul 15". */
  payDates: string;
  /** ISO dates, and the same dates in words ("January 15, 2026"). */
  datedDate: string;
  datedDateLong: string;
  maturityDate: string;
  maturityDateLong: string;
  index: string;
  baseCpi: string;
  /** The security's face value, e.g. "1000": the calculator's face. */
  faceValue: string;
  /** The face in dollars, e.g. "$1,000". */
  faceDisplay: string;
}

/** The latest FedInvest real clean price within the 7-day lookback. */
export interface TipsPriceView {
  /** Per 100 of face, e.g. "97.125". */
  value: string;
  /** ISO date of the price, e.g. "2026-10-27". */
  date: string;
  dateLong: string;
  /** e.g. "October 2026". */
  monthYear: string;
  /** The price month and the next, e.g. "October", "November". */
  monthName: string;
  nextMonthName: string;
}

/** One monthly CPI-U NSA level from the price service. */
export interface TipsCpiReadingView {
  /** e.g. "CPI-U Jul 2026". */
  label: string;
  /** e.g. "July". */
  monthName: string;
  value: string;
}

/** CPI-U months m-3 and m-2 of the price date's month. */
export interface TipsCpiView {
  readings: [TipsCpiReadingView, TipsCpiReadingView];
  /** e.g. "CPI-U Jul 2026 and Aug 2026". */
  months: string;
}

/** valuation-service's measures for one position of the security's face. */
export interface TipsValuationView {
  /** REFERENCE_CPI and INDEX_RATIO, to 5 decimals as Treasury shows them. */
  referenceCpi: string;
  indexRatio: string;
  /** How prices moved since the dated date, from INDEX_RATIO: "rose" or
   * "fell", and by how much, e.g. "2.46%". */
  inflationVerb: "rose" | "fell";
  inflationPct: string;
  /** INFLATION_ADJUSTED_PRINCIPAL and MARKET_VALUE, in dollars. */
  adjustedPrincipal: string;
  marketValue: string;
  /** YIELD_TO_MATURITY, which is the real yield for a TIPS, in percent. */
  realYield: string;
  /** The first projected cashflow, in dollars; null when none came back. */
  nextCoupon: string | null;
}

export interface TipsPageData {
  cusip: string;
  /** What the figures are as of: the price date and the CPI-U months. */
  asOf: { priceDate: string | null; cpiMonths: string | null };
  security: Section<TipsSecurityView>;
  price: Section<TipsPriceView>;
  cpi: Section<TipsCpiView>;
  valuation: Section<TipsValuationView>;
  /** Calculator inputs that are not a single section's figure. */
  calculator: {
    /** Years from the price date to maturity, or null without both. */
    years: string | null;
    /** The labelled assumption, in percent: a user input, not live data. */
    inflation: string;
  };
}

export const UNAVAILABLE = {
  security: "Live security data is unavailable right now.",
  price: "The live FedInvest price is unavailable right now.",
  cpi: "Live CPI-U data is unavailable right now.",
  valuation: "The live valuation is unavailable right now.",
  // US-298b: needs an inflation assumption in the valuation request.
  projection:
    "Unavailable: this needs an inflation forecast, which the valuation service doesn't take yet.",
  value: "Unavailable",
} as const;

/** The message of the first section that failed, or "" when none did. */
export function firstUnavailable(...sections: Section<unknown>[]): string {
  for (const section of sections) {
    if (!section.ok) return section.message;
  }
  return "";
}
