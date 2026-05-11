/**
 * Unit tests for pickBestForBucket — the per-bucket on-the-run picker
 * helper.
 *
 * Pre-M5 / #260: this file exercised the bucket-aware couponRate > 0
 * filter from PR #153 (#232 amend) which kept Treasury STRIPS out of
 * the 30Y bucket by detecting their zero-coupon shape.
 *
 * Post-M5: STRIPS has its own first-class ProductType enum value
 * (along with TBILL / TREASURY_NOTE / TREASURY_BOND / TIPS /
 * TREASURY_FRN); the candidate-build stage in selectOnTheRunBonds
 * filters by product type, so the bucket-level helper no longer has
 * to reason about coupon shape. The helper's contract simplified to
 * "pick the most recently issued candidate whose maturity is within
 * tolerance of the bucket's target".
 *
 * These tests now exercise that simplified contract. The "STRIPS
 * excluded" behavior is enforced one layer up (the canonical
 * ON_THE_RUN_PRODUCT_TYPES set in selectOnTheRunBonds) and covered
 * by the e2e regression in
 * tests/e2e/treasury-curve-strips-filter.spec.ts.
 */
import { describe, expect, test } from 'vitest';
import { pickBestForBucket, TENOR_BUCKETS } from '$lib/treasuryCurveSelection';

const ASOF = new Date('2026-05-11T12:00:00Z');

function addMonths(asOf: Date, n: number): Date {
  const d = new Date(asOf);
  d.setMonth(d.getMonth() + n);
  return d;
}

function bucket(label: string) {
  const b = TENOR_BUCKETS.find((x) => x.label === label);
  if (!b) throw new Error(`unknown bucket ${label}`);
  return b;
}

type Candidate = {
  cusip: string;
  issueDate: Date;
  maturityDate: Date;
};

describe('pickBestForBucket — picks the most-recently-issued in-tolerance candidate', () => {
  test('single candidate at the target maturity is picked', () => {
    const c: Candidate = {
      cusip: 'BOND-30Y',
      issueDate: addMonths(ASOF, -1),
      maturityDate: addMonths(ASOF, 360),
    };
    expect(pickBestForBucket([c], bucket('30Y'), ASOF)?.cusip).toBe('BOND-30Y');
  });

  test('30Y bucket: most-recently-issued wins when two candidates match', () => {
    const older: Candidate = {
      cusip: 'BOND-OLD',
      issueDate: addMonths(ASOF, -3),
      maturityDate: addMonths(ASOF, 360),
    };
    const newer: Candidate = {
      cusip: 'BOND-NEW',
      issueDate: addMonths(ASOF, -1),
      maturityDate: addMonths(ASOF, 360),
    };
    expect(pickBestForBucket([older, newer], bucket('30Y'), ASOF)?.cusip).toBe('BOND-NEW');
  });

  test('6M bucket: most-recently-issued bill wins', () => {
    const older: Candidate = {
      cusip: 'BILL-OLD',
      issueDate: addMonths(ASOF, -2),
      maturityDate: addMonths(ASOF, 6),
    };
    const newer: Candidate = {
      cusip: 'BILL-NEW',
      issueDate: addMonths(ASOF, -1),
      maturityDate: addMonths(ASOF, 6),
    };
    expect(pickBestForBucket([older, newer], bucket('6M'), ASOF)?.cusip).toBe('BILL-NEW');
  });

  test('returns null when no candidate falls within tolerance', () => {
    // 30Y bucket targets ~360 months out; a 60-month-out candidate
    // is way outside the long-tenor tolerance.
    const wayOff: Candidate = {
      cusip: 'NOT-A-MATCH',
      issueDate: addMonths(ASOF, -1),
      maturityDate: addMonths(ASOF, 60),
    };
    expect(pickBestForBucket([wayOff], bucket('30Y'), ASOF)).toBeNull();
  });

  test('empty candidate list returns null', () => {
    expect(pickBestForBucket([], bucket('10Y'), ASOF)).toBeNull();
  });
});

describe('pickBestForBucket — M5 / #260: no longer applies a coupon-shape filter', () => {
  // Pre-M5 the bucket-level filter dropped couponRate=0 candidates
  // from buckets > 12 months. Post-M5 STRIPS is filtered at the
  // candidate stage in selectOnTheRunBonds via
  // ON_THE_RUN_PRODUCT_TYPES, so the helper trusts that what it
  // receives belongs in the bucket. This test locks in the
  // simplification — the generic constraint no longer requires
  // couponRate.
  test('a candidate with no coupon-rate field is picked when its maturity matches', () => {
    const c: Candidate = {
      cusip: 'BOND-30Y',
      issueDate: addMonths(ASOF, -1),
      maturityDate: addMonths(ASOF, 360),
    };
    expect(pickBestForBucket([c], bucket('30Y'), ASOF)?.cusip).toBe('BOND-30Y');
  });
});
