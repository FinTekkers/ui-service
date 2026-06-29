/**
 * Unit tests for #347 (clean redo of #313):
 *   - identifierString never returns a bare UUID. When no typed
 *     identifier is present it returns MISSING_IDENTIFIER_MARKER
 *     ('UNKNOWN') so the data-quality issue surfaces in the grid.
 *   - primaryIdentifier dispatches per product family (bonds → CUSIP,
 *     equities → EXCH_TICKER, indices → SERIES_ID, currencies → CASH,
 *     crypto/commodity → EXCH_TICKER) and skips UNKNOWN-typed entries.
 *   - hasMissingIdentifier surfaces the boolean for UI flags.
 *   - buildIdentifierProto refuses to construct an outgoing identifier
 *     with UNKNOWN_IDENTIFIER_TYPE (the #347/#27 client-side guard).
 */
import { describe, expect, test } from 'vitest';
import Security from '@fintekkers/ledger-models/node/wrappers/models/security/security';
import { SecurityProto } from '@fintekkers/ledger-models/node/fintekkers/models/security/security_pb';
import { ProductTypeProto } from '@fintekkers/ledger-models/node/fintekkers/models/security/product_type_pb';
import { IdentifierProto } from '@fintekkers/ledger-models/node/fintekkers/models/security/identifier/identifier_pb';
import { IdentifierTypeProto } from '@fintekkers/ledger-models/node/fintekkers/models/security/identifier/identifier_type_pb';
import { UUID } from '@fintekkers/ledger-models/node/wrappers/models/utils/uuid';

import {
  primaryIdentifier,
  identifierString,
  hasMissingIdentifier,
  buildIdentifierProto,
  MISSING_IDENTIFIER_MARKER,
} from './security';

function buildSecurity(
  productType: number,
  ids: Array<{ type: IdentifierTypeProto; value: string }>,
): Security {
  const proto = new SecurityProto()
    .setObjectClass('Security')
    .setVersion('0.0.1')
    .setUuid(UUID.random().toUUIDProto())
    .setProductType(productType)
    .setIssuerName('Test Issuer');
  for (const id of ids) {
    proto.addIdentifiers(
      new IdentifierProto().setIdentifierType(id.type).setIdentifierValue(id.value),
    );
  }
  return Security.create(proto);
}

const UUID_HEX_SHAPE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

describe('#347 identifierString — never bare UUID; UNKNOWN as data-quality flag', () => {
  test('equity with EXCH_TICKER renders the ticker', () => {
    const sec = buildSecurity(ProductTypeProto.COMMON_STOCK, [
      { type: IdentifierTypeProto.EXCH_TICKER, value: 'TSLA' },
    ]);
    expect(identifierString(sec)).toBe('TSLA');
  });

  test('index with SERIES_ID renders the SERIES_ID', () => {
    const sec = buildSecurity(ProductTypeProto.CPI_SERIES, [
      { type: IdentifierTypeProto.SERIES_ID, value: 'CUSR0000SA0' },
    ]);
    expect(identifierString(sec)).toBe('CUSR0000SA0');
  });

  test('currency with CASH renders the 3-letter code', () => {
    const sec = buildSecurity(ProductTypeProto.CURRENCY, [
      { type: IdentifierTypeProto.CASH, value: 'USD' },
    ]);
    expect(identifierString(sec)).toBe('USD');
  });

  test('bond with CUSIP renders the CUSIP', () => {
    const sec = buildSecurity(ProductTypeProto.TREASURY_NOTE, [
      { type: IdentifierTypeProto.CUSIP, value: '91282CQL8' },
    ]);
    expect(identifierString(sec)).toBe('91282CQL8');
  });

  test('security with no identifiers renders UNKNOWN (NOT the UUID hex)', () => {
    const sec = buildSecurity(ProductTypeProto.COMMON_STOCK, []);
    const result = identifierString(sec);
    expect(result).toBe(MISSING_IDENTIFIER_MARKER);
    expect(result).toBe('UNKNOWN');
    expect(result).not.toMatch(UUID_HEX_SHAPE);
  });

  test('security with only UNKNOWN_IDENTIFIER_TYPE renders UNKNOWN (not the bad value, not the UUID)', () => {
    // This is the live #347 case: equity rows on /data/securities written
    // by a stale loader with identifier_type=UNKNOWN_IDENTIFIER_TYPE (the
    // proto3 default). Surfacing the value as if it were canonical would
    // lie to the user; surfacing the UUID would mask the bug. Render
    // 'UNKNOWN' so the data-quality issue is visible.
    const sec = buildSecurity(ProductTypeProto.COMMON_STOCK, [
      { type: IdentifierTypeProto.UNKNOWN_IDENTIFIER_TYPE, value: 'some-stale-value' },
    ]);
    const result = identifierString(sec);
    expect(result).toBe(MISSING_IDENTIFIER_MARKER);
    expect(result).not.toBe('some-stale-value');
    expect(result).not.toMatch(UUID_HEX_SHAPE);
  });

  test('mixed UNKNOWN + typed identifier picks the typed one', () => {
    const sec = buildSecurity(ProductTypeProto.COMMON_STOCK, [
      { type: IdentifierTypeProto.UNKNOWN_IDENTIFIER_TYPE, value: 'junk' },
      { type: IdentifierTypeProto.EXCH_TICKER, value: 'TSLA' },
    ]);
    expect(identifierString(sec)).toBe('TSLA');
  });
});

