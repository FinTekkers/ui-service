// Mock data for /free/soma, copied from the owner's DataExplorer.dc.html
// artboard (version 1792630643-19db). Figures as of the 2026-10-14 H.4.1.
// Shares and bar widths are stored, not derived in the page; they follow
// the artboard's rule (src/tests/free-soma-page.test.ts checks them).
// Treasury holdings only: owner ruling 3 Nov 2026, Plan MDI-99.
import type { SomaResponse } from "./types";

export const soma: SomaResponse = {
  asOf: "2026-10-14",
  headline: {
    total: "$4.57T",
    caption: "securities held outright",
    change: "+$373.1B vs a year ago",
    note: "Excludes SOMA's mortgage-backed securities (MBS).",
  },
  composition: [
    {
      label: "Notes & bonds",
      spoken: "notes and bonds",
      pct: 79.1,
      color: "#5B8DEF",
    },
    { label: "Bills", spoken: "bills", pct: 12.4, color: "#B9D0FA" },
    {
      label: "TIPS incl. inflation comp.",
      spoken: "TIPS including inflation compensation",
      pct: 8.5,
      color: "#2F5BB7",
    },
  ],
  table: {
    columns: ["Oct 14, 2026", "Oct 15, 2025"],
    // `change` is stored, not current − prior: the artboard rounds each row
    // on its own.
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
    ],
    // The owner's figures, stored as given: the rows' prior column sums to
    // 4,199.7 and their changes to 373.2, each row being rounded on its own.
    total: {
      label: "Total held outright, excluding MBS",
      current: 4572.9,
      prior: 4199.8,
      change: 373.1,
    },
  },
  findings: [
    {
      figure: "+$373.1B",
      title: "The portfolio is growing again",
      body: "With runoff over, total holdings rose from $4.20T to $4.57T year over year.",
    },
    {
      figure: "2.9×",
      title: "Bills nearly tripled",
      body: "From $196.0B to $566.0B. Since December 2025 the Fed has bought bills to keep bank reserves ample: about $40B a month at first, cut to about $25B in April 2026.",
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
  },
};
