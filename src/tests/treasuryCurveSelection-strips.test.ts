/**
 * Unit tests for the bucket-aware zero-coupon rule in
 * pickBestForBucket (second-brain#232 amend after review feedback).
 *
 * The original PR #153 universally filtered couponRate > 0, which
 * wrongly excluded T-bills (legitimately zero-coupon discount
 * instruments). The amended rule applies the filter only to buckets
 * > 12 months, where notes/bonds live and a couponRate=0 entry is a
 * Treasury STRIP slipping in via the BOND_SECURITY type.
 *
 * pickBestForBucket is generic on the candidate shape — it reads
 * only issueDate / maturityDate / couponRate — so tests feed in
 * minimal plain objects and don't need the gRPC mocking surface.
 */
import { describe, expect, test } from 'vitest';
import { pickBestForBucket, TENOR_BUCKETS } from '$lib/treasuryCurveSelection';

const ASOF = new Date('2026-05-08T12:00:00Z');

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
  couponRate: number;
};

describe('pickBestForBucket — T-bills (≤12m) accept zero-coupon', () => {
  test('a zero-coupon ~6m bill IS picked into the 6M bucket', () => {
    const bill: Candidate = {
      cusip: 'BILL-123',
      issueDate: addMonths(ASOF, -1),
      maturityDate: addMonths(ASOF, 6),
      couponRate: 0,
    };
    const best = pickBestForBucket([bill], bucket('6M'), ASOF);
    expect(best?.cusip).toBe('BILL-123');
  });

  test('a zero-coupon ~3m bill IS picked into the 3M bucket', () => {
    const bill: Candidate = {
      cusip: 'BILL-3M',
      issueDate: addMonths(ASOF, -1),
      maturityDate: addMonths(ASOF, 3),
      couponRate: 0,
    };
    const best = pickBestForBucket([bill], bucket('3M'), ASOF);
    expect(best?.cusip).toBe('BILL-3M');
  });

  test('a zero-coupon ~12m bill IS picked into the 1Y bucket (boundary)', () => {
    const bill: Candidate = {
      cusip: 'BILL-1Y',
      issueDate: addMonths(ASOF, -1),
      maturityDate: addMonths(ASOF, 12),
      couponRate: 0,
    };
    const best = pickBestForBucket([bill], bucket('1Y'), ASOF);
    expect(best?.cusip).toBe('BILL-1Y');
  });
});

describe('pickBestForBucket — Notes/Bonds (>12m) reject zero-coupon (STRIPS)', () => {
  test('a zero-coupon ~30y STRIPS-shape candidate is NOT picked into the 30Y bucket', () => {
    const strips: Candidate = {
      cusip: 'STRIPS-XYZ',
      issueDate: addMonths(ASOF, -1),
      maturityDate: addMonths(ASOF, 360),
      couponRate: 0,
    };
    expect(pickBestForBucket([strips], bucket('30Y'), ASOF)).toBeNull();
  });

  test('a zero-coupon ~10y STRIPS-shape candidate is NOT picked into the 10Y bucket', () => {
    const strips: Candidate = {
      cusip: 'STRIPS-10Y',
      issueDate: addMonths(ASOF, -1),
      maturityDate: addMonths(ASOF, 120),
      couponRate: 0,
    };
    expect(pickBestForBucket([strips], bucket('10Y'), ASOF)).toBeNull();
  });

  test('conventional 30Y bond (couponRate>0) IS picked into the 30Y bucket', () => {
    const bond: Candidate = {
      cusip: 'BOND-ABC',
      issueDate: addMonths(ASOF, -1),
      maturityDate: addMonths(ASOF, 360),
      couponRate: 4.25,
    };
    const best = pickBestForBucket([bond], bucket('30Y'), ASOF);
    expect(best?.cusip).toBe('BOND-ABC');
  });

  test('mixed 30Y bucket: STRIPS dropped, conventional bond picked even if STRIPS is more recently issued', () => {
    const conventional: Candidate = {
      cusip: 'BOND-ABC',
      issueDate: addMonths(ASOF, -2),
      maturityDate: addMonths(ASOF, 360),
      couponRate: 4.25,
    };
    const strips: Candidate = {
      // More recently issued — would win the most-recent tiebreak
      // pre-fix, biasing the curve.
      cusip: 'STRIPS-XYZ',
      issueDate: addMonths(ASOF, -1),
      maturityDate: addMonths(ASOF, 360),
      couponRate: 0,
    };
    const best = pickBestForBucket([conventional, strips], bucket('30Y'), ASOF);
    expect(best?.cusip).toBe('BOND-ABC');
  });
});

describe('pickBestForBucket — most-recent tiebreak still applies within each filter regime', () => {
  test('6M bucket: most-recently-issued bill wins (both zero-coupon)', () => {
    const older: Candidate = {
      cusip: 'BILL-OLD',
      issueDate: addMonths(ASOF, -2),
      maturityDate: addMonths(ASOF, 6),
      couponRate: 0,
    };
    const newer: Candidate = {
      cusip: 'BILL-NEW',
      issueDate: addMonths(ASOF, -1),
      maturityDate: addMonths(ASOF, 6),
      couponRate: 0,
    };
    const best = pickBestForBucket([older, newer], bucket('6M'), ASOF);
    expect(best?.cusip).toBe('BILL-NEW');
  });

  test('30Y bucket: most-recently-issued conventional bond wins (both have coupon)', () => {
    const older: Candidate = {
      cusip: 'BOND-OLD',
      issueDate: addMonths(ASOF, -3),
      maturityDate: addMonths(ASOF, 360),
      couponRate: 4.0,
    };
    const newer: Candidate = {
      cusip: 'BOND-NEW',
      issueDate: addMonths(ASOF, -1),
      maturityDate: addMonths(ASOF, 360),
      couponRate: 4.25,
    };
    const best = pickBestForBucket([older, newer], bucket('30Y'), ASOF);
    expect(best?.cusip).toBe('BOND-NEW');
  });
});