describe('#347 primaryIdentifier — per-family preference, skips UNKNOWN-typed', () => {
  test('TREASURY_NOTE prefers CUSIP over ISIN', () => {
    const sec = buildSecurity(ProductTypeProto.TREASURY_NOTE, [
      { type: IdentifierTypeProto.ISIN, value: 'US91282CQL81' },
      { type: IdentifierTypeProto.CUSIP, value: '91282CQL8' },
    ]);
    expect(primaryIdentifier(sec)?.getIdentifierValue()).toBe('91282CQL8');
    expect(primaryIdentifier(sec)?.getIdentifierType()).toBe(IdentifierTypeProto.CUSIP);
  });

  test('MORTGAGE_BACKED bond family resolves to CUSIP', () => {
    const sec = buildSecurity(ProductTypeProto.MORTGAGE_BACKED, [
      { type: IdentifierTypeProto.CUSIP, value: '3133WJVX4' },
    ]);
    expect(primaryIdentifier(sec)?.getIdentifierValue()).toBe('3133WJVX4');
  });

  test('CORP_BOND with only ISIN falls through CUSIP to ISIN', () => {
    const sec = buildSecurity(ProductTypeProto.CORP_BOND, [
      { type: IdentifierTypeProto.ISIN, value: 'XS1234567890' },
    ]);
    expect(primaryIdentifier(sec)?.getIdentifierValue()).toBe('XS1234567890');
  });

  test('COMMON_STOCK (equity) prefers EXCH_TICKER over CUSIP/ISIN', () => {
    const sec = buildSecurity(ProductTypeProto.COMMON_STOCK, [
      { type: IdentifierTypeProto.CUSIP, value: '88160R101' },
      { type: IdentifierTypeProto.ISIN, value: 'US88160R1014' },
      { type: IdentifierTypeProto.EXCH_TICKER, value: 'TSLA' },
    ]);
    expect(primaryIdentifier(sec)?.getIdentifierValue()).toBe('TSLA');
    expect(primaryIdentifier(sec)?.getIdentifierType()).toBe(IdentifierTypeProto.EXCH_TICKER);
  });

  test('ETF prefers EXCH_TICKER', () => {
    const sec = buildSecurity(ProductTypeProto.ETF, [
      { type: IdentifierTypeProto.EXCH_TICKER, value: 'SPY' },
    ]);
    expect(primaryIdentifier(sec)?.getIdentifierValue()).toBe('SPY');
  });

  test('CPI_SERIES (index) prefers SERIES_ID', () => {
    const sec = buildSecurity(ProductTypeProto.CPI_SERIES, [
      { type: IdentifierTypeProto.SERIES_ID, value: 'CUSR0000SA0' },
    ]);
    expect(primaryIdentifier(sec)?.getIdentifierValue()).toBe('CUSR0000SA0');
  });

  test('CURRENCY prefers CASH (3-letter code)', () => {
    const sec = buildSecurity(ProductTypeProto.CURRENCY, [
      { type: IdentifierTypeProto.CASH, value: 'USD' },
    ]);
    expect(primaryIdentifier(sec)?.getIdentifierValue()).toBe('USD');
  });

  test('CRYPTOCURRENCY prefers EXCH_TICKER', () => {
    const sec = buildSecurity(ProductTypeProto.CRYPTOCURRENCY, [
      { type: IdentifierTypeProto.EXCH_TICKER, value: 'BTC' },
    ]);
    expect(primaryIdentifier(sec)?.getIdentifierValue()).toBe('BTC');
  });

  test('skips UNKNOWN-typed identifiers when looking for a fallback', () => {
    // EQUITY preference order is exhausted (no EXCH_TICKER/ISIN/FIGI/CUSIP);
    // the only present identifier is UNKNOWN-typed → no fallback emitted.
    const sec = buildSecurity(ProductTypeProto.COMMON_STOCK, [
      { type: IdentifierTypeProto.UNKNOWN_IDENTIFIER_TYPE, value: 'junk' },
    ]);
    expect(primaryIdentifier(sec)).toBeUndefined();
  });

  test('any-typed fallback when the per-family list misses but a typed identifier exists', () => {
    // COMMON_STOCK prefers EXCH_TICKER/ISIN/FIGI/CUSIP. An off-convention
    // row carrying only an OSI should still pull through OSI rather than
    // be flagged UNKNOWN.
    const sec = buildSecurity(ProductTypeProto.COMMON_STOCK, [
      { type: IdentifierTypeProto.OSI, value: 'OSI_FALLBACK_123' },
    ]);
    expect(primaryIdentifier(sec)?.getIdentifierValue()).toBe('OSI_FALLBACK_123');
  });

  test('returns undefined when no identifiers are present', () => {
    const sec = buildSecurity(ProductTypeProto.COMMON_STOCK, []);
    expect(primaryIdentifier(sec)).toBeUndefined();
  });

  test('unknown product type defaults to bond order', () => {
    const sec = buildSecurity(ProductTypeProto.PRODUCT_TYPE_UNKNOWN, [
      { type: IdentifierTypeProto.CUSIP, value: '999999999' },
      { type: IdentifierTypeProto.EXCH_TICKER, value: 'XXX' },
    ]);
    expect(primaryIdentifier(sec)?.getIdentifierValue()).toBe('999999999');
  });
});

