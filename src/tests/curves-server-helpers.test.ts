/**
 * Unit tests for the term-forward helpers in $lib/curveForwardTerm.
 *
 * Covers what the term-forward feature (#264) added:
 *   - formatYears() decimal-year display replaces the lossy bucketing
 *     tenorLabel() (9.95Y must NOT collapse to "10Y")
 *   - parseForwardTerm() URL-param parser allows only {1, 2, 5, 10} with
 *     10 as the default for any unknown / missing input
 *
 * Helpers live in $lib (not in +page.server.ts) because SvelteKit restricts
 * exports from page-server modules to its own set.
 */
import { describe, expect, test } from 'vitest';
import {
  formatYears,
  parseForwardTerm,
  ALLOWED_FORWARD_TERMS,
  DEFAULT_FORWARD_TERM,
} from '$lib/curveForwardTerm';

describe('formatYears', () => {
  test('whole-year tenors render without decimals', () => {
    expect(formatYears(1)).toBe('1Y');
    expect(formatYears(5)).toBe('5Y');
    expect(formatYears(30)).toBe('30Y');
  });

  test('decimal-year tenors keep two decimals (no bucketing)', () => {
    expect(formatYears(9.95)).toBe('9.95Y');
    expect(formatYears(0.49)).toBe('0.49Y');
    expect(formatYears(29.97)).toBe('29.97Y');
  });

  test('returns em-dash for non-finite input', () => {
    expect(formatYears(NaN)).toBe('—');
    expect(formatYears(Infinity)).toBe('—');
  });
});

describe('parseForwardTerm', () => {
  test('null (no URL param) returns the default term', () => {
    expect(parseForwardTerm(null)).toBe(DEFAULT_FORWARD_TERM);
    expect(DEFAULT_FORWARD_TERM).toBe(10);
  });

  test('every allowed term parses to its numeric value', () => {
    for (const t of ALLOWED_FORWARD_TERMS) {
      expect(parseForwardTerm(String(t))).toBe(t);
    }
  });

  test('disallowed terms fall back to the default — no exception', () => {
    expect(parseForwardTerm('3')).toBe(DEFAULT_FORWARD_TERM);   // not in {1,2,5,10}
    expect(parseForwardTerm('7')).toBe(DEFAULT_FORWARD_TERM);
    expect(parseForwardTerm('20')).toBe(DEFAULT_FORWARD_TERM);
  });

  test('garbage input falls back to the default — no exception', () => {
    expect(parseForwardTerm('abc')).toBe(DEFAULT_FORWARD_TERM);
    expect(parseForwardTerm('')).toBe(DEFAULT_FORWARD_TERM);
    expect(parseForwardTerm('1Y')).toBe(DEFAULT_FORWARD_TERM);
  });
});
