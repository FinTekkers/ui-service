// US-338: the funds /free/etf/[ticker] serves, and the only place a fund's
// identity and wording live. Adding a fund is one entry here. Only these
// slugs reach the broker: findEtf is the allowlist the loader checks first.
//
// No fund figures here (expense ratios, AUM, share counts): every number the
// page shows comes from the fund's stored SecurityMetric series.

export interface EtfFund {
  /** The URL segment: lowercase, /free/etf/<slug>. */
  slug: string;
  /** The EXCH_TICKER sent to the broker. */
  ticker: string;
  /** "SPDR S&P 500 ETF Trust". */
  name: string;
  /** Whose figures these are: "State Street". */
  sponsor: string;
  /** "State Street (SPDR)". */
  sponsorFamily: string;
  /** With its article: "a unit investment trust", as in "SPY is a unit investment trust". */
  structure: string;
  /** ISO date every search starts from (the fund's launch), so nothing stored is cut off. */
  searchFrom: string;
  /** The narrative under "What is <ticker>?", one string per paragraph. */
  paragraphs: string[];
  /** The fund's own data page, and the ISO date its daily history starts. */
  source: { label: string; href: string; since: string };
  /** What the expense ratio pays for, after "<ticker> is <structure>: ". */
  feeText: string;
  /** Shown under the narrative when the stored history is split-adjusted. */
  splitNote?: string;
}

export const ETF_FUNDS: readonly EtfFund[] = [
  {
    slug: "spy",
    ticker: "SPY",
    name: "SPDR S&P 500 ETF Trust",
    sponsor: "State Street",
    sponsorFamily: "State Street (SPDR)",
    structure: "a unit investment trust",
    searchFrom: "1993-01-22",
    paragraphs: [
      "The SPDR S&P 500 ETF Trust (SPY) was the first US exchange-traded fund and is still one of the largest. It holds the stocks of the S&P 500 index. It is State Street's fund, part of its SPDR family, not an iShares fund from BlackRock.",
      "Authorised participants create and redeem SPY shares in large blocks, so the share count moves with investor demand. Its assets change for two reasons: money flowing in or out, and the market value of the stocks it holds. The charts below separate the two.",
    ],
    source: {
      label: "State Street SPY fund data",
      href: "https://www.ssga.com/us/en/intermediary/etfs/spdr-sp-500-etf-trust-spy",
      since: "2006-05-31",
    },
    feeText:
      "its expense ratio pays the trustee (State Street), the S&P index licence and marketing costs.",
  },
  {
    slug: "tqqq",
    ticker: "TQQQ",
    name: "ProShares UltraPro QQQ",
    sponsor: "ProShares",
    sponsorFamily: "ProShares",
    structure: "an open-end fund",
    searchFrom: "2010-02-09",
    paragraphs: [
      "ProShares UltraPro QQQ (TQQQ) is a leveraged exchange-traded fund from ProShares. Each day it aims to return three times that day's return on the Nasdaq-100 index, before fees and expenses. Over longer periods its return can differ a lot from three times the index's.",
      "Authorised participants create and redeem TQQQ shares in large blocks, so the share count moves with investor demand. Its assets change for two reasons: money flowing in or out, and the market value of what it holds. The charts below separate the two.",
    ],
    source: {
      label: "ProShares TQQQ fund data",
      href: "https://www.proshares.com/our-etfs/leveraged-and-inverse/tqqq",
      since: "2010-02-09",
    },
    feeText:
      "its expense ratio pays ProShares' management fee and the fund's other costs.",
    splitNote:
      "Split-adjusted history: ProShares restates NAV per share and shares outstanding after each share split, so earlier days are shown on today's share basis, as stored.",
  },
];

/**
 * The fund at `slug`, or undefined. Exact match on the lowercase slug only:
 * "SPY", "spy " and inherited keys like "constructor" match nothing.
 */
export function findEtf(slug: string): EtfFund | undefined {
  return ETF_FUNDS.find((fund) => fund.slug === slug);
}

/** The fee chart's note: "Estimate. SPY is a unit investment trust: …". */
export function etfFeeNote(fund: EtfFund): string {
  return `Estimate. ${fund.ticker} is ${fund.structure}: ${fund.feeText}`;
}
