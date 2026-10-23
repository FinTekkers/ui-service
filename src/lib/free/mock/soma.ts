// Mock data for /free/soma, copied from the owner's DataExplorer.dc.html
// artboard (version 1792630643-19db). Figures as of the 2026-10-14 H.4.1.
// Shares and bar widths are stored, not derived in the page; they follow
// the artboard's rule (src/tests/free-soma-page.test.ts checks them).
import type { SomaResponse } from "./types";

export const soma: SomaResponse = {
  asOf: "2026-10-14",
  headline: {
    total: "$6.47T",
    caption: "securities held outright",
    change: "+$185.3B vs a year ago",
  },
  composition: [
    {
      label: "Notes & bonds",
      spoken: "notes and bonds",
      pct: 55.9,
      color: "#5B8DEF",
    },
    { label: "MBS", spoken: "MBS", pct: 29.3, color: "#F0A050" },
    { label: "Bills", spoken: "bills", pct: 8.7, color: "#B9D0FA" },
    {
      label: "TIPS incl. inflation comp.",
      spoken: "TIPS including inflation compensation",
      pct: 6.0,
      color: "#2F5BB7",
    },
  ],
  table: {
    columns: ["Oct 14, 2026", "Oct 15, 2025"],
    // `change` is the artboard's figure, not current − prior: each row is
    // rounded on its own, so MBS shows −187.9 where 1898.2 − 2086.0 = −187.8.
    rows: [
      { label: "Treasury bills", current: 566.0, prior: 196.0, change: 370.0 },
      {
        label: "Notes & bonds, nominal",
        current: 3618.0,
        prior: 3579.0,
        change: 39.0,
      },
      { label: "TIPS principal", current: 280.0, prior: 310.2, change: -30.2 },
      {
        label: "Inflation compensation",
        current: 106.6,
        prior: 112.2,
        change: -5.6,
      },
      { label: "Agency debt", current: 2.3, prior: 2.3, change: 0.0 },
      {
        label: "Mortgage-backed securities",
        current: 1898.2,
        prior: 2086.0,
        change: -187.9,
      },
    ],
    total: {
      label: "Total held outright",
      current: 6471.1,
      prior: 6285.8,
      change: 185.3,
    },
  },
  findings: [
    {
      figure: "+$185.3B",
      title: "The portfolio is growing again",
      body: "With runoff over, total holdings rose from $6.29T to $6.47T year over year.",
    },
    {
      figure: "2.9×",
      title: "Bills nearly tripled",
      body: "From $196.0B to $566.0B. MBS paydowns are reinvested in bills, and since December 2025 the Fed has bought bills to keep bank reserves ample: about $40B a month at first, cut to about $25B in April 2026.",
    },
    {
      figure: "−$187.9B",
      title: "Mortgages keep running off",
      body: "MBS fell to $1.90T. About 94% has more than 10 years left to maturity, so the decline comes from homeowners' principal paydowns, not bonds maturing.",
    },
    {
      figure: "$386.5B",
      title: "A large TIPS holder",
      body: "$280.0B of TIPS principal plus $106.6B of accrued inflation compensation.",
      link: { href: "/free/tips", label: "See how TIPS work" },
    },
  ],
  maturity: {
    labels: [
      "Within 15 days",
      "16–90 days",
      "91 days–1 yr",
      "1–5 yrs",
      "5–10 yrs",
      "Over 10 yrs",
    ],
    tsy: {
      note: "Treasuries are spread across the curve. About $1.03T, or 22%, matures within a year, mostly the bills the Fed has been buying.",
      color: "#2F5BB7",
      buckets: [
        { valueM: 106926, sharePct: 2.3 },
        { valueM: 390845, sharePct: 8.6 },
        { valueM: 529071, sharePct: 11.6 },
        { valueM: 1436242, sharePct: 31.4 },
        { valueM: 482152, sharePct: 10.5 },
        { valueM: 1625316, sharePct: 35.6 },
      ],
    },
    mbs: {
      note: "Almost all mortgage-backed securities have more than 10 years left. They shrink through monthly principal paydowns rather than maturities.",
      color: "#C2620A",
      buckets: [
        { valueM: 0, sharePct: 0.0 },
        { valueM: 8, sharePct: 0.0 },
        { valueM: 163, sharePct: 0.0 },
        { valueM: 5093, sharePct: 0.3 },
        { valueM: 113674, sharePct: 6.0 },
        { valueM: 1779222, sharePct: 93.7 },
      ],
    },
  },
};
