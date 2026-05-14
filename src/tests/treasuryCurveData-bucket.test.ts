/**
 * Unit coverage for $lib/treasuryCurveData.bucketForMonths — #268.
 *
 * The post-#268 loader receives a flat list of constituent Securities
 * from the server-side index resolver and derives a tenor label per row
 * by mapping months-to-maturity to the closest TENOR_BUCKETS entry.
 * This is the only place where label drift could hide a regression
 * (e.g. a 6.4Y note collapsing to the 5Y bucket instead of 7Y), so it
 * gets pinned regardless of the gRPC integration.
 */
import { describe, expect, test } from 'vitest';
import { bucketForMonths, TENOR_BUCKETS } from '$lib/treasuryCurveData';

describe('bucketForMonths', () => {
  test('exact bucket months snap to their own label', () => {
    for (const b of TENOR_BUCKETS) {
      expect(bucketForMonths(b.months).label).toBe(b.label);
    }
  });

  test('off-by-one months snap to the nearest bucket', () => {
    expect(bucketForMonths(2).label).toBe('1M');     // 2mo is closer to 1mo (1) than 3mo (1) → tie → first wins
    expect(bucketForMonths(4).label).toBe('3M');     // 4 closer to 3 than 6
    expect(bucketForMonths(11).label).toBe('1Y');    // 11mo closer to 12 than 6
    expect(bucketForMonths(78).label).toBe('7Y');    // 78mo (6.5Y) closer to 84 (7Y) than 60 (5Y)
    expect(bucketForMonths(115).label).toBe('10Y');  // 115mo (~9.6Y) closer to 120 than 84
  });

  test('long-tenor maturities map to 20Y / 30Y buckets correctly', () => {
    // ties resolve to the first-seen (lower) bucket — `<` not `<=` in the picker
    expect(bucketForMonths(180).label).toBe('10Y');  // 15Y equidistant between 10Y and 20Y → first wins
    expect(bucketForMonths(210).label).toBe('20Y');  // 17.5Y closer to 20Y (30) than 10Y (90)
    expect(bucketForMonths(240).label).toBe('20Y');
    expect(bucketForMonths(300).label).toBe('20Y');  // 25Y equidistant between 20Y and 30Y → first wins
    expect(bucketForMonths(330).label).toBe('30Y');  // 27.5Y closer to 30Y (30) than 20Y (90)
    expect(bucketForMonths(360).label).toBe('30Y');
    expect(bucketForMonths(420).label).toBe('30Y');  // 35Y past 30Y clamps at 30Y
  });

  test('TENOR_BUCKETS spans 1M through 30Y inclusive', () => {
    expect(TENOR_BUCKETS).toHaveLength(11);
    expect(TENOR_BUCKETS[0].label).toBe('1M');
    expect(TENOR_BUCKETS[TENOR_BUCKETS.length - 1].label).toBe('30Y');
  });
});
