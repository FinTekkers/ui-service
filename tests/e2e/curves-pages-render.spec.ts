/**
 * Regression for second-brain#302: /data/curves and /data/treasury_curve
 * silently rendered empty after the v0.4.4 ledger-models bump because
 * Security.getIssueDate() / getMaturityDate() switched from `LocalDate`
 * (with .toDate()) to `Date | null`. Three call sites swallowed the
 * resulting TypeError:
 *   - src/lib/treasuryCurveData.ts:86-87  → maturityDate=null on every
 *     constituent → all rows landed in the same bucket → curve loader
 *     fell back to "Insufficient curve inputs"
 *   - src/lib/security.ts:288-289 / 445-446 / 484
 *   - src/routes/+page.server.ts:54-66 (homepage row filter)
 *
 * Same family as #292 (positions) and #300 (transactions). Asserts the
 * UI-page-render smoke pattern from #297: pages that silently empty are
 * P1 user-visible regressions and need a smoke that fails loudly.
 *
 * Per PM (PR #177 review), the smoke goes deeper than just "row count
 * > 0" — see docstrings on each assertion below for what each guards.
 */
import { test, expect } from '@playwright/test';

const CURVES_URL = '/data/curves?asof=2026-05-15&term=10';
// 2026-04-08 used for the row-count + non-Bill-coupon assertions (#302
// repro lived on a stale historical day). #305 part B/C use a recent
// date because RunCurve needs priced constituents and prices in the
// running ledger only exist on the most recent days.
const TREASURY_CURVE_URL = '/data/treasury_curve?date=2026-04-08';
const TREASURY_CURVE_RECENT_URL = '/data/treasury_curve?date=2026-05-15';

// EXPECTED_CONSTITUENT_COUNT in $lib/treasuryCurveData = 11
// (TENOR_BUCKETS spans {1M, 3M, 6M, 1Y, 2Y, 3Y, 5Y, 7Y, 10Y, 20Y, 30Y}).
// PM accepts the 8-11 range so the smoke tolerates legitimately
// partial days (some buckets unprovisioned in the test env) without
// going green on the silent-empty regression.
const EXPECTED_CONSTITUENT_COUNT_MIN = 8;
const EXPECTED_CONSTITUENT_COUNT_MAX = 11;

// Bills (zero-coupon) tenors. Anything OUTSIDE this set is a coupon-
// bearing note/bond and must have couponRate > 0. The pre-#302 silent
// fallback set every row's couponRate to 0 (constituent loader's
// `couponRate ?? 0` masked the wrapper-side throw); without this
// per-row check the smoke would have happily passed.
const BILL_TENORS = new Set(['1M', '2M', '3M', '6M', '12M', '1Y']);

