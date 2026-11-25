/**
 * US-339 metrics 1–2: the XLK ÷ SPY drawdown from its 252-session high,
 * the troughs of episodes deeper than −10%, and 'worst since', on fixed
 * series.
 */
import { describe, expect, test } from "vitest";
import {
  alignCloses,
  drawdowns,
  percentLabel,
  troughs,
  worstSince,
  type Close,
  type DrawdownPoint,
  type RatioPoint,
} from "$lib/free/techVsSp500";

/** The ISO date `n` days after 2000-01-01. */
function day(n: number): string {
  const d = new Date(Date.UTC(2000, 0, 1));
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Ratio points on consecutive days, from plain ratios. */
function ratios(values: number[]): RatioPoint[] {
  return values.map((ratio, i) => ({ date: day(i), ratio }));
}

/** A drawdown series on consecutive days, from plain dd values. */
function dds(values: number[]): DrawdownPoint[] {
  return values.map((dd, i) => ({ date: day(i), dd }));
}

const flat = (n: number, v = 1) => Array.from({ length: n }, () => v);

describe("drawdowns (metric 1)", () => {
  test("0 at a new trailing high, and at a close equal to the max", () => {
    const out = drawdowns(ratios([...flat(251), 2, 1.5, 2]));
    expect(out).toHaveLength(3);
    expect(Object.is(out[0].dd, 0)).toBe(true);
    expect(out[1].dd).toBe(1.5 / 2 - 1);
    // Equal to the max: exactly +0, not -0 or a rounding residue.
    expect(Object.is(out[2].dd, 0)).toBe(true);
  });

  test("below a high it is exactly ratio ÷ max − 1", () => {
    const values = [...flat(251, 1.1), 1.25, 0.8, 0.9731];
    const out = drawdowns(ratios(values));
    expect(out.map((p) => p.dd)).toEqual([
      0,
      0.8 / 1.25 - 1,
      0.9731 / 1.25 - 1,
    ]);
    for (const p of out) expect(p.dd).toBeLessThanOrEqual(0);
  });

  test("a high 252 sessions back counts (today included)", () => {
    // Today is index 300; the high is at 300 − 251, the window's first day.
    const values = flat(301);
    values[300 - 251] = 2;
    const out = drawdowns(ratios(values));
    expect(out[out.length - 1]).toEqual({ date: day(300), dd: -0.5 });
  });

  test("a high 253 sessions back does not count", () => {
    const values = flat(301);
    values[300 - 252] = 2;
    const out = drawdowns(ratios(values));
    expect(out[out.length - 1]).toEqual({ date: day(300), dd: 0 });
    // The day before, the same high was still 252 sessions back.
    expect(out[out.length - 2].dd).toBe(-0.5);
  });

  test("output starts at the 252nd session; fewer than 252 give []", () => {
    const out = drawdowns(ratios(flat(260)));
    expect(out).toHaveLength(260 - 251);
    expect(out[0].date).toBe(day(251));
    expect(drawdowns(ratios(flat(251)))).toEqual([]);
    expect(drawdowns([])).toEqual([]);
  });
});

describe("alignCloses (metric 1)", () => {
  test("a date where XLK or SPY has no close is skipped, never filled", () => {
    const xlk: Close[] = [
      { date: day(0), close: 10 },
      { date: day(1), close: 11 },
      // day(2): no XLK close
      { date: day(3), close: 12 },
      { date: day(4), close: 13 },
    ];
    const spy: Close[] = [
      { date: day(0), close: 100 },
      // day(1): no SPY close
      { date: day(2), close: 102 },
      { date: day(3), close: 103 },
      { date: day(4), close: 104 },
    ];
    expect(alignCloses(xlk, spy)).toEqual([
      { date: day(0), ratio: 10 / 100 },
      { date: day(3), ratio: 12 / 103 },
      { date: day(4), ratio: 13 / 104 },
    ]);
  });

  test("the window counts aligned sessions, not calendar days", () => {
    // XLK every day; SPY missing every third day. 380 calendar days give
    // 254 aligned sessions.
    const xlk: Close[] = [];
    const spy: Close[] = [];
    for (let i = 0; i < 380; i++) {
      xlk.push({ date: day(i), close: 1 });
      if (i % 3 !== 2) spy.push({ date: day(i), close: 1 });
    }
    const aligned = alignCloses(xlk, spy);
    expect(aligned).toHaveLength(254);
    expect(aligned.map((p) => p.date)).not.toContain(day(2));
    const today = aligned.length - 1;
    // The high 252 sessions back, over 252 calendar days ago, still counts.
    const highAt = today - 251;
    const highDate = aligned[highAt].date;
    const lastDate = aligned[today].date;
    const calendarDays =
      (Date.parse(lastDate) - Date.parse(highDate)) / 86_400_000;
    expect(calendarDays).toBeGreaterThan(252);
    const withHigh = aligned.map((p, i) =>
      i === highAt ? { ...p, ratio: 4 } : p
    );
    const out = drawdowns(withHigh);
    expect(out).toHaveLength(254 - 251);
    expect(out[0].date).toBe(aligned[251].date);
    expect(out[out.length - 1]).toEqual({ date: lastDate, dd: -0.75 });
    // One session later it would be 253 back: shifting the high one
    // session earlier drops it.
    const earlier = aligned.map((p, i) =>
      i === highAt - 1 ? { ...p, ratio: 4 } : p
    );
    expect(drawdowns(earlier).at(-1)?.dd).toBe(0);
  });

  test("a non-positive or missing close is skipped", () => {
    const xlk: Close[] = [
      { date: day(0), close: 0 },
      { date: day(1), close: Number.NaN },
      { date: day(2), close: 5 },
    ];
    const spy: Close[] = [
      { date: day(0), close: 50 },
      { date: day(1), close: 50 },
      { date: day(2), close: 50 },
    ];
    expect(alignCloses(xlk, spy)).toEqual([{ date: day(2), ratio: 0.1 }]);
  });
});

describe("troughs (metric 2)", () => {
  test("−15% and −25% episodes give one point each at their deepest; a −6% dip gives none", () => {
    const series = dds([
      0,
      -0.05,
      -0.15,
      -0.08,
      0, // −15% episode
      -0.02,
      -0.06,
      -0.01,
      0, // −6% dip
      -0.1,
      -0.2,
      -0.25,
      -0.12,
      0, // −25% episode
    ]);
    expect(troughs(series)).toEqual([
      { date: day(2), dd: -0.15 },
      { date: day(11), dd: -0.25 },
    ]);
  });

  test("exactly −10% is not deeper than −10%; −10.01% is", () => {
    expect(troughs(dds([0, -0.05, -0.1, -0.03, 0]))).toEqual([]);
    expect(troughs(dds([0, -0.05, -0.1001, -0.03, 0]))).toEqual([
      { date: day(2), dd: -0.1001 },
    ]);
  });

  test("an episode still open at the latest date counts", () => {
    expect(troughs(dds([0, -0.04, -0.18, -0.16]))).toEqual([
      { date: day(2), dd: -0.18 },
    ]);
  });

  test("a tied minimum gives one point, at its first date", () => {
    expect(troughs(dds([0, -0.2, -0.12, -0.2, -0.05, 0]))).toEqual([
      { date: day(1), dd: -0.2 },
    ]);
  });

  test("no series, or no dip, gives none", () => {
    expect(troughs([])).toEqual([]);
    expect(troughs(dds([0, 0, 0]))).toEqual([]);
  });
});

describe("worstSince (metric 2)", () => {
  test("the last earlier date at least as deep as the latest", () => {
    // Deeper on day 1 and day 4; day 6 is shallower; latest −0.2.
    const series = dds([0, -0.3, -0.1, 0, -0.25, -0.05, -0.15, -0.2]);
    expect(worstSince(series)).toBe(day(4));
  });

  test("an earlier day exactly as deep counts", () => {
    expect(worstSince(dds([0, -0.2, -0.3, -0.2, -0.1, -0.2]))).toBe(day(3));
  });

  test("null when the latest is the deepest on record", () => {
    expect(worstSince(dds([0, -0.1, -0.05, -0.3]))).toBeNull();
  });

  test("null when the latest is 0 (a new high), never the previous 0% day", () => {
    expect(worstSince(dds([0, -0.1, 0, 0]))).toBeNull();
    expect(worstSince([])).toBeNull();
  });
});

describe("percentLabel", () => {
  test("one decimal, U+2212 minus, no −0.0%", () => {
    expect(percentLabel(-0.17234)).toBe("−17.2%");
    expect(percentLabel(0)).toBe("0.0%");
    expect(percentLabel(-0.00001)).toBe("0.0%");
  });
});
