/**
 * Unit coverage for $lib/security.ts baseCpiOf — #266.
 *
 * Reads canonical `tips_details.base_cpi` first (market-data-inputs
 * PR #17 populates it from TreasuryDirect's RefCPIDatedDate); falls
 * back to legacy flat `SecurityProto.base_cpi`; returns `undefined`
 * (NOT 0, NOT '') when neither is populated so the TIPS calculator
 * can distinguish "auto-fill" from "leave empty for manual override".
 */
import { describe, expect, test } from 'vitest';
import { baseCpiOf } from '$lib/security';

function fakeSecurity(stub: any) {
  return { proto: stub } as any;
}
const decimal = (v: string) => ({ getArbitraryPrecisionValue: () => v });

describe('baseCpiOf', () => {
  test('reads canonical tips_details.base_cpi when populated', () => {
    const sec = fakeSecurity({
      getTipsDetails: () => ({ getBaseCpi: () => decimal('256.39126') }),
      getBaseCpi: () => undefined,
    });
    expect(baseCpiOf(sec)).toBe('256.39126');
  });

  test('falls back to flat SecurityProto.base_cpi (legacy data path)', () => {
    const sec = fakeSecurity({
      getTipsDetails: () => undefined,
      getBaseCpi: () => decimal('200.123'),
    });
    expect(baseCpiOf(sec)).toBe('200.123');
  });

  test('prefers tips_details over flat when both populated', () => {
    // Real wire shape per the post-#266 dual-write: data-sourcing-dev
    // mirrors base_cpi onto both. The tips_details copy is canonical;
    // the flat field is legacy and could drift.
    const sec = fakeSecurity({
      getTipsDetails: () => ({ getBaseCpi: () => decimal('256.39126') }),
      getBaseCpi: () => decimal('100.000'),
    });
    expect(baseCpiOf(sec)).toBe('256.39126');
  });

  test('returns undefined when neither field is populated', () => {
    const sec = fakeSecurity({
      getTipsDetails: () => undefined,
      getBaseCpi: () => undefined,
    });
    expect(baseCpiOf(sec)).toBeUndefined();
  });

  test('returns undefined when tips_details exists but base_cpi is empty', () => {
    const sec = fakeSecurity({
      getTipsDetails: () => ({ getBaseCpi: () => undefined }),
      getBaseCpi: () => undefined,
    });
    expect(baseCpiOf(sec)).toBeUndefined();
  });

  test('returns undefined when base_cpi is the empty string (not zero)', () => {
    const sec = fakeSecurity({
      getTipsDetails: () => ({ getBaseCpi: () => decimal('') }),
      getBaseCpi: () => undefined,
    });
    expect(baseCpiOf(sec)).toBeUndefined();
  });

  test('preserves full DecimalValueProto precision (no number coercion)', () => {
    // base_cpi from TreasuryDirect carries 5–6 decimal precision. The
    // helper must return the raw string so downstream display and
    // round-trip-to-server preserve the digits.
    const sec = fakeSecurity({
      getTipsDetails: () => ({ getBaseCpi: () => decimal('249.45316728') }),
      getBaseCpi: () => undefined,
    });
    expect(baseCpiOf(sec)).toBe('249.45316728');
  });

  test('handles missing accessor methods (stale codegen)', () => {
    // Defensive — older ledger-models builds may not have getTipsDetails.
    // Helper should not throw; it should fall back gracefully.
    const sec = fakeSecurity({
      getBaseCpi: () => decimal('210.5'),
    });
    expect(baseCpiOf(sec)).toBe('210.5');
  });

  test('returns undefined for a non-TIPS Security (no details and no flat)', () => {
    const sec = fakeSecurity({
      getBondDetails: () => ({ getCouponRate: () => decimal('4.625') }),
      // no tips_details, no flat base_cpi
    });
    expect(baseCpiOf(sec)).toBeUndefined();
  });
});
