import { describe, expect, test } from 'vitest';
import { buildFilterUrl } from './urlState';

describe('buildFilterUrl', () => {
  test('empty overrides + empty current returns just the pathname', () => {
    expect(buildFilterUrl('/data/positions', new URLSearchParams(), {})).toBe(
      '/data/positions',
    );
  });

  test('non-empty string override is set', () => {
    expect(
      buildFilterUrl('/data/positions', new URLSearchParams(), { fields: 'A,B' }),
    ).toBe('/data/positions?fields=A%2CB');
  });

  test('empty-string override is treated as absent', () => {
    expect(
      buildFilterUrl('/data/positions', new URLSearchParams(), {
        fields: 'A',
        cusip: '',
      }),
    ).toBe('/data/positions?fields=A');
  });

  test('undefined override is treated as absent', () => {
    expect(
      buildFilterUrl('/data/positions', new URLSearchParams(), {
        fields: 'A',
        cusip: undefined,
      }),
    ).toBe('/data/positions?fields=A');
  });

  test('inheritKeys preserves param from current when override absent', () => {
    const current = new URLSearchParams('portfolioId=abc-123');
    expect(
      buildFilterUrl('/data/positions', current, { fields: 'A' }, ['portfolioId']),
    ).toBe('/data/positions?fields=A&portfolioId=abc-123');
  });

  test('inheritKeys does NOT add a param that is missing from current', () => {
    expect(
      buildFilterUrl('/data/positions', new URLSearchParams(), { fields: 'A' }, [
        'portfolioId',
      ]),
    ).toBe('/data/positions?fields=A');
  });

  test('override wins over current for the same key', () => {
    const current = new URLSearchParams('portfolioId=old&fields=stale');
    expect(
      buildFilterUrl(
        '/data/positions',
        current,
        { portfolioId: 'new', fields: 'fresh' },
        ['portfolioId'],
      ),
    ).toBe('/data/positions?portfolioId=new&fields=fresh');
  });

  test('null override removes a key that would otherwise inherit', () => {
    const current = new URLSearchParams('portfolioId=abc-123');
    expect(
      buildFilterUrl(
        '/data/positions',
        current,
        { fields: 'A', portfolioId: null },
        ['portfolioId'],
      ),
    ).toBe('/data/positions?fields=A');
  });

  test('insertion order: overrides first (in declaration order), then inheritKeys', () => {
    const current = new URLSearchParams('portfolioId=p1&assetClass=fixed');
    expect(
      buildFilterUrl(
        '/data/positions',
        current,
        { fields: 'A', measures: 'M' },
        ['portfolioId', 'assetClass'],
      ),
    ).toBe('/data/positions?fields=A&measures=M&portfolioId=p1&assetClass=fixed');
  });

  test('special characters get URL-encoded', () => {
    expect(
      buildFilterUrl('/data/positions', new URLSearchParams(), {
        cusip: 'a b/c',
      }),
    ).toBe('/data/positions?cusip=a+b%2Fc');
  });

  test('PositionSelect call shape — inherits portfolioId, applies form overrides', () => {
    const current = new URLSearchParams('portfolioId=soma-uuid&fields=stale');
    const url = buildFilterUrl(
      '/data/positions',
      current,
      {
        positionView: 'DEFAULT_VIEW',
        positionType: 'TRANSACTION',
        fields: 'SECURITY_DESCRIPTION',
        measures: 'DIRECTED_QUANTITY',
        cusip: undefined,
        tradeDate: '2026-05-06',
        tradeDateOperator: 'lesser_than_or_equals',
        assetClass: undefined,
        hideZeros: 'true',
      },
      ['portfolioId'],
    );
    expect(url).toBe(
      '/data/positions?positionView=DEFAULT_VIEW&positionType=TRANSACTION&fields=SECURITY_DESCRIPTION&measures=DIRECTED_QUANTITY&tradeDate=2026-05-06&tradeDateOperator=lesser_than_or_equals&hideZeros=true&portfolioId=soma-uuid',
    );
  });
});
