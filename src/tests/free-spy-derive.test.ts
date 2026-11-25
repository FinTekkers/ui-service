/**
 * US-334 metric 1: /free/spy's loader derivations on fixed series.
 * (a) each month's net flows + market move equals its ΔAUM exactly;
 * (b) fee revenue sums daily AUM × the expense ratio in force that day ÷ 365
 *     over every calendar day, splitting a month at a ratio change. US-336:
 *     the ratio is EXPENSE_RATIO in percent (0.0945 = 0.0945%), as the
 *     ledger-models proto comment defines it;
 * (c) missing days stay gaps (null, never 0) in every derived series.
 *
 * @vitest-environment node
 */
import Decimal from "decimal.js";
import { describe, expect, test } from "vitest";
import {
  feeRevenue,
  latestShareCount,
  mergeRatio,
  monthlyFlows,
  tradingCalendar,
  type DailySeries,
} from "$lib/server/free-spy";
import { isStale } from "$lib/free/spy";

type Row = [string, string];

const without = (series: Row[], date: string): Row[] =>
  series.filter(([d]) => d !== date);

// Five trading days over three months, worked by hand:
//   Jan: first day, no previous day   → netFlows null, ΔAUM null
//   Feb: (110−100)×11 + (105−110)×12 = 110 − 60 = 50;  ΔAUM 1260−1000 = 260
//   Mar: (120−105)×13 + (120−120)×14 = 195;            ΔAUM 1680−1260 = 420
const SHARES: Row[] = [
  ["2026-01-30", "100"],
  ["2026-02-02", "110"],
  ["2026-02-27", "105"],
  ["2026-03-02", "120"],
  ["2026-03-31", "120"],
];
const NAV: Row[] = [
  ["2026-01-30", "10"],
  ["2026-02-02", "11"],
  ["2026-02-27", "12"],
  ["2026-03-02", "13"],
  ["2026-03-31", "14"],
];
const TNA: Row[] = [
  ["2026-01-30", "1000"],
  ["2026-02-02", "1210"],
  ["2026-02-27", "1260"],
  ["2026-03-02", "1560"],
  ["2026-03-31", "1680"],
];