test.describe('/data/curves + /data/treasury_curve render real data (#302)', () => {
  test('/data/curves: 200, no "Insufficient curve inputs", chart SVG has rendered traces', async ({ page }) => {
    const response = await page.goto(CURVES_URL);
    expect(response, 'GET /data/curves returns a response').not.toBeNull();
    expect(response!.status(), 'no 5xx — load() must not throw').toBeLessThan(500);

    // Pre-#302 the page rendered an "Insufficient curve inputs" banner
    // because every constituent's maturityDate became null and the
    // bootstrapper saw <2 distinct tenors. Fail loudly if that string
    // is still in the rendered HTML.
    await expect(page.locator('body')).not.toContainText('Insufficient curve inputs', {
      timeout: 15_000,
    });

    // Plotly renders client-side via onMount → dynamic import → newPlot.
    // Wait for the chart container, then assert it actually has an
    // SVG child with traces. Pre-#302 the page-server returned empty
    // par/spot/forward arrays, the onMount early-return at +page.svelte:43
    // (`if (!chartEl || par.length === 0) return;`) fired, and no SVG
    // was ever inserted — the .curves-chart div stayed empty. This
    // assertion is the only one that distinguishes "load() returned
    // empty arrays silently" from "chart actually rendered with data".
    const chart = page.locator('.curves-chart');
    await expect(chart, '.curves-chart container present').toBeVisible({ timeout: 15_000 });

    // Plotly v2 emits <svg class="main-svg"> as the chart's render
    // target. There are usually 2 main-svg elements (chart + legend
    // overlay); we just need ≥ 1.
    const svg = chart.locator('svg.main-svg');
    await expect.poll(
      async () => svg.count(),
      {
        message: 'svg.main-svg never appeared inside .curves-chart — Plotly newPlot did not run, which means par.length was 0 (silent empty)',
        timeout: 15_000,
      },
    ).toBeGreaterThan(0);

    // Trace verification: par + spot + forward each emit a
    // <g class="trace scatter ..."> inside the scatterlayer. Pre-#302
    // we'd render the SVG shell with no .trace nodes (Plotly's
    // newPlot was never called — see above). Post-fix: 3 traces.
    const traces = chart.locator('svg.main-svg g.scatterlayer g.trace');
    await expect.poll(
      async () => traces.count(),
      {
        message: 'no scatter traces rendered inside the curves chart — par/spot/forward arrays were empty',
        timeout: 15_000,
      },
    ).toBeGreaterThan(0);
  });

  test('/data/treasury_curve: row count in [8, 11] range, all non-Bill tenors have non-zero coupon', async ({ page }) => {
    const response = await page.goto(TREASURY_CURVE_URL);
    expect(response, 'GET /data/treasury_curve returns a response').not.toBeNull();
    expect(response!.status(), 'no 5xx — load() must not throw').toBeLessThan(500);

    const rows = page.locator('table tbody tr');

    // Pre-#302 the table rendered 0 rows because every constituent's
    // maturityDate was null. Post-fix the resolver should return the
    // standard Treasury Curve Index constituent set
    // (EXPECTED_CONSTITUENT_COUNT = 11). Accept partial days [8, 11]
    // to tolerate a constituent or two being unpriced in the seed.
    await expect.poll(
      async () => rows.count(),
      {
        message: `/data/treasury_curve row count out of expected range [${EXPECTED_CONSTITUENT_COUNT_MIN}, ${EXPECTED_CONSTITUENT_COUNT_MAX}]`,
        timeout: 15_000,
      },
    ).toBeGreaterThanOrEqual(EXPECTED_CONSTITUENT_COUNT_MIN);
    await expect.poll(async () => rows.count(), { timeout: 15_000 })
      .toBeLessThanOrEqual(EXPECTED_CONSTITUENT_COUNT_MAX);

    // Iterate rows: column 1 = tenor (inside <strong>); column 6 =
    // coupon rate (formatted as e.g. "5.000%"). Pre-#302 the
    // constituent loader's `couponRate = 0` fallback masked the
    // wrapper-side throw — every row rendered "0.000%" silently and
    // the row-count smoke alone wouldn't have caught it. This loop
    // is the assertion that would have failed loudly.
    const rowCount = await rows.count();
    const offenders: { tenor: string; couponRate: string }[] = [];
    for (let i = 0; i < rowCount; i++) {
      const row = rows.nth(i);
      const tenor = (await row.locator('td').nth(0).innerText()).trim();
      const couponRateText = (await row.locator('td.yield-cell').innerText()).trim();
      // "5.000%" → 5
      const couponRate = parseFloat(couponRateText.replace('%', ''));
      if (BILL_TENORS.has(tenor)) continue; // Bills are zero-coupon by design
      if (!Number.isFinite(couponRate) || couponRate <= 0) {
        offenders.push({ tenor, couponRate: couponRateText });
      }
    }
    expect(
      offenders,
      `non-Bill tenors with zero/missing coupon (would have masked #302): ${JSON.stringify(offenders)}`,
    ).toEqual([]);
  });

  // #305 part B: chart used to plot couponRate as the Y axis (Bills
  // came out at 0%, notes flat-lined at their fixed coupons regardless
  // of where they traded). Post-fix the page-server runs RunCurve and
  // joins par yields per tenor; the chart Y series is parYield, NOT
  // couponRate. This assertion locks that contract by reading the
  // page payload's serialized parYield array and checking it differs
  // from couponRate on at least one row.
  test('/data/treasury_curve part B: par yields rendered (Y axis ≠ couponRate column)', async ({ page }) => {
    const response = await page.goto(TREASURY_CURVE_RECENT_URL);
    expect(response!.status()).toBeLessThan(500);

    // Read the rendered table cells: column 5 = Coupon Rate (yield-cell),
    // column 6 = Par Yield (par-yield-cell). Pre-#305-part-B the page
    // didn't have a Par Yield column at all and the chart Y was driven
    // off the coupon column; the contract this test locks is that the
    // par-yield column exists, has at least one numeric value, and
    // disagrees with the coupon column on at least one row (Bills:
    // coupon=0%, par=~3-4%; off-par notes: coupon != par).
    const rows = page.locator('table tbody tr');
    await expect.poll(async () => rows.count(), { timeout: 15_000 })
      .toBeGreaterThanOrEqual(EXPECTED_CONSTITUENT_COUNT_MIN);

    const rowCount = await rows.count();
    let anyParYieldRendered = false;
    let rowsWhereYieldDiffersFromCoupon = 0;
    const pricedWithoutYield: { tenor: string; price: string }[] = [];
    for (let i = 0; i < rowCount; i++) {
      const row = rows.nth(i);
      const tenor = (await row.locator('td').nth(0).innerText()).trim();
      const couponText = (await row.locator('td.yield-cell').innerText()).trim();
      const parText = (await row.locator('td.par-yield-cell').innerText()).trim();
      const priceText = (await row.locator('td.price-cell').innerText()).trim();

      // Coverage check — locks the #305-reopen gap fix. Pre-fix the
      // join used canonical bucket years (1M=0.083, 30Y=30.0) but the
      // fitter emits at the bond's actual maturity-derived years
      // (1M Bill=0.21, 30Y Bond=29.76). Bonds whose actual maturity
      // was >0.05y from the bucket label silently lost their parYield
      // (1M, 3Y, 20Y, 30Y on 2026-05-14). Any priced row MUST now
      // come back with a par yield — flag offenders loudly.
      if (priceText !== '—' && parText === '—') {
        pricedWithoutYield.push({ tenor, price: priceText });
        continue;
      }
      if (parText === '—') continue;

      anyParYieldRendered = true;
      const coupon = parseFloat(couponText.replace('%', ''));
      const par = parseFloat(parText.replace('%', ''));
      if (Number.isFinite(coupon) && Number.isFinite(par) && Math.abs(coupon - par) > 0.01) {
        rowsWhereYieldDiffersFromCoupon++;
      }
    }
    expect(
      anyParYieldRendered,
      'no row had a non-null Par Yield — RunCurve returned no usable curve, par-yield column hard-coded to "—"',
    ).toBe(true);
    expect(
      rowsWhereYieldDiffersFromCoupon,
      'every priced row had parYield equal to couponRate — chart probably still plots coupon (#305 part B regression)',
    ).toBeGreaterThan(0);
    expect(
      pricedWithoutYield,
      `priced constituents missing a par yield (#305-reopen gap regression): ${JSON.stringify(pricedWithoutYield)}`,
    ).toEqual([]);
  });

  // #305 part C: POSTCUT01 (uuid dbd72c65-…) was a stray test fixture
  // that surfaced in an earlier on-the-run constituent. data-sourcing-dev
  // owns the ledger cleanup; the UI-side assertion guards against any
  // POST*/TEST* identifier ever resurfacing in the curve picker.
  test('/data/treasury_curve part C: no POST*/TEST* identifiers in any row', async ({ page }) => {
    const response = await page.goto(TREASURY_CURVE_RECENT_URL);
    expect(response!.status()).toBeLessThan(500);

    const html = await page.content();
    const cusips = [...html.matchAll(/cusip:"([^"]+)"/g)].map((m) => m[1]);
    const offenders = cusips.filter((id) => /^(POST|TEST)/i.test(id));
    expect(
      offenders,
      `stray test/POSTCUT identifiers leaked into the curve picker: ${JSON.stringify(offenders)}`,
    ).toEqual([]);
  });
});
