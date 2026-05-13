/**
 * Component-level regression for M6 #263 BUG 2: the Reference CPI input
 * was rendered in BOTH CUSIP-lookup and manual-entry modes, but the
 * `calculate()` button's URL builder only wrote `referenceCpi` to the
 * URL in manual mode. So a user in CUSIP mode could type a value into
 * the field, click Calculate, and the value was silently dropped — the
 * server side (page-server + RunTipsValuation) never saw it.
 *
 * After the fix, `referenceCpi` flows to the URL in both modes when
 * the user has typed a value.
 *
 * Asserts on the navigation URL by stubbing `window.location.href`'s
 * setter — clicking Calculate triggers an assignment that we intercept.
 */
import { render, fireEvent } from '@testing-library/svelte';
import { describe, expect, test, beforeEach, afterEach, vi } from 'vitest';

import TipsCalculator from '../components/widgets/TipsCalculator.svelte';

const securities = [
  { cusip: '912810RL4', issuerName: 'US Treasury', couponRate: '2.5', maturityDate: '2029-01-15' },
];

function stubHrefSetter(): { lastHref: () => string | undefined; restore: () => void } {
  let last: string | undefined;
  // JSDOM's `window.location` is non-configurable. `vi.stubGlobal` replaces
  // the global via Object.defineProperty under the hood, but the trick is
  // to provide an object whose `href` is a writable accessor.
  const stub: any = {};
  Object.defineProperty(stub, 'href', {
    configurable: true,
    enumerable: true,
    get: () => last ?? 'http://localhost/',
    set: (v: string) => { last = v; },
  });
  stub.search = '';
  stub.pathname = '/';
  stub.host = 'localhost';
  stub.protocol = 'http:';
  vi.stubGlobal('location', stub);
  return {
    lastHref: () => last,
    restore: () => {
      vi.unstubAllGlobals();
    },
  };
}

describe('TipsCalculator — form-to-URL wiring for Reference CPI (#263 bug 2)', () => {
  let href: ReturnType<typeof stubHrefSetter>;

  beforeEach(() => {
    href = stubHrefSetter();
  });

  afterEach(() => {
    href.restore();
  });

  test('CUSIP mode: referenceCpi from the form is included in the URL on Calculate', async () => {
    const { getByLabelText, getByRole } = render(TipsCalculator, { props: { securities } });

    // CUSIP mode is the default. Fill in required fields + Reference CPI.
    await fireEvent.input(getByLabelText('CUSIP'), { target: { value: '912810RL4' } });
    await fireEvent.input(getByLabelText('Price (% of par)'), { target: { value: '98' } });
    await fireEvent.input(getByLabelText('Current CPI'), { target: { value: '350' } });
    await fireEvent.input(getByLabelText(/Reference CPI/), { target: { value: '258.446' } });

    await fireEvent.click(getByRole('button', { name: /Calculate/i }));

    const url = href.lastHref();
    expect(url, 'Calculate must navigate').toBeDefined();
    expect(url).toContain('tipsMode=cusip');
    expect(url).toContain('tipsCusip=912810RL4');
    expect(url, 'referenceCpi must be forwarded in CUSIP mode').toContain('referenceCpi=258.446');
  });

  test('Manual mode still forwards referenceCpi (no regression on the previously-working branch)', async () => {
    const { getByText, getByLabelText, getByRole } = render(TipsCalculator, { props: { securities } });

    await fireEvent.click(getByText('Manual Entry'));

    await fireEvent.input(getByLabelText('Price (% of par)'), { target: { value: '98' } });
    await fireEvent.input(getByLabelText('Current CPI'), { target: { value: '350' } });
    await fireEvent.input(getByLabelText(/Reference CPI/), { target: { value: '258.446' } });

    await fireEvent.click(getByRole('button', { name: /Calculate/i }));

    const url = href.lastHref();
    expect(url).toBeDefined();
    expect(url).toContain('tipsMode=manual');
    expect(url).toContain('referenceCpi=258.446');
  });

  test('empty referenceCpi is not appended (avoids ?referenceCpi=&… noise)', async () => {
    const { getByLabelText, getByRole } = render(TipsCalculator, { props: { securities } });

    await fireEvent.input(getByLabelText('CUSIP'), { target: { value: '912810RL4' } });
    await fireEvent.input(getByLabelText('Price (% of par)'), { target: { value: '98' } });
    await fireEvent.input(getByLabelText('Current CPI'), { target: { value: '350' } });
    // Don't touch referenceCpi.

    await fireEvent.click(getByRole('button', { name: /Calculate/i }));

    const url = href.lastHref();
    expect(url).toBeDefined();
    expect(url).not.toContain('referenceCpi=');
  });
});
