/**
 * Component tests for /data/curves — post-#264 term-forward view.
 *
 * Server-side concerns (CurveRequestProto.setForwardTermYears wiring,
 * decimal-year tenor formatting, URL-param parsing) live in
 * curves-server-helpers.test.ts. This file covers the rendered page.
 *
 * Plotly itself isn't exercised — it's loaded in onMount via dynamic import
 * which jsdom can't resolve cleanly, and we'd be testing Plotly rather than
 * our code. The chart-data correctness is asserted via the server-side
 * parseCurveResponse unit coverage + the e2e spec.
 */
import { render, screen } from '@testing-library/svelte';
import { describe, expect, test, vi } from 'vitest';

vi.mock('plotly.js-dist', () => ({
  default: { newPlot: vi.fn() },
}));

import CurvesPage from '../routes/(authenticated)/data/curves/+page.svelte';

// Fixture: 2026-03-19 par/spot rows + a 10Y-forward series (f(t, t+10)).
// Forward x-axis now means *starting* year t, not maturity tenor.
const FIXTURE_2026_03_19 = {
  curveDate: '2026-03-19',
  termYears: 10 as const,
  par: [
    { tenor: '0.5Y', years: 0.5, yield: 3.76 },
    { tenor: '1Y', years: 1.0, yield: 3.73 },
    { tenor: '2Y', years: 2.0, yield: 3.79 },
    { tenor: '3Y', years: 3.0, yield: 3.79 },
    { tenor: '5Y', years: 5.0, yield: 3.88 },
    { tenor: '7Y', years: 7.0, yield: 4.06 },
    { tenor: '9.95Y', years: 9.95, yield: 4.25 },
    { tenor: '20Y', years: 20.0, yield: 4.82 },
    { tenor: '29.97Y', years: 29.97, yield: 4.83 },
  ],
  spot: [
    { tenor: '0.5Y', years: 0.5, yield: 3.760 },
    { tenor: '1Y', years: 1.0, yield: 3.730 },
    { tenor: '2Y', years: 2.0, yield: 3.792 },
    { tenor: '5Y', years: 5.0, yield: 3.889 },
    { tenor: '9.95Y', years: 9.95, yield: 4.312 },
    { tenor: '29.97Y', years: 29.97, yield: 4.856 },
  ],
  forward: [
    // f(0, 10), f(1, 11), … f(20, 30) — 21 points for T=10
    { tenor: '0Y', years: 0, yield: 4.31 },
    { tenor: '1Y', years: 1, yield: 4.42 },
    { tenor: '5Y', years: 5, yield: 4.61 },
    { tenor: '10Y', years: 10, yield: 4.74 },
    { tenor: '20Y', years: 20, yield: 4.99 },
  ],
  warnings: [],
  error: null,
  // #268 latest-buildable-date defaults — fixture starts in the "loaded
  // for an explicit date" shape (defaulted=false, no hint date). Tests
  // for the hint UI clone-and-override these fields.
  latestBuildableDate: null,
  asofWasDefaulted: false,
  user: {
    id: 'test',
    name: 'Test User',
    email: 'test@example.com',
    apiKey: 'ftk_live_test',
  },
};

