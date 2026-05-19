/**
 * Regression test for #311: /treasuries2 "Cumulative Position by Product
 * Type" chart silently dropped the MORTGAGE_BACKED layer. The server
 * boundary returned 4,733 MBS positions (verified via backend-dev-ledger's
 * #49 probe data), but the rendered chart was missing the trace
 * altogether — the page emitted no error, no banner, and the existing
 * treasuries2-loads smoke happily passed because the page rendered the
 * graphs column.
 *
 * This test is the acceptance gate for the fix in #307. It is intentionally
 * RED on the current main: it asserts the failure mode the fix must close.
 * Once #307 lands, it should flip GREEN and stay there.
 *
 * What this guards (and prior weaker smokes did NOT):
 *   - treasuries2-loads.spec.ts only asserted "graphs OR empty-state
 *     rendered". A chart missing one stacked product-type layer is
 *     neither — the page rendered, the column was there, the trace was
 *     just gone. That test cannot catch silent layer drops.
 *   - The fix's correctness lives in the chart payload, not the DOM
 *     shell. Plotly stacks bars across traces, so a missing trace is
 *     visually subtle (the stack shifts down) and easy to miss in a
 *     screenshot smoke. We read the data payload Plotly attaches to the
 *     chart div directly.
 *
 * Numerical context for the most-recent-month tolerance (NYFed Phase 4
 * load reference): the SOMA MBS holding pile is ~$1.97T as of late-2025
 * snapshot. createCumulativePositionGraph converts to trillions, so the
 * y values are in units of $T (e.g. y=1.97 == $1.97T). The tolerance
 * window is deliberately ORDER-OF-MAGNITUDE wide (0.2T .. 10T):
 *   - 0.2T floor: catches "trace exists with one tiny non-zero point
 *     but the cumulative never accumulates" failure modes.
 *   - 10T ceiling: catches obvious unit-confusion bugs (e.g. plotting
 *     billions or millions as trillions, or summing un-converted face
 *     values).
 *   - Not asserting tight ±5% around 1.97T: the underlying SOMA load
 *     can swing as backend-dev-ledger refreshes data, and we don't want
 *     this test to be a tripwire for legitimate data refreshes — only
 *     for the silent-drop / unit-confusion regressions.
 */
import { test, expect, type Page } from '@playwright/test';

const MBS_PRODUCT_TYPE = 'MORTGAGE_BACKED';
const CUMULATIVE_CHART_ID = 'cumulative-position';

// Most-recent-month tolerance for the MBS cumulative position. See header
// docstring above for the rationale on the wide band.
const MBS_MOST_RECENT_TRILLIONS_MIN = 0.2; // $200B
const MBS_MOST_RECENT_TRILLIONS_MAX = 10.0; // $10T

interface PlotlyTrace {
  name?: string;
  x?: unknown[];
  y?: number[];
}

/**
 * Read the data array Plotly attaches to the chart container after
 * newPlot() finishes. Returns null if the element doesn't exist or
 * Plotly hasn't run yet (we poll on this — see waitForChartData).
 */
async function readPlotlyData(page: Page, chartId: string): Promise<PlotlyTrace[] | null> {
  return await page.evaluate((id) => {
    const el = document.getElementById(id) as (HTMLElement & { data?: unknown }) | null;
    if (!el || !Array.isArray(el.data)) return null;
    // Strip non-serializable fields (Plotly stores some closures); we only
    // need name + x + y for assertions.
    return (el.data as Array<Record<string, unknown>>).map((t) => ({
      name: typeof t.name === 'string' ? t.name : undefined,
      x: Array.isArray(t.x) ? (t.x as unknown[]) : undefined,
      y: Array.isArray(t.y) ? (t.y as number[]) : undefined,
    }));
  }, chartId);
}

async function waitForChartData(page: Page, chartId: string): Promise<PlotlyTrace[]> {
  // Wait for the chart container's <svg.main-svg> first — same pattern
  // curves-pages-render.spec.ts uses to wait for newPlot() to commit.
  const chart = page.locator(`#${chartId}`);
  await expect(chart, `#${chartId} container present`).toBeVisible({ timeout: 15_000 });
  const svg = chart.locator('svg.main-svg');
  await expect
    .poll(async () => svg.count(), {
      message: `svg.main-svg never appeared inside #${chartId} — Plotly newPlot did not run, so the chart payload is unobservable`,
      timeout: 20_000,
    })
    .toBeGreaterThan(0);

  // Now the .data property should be attached. Poll once more to give
  // the assignment a tick to settle.
  let traces: PlotlyTrace[] | null = null;
  await expect
    .poll(
      async () => {
        traces = await readPlotlyData(page, chartId);
        return traces?.length ?? 0;
      },
      {
        message: `Plotly data array on #${chartId} never populated`,
        timeout: 10_000,
      },
    )
    .toBeGreaterThan(0);
  return traces!;
}

