/**
 * M6 #263 bug 3: BondSecurity.getProductType() in ledger-models 0.2.1
 * overrides the base Security wrapper and returns a tenor-derived
 * 'BILL' / 'NOTE' / 'BOND' string. Security.create() returns a
 * BondSecurity instance for TREASURY_NOTE, TIPS, and TREASURY_FRN, so
 * any of those leaves shows up in the UI as the coarse override label
 * instead of its actual leaf name — producing phantom 'BOND' rows on
 * /data/securities that don't exist on the wire.
 *
 * productTypeNameOf resolves the numeric proto enum directly. These
 * tests both pin the helper's contract and lock in the override
 * behavior that motivated it (so a future upstream wrapper fix surfaces
 * here as a green-but-now-redundant test, not silent drift).
 */
import { describe, expect, test } from 'vitest';
import Security from '@fintekkers/ledger-models/node/wrappers/models/security/security';
import BondSecurity from '@fintekkers/ledger-models/node/wrappers/models/security/BondSecurity';
import { SecurityProto } from '@fintekkers/ledger-models/node/fintekkers/models/security/security_pb';
import { ProductTypeProto } from '@fintekkers/ledger-models/node/fintekkers/models/security/product_type_pb';
import { CouponTypeProto } from '@fintekkers/ledger-models/node/fintekkers/models/security/coupon_type_pb';
import { CouponFrequencyProto } from '@fintekkers/ledger-models/node/fintekkers/models/security/coupon_frequency_pb';
import { LocalDateProto } from '@fintekkers/ledger-models/node/fintekkers/models/util/local_date_pb';
import { DecimalValueProto } from '@fintekkers/ledger-models/node/fintekkers/models/util/decimal_value_pb';
import { UUID } from '@fintekkers/ledger-models/node/wrappers/models/utils/uuid';
import { productTypeNameOf } from '$lib/security';

function makeBondProto(opts: {
  productType: number;
  issueYear: number;
  maturityYear: number;
}): SecurityProto {
  const proto = new SecurityProto();
  proto.setObjectClass('Security');
  proto.setVersion('0.0.1');
  proto.setUuid(UUID.random().toUUIDProto());
  proto.setProductType(opts.productType);
  proto.setAssetClass('RATES');
  proto.setIssuerName('Test Issuer');
  proto.setCouponType(CouponTypeProto.FIXED);
  proto.setCouponFrequency(CouponFrequencyProto.SEMIANNUALLY);
  proto.setCouponRate(new DecimalValueProto().setArbitraryPrecisionValue('0.05'));
  proto.setFaceValue(new DecimalValueProto().setArbitraryPrecisionValue('1000'));
  proto.setIssueDate(new LocalDateProto().setYear(opts.issueYear).setMonth(1).setDay(1));
  proto.setMaturityDate(new LocalDateProto().setYear(opts.maturityYear).setMonth(1).setDay(1));
  return proto;
}

describe('productTypeNameOf (M6 #263 bug 3)', () => {
  test('returns the proto leaf name for non-bond securities', () => {
    const proto = new SecurityProto();
    proto.setProductType(ProductTypeProto.TBILL);
    const sec = Security.create(proto);
    expect(productTypeNameOf(sec)).toBe('TBILL');
  });

  test('returns TREASURY_NOTE for a 10Y note (wrapper would return NOTE)', () => {
    const proto = makeBondProto({
      productType: ProductTypeProto.TREASURY_NOTE,
      issueYear: 2024, maturityYear: 2034,
    });
    const sec = Security.create(proto);
    expect(sec).toBeInstanceOf(BondSecurity);
    expect(productTypeNameOf(sec)).toBe('TREASURY_NOTE');
    // Document the pre-fix behavior that motivated the helper.
    expect(sec.getProductType()).toBe('NOTE');
  });

  test('returns TIPS for a 30Y TIPS (wrapper would return BOND)', () => {
    const proto = makeBondProto({
      productType: ProductTypeProto.TIPS,
      issueYear: 2024, maturityYear: 2054,
    });
    const sec = Security.create(proto);
    expect(sec).toBeInstanceOf(BondSecurity);
    expect(productTypeNameOf(sec)).toBe('TIPS');
    // This is the phantom-BOND case from the bug report:
    // 30Y TIPS used to display as 'BOND' on /data/securities.
    expect(sec.getProductType()).toBe('BOND');
  });

  test('returns TREASURY_FRN regardless of tenor (wrapper would derive BILL/NOTE/BOND)', () => {
    const proto = makeBondProto({
      productType: ProductTypeProto.TREASURY_FRN,
      issueYear: 2024, maturityYear: 2026,
    });
    const sec = Security.create(proto);
    expect(sec).toBeInstanceOf(BondSecurity);
    expect(productTypeNameOf(sec)).toBe('TREASURY_FRN');
  });

  test('TREASURY_BOND (not a BondSecurity per the factory) round-trips its leaf name', () => {
    // Security.create only wraps TREASURY_NOTE/TIPS/TREASURY_FRN as
    // BondSecurity; TREASURY_BOND comes back as base Security. Pin
    // that — if a future factory rev wraps TREASURY_BOND too, this
    // test should still pass.
    const proto = makeBondProto({
      productType: ProductTypeProto.TREASURY_BOND,
      issueYear: 2024, maturityYear: 2054,
    });
    const sec = Security.create(proto);
    expect(productTypeNameOf(sec)).toBe('TREASURY_BOND');
  });

  test('unknown / unset product type falls back to UNKNOWN_PRODUCT_TYPE', () => {
    const proto = new SecurityProto();
    proto.setProductType(99999 as unknown as number);
    const sec = Security.create(proto);
    expect(productTypeNameOf(sec)).toBe('UNKNOWN_PRODUCT_TYPE');
  });
});