describe('/data/curves component', () => {
  test('renders the page title', () => {
    render(CurvesPage, { props: { data: FIXTURE_2026_03_19 } });
    expect(screen.getByText('Treasury Yield Curves')).toBeInTheDocument();
  });

  test('subtitle includes the as-of date', () => {
    render(CurvesPage, { props: { data: FIXTURE_2026_03_19 } });
    expect(screen.getByText(/2026-03-19/)).toBeInTheDocument();
  });

  test('forward-term selector exposes 1Y/2Y/5Y/10Y and defaults to data.termYears', () => {
    render(CurvesPage, { props: { data: FIXTURE_2026_03_19 } });
    const select = screen.getByLabelText('Forward term') as HTMLSelectElement;
    expect(select).toBeInTheDocument();
    expect(select.value).toBe('10');
    const optionValues = Array.from(select.querySelectorAll('option')).map(
      (o) => (o as HTMLOptionElement).value,
    );
    expect(optionValues).toEqual(['1', '2', '5', '10']);
  });

  test('par/spot table renders decimal-year tenors (no 9.95→10Y bucketing)', () => {
    render(CurvesPage, { props: { data: FIXTURE_2026_03_19 } });

    // The par/spot table heading + at least one decimal-year row.
    expect(screen.getByText('Par & Spot Curves')).toBeInTheDocument();
    const decimalCell = screen.getAllByText('9.95Y').find((el) => el.tagName === 'STRONG');
    expect(decimalCell, '9.95Y tenor renders verbatim instead of being snapped to "10Y"').toBeInTheDocument();
    expect(screen.getByText('4.250')).toBeInTheDocument();   // par 4.25
    expect(screen.getByText('4.312')).toBeInTheDocument();   // spot 4.312
  });

  test('forward table renders one row per starting year for the selected term', () => {
    render(CurvesPage, { props: { data: FIXTURE_2026_03_19 } });
    expect(screen.getByText(/10Y Forward Rate by Start Year/)).toBeInTheDocument();
    // Each forward fixture row's starting-year label should appear in the table.
    expect(screen.getByText('4.310')).toBeInTheDocument();   // f(0, 10) = 4.31
    expect(screen.getByText('4.420')).toBeInTheDocument();   // f(1, 11)
    expect(screen.getByText('4.740')).toBeInTheDocument();   // f(10, 20)
  });

  test('forward table shows empty-state when backend returns no forward points', () => {
    render(CurvesPage, {
      props: {
        data: { ...FIXTURE_2026_03_19, forward: [] },
      },
    });
    expect(screen.getByText(/No forward points returned for 10Y term/)).toBeInTheDocument();
  });

  test('shows error banner when load() failed', () => {
    render(CurvesPage, {
      props: {
        data: {
          ...FIXTURE_2026_03_19,
          par: [], spot: [], forward: [],
          error: 'RunCurve failed: insufficient inputs',
        },
      },
    });
    expect(screen.getByText(/RunCurve failed/)).toBeInTheDocument();
  });

  test('shows backend warnings when present', () => {
    render(CurvesPage, {
      props: {
        data: {
          ...FIXTURE_2026_03_19,
          warnings: ['Tenor gap between 7Y and 20Y — interpolation may be unreliable'],
        },
      },
    });
    expect(screen.getByText(/1 warning/)).toBeInTheDocument();
  });

  // #268: latest-buildable-date hint surfaces the most-recent date with a
  // fully-priced curve. Renders only when the resolver could find one and
  // the user isn't already viewing it (otherwise the hint is noise).
  test('shows latest-buildable-date hint with link when user is viewing an older date', () => {
    render(CurvesPage, {
      props: {
        data: {
          ...FIXTURE_2026_03_19,
          latestBuildableDate: '2026-05-12',
          asofWasDefaulted: false,
        },
      },
    });
    const hint = screen.getByTestId('latest-hint');
    expect(hint).toBeInTheDocument();
    expect(hint.textContent).toMatch(/2026-05-12/);
    // anchor links to the latest date so a single click recovers
    const anchor = hint.querySelector('a');
    expect(anchor).not.toBeNull();
    expect(anchor?.getAttribute('href')).toMatch(/asof=2026-05-12/);
  });

  test('latest-buildable-date hint renders as text only when it matches the current curveDate', () => {
    render(CurvesPage, {
      props: {
        data: {
          ...FIXTURE_2026_03_19,
          curveDate: '2026-05-12',
          latestBuildableDate: '2026-05-12',
          asofWasDefaulted: true,
        },
      },
    });
    const hint = screen.getByTestId('latest-hint');
    expect(hint).toBeInTheDocument();
    // no anchor: the user is already on the latest date
    expect(hint.querySelector('a')).toBeNull();
  });

  test('latest-buildable-date hint is absent when the loader could not find one', () => {
    render(CurvesPage, {
      props: {
        data: {
          ...FIXTURE_2026_03_19,
          latestBuildableDate: null,
          asofWasDefaulted: false,
        },
      },
    });
    expect(screen.queryByTestId('latest-hint')).toBeNull();
  });
});
