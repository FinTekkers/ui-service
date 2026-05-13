/**
 * Regression for the /treasuries2 500 surfaced in second-brain#263. The
 * page-server's load() called getTreasuryTransactions without threading
 * locals.user?.apiKey, so the underlying gRPC search went out
 * unauthenticated and the broker returned UNAUTHENTICATED — which load()
 * re-threw, taking the whole page to a 500 before render.
 *
 * Identical pattern to the /treasuries3 fix in 5d8f052; that branch missed
 * its sibling /treasuries2.
 *
 * After the fix the page should either render the analytics view
 * (December 2025 data is in the seed) OR the empty-state — but never 500.
 *
 * /treasuries2 is a top-level route (NOT under (authenticated)/), so
 * `.auth-shell` is not present here. Assert against the page's own H1.
 */
import { test, expect } from '@playwright/test';

test.describe('/treasuries2 — page-server apiKey threading', () => {
  test('/treasuries2 loads without 500 (apiKey threaded to getTreasuryTransactions)', async ({ page }) => {
    const response = await page.goto('/treasuries2');

    expect(response, 'GET /treasuries2 returns a response').not.toBeNull();
    const status = response!.status();
    expect(status, 'no 500 / no 5xx after apiKey threading').toBeLessThan(500);

    await expect(
      page.getByRole('heading', { level: 1, name: /Treasury Position Analytics/ }),
    ).toBeVisible({ timeout: 10_000 });

    // Either the analytics view OR the empty-state is acceptable — both
    // prove load() returned cleanly. Seed contents are backend-driven.
    const graphs = page.locator('.graphs-column');
    const emptyState = page.locator('.no-data');
    const hasGraphs = await graphs.isVisible().catch(() => false);
    const hasEmptyState = await emptyState.isVisible().catch(() => false);
    expect(
      hasGraphs || hasEmptyState,
      'either the graphs column OR the empty-state is rendered',
    ).toBe(true);
  });
});
