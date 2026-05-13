/**
 * Unit coverage for couponRateOf — the M6 #263 bug 3 (second round) fix.
 *
 * The picker for /data/treasury_curve was rendering coupon=0% for the 20Y
 * on-the-run, a TREASURY_BOND with a real 4.x% coupon on the wire. Root
 * cause: ledger-models 0.2.4's `Security.create()` factory only returns a
 * BondSecurity wrapper for TREASURY_NOTE / TIPS / TREASURY_FRN. For
 * TREASURY_BOND / TBILL / STRIPS / SOVEREIGN_BOND it returns a plain
 * Security — which has no `getCouponRate()` method — and the picker's
 * try/catch around `(bond as BondSecurity).getCouponRate()` swallowed the
 * "not a function" TypeError, defaulting to 0.
 *
 * couponRateOf reads coupon_rate from the proto directly, trying the
 * bond/tips/frn details oneof first (where data-sourcing-dev writes the
 * canonical value post-M6) and falling back to the legacy flat field.
 */
import { describe, expect, test } from 'vitest';
import { couponRateOf } from '$lib/security';

// Fake Security wrappers — we only need the .proto field couponRateOf
// reads. Avoids pulling in the full ledger-models wrapper construction
// (which expects valid SecurityProto bytes / wire format).
function fakeSecurity(stub: any) {
  return { proto: stub } as any;
}

const decimal = (v: string) => ({ getArbitraryPrecisionValue: () => v });

describe('couponRateOf', () => {
  test('reads from bond_details.coupon_rate (the M6 canonical path)', () => {
    const sec = fakeSecurity({
      getBondDetails: () => ({ getCouponRate: () => decimal('4.625') }),
      getTipsDetails: () => undefined,
      getFrnDetails: () => undefined,
      getCouponRate: () => undefined,
    });
    expect(couponRateOf(sec)).toBe(4.625);
  });

  test('reads from tips_details when bond_details is absent', () => {
    const sec = fakeSecurity({
      getBondDetails: () => undefined,
      getTipsDetails: () => ({ getCouponRate: () => decimal('2.375') }),
      getFrnDetails: () => undefined,
      getCouponRate: () => undefined,
    });
    expect(couponRateOf(sec)).toBe(2.375);
  });

  test('reads from frn_details when only that oneof is set', () => {
    const sec = fakeSecurity({
      getBondDetails: () => undefined,
      getTipsDetails: () => undefined,
      getFrnDetails: () => ({ getCouponRate: () => decimal('0.125') }),
      getCouponRate: () => undefined,
    });
    expect(couponRateOf(sec)).toBe(0.125);
  });

  test('falls back to the flat SecurityProto.coupon_rate (legacy data path)', () => {
    const sec = fakeSecurity({
      getBondDetails: () => undefined,
      getTipsDetails: () => undefined,
      getFrnDetails: () => undefined,
      getCouponRate: () => decimal('3.875'),
    });
    expect(couponRateOf(sec)).toBe(3.875);
  });

  test('prefers details oneof when both flat and details are populated', () => {
    // Real wire shape per data-sourcing-dev's #263 spot-check: post-M6
    // backfill writes BOTH the flat field AND bond_details. The details
    // value is the canonical one; the flat field is a legacy/dual-write
    // residue. If they ever drift we want the canonical one to win.
    const sec = fakeSecurity({
      getBondDetails: () => ({ getCouponRate: () => decimal('4.625') }),
      getTipsDetails: () => undefined,
      getFrnDetails: () => undefined,
      getCouponRate: () => decimal('0.0'),
    });
    expect(couponRateOf(sec)).toBe(4.625);
  });

  test('returns 0 for TBILL (no coupon anywhere — correct zero-coupon semantic)', () => {
    const sec = fakeSecurity({
      getBondDetails: () => undefined,
      getTipsDetails: () => undefined,
      getFrnDetails: () => undefined,
      getCouponRate: () => undefined,
    });
    expect(couponRateOf(sec)).toBe(0);
  });

  test('returns 0 when the details proto exists but coupon_rate is empty', () => {
    const sec = fakeSecurity({
      getBondDetails: () => ({ getCouponRate: () => undefined }),
      getTipsDetails: () => undefined,
      getFrnDetails: () => undefined,
      getCouponRate: () => undefined,
    });
    expect(couponRateOf(sec)).toBe(0);
  });

  test('returns 0 for unparseable rate strings rather than NaN', () => {
    const sec = fakeSecurity({
      getBondDetails: () => ({ getCouponRate: () => decimal('garbage') }),
      getTipsDetails: () => undefined,
      getFrnDetails: () => undefined,
      getCouponRate: () => undefined,
    });
    expect(couponRateOf(sec)).toBe(0);
  });

  test('handles missing details accessors (stale JS codegen)', () => {
    // Defensive: BondSecurity.js guards with `typeof getBondDetails !==
    // 'function'`. We replicate that tolerance — if the proto wrapper
    // is from an older ledger-models build, we should still read the
    // flat field rather than crash.
    const sec = fakeSecurity({
      getCouponRate: () => decimal('5.0'),
    });
    expect(couponRateOf(sec)).toBe(5.0);
  });

  test('parses negative coupon (defensive — FRN spread floor can go negative)', () => {
    const sec = fakeSecurity({
      getBondDetails: () => undefined,
      getTipsDetails: () => undefined,
      getFrnDetails: () => ({ getCouponRate: () => decimal('-0.125') }),
      getCouponRate: () => undefined,
    });
    expect(couponRateOf(sec)).toBe(-0.125);
  });
});