describe('#347 hasMissingIdentifier — UI data-quality flag', () => {
  test('false when a typed identifier is present', () => {
    const sec = buildSecurity(ProductTypeProto.COMMON_STOCK, [
      { type: IdentifierTypeProto.EXCH_TICKER, value: 'TSLA' },
    ]);
    expect(hasMissingIdentifier(sec)).toBe(false);
  });

  test('true when no identifier is present', () => {
    const sec = buildSecurity(ProductTypeProto.COMMON_STOCK, []);
    expect(hasMissingIdentifier(sec)).toBe(true);
  });

  test('true when the only identifier is UNKNOWN-typed (the live #347 case)', () => {
    const sec = buildSecurity(ProductTypeProto.COMMON_STOCK, [
      { type: IdentifierTypeProto.UNKNOWN_IDENTIFIER_TYPE, value: 'junk' },
    ]);
    expect(hasMissingIdentifier(sec)).toBe(true);
  });
});

describe('#347/#27 buildIdentifierProto — client-side outgoing guard', () => {
  test('throws on UNKNOWN_IDENTIFIER_TYPE', () => {
    expect(() =>
      buildIdentifierProto({
        type: IdentifierTypeProto.UNKNOWN_IDENTIFIER_TYPE,
        value: 'whatever',
      }),
    ).toThrowError(/UNKNOWN_IDENTIFIER_TYPE/);
  });

  test('throws on empty value', () => {
    expect(() =>
      buildIdentifierProto({
        type: IdentifierTypeProto.CUSIP,
        value: '',
      }),
    ).toThrowError(/empty value/);
  });

  test('throws on whitespace-only value', () => {
    expect(() =>
      buildIdentifierProto({
        type: IdentifierTypeProto.EXCH_TICKER,
        value: '   ',
      }),
    ).toThrowError(/empty value/);
  });

  test('trims the value and stamps the chosen type for CUSIP', () => {
    const proto = buildIdentifierProto({
      type: IdentifierTypeProto.CUSIP,
      value: '  91282CQL8  ',
    });
    expect(proto.getIdentifierType()).toBe(IdentifierTypeProto.CUSIP);
    expect(proto.getIdentifierValue()).toBe('91282CQL8');
  });

  test('accepts every typed identifier kind the platform models today', () => {
    const cases: Array<[IdentifierTypeProto, string]> = [
      [IdentifierTypeProto.CUSIP, '91282CQL8'],
      [IdentifierTypeProto.ISIN, 'US91282CQL81'],
      [IdentifierTypeProto.EXCH_TICKER, 'TSLA'],
      [IdentifierTypeProto.FIGI, 'BBG000B9XRY4'],
      [IdentifierTypeProto.SERIES_ID, 'CUSR0000SA0'],
      [IdentifierTypeProto.OSI, 'TSLA_240119C00200000'],
      [IdentifierTypeProto.INDEX_NAME, 'S&P 500'],
      [IdentifierTypeProto.CASH, 'USD'],
    ];
    for (const [type, value] of cases) {
      const proto = buildIdentifierProto({ type, value });
      expect(proto.getIdentifierType()).toBe(type);
      expect(proto.getIdentifierValue()).toBe(value);
    }
  });
});
