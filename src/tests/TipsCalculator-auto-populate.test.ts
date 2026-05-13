/**
 * #266 — TipsCalculator auto-populates Reference CPI from the selected
 * Security's `baseCpi` (which the page-server lifts from
 * TipsDetailsProto.base_cpi via $lib/security.ts baseCpiOf).
 *
 * Asserts on three things:
 *  1. Picking a CUSIP from the autocomplete fills the Reference CPI
 *     input with the security's baseCpi when present.
 *  2. The "from Security master" indicator pill appears when auto-
 *     populated; the "manual override" indicator appears when the
 *     user types into the field.
 *  3. A subsequent CUSIP pick does NOT clobber a manual override — the
 *     PR #164 fallback escape hatch stays intact.
 *
 * URL navigation behavior is covered by TipsCalculator-form-wiring.test.ts;
 * this file is scoped to the auto-populate state machine.
 */
import { render, fireEvent } from '@testing-library/svelte';
import { describe, expect, test, beforeEach, afterEach, vi } from 'vitest';

import TipsCalculator from '../components/widgets/TipsCalculator.svelte';

const SECURITIES = [
  // The acceptance-test fixture: 912828ZZ6 + baseCpi=256.39126
  { cusip: '912828ZZ6', issuerName: 'US Treasury', couponRate: '0.625', maturityDate: '2030-01-15', baseCpi: '256.39126' },
  // Another with a different baseCpi to verify the right one is picked.
  { cusip: '912810RL4', issuerName: 'US Treasury', couponRate: '2.5',   maturityDate: '2029-07-15', baseCpi: '249.45316728' },
  // No baseCpi (data gap or new ingestion) — auto-fill must NOT fire,
  // and the manual-override path stays usable.
  { cusip: '912810FG8', issuerName: 'US Treasury', couponRate: '3.875', maturityDate: '2040-04-15' },
];

// JSDOM's window.location is non-configurable; stub via vi.stubGlobal so
// the calculate() function's navigation doesn't blow up in tests.
function stubLocation(): () => void {
  let lastHref: string | undefined;
  const stub: any = {};
  Object.defineProperty(stub, 'href', {
    get: () => lastHref ?? 'http://localhost/',
    set: (v: string) => { lastHref = v; },
    configurable: true,
    enumerable: true,
  });
  stub.search = '';
  vi.stubGlobal('location', stub);
  return () => vi.unstubAllGlobals();
}

describe('TipsCalculator — auto-populate Reference CPI from Security (#266)', () => {
  let restore: () => void;
  beforeEach(() => { restore = stubLocation(); });
  afterEach(() => { restore(); });

  test('picking a CUSIP with baseCpi populates Reference CPI + shows "from Security master"', async () => {
    const { getByLabelText, getByText } = render(TipsCalculator, { props: { securities: SECURITIES } });

    // Type the CUSIP into the autocomplete input. The component filters
    // suggestions on startsWith — once a single match is in the dropdown
    // the user clicks it.
    await fireEvent.input(getByLabelText('CUSIP'), { target: { value: '912828ZZ6' } });
    // The suggestion li mousedown is what the component listens for —
    // fire mousedown directly on the suggestion text.
    const suggestion = getByText('912828ZZ6');
    await fireEvent.mouseDown(suggestion);

    const refCpiInput = getByLabelText(/Reference CPI/) as HTMLInputElement;
    expect(refCpiInput.value, 'baseCpi from the picked Security must auto-fill').toBe('256.39126');

    // Indicator pill present + correct
    expect(getByText('from Security master')).toBeInTheDocument();
  });

  test('typing into Reference CPI flips the indicator to "manual override"', async () => {
    const { getByLabelText, getByText } = render(TipsCalculator, { props: { securities: SECURITIES } });

    await fireEvent.input(getByLabelText(/Reference CPI/), { target: { value: '300.5' } });

    const input = getByLabelText(/Reference CPI/) as HTMLInputElement;
    expect(input.value).toBe('300.5');
    expect(getByText('manual override')).toBeInTheDocument();
  });

  test('CUSIP without baseCpi does NOT auto-fill; leaves the input empty + no indicator', async () => {
    const { getByLabelText, queryByText, getByText } = render(TipsCalculator, { props: { securities: SECURITIES } });

    await fireEvent.input(getByLabelText('CUSIP'), { target: { value: '912810FG8' } });
    await fireEvent.mouseDown(getByText('912810FG8'));

    const refCpiInput = getByLabelText(/Reference CPI/) as HTMLInputElement;
    expect(refCpiInput.value, 'no baseCpi → no auto-fill (user supplies manual)').toBe('');
    expect(queryByText('from Security master'), 'no indicator when nothing auto-populated').toBeNull();
    expect(queryByText('manual override'), 'no indicator when input is empty').toBeNull();
  });

  test('subsequent CUSIP pick does NOT clobber a manual override (PR #164 fallback preserved)', async () => {
    const { getByLabelText, queryByText, getByText } = render(TipsCalculator, { props: { securities: SECURITIES } });

    // User manually enters a Reference CPI first
    await fireEvent.input(getByLabelText(/Reference CPI/), { target: { value: '300.5' } });
    expect(getByText('manual override')).toBeInTheDocument();

    // Then picks a CUSIP that has its own baseCpi
    await fireEvent.input(getByLabelText('CUSIP'), { target: { value: '912828ZZ6' } });
    await fireEvent.mouseDown(getByText('912828ZZ6'));

    const refCpiInput = getByLabelText(/Reference CPI/) as HTMLInputElement;
    expect(refCpiInput.value, 'manual override survives a CUSIP pick').toBe('300.5');
    expect(getByText('manual override'), 'indicator stays "manual override"').toBeInTheDocument();
    expect(queryByText('from Security master'), 'auto indicator must NOT appear over a manual override').toBeNull();
  });

  test('different CUSIP picks use that CUSIP\'s baseCpi (not a stale one)', async () => {
    const { getByLabelText, getByText } = render(TipsCalculator, { props: { securities: SECURITIES } });

    await fireEvent.input(getByLabelText('CUSIP'), { target: { value: '912810RL4' } });
    await fireEvent.mouseDown(getByText('912810RL4'));

    const refCpiInput = getByLabelText(/Reference CPI/) as HTMLInputElement;
    expect(refCpiInput.value).toBe('249.45316728');
  });
});