/** Every weekday from `from` to `to`, ISO. */
function weekdays(from: string, to: string): string[] {
  const days: string[] = [];
  for (
    let d = new Date(`${from}T00:00:00Z`);
    d.toISOString().slice(0, 10) <= to;
    d.setUTCDate(d.getUTCDate() + 1)
  ) {
    const dow = d.getUTCDay();
    if (dow !== 0 && dow !== 6) days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

// A long, irregular fixture for the exactness check: fractional NAVs and
// TNAs that don't divide evenly, so any float maths would show.
function longFixture() {
  const days = weekdays("2025-01-02", "2025-12-31");
  const shares: Row[] = [];
  const nav: Row[] = [];
  const tna: Row[] = [];
  days.forEach((day, i) => {
    const s = 1_000_000_000 + ((i * 7919) % 13) * 250_000 - (i % 5) * 100_000;
    const n = new Decimal("500.123457").plus(new Decimal(i).times("0.37"));
    shares.push([day, String(s)]);
    nav.push([day, n.toString()]);
    tna.push([day, n.times(s).plus("0.01").toString()]);
  });
  return { shares, nav, tna };
}

describe("metric 1a: net flows + market move = ΔAUM", () => {
  test("hand-worked months", () => {
    expect(monthlyFlows(SHARES, NAV, TNA)).toEqual([
      {
        month: "2026-01",
        aumEnd: "1000",
        deltaAum: null,
        netFlows: null,
        marketMove: null,
      },
      {
        month: "2026-02",
        aumEnd: "1260",
        deltaAum: "260",
        netFlows: "50",
        marketMove: "210",
      },
      {
        month: "2026-03",
        aumEnd: "1680",
        deltaAum: "420",
        netFlows: "195",
        marketMove: "225",
      },
    ]);
  });

  test("exact under Decimal for every month of a year of irregular data", () => {
    const { shares, nav, tna } = longFixture();
    const months = monthlyFlows(shares, nav, tna);
    expect(months).toHaveLength(12);
    for (const m of months.slice(1)) {
      expect(m.deltaAum).not.toBeNull();
      expect(m.netFlows).not.toBeNull();
      expect(m.marketMove).not.toBeNull();
      expect(
        new Decimal(m.netFlows as string)
          .plus(m.marketMove as string)
          .equals(m.deltaAum as string)
      ).toBe(true);
    }
  });

  test("the first month has null ΔAUM and market move, never 0", () => {
    const [first] = monthlyFlows(SHARES, NAV, TNA);
    expect(first.deltaAum).toBeNull();
    expect(first.marketMove).toBeNull();
  });
});

describe("metric 1b: fee revenue", () => {
  // May–Jul 2026, weekdays only. TNA is 365,000 (so 1 a day at 0.1%),
  // except Friday 5 June at 730,000, which Saturday and Sunday carry.
  const calendar = weekdays("2026-05-01", "2026-07-03");
  const tna: Row[] = calendar.map((d) => [
    d,
    d === "2026-06-05" ? "730000" : "365000",
  ]);
  // Percent, as stored: 0.1% from 15 May; doubles to 0.2% on Monday 15 June.
  const ratio: Row[] = [
    ["2026-05-15", "0.1"],
    ["2026-06-15", "0.2"],
  ];

  // June by hand:
  //   1–4 June    4 days × 365,000 × 0.1% / 365 = 4
  //   5–7 June    3 days × 730,000 × 0.1% / 365 = 6  (Fri, and Sat/Sun carry Fri)
  //   8–14 June   7 days × 1                    = 7
  //   15–30 June 16 days × 365,000 × 0.2% / 365 = 32 (the change day itself at 0.2%)
  //   total 49
  test("splits at the change date, applies a ratio on its own date, and carries Friday's AUM over the weekend", () => {
    const fees = feeRevenue(tna, ratio, calendar);
    const june = fees.find((f) => f.month === "2026-06");
    expect(june?.fee).not.toBeNull();
    expect(new Decimal(june?.fee as string).equals(49)).toBe(true);
  });

  test("a month that starts before any ratio is in force is null", () => {
    const may = feeRevenue(tna, ratio, calendar).find(
      (f) => f.month === "2026-05"
    );
    expect(may).toEqual({ month: "2026-05", fee: null });
  });

  test("the latest month runs to the last trading day: 1–3 July at 2 a day = 6", () => {
    const july = feeRevenue(tna, ratio, calendar).find(
      (f) => f.month === "2026-07"
    );
    expect(new Decimal(july?.fee as string).equals(6)).toBe(true);
  });

  test("a missing TNA trading day nulls its month only", () => {
    const gappy = without(tna, "2026-06-10");
    const fees = feeRevenue(gappy, ratio, calendar);
    expect(fees.find((f) => f.month === "2026-06")?.fee).toBeNull();
    expect(
      new Decimal(
        fees.find((f) => f.month === "2026-07")?.fee as string
      ).equals(6)
    ).toBe(true);
  });

  test("no ratio series gives every month null, never a default", () => {
    for (const f of feeRevenue(tna, [], calendar)) expect(f.fee).toBeNull();
  });

  // Friday 19 June is a holiday: in neither the calendar nor TNA, as when
  // production builds the calendar from TNA. Thursday 18 June's AUM is
  // doubled so the carry shows: 18–21 June are 4 days × 730,000 × 0.2% / 365
  // = 16, not 4 × 2 = 8, so June is 49 − 8 + 16 = 57.
  test("a holiday uses the prior trading day's AUM, like a weekend", () => {
    const holiday = "2026-06-19";
    const cal = calendar.filter((d) => d !== holiday);
    const t: Row[] = without(tna, holiday).map(([d, v]) => [
      d,
      d === "2026-06-18" ? "730000" : v,
    ]);
    const june = feeRevenue(t, ratio, cal).find((f) => f.month === "2026-06");
    expect(june?.fee).not.toBeNull();
    expect(new Decimal(june?.fee as string).equals(57)).toBe(true);
  });

  // The point in force on the AUM start (from GetLatest) is dated 20 April,
  // before the first AUM day, so it applies from 1 May: 31 days × 1 = 31.
  test("a ratio point dated before the AUM start applies from day one", () => {
    const merged = mergeRatio(ratio, ["2026-04-20", "0.1"]);
    expect(merged[0]).toEqual(["2026-04-20", "0.1"]);
    const may = feeRevenue(tna, merged, calendar).find(
      (f) => f.month === "2026-05"
    );
    expect(may?.fee).not.toBeNull();
    expect(new Decimal(may?.fee as string).equals(31)).toBe(true);
  });

  test("mergeRatio keeps one point per date, ascending", () => {
    expect(
      mergeRatio(
        [
          ["2026-06-15", "0.2"],
          ["2026-05-15", "0.1"],
        ],
        ["2026-05-15", "0.1"]
      )
    ).toEqual([
      ["2026-05-15", "0.1"],
      ["2026-06-15", "0.2"],
    ]);
    expect(mergeRatio([], null)).toEqual([]);
  });

  // Units anchor: SPY's 0.0945% on a constant 3,650,000,000 for all of
  // June 2026 (30 days) is 3,650,000,000 × 0.0945 / 100 / 365 = 9,450 a day,
  // 283,500 for the month: average daily AUM × 0.0945% × days ÷ 365.
  test("EXPENSE_RATIO is percent: 0.0945 is 0.0945% a year", () => {
    const june = weekdays("2026-06-01", "2026-06-30");
    const fees = feeRevenue(
      june.map((d) => [d, "3650000000"]),
      [["2007-01-26", "0.0945"]],
      june
    );
    expect(fees).toHaveLength(1);
    expect(new Decimal(fees[0].fee as string).equals(283_500)).toBe(true);
  });
});

describe("metric 1c: missing days stay null", () => {
  test("a missing NAV day nulls that month's flows and market move", () => {
    const [jan, feb, mar] = monthlyFlows(
      SHARES,
      without(NAV, "2026-02-27"),
      TNA
    );
    expect(feb.netFlows).toBeNull();
    expect(feb.marketMove).toBeNull();
    expect(feb.deltaAum).toBe("260");
    expect(jan.aumEnd).toBe("1000");
    expect(mar).toMatchObject({ netFlows: "195", marketMove: "225" });
  });

  test("a missing shares day nulls that month; neighbouring months are unchanged", () => {
    const [jan, feb, mar] = monthlyFlows(
      without(SHARES, "2026-02-02"),
      NAV,
      TNA
    );
    expect(feb.netFlows).toBeNull();
    expect(feb.marketMove).toBeNull();
    expect(jan).toMatchObject({ aumEnd: "1000", netFlows: null });
    expect(mar).toMatchObject({
      deltaAum: "420",
      netFlows: "195",
      marketMove: "225",
    });
  });

  test("a missing month-end TNA nulls aumEnd (no earlier day), that month's ΔAUM and the next month's", () => {
    const [, feb, mar] = monthlyFlows(SHARES, NAV, without(TNA, "2026-02-27"));
    expect(feb.aumEnd).toBeNull();
    expect(feb.deltaAum).toBeNull();
    expect(feb.marketMove).toBeNull();
    expect(feb.netFlows).toBe("50");
    expect(mar.aumEnd).toBe("1680");
    expect(mar.deltaAum).toBeNull();
    expect(mar.marketMove).toBeNull();
  });

  test("a month with no stored days at all is kept, every figure null", () => {
    const skip = (s: Row[]) => s.filter(([d]) => !d.startsWith("2026-02"));
    const months = monthlyFlows(skip(SHARES), skip(NAV), skip(TNA));
    expect(months.map((m) => m.month)).toEqual([
      "2026-01",
      "2026-02",
      "2026-03",
    ]);
    expect(months[1]).toEqual({
      month: "2026-02",
      aumEnd: null,
      deltaAum: null,
      netFlows: null,
      marketMove: null,
    });
    // March can't reach back across the empty month.
    expect(months[2].netFlows).toBeNull();
    expect(months[2].deltaAum).toBeNull();
  });

  test("a stored null value is a gap, not 0", () => {
    const nulled: DailySeries = NAV.map(([d, v]) => [
      d,
      d === "2026-03-02" ? null : v,
    ]);
    const mar = monthlyFlows(SHARES, nulled, TNA)[2];
    expect(mar.netFlows).toBeNull();
    expect(mar.marketMove).toBeNull();
  });

  test("the trading calendar is the union of the series", () => {
    expect(
      tradingCalendar([["2026-01-02", "1"]], [["2026-01-01", "1"]], [])
    ).toEqual(["2026-01-01", "2026-01-02"]);
  });
});

describe("latest share count and staleness", () => {
  test("latestShareCount skips a trailing null", () => {
    expect(
      latestShareCount([
        ["2026-11-20", "5"],
        ["2026-11-21", null],
      ])
    ).toEqual({ date: "2026-11-20", value: "5" });
    expect(latestShareCount([])).toBeNull();
  });

  test("isStale: 14 whole UTC days is fresh, 15 is stale", () => {
    const now = new Date("2026-11-25T23:59:00Z");
    expect(isStale("2026-11-11", now)).toBe(false);
    expect(isStale("2026-11-10", now)).toBe(true);
  });
});
