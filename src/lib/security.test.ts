/**
 * Unit tests for identifierString + primaryIdentifier (#313).
 *
 * Pre-fix `identifierString` hardcoded CUSIP→ISIN→UUID and silently
 * rendered the UUID hex on /data/securities for every equity / index /
 * currency row. PM redirect (issue #313 comments): skip the per-product
 * priority chain for display — join every identifier value instead.
 * `primaryIdentifier` keeps the per-family preference for the lookup /
 * filter paths that genuinely need a single value.
 */
import { describe, expect, test } from 'vitest';
import Security from '@fintekkers/ledger-models/node/wrappers/models/security/security';
import { SecurityProto } from '@fintekkers/ledger-models/node/fintekkers/models/security/security_pb';
import { ProductTypeProto } from '@fintekkers/ledger-models/node/fintekkers/models/security/product_type_pb';
import { IdentifierProto } from '@fintekkers/ledger-models/node/fintekkers/models/security/identifier/identifier_pb';
import { IdentifierTypeProto } from '@fintekkers/ledger-models/node/fintekkers/models/security/identifier/identifier_type_pb';
import { UUID } from '@fintekkers/ledger-models/node/wrappers/models/utils/uuid';

import { primaryIdentifier, identifierString } from './security';

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

describe('identifierString (#313) — join all identifiers', () => {
  test('single-identifier security renders as just that identifier', () => {
    const sec = buildSecurity(ProductTypeProto.COMMON_STOCK, [
      { type: IdentifierTypeProto.EXCH_TICKER, value: 'TSLA' },
    ]);
    expect(identifierString(sec)).toBe('TSLA');
  });

  test('multi-identifier security joins every value with ", "', () => {
    // Order matches insertion order — we don't sort, so the wire order
    // determines display order. Treasuries today carry CUSIP first.
    const sec = buildSecurity(ProductTypeProto.TREASURY_NOTE, [
      { type: IdentifierTypeProto.CUSIP, value: '91282CQL8' },
      { type: IdentifierTypeProto.ISIN, value: 'US91282CQL81' },
    ]);
    expect(identifierString(sec)).toBe('91282CQL8, US91282CQL81');
  });

  test('equity rows render their ticker (regression guard for #313)', () => {
    // Pre-fix: equities fell through CUSIP/ISIN to UUID hex. The fix is
    // that EXCH_TICKER (the only identifier on the row) renders.
    const sec = buildSecurity(ProductTypeProto.COMMON_STOCK, [
      { type: IdentifierTypeProto.EXCH_TICKER, value: 'TSLA' },
    ]);
    const result = identifierString(sec);
    expect(result).toBe('TSLA');
    expect(result).not.toMatch(/^[0-9a-f-]{36}$/i);
  });

  test('currency rows render the CASH 3-letter code, not the UUID', () => {
    const sec = buildSecurity(ProductTypeProto.CURRENCY, [
      { type: IdentifierTypeProto.CASH, value: 'USD' },
    ]);
    expect(identifierString(sec)).toBe('USD');
  });

  test('index rows render their SERIES_ID, not the UUID', () => {
    const sec = buildSecurity(ProductTypeProto.CPI_SERIES, [
      { type: IdentifierTypeProto.SERIES_ID, value: 'CUSR0000SA0' },
    ]);
    expect(identifierString(sec)).toBe('CUSR0000SA0');
  });

  test('UUID fallback fires only when no identifiers are present at all', () => {
    const sec = buildSecurity(ProductTypeProto.COMMON_STOCK, []);
    const result = identifierString(sec);
    // UUID stringifies to the canonical 36-char hyphenated form — the
    // shape /data/securities used to render for every equity row.
    expect(result).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
  });
});

describe('primaryIdentifier (#313) — per-product-family preference', () => {
  test('TREASURY_NOTE bond prefers CUSIP over ISIN', () => {
    const sec = buildSecurity(ProductTypeProto.TREASURY_NOTE, [
      { type: IdentifierTypeProto.ISIN, value: 'US91282CQL81' },
      { type: IdentifierTypeProto.CUSIP, value: '91282CQL8' },
    ]);
    expect(primaryIdentifier(sec)?.getIdentifierValue()).toBe('91282CQL8');
  });

  test('MORTGAGE_BACKED bond family also resolves to CUSIP', () => {
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
  });

  test('ETF prefers EXCH_TICKER', () => {
    const sec = buildSecurity(ProductTypeProto.ETF, [
      { type: IdentifierTypeProto.EXCH_TICKER, value: 'SPY' },
    ]);
    expect(primaryIdentifier(sec)?.getIdentifierValue()).toBe('SPY');
  });

  test('CPI_SERIES (index) prefers SERIES_ID over UUID', () => {
    const sec = buildSecurity(ProductTypeProto.CPI_SERIES, [
      { type: IdentifierTypeProto.SERIES_ID, value: 'CUSR0000SA0' },
    ]);
    expect(primaryIdentifier(sec)?.getIdentifierValue()).toBe('CUSR0000SA0');
  });

  test('EQUITY_INDEX prefers SERIES_ID', () => {
    const sec = buildSecurity(ProductTypeProto.EQUITY_INDEX, [
      { type: IdentifierTypeProto.SERIES_ID, value: 'SPX' },
    ]);
    expect(primaryIdentifier(sec)?.getIdentifierValue()).toBe('SPX');
  });

  test('CURRENCY prefers CASH identifier (3-letter code)', () => {
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

  test('any-present-identifier fallback when the preferred type is missing', () => {
    // COMMON_STOCK normally prefers EXCH_TICKER; an off-convention write
    // with only an OSI identifier should still surface OSI rather than
    // falling all the way to undefined.
    const sec = buildSecurity(ProductTypeProto.COMMON_STOCK, [
      { type: IdentifierTypeProto.OSI, value: 'OSI_FALLBACK_123' },
    ]);
    expect(primaryIdentifier(sec)?.getIdentifierValue()).toBe('OSI_FALLBACK_123');
  });

  test('returns undefined when no identifiers are present', () => {
    const sec = buildSecurity(ProductTypeProto.COMMON_STOCK, []);
    expect(primaryIdentifier(sec)).toBeUndefined();
  });

  test('unknown product type defaults to bond order (CUSIP first)', () => {
    const sec = buildSecurity(ProductTypeProto.PRODUCT_TYPE_UNKNOWN, [
      { type: IdentifierTypeProto.CUSIP, value: '999999999' },
      { type: IdentifierTypeProto.EXCH_TICKER, value: 'XXX' },
    ]);
    expect(primaryIdentifier(sec)?.getIdentifierValue()).toBe('999999999');
  });
});
