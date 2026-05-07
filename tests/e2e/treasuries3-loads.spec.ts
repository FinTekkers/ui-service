/**
 * Regression for the /treasuries3 500 surfaced in PR #137's reviewer
 * checklist. The page-server's load() called getTreasuryTransactions
 * without threading locals.user?.apiKey, so the underlying gRPC search
 * went out unauthenticated and the broker returned UNAUTHENTICATED —
 * which the load() function re-threw, taking the whole page to a 500
 * before render.
 *
 * After the fix, the page should either render the bond-activity table
 * (December 2025 data is in the seed) OR the empty-state ("No bond
 * activity ( bills) found for December 2025.") — but never 500.
 *
 * /treasuries3 is a top-level route (NOT under (authenticated)/), so
 * `.auth-shell` is not present here. Assert against the page's own
 * indicators: the H1 title, and either a data row or the .no-data
 * block.
 */
import { test, expect } from '@playwright/test';

test.describe('/treasuries3 — page-server apiKey threading', () => {
  test('/treasuries3 loads without 500 (apiKey threaded to getTreasuryTransactions)', async ({ page }) => {
    const response = await page.goto('/treasuries3');

    // 1. HTTP layer — the bug previously surfaced as a 500.
    expect(response, 'GET /treasuries3 returns a response').not.toBeNull();
    const status = response!.status();
    expect(status, 'no 500 / no 5xx after apiKey threading').toBeLessThan(500);

    // 2. Render layer — the page's own H1 is the cheap "page rendered"
    // signal that doesn't depend on the seed having data. Not an exact
    // match because the heading text contains regex-special chars.
    await expect(
      page.getByRole('heading', { level: 1, name: /Bond Activity.*December 2025/ }),
    ).toBeVisible({ timeout: 10_000 });

    // 3. Either the table OR the empty-state is acceptable — both prove
    // the page-server's load() returned cleanly. The seed contents are
    // backend-driven and can change without breaking this assertion.
    const table = page.locator('table.bond-activity-table');
    const emptyState = page.locator('.no-data');
    const hasTable = await table.isVisible().catch(() => false);
    const hasEmptyState = await emptyState.isVisible().catch(() => false);
    expect(
      hasTable || hasEmptyState,
      'either the table OR the empty-state is rendered',
    ).toBe(true);
  });
});
