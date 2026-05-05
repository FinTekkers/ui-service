/**
 * #203 Phase 3 — component test for /data/curves.
 *
 * Per the Step 9 e2e plan: feed +page.svelte the 2026-03-19 fixture from
 * `valuation-service/tests/scenarios/scenario_*_curve.md` and assert the
 * page-level shape (subtitle, table headers, per-tenor rows).
 *
 * Plotly itself isn't exercised here — it's loaded in onMount via dynamic
 * import which Vitest's jsdom can't resolve cleanly (and we'd be testing
 * Plotly, not our code). The curve-render correctness assertion is on the
 * server side: `parseCurveResponse` mapping CurveResultProto → page shape,
 * which has its own unit coverage and is also exercised against the live
 * service in the manual smoke test attached to the PR.
 */
import { render, screen } from '@testing-library/svelte';
import { describe, expect, test, vi } from 'vitest';

// Plotly is dynamic-imported in onMount; stub it so the chart container
// doesn't blow up. We don't exercise Plotly's rendering — that's its own lib.
vi.mock('plotly.js-dist', () => ({
  default: { newPlot: vi.fn() },
}));

import CurvesPage from '../routes/(authenticated)/data/curves/+page.svelte';

// Fixture matching the 2026-03-19 scenario (par values from the existing
// scenario fixtures — see #203 reference list).
const FIXTURE_2026_03_19 = {
  curveDate: '2026-03-19',
  par: [
    { tenor: '6M', years: 0.5, yield: 3.76 },
    { tenor: '1Y', years: 1.0, yield: 3.73 },
    { tenor: '2Y', years: 2.0, yield: 3.79 },
    { tenor: '3Y', years: 3.0, yield: 3.79 },
    { tenor: '5Y', years: 5.0, yield: 3.88 },
    { tenor: '7Y', years: 7.0, yield: 4.06 },
    { tenor: '10Y', years: 10.0, yield: 4.25 },
    { tenor: '20Y', years: 20.0, yield: 4.82 },
    { tenor: '30Y', years: 30.0, yield: 4.83 },
  ],
  spot: [
    { tenor: '6M', years: 0.5, yield: 3.760 },
    { tenor: '1Y', years: 1.0, yield: 3.730 },
    { tenor: '2Y', years: 2.0, yield: 3.792 },
    { tenor: '5Y', years: 5.0, yield: 3.889 },
    { tenor: '10Y', years: 10.0, yield: 4.312 },
    { tenor: '30Y', years: 30.0, yield: 4.856 },
  ],
  forward: [
    { tenor: '1Y', years: 1.0, yield: 3.699 },
    { tenor: '2Y', years: 2.0, yield: 3.854 },
    { tenor: '5Y', years: 5.0, yield: 4.036 },
    { tenor: '10Y', years: 10.0, yield: 4.736 },
    { tenor: '30Y', years: 30.0, yield: 5.128 },
  ],
  warnings: [],
  error: null,
  user: undefined,
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

  test('renders the data table with par/spot/forward rows for the 2026-03-19 fixture', () => {
    render(CurvesPage, { props: { data: FIXTURE_2026_03_19 } });

    // Headers
    expect(screen.getByRole('columnheader', { name: 'Tenor' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /Par Yield/ })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /Spot Rate/ })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /Forward Rate/ })).toBeInTheDocument();

    // 10Y row — par 4.25, spot 4.312, forward 4.736
    const tenY = screen.getAllByText('10Y').find((el) => el.tagName === 'STRONG');
    expect(tenY).toBeInTheDocument();
    expect(screen.getByText('4.250')).toBeInTheDocument();
    expect(screen.getByText('4.312')).toBeInTheDocument();
    expect(screen.getByText('4.736')).toBeInTheDocument();

    // 30Y row — par 4.83, spot 4.856, forward 5.128
    expect(screen.getByText('4.830')).toBeInTheDocument();
    expect(screen.getByText('4.856')).toBeInTheDocument();
    expect(screen.getByText('5.128')).toBeInTheDocument();
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
});
