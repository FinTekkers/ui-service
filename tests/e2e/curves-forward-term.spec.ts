/**
 * E2E coverage for the term-forward view on /data/curves (#264).
 *
 * What's verified end-to-end:
 *   1. The page loads with the forward-term selector defaulted to 10Y.
 *   2. Switching the selector to 1Y triggers a navigation to
 *      /data/curves?asof=…&term=1 and the new term is sticky on reload.
 *   3. The forward table heading reflects the selected term ("1Y Forward Rate
 *      by Start Year") — which proves data.termYears propagated and the page
 *      rendered the new forward series rather than the legacy single line.
 *
 * What's NOT verified here:
 *   - Numerical correctness of f(t, t+T) — that's validated in
 *     valuation-service against FRED in PR #50, and against fixed inputs in
 *     the curves-server-helpers vitest. Adding it here would require
 *     pinning a curve fixture, and the e2e environment uses live curves.
 */
import { test, expect } from '@playwright/test';

test.describe('/data/curves — forward-term selector (#264)', () => {
  test('selector defaults to 10Y and is wired to ?term=', async ({ page }) => {
    await page.goto('/data/curves');

    const selector = page.getByLabel('Forward term');
    await expect(selector).toBeVisible({ timeout: 15_000 });
    await expect(selector).toHaveValue('10');

    // Forward table heading proves termYears flowed from server to page.
    await expect(page.getByRole('heading', { name: /10Y Forward Rate by Start Year/ }))
      .toBeVisible({ timeout: 15_000 });
  });

  test('switching to 1Y reloads the page with term=1 and re-renders the forward table', async ({ page }) => {
    await page.goto('/data/curves');

    const selector = page.getByLabel('Forward term');
    await expect(selector).toBeVisible({ timeout: 15_000 });

    await Promise.all([
      page.waitForURL(/term=1(?:&|$)/, { timeout: 15_000 }),
      selector.selectOption('1'),
    ]);

    // Post-navigation: selector remembers, heading reflects 1Y.
    await expect(page.getByLabel('Forward term')).toHaveValue('1');
    await expect(page.getByRole('heading', { name: /1Y Forward Rate by Start Year/ }))
      .toBeVisible({ timeout: 15_000 });
  });

  test('decimal-year tenors render verbatim (no bucket snapping) when backend returns curve data', async ({ page }) => {
    // Spec callout: the prior tenorLabel() snapped 9–14Y → "10Y". The new
    // formatYears() renders "9.95Y". The unit assertion lives in
    // curves-page.test.ts where the fixture is pinned; this e2e check is
    // data-dependent and runs only when the live backend returns rows. If
    // RunCurve errors (e.g. pre-existing M6 bug 5 coupon-rate gap), we skip
    // — we don't want UI-correctness signal swallowed by a separate
    // data-sourcing regression.
    await page.goto('/data/curves');
    await expect(page.getByRole('heading', { name: /Par & Spot Curves/ }))
      .toBeVisible({ timeout: 15_000 });

    const errorBanner = page.locator('.error-banner');
    if (await errorBanner.isVisible().catch(() => false)) {
      test.skip(true, `backend RunCurve returned an error — out of scope for this UI spec: ${(await errorBanner.textContent()) ?? ''}`);
    }

    const tenorCells = await page.locator('.table-wrapper').first()
      .locator('tbody td strong').allTextContents();

    const decimalish = tenorCells.find((s) => /^\d+\.\d+Y$/.test(s));
    expect(decimalish, `expected at least one decimal-year tenor, saw ${JSON.stringify(tenorCells)}`)
      .toBeDefined();
  });
});
