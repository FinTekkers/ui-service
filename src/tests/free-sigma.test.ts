/**
 * US-341 metric 1: the σ move on fixed closes. return_t ÷ the sample
 * standard deviation of exactly the previous 100 returns, today excluded.
 * The first value lands on the 101st return; missing days are skipped,
 * never filled; a window with no spread gives no value.
 *
 * Expected values are hard-coded, worked out by hand: returns 1–100
 * alternate +1% and −1%, so their mean is 0, their sample stdev is
 * 0.01 × √(100/99) and their population stdev is 0.01.
 */
import { describe, expect, test } from "vitest";
import spyFixture from "./fixtures/sigma-spy-adjusted.json";
import tqqqFixture from "./fixtures/sigma-tqqq-adjusted.json";
import {
  EWMA_LAMBDA,
  SIGMA_BAND,
  SIGMA_WINDOW,
  countOutside,
  dailyReturns,
  ewmaSigmaSeries,
  inRange,
  parseMethod,
  sampleStdev,
  sigmaLabel,
  sigmaSeries,
  topOutliers,
  type Close,
  type SigmaPoint,
} from "$lib/free/sigma";

/** The ISO date `n` days after 2024-01-01. */
function day(n: number): string {
  const d = new Date(Date.UTC(2024, 0, 1));
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Closes from 100, one per day from day(0), stepping by each return. */
function closesFrom(returns: number[]): Close[] {
  const out: Close[] = [{ date: day(0), close: 100 }];
  for (const r of returns) {
    out.push({
      date: day(out.length),
      close: out[out.length - 1].close * (1 + r),
    });
  }
  return out;
}

const ALTERNATING = Array.from({ length: 100 }, (_, i) =>
  i % 2 ? -0.01 : 0.01
);

/** 2 × √0.99: return 101 is +2% against the alternating ±1% window. */
const SIGMA_AT_2PCT = 1.98997487421324;

const sigmas = (closes: Close[]) => sigmaSeries(dailyReturns(closes));

describe("sigmaSeries", () => {
  test("101 closes (100 returns) give no point; 102 give exactly one, on return 101", () => {
    expect(SIGMA_WINDOW).toBe(100);
    const closes = closesFrom([...ALTERNATING, 0.02]);
    expect(closes).toHaveLength(102);
    expect(sigmas(closes.slice(0, 101))).toEqual([]);
    const points = sigmas(closes);
    expect(points).toHaveLength(1);
    expect(points[0].date).toBe(day(101));
  });

  test("divides by the sample stdev of returns 1–100, not the population one", () => {
    const [point] = sigmas(closesFrom([...ALTERNATING, 0.02]));
    expect(point.sigma).toBeCloseTo(SIGMA_AT_2PCT, 9);
    // The population stdev (n, not n − 1) would give 2.
    expect(point.sigma).not.toBeCloseTo(2, 4);
  });

  test("today is excluded: changing return 101 alone moves σ, not the window's stdev", () => {
    const [at2] = sigmas(closesFrom([...ALTERNATING, 0.02]));
    const [at4] = sigmas(closesFrom([...ALTERNATING, 0.04]));
    expect(at4.sigma).toBeCloseTo(3.979949748426, 9);
    expect(at4.sigma / at2.sigma).toBeCloseTo(2, 12);
  });

  test("each point uses exactly the previous 100 returns", () => {
    // A huge return 1 is in return 101's window, not return 102's.
    const returns = [0.5, ...ALTERNATING.slice(1), 0.02, 0.02];
    const points = sigmas(closesFrom(returns));
    expect(points.map((p) => p.date)).toEqual([day(101), day(102)]);
    const window102 = dailyReturns(closesFrom(returns))
      .slice(1, 101)
      .map((r) => r.ret);
    expect(points[1].sigma).toBeCloseTo(0.02 / sampleStdev(window102), 12);
    expect(points[0].sigma).toBeLessThan(0.5);
  });

  test("a flat window (no spread) gives no point and never NaN or Infinity; a varying one gives a point again", () => {
    const flat: Close[] = Array.from({ length: 101 }, (_, i) => ({
      date: day(i),
      close: 100,
    }));
    const closes = [
      ...flat,
      { date: day(101), close: 101 },
      { date: day(102), close: 102 },
    ];
    const points = sigmas(closes);
    expect(points.map((p) => p.date)).toEqual([day(102)]);
    for (const p of points) expect(Number.isFinite(p.sigma)).toBe(true);
  });

  test("a window of identical non-zero returns gives no point either", () => {
    const steady = Array.from({ length: 100 }, () => 0.01);
    const points = sigmas(closesFrom([...steady, 0.02]));
    expect(points).toEqual([]);
  });
});

describe("dailyReturns: missing days are skipped, never filled", () => {
  test("a removed middle close: no return on that date, the next one spans the gap", () => {
    const closes = closesFrom([...ALTERNATING, 0.02, 0.03]);
    const gap = closes.filter((c) => c.date !== day(50));
    const returns = dailyReturns(gap);
    expect(returns).toHaveLength(101);
    expect(returns.find((r) => r.date === day(50))).toBeUndefined();
    const after = returns.find((r) => r.date === day(51));
    expect(after?.ret).toBeCloseTo(closes[51].close / closes[49].close - 1, 15);
    // 102 closes left: exactly one point, and none on the missing date.
    const points = sigmaSeries(returns);
    expect(points.map((p) => p.date)).toEqual([day(102)]);
  });

  test.each([
    ["NaN", NaN],
    ["Infinity", Infinity],
    ["0", 0],
    ["a negative close", -5],
  ])("%s is dropped like a missing day", (_name, bad) => {
    const closes = closesFrom([...ALTERNATING, 0.02, 0.03]);
    const removed = closes.filter((c) => c.date !== day(50));
    const broken = closes.map((c) =>
      c.date === day(50) ? { ...c, close: bad } : c
    );
    expect(dailyReturns(broken)).toEqual(dailyReturns(removed));
    for (const r of dailyReturns(broken)) {
      expect(Number.isFinite(r.ret)).toBe(true);
    }
  });

  test("a repeated date keeps its last close; input order does not matter", () => {
    const closes = closesFrom([0.01, -0.01, 0.02]);
    const dup = [
      closes[0],
      { date: day(1), close: 1 },
      closes[1],
      ...closes.slice(2),
    ];
    expect(dailyReturns(dup)).toEqual(dailyReturns(closes));
    expect(dailyReturns([...closes].reverse())).toEqual(dailyReturns(closes));
    expect(dailyReturns(dup).map((r) => r.date)).toEqual([
      day(1),
      day(2),
      day(3),
    ]);
  });
});

describe("ranges and outliers", () => {
  const pts: SigmaPoint[] = [
    { date: "2019-06-01", sigma: -6.1 },
    { date: "2023-06-01", sigma: 4.2 },
    { date: "2024-06-01", sigma: 3 },
    { date: "2024-06-02", sigma: -3 },
    { date: "2025-01-01", sigma: -3.01 },
    { date: "2025-06-01", sigma: 0.5 },
  ];

  test("exactly ±3σ is inside the band; 1Y, 5Y and All count from the latest date", () => {
    expect(SIGMA_BAND).toBe(3);
    expect(countOutside(pts)).toBe(3);
    expect(inRange(pts, "1Y").map((p) => p.date)).toEqual([
      "2024-06-02",
      "2025-01-01",
      "2025-06-01",
    ]);
    expect(countOutside(inRange(pts, "1Y"))).toBe(1);
    expect(countOutside(inRange(pts, "5Y"))).toBe(2);
    expect(inRange(pts, "All")).toEqual(pts);
  });

  test("top outliers: outside the band only, largest |σ| first, at most n", () => {
    expect(topOutliers(pts)).toEqual([
      { date: "2019-06-01", sigma: -6.1 },
      { date: "2023-06-01", sigma: 4.2 },
      { date: "2025-01-01", sigma: -3.01 },
    ]);
    expect(topOutliers(pts, 1)).toEqual([{ date: "2019-06-01", sigma: -6.1 }]);
  });

  test("labels: sign, two decimals, σ", () => {
    expect(sigmaLabel(-6.1)).toBe("−6.10σ");
    expect(sigmaLabel(4.2)).toBe("+4.20σ");
    expect(sigmaLabel(-0.001)).toBe("0.00σ");
  });
});

// US-360 metric 1: EWMA (λ = 0.94, RiskMetrics) on the stored Yahoo
// adjusted closes, captured from the host price service on 2026-11-28 with
// fetchClosesByTicker. EWMA depends on its seed (the first 100 returns), so
// each fixture starts at the stored history's first close: SPY 1993-01-29,
// TQQQ 2010-02-11. Expected values were computed independently on 27 Nov.
type Fixture = { closes: (string | number)[][] };
const fixtureCloses = (f: Fixture): Close[] =>
  f.closes.map(([date, close]) => ({
    date: String(date),
    close: Number(close),
  }));
const SPY_CLOSES = fixtureCloses(spyFixture);
const TQQQ_CLOSES = fixtureCloses(tqqqFixture);

const sigmaOn = (points: SigmaPoint[], date: string): number => {
  const p = points.find((x) => x.date === date);
  if (!p) throw new Error(`no σ on ${date}`);
  return p.sigma;
};

/** ±0.001, the owner's tolerance. */
const expectNear = (actual: number, expected: number) =>
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(0.001);

describe("ewmaSigmaSeries (US-360)", () => {
  test("the fixtures start at the stored history's first close", () => {
    expect(SPY_CLOSES[0].date).toBe("1993-01-29");
    expect(TQQQ_CLOSES[0].date).toBe("2010-02-11");
  });

  test.each([
    ["SPY", "2018-02-05", -5.5722],
    ["SPY", "2025-04-09", 5.1717],
    ["SPY", "2024-08-05", -2.9154],
    ["TQQQ", "2018-02-05", -4.458],
    ["TQQQ", "2025-04-09", 5.1091],
  ])("%s on %s is %f", (ticker, date, expected) => {
    const closes = ticker === "SPY" ? SPY_CLOSES : TQQQ_CLOSES;
    expectNear(sigmaOn(ewmaSigmaSeries(dailyReturns(closes)), date), expected);
  });

  test("hand fixture, window 3: sample-variance seed, then divide, then update", () => {
    // Seed: sample variance (n − 1) of 0.01, −0.02, 0.03 = 6.3333e-4.
    // Return 4: 0.04 ÷ √6.3333e-4 = +1.5894 (updating first gives 1.5213;
    // a zero-mean seed gives 1.5119). Then 0.94 × 6.3333e-4 + 0.06 × 0.04²
    // = 6.9133e-4, so return 5: −0.05 ÷ √6.9133e-4 = −1.9016.
    const rets = [0.01, -0.02, 0.03, 0.04, -0.05].map((ret, i) => ({
      date: day(i + 1),
      ret,
    }));
    const points = ewmaSigmaSeries(rets, 3);
    expect(points.map((p) => p.date)).toEqual([day(4), day(5)]);
    expect(points[0].sigma).toBeCloseTo(1.5894, 4);
    expect(points[1].sigma).toBeCloseTo(-1.9016, 4);
    expect(EWMA_LAMBDA).toBe(0.94);
  });

  test("100 returns give no point; the first lands on return 101", () => {
    const rets = dailyReturns(closesFrom([...ALTERNATING, 0.02]));
    expect(ewmaSigmaSeries(rets.slice(0, 100))).toEqual([]);
    expect(ewmaSigmaSeries(rets).map((p) => p.date)).toEqual([day(101)]);
  });
});

// US-360 metric 2: the 100-day option is today's series, unchanged.
describe("sigmaSeries on the stored SPY closes (US-360)", () => {
  test("SPY 2018-02-05 is still −9.3072 on the trailing 100 days", () => {
    expectNear(
      sigmaOn(sigmaSeries(dailyReturns(SPY_CLOSES)), "2018-02-05"),
      -9.3072
    );
  });
});

describe("parseMethod (US-360)", () => {
  test("exactly '100d' picks the window; anything else is EWMA", () => {
    expect(parseMethod("100d")).toBe("100d");
    for (const raw of [null, "", "ewma", "foo", "100D", "100d "]) {
      expect(parseMethod(raw), String(raw)).toBe("ewma");
    }
  });
});