test.describe('/treasuries2 — Cumulative Position chart must include MBS layer (#311)', () => {
  test('MORTGAGE_BACKED trace present with non-zero values and a plausible most-recent cumulative', async ({ page }) => {
    const response = await page.goto('/treasuries2');
    expect(response, 'GET /treasuries2 returns a response').not.toBeNull();
    expect(response!.status(), 'no 5xx on /treasuries2').toBeLessThan(500);

    // The page-server returns transactions; when transactions is empty
    // the page renders .no-data instead of the chart container. That
    // would still trip the regression we want to lock in (silent empty
    // is the failure mode), so we assert the chart actually rendered
    // BEFORE inspecting traces.
    await expect(
      page.getByRole('heading', { level: 1, name: /Treasury Position Analytics/ }),
    ).toBeVisible({ timeout: 10_000 });
    await expect(
      page.locator('.no-data'),
      '/treasuries2 rendered the empty-state — no transactions reached the page; the MBS-drop regression is hiding behind an even worse empty-load failure',
    ).toHaveCount(0);

    const traces = await waitForChartData(page, CUMULATIVE_CHART_ID);

    // === Assertion 1: MBS trace exists ===
    // Pre-#307: this trace is missing entirely (silent drop). The
    // existing per-page smoke didn't catch it because the chart still
    // rendered with the remaining product types stacked.
    const traceNames = traces.map((t) => t.name).filter((n): n is string => typeof n === 'string');
    const mbsTrace = traces.find((t) => t.name === MBS_PRODUCT_TYPE);
    expect(
      mbsTrace,
      `MORTGAGE_BACKED trace missing from cumulative chart. Traces present: ${JSON.stringify(traceNames)}. This is the #311 / #307 silent-drop regression — backend returned MBS positions but they did not survive to the chart.`,
    ).toBeDefined();

    // === Assertion 2: MBS trace has >= 1 non-zero data point ===
    // Defends against the "trace renders but every y=0" degenerate
    // fallback (e.g. groupByDateAndCategory filtered MBS rows out
    // post-mapping but ensureCategories injected a zero column).
    const mbsY = mbsTrace!.y ?? [];
    expect(mbsY.length, 'MORTGAGE_BACKED trace has no data points').toBeGreaterThan(0);
    const nonZeroCount = mbsY.filter((v) => Number.isFinite(v) && v !== 0).length;
    expect(
      nonZeroCount,
      `MORTGAGE_BACKED trace has zero non-zero points (all ${mbsY.length} entries are 0/NaN). This indicates MBS rows were mapped in but their cumulative quantity never accumulated — same silent-empty failure mode #311 is locking in.`,
    ).toBeGreaterThan(0);

    // === Assertion 3: most-recent cumulative within order-of-magnitude tolerance ===
    // y is in trillions (createCumulativePositionGraph → convertToTrillions).
    // NYFed Phase 4 reference snapshot puts SOMA MBS at ~$1.97T late-2025.
    // We assert a wide band (0.2T .. 10T) — see header docstring for the
    // rationale on why tight tolerance is wrong here.
    const lastY = mbsY[mbsY.length - 1];
    expect(
      Number.isFinite(lastY),
      `MORTGAGE_BACKED most-recent y is non-finite (${lastY}) — cumulative sum produced NaN/Infinity`,
    ).toBe(true);
    expect(
      lastY,
      `MORTGAGE_BACKED most-recent cumulative = ${lastY}T (in trillions). Expected within [${MBS_MOST_RECENT_TRILLIONS_MIN}T, ${MBS_MOST_RECENT_TRILLIONS_MAX}T] vs ~$1.97T NYFed Phase 4 reference. Below the floor suggests rows mapped but quantities truncated; above the ceiling suggests a unit-confusion bug (billions/millions plotted as trillions).`,
    ).toBeGreaterThanOrEqual(MBS_MOST_RECENT_TRILLIONS_MIN);
    expect(lastY).toBeLessThanOrEqual(MBS_MOST_RECENT_TRILLIONS_MAX);
  });
});
