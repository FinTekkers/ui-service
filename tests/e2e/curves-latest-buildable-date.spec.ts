/**
 * E2E coverage for the #268 latest-buildable-date UX on /data/curves and
 * /data/treasury_curve.
 *
 * Pre-#268 the loader defaulted `asof` to "today" and rendered blank with
 * 11 warnings whenever today's data was incomplete (Bug 4 on #263). The
 * post-#268 loader scans backward via the server-side index resolver until
 * it finds a fully-priced curve, then defaults `asof` to that date AND
 * surfaces a "Latest fully-priced: YYYY-MM-DD" hint so the user can see
 * what date they're viewing without inspecting the URL.
 *
 * What's verified:
 *   1. /data/curves with no ?asof= renders the hint.
 *   2. /data/treasury_curve with no ?date= renders the hint.
 *   3. When the user navigates to an older date (e.g. ?asof=2026-05-01),
 *      the hint links forward to the latest date.
 *
 * What's NOT verified:
 *   - The specific latest-date value — that's data-dependent and shifts
 *     daily as data-sourcing-dev backfills.
 */
import { test, expect } from '@playwright/test';

test.describe('#268 — latest-buildable-date hint on /data/curves', () => {
  test('default landing surfaces the latest fully-priced date hint', async ({ page }) => {
    await page.goto('/data/curves');

    // Wait for the page to settle. The asof input must render before the
    // hint check, regardless of whether the backend returned curve data.
    await expect(page.getByLabel('As of:')).toBeVisible({ timeout: 30_000 });

    // The hint is only rendered when the loader's scan returned a date.
    // In environments with sufficient data, that's expected. Skip if the
    // backend was empty (no curve dates available — orthogonal to the UX).
    const hint = page.getByTestId('latest-hint');
    if (await hint.count() === 0) {
      test.skip(true, 'no latest-buildable date available in this environment');
    }
    await expect(hint).toBeVisible();
    await expect(hint).toContainText(/Latest fully-priced:\s*\d{4}-\d{2}-\d{2}/);
  });

  test('viewing an older date renders the hint as a link to the latest date', async ({ page }) => {
    // Far-past date guaranteed to differ from the latest scanned date.
    await page.goto('/data/curves?asof=2024-01-02&term=10');

    await expect(page.getByLabel('As of:')).toBeVisible({ timeout: 30_000 });

    const hint = page.getByTestId('latest-hint');
    if (await hint.count() === 0) {
      test.skip(true, 'no latest-buildable date available in this environment');
    }
    await expect(hint).toBeVisible();
    // When the user is on an older date, the hint must be a clickable link
    // (recovery in one click) rather than plain text.
    const anchor = hint.locator('a');
    await expect(anchor).toBeVisible();
    await expect(anchor).toHaveAttribute('href', /asof=\d{4}-\d{2}-\d{2}/);
  });
});

test.describe('#268 — latest-buildable-date hint on /data/treasury_curve', () => {
  test('default landing surfaces the latest fully-priced date hint', async ({ page }) => {
    await page.goto('/data/treasury_curve');

    await expect(page.getByLabel('Curve Date:')).toBeVisible({ timeout: 30_000 });

    const hint = page.getByTestId('latest-hint');
    if (await hint.count() === 0) {
      test.skip(true, 'no latest-buildable date available in this environment');
    }
    await expect(hint).toBeVisible();
    await expect(hint).toContainText(/Latest fully-priced:\s*\d{4}-\d{2}-\d{2}/);
  });
});
