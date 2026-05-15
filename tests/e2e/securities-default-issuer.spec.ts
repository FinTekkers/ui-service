/**
 * Regression for second-brain#306: /data/securities (no params) used to
 * default issuerName='US Government', silently hiding every non-US-Government
 * security (incl. all equities). Same family as #292 / #300 / #302 — a
 * hardcoded UI-side filter making real data invisible.
 *
 * The default has been dropped; FetchSecurity now fans out across the
 * known asset-class strings (M5 hierarchy + legacy display names) when
 * no user-driven filter is set, so the no-params landing view returns
 * every visible security regardless of issuer.
 *
 * Plus the title-typo cleanup also requested on this PR (3 stale
 * copy-pasted layout titles): securities → "Dashboard Positions",
 * positions → "Dashboard Transactions", portfolios → "Dashboard Portfolio".
 *
 * Asserts:
 *   1. /data/securities (no params) returns ≥1 row whose issuer is NOT
 *      'US Government'. Pre-#306 this was 0 by construction.
 *   2. /data/securities?issuerName=US%20Government still returns ≥1 row
 *      and EVERY rendered row's issuer is 'US Government' (sampling
 *      first 50 rows for perf — explicit filter is exclusive by design).
 *   3. <title> on each of the 4 dashboard data routes matches the route.
 */
import { test, expect } from '@playwright/test';

const ROUTE_TITLES: { url: string; expected: string }[] = [
  { url: '/data/securities', expected: 'Dashboard Securities' },
  { url: '/data/positions', expected: 'Dashboard Positions' },
  { url: '/data/portfolios', expected: 'Dashboard Portfolios' },
  { url: '/data/transactions', expected: 'Dashboard Transactions' },
];

test.describe('/data/securities default issuer filter (#306)', () => {
  test('no params: returns ≥1 non-US-Government issuer', async ({ page }) => {
    const response = await page.goto('/data/securities');
    expect(response, 'GET /data/securities returns a response').not.toBeNull();
    expect(response!.status(), 'no 5xx — load() must not throw').toBeLessThan(500);

    // Issuer column is index 3 in SecurityGrid (col 0 is the action
    // cell, then identifier, identifierType, issuer, assetClass…).
    // Sample first 50 rows for perf — that's plenty to prove the
    // landing view contains at least one non-US-Government issuer.
    const rows = page.locator('table tbody tr.table-row');
    await expect.poll(
      async () => rows.count(),
      {
        message: '/data/securities returned no rows — no-filter fanout failed; would have caught #306',
        timeout: 15_000,
      },
    ).toBeGreaterThan(0);

    const sampleSize = Math.min(50, await rows.count());
    const issuers = await Promise.all(
      Array.from({ length: sampleSize }, (_, i) =>
        rows.nth(i).locator('td').nth(3).innerText().then((t) => t.trim()),
      ),
    );
    const distinct = new Set(issuers.filter(Boolean));
    const nonGovt = [...distinct].filter((i) => i !== 'US Government');
    expect(
      nonGovt.length,
      `expected ≥1 non-US-Government issuer in first ${sampleSize} rows; saw distinct=${JSON.stringify([...distinct])}`,
    ).toBeGreaterThan(0);
  });

  test('?issuerName=US Government still works (back-compat for existing URLs)', async ({ page }) => {
    const response = await page.goto('/data/securities?issuerName=US%20Government');
    expect(response!.status()).toBeLessThan(500);

    const rows = page.locator('table tbody tr.table-row');
    await expect.poll(async () => rows.count(), { timeout: 15_000 })
      .toBeGreaterThan(0);

    // Same 50-row sample — assert every sampled issuer is exactly
    // 'US Government'. With ~3,300 US-Gov rows this would hang for
    // many minutes if we walked all rows sequentially.
    const sampleSize = Math.min(50, await rows.count());
    const issuers = await Promise.all(
      Array.from({ length: sampleSize }, (_, i) =>
        rows.nth(i).locator('td').nth(3).innerText().then((t) => t.trim()),
      ),
    );
    const distinct = new Set(issuers.filter(Boolean));
    expect(
      [...distinct],
      'explicit ?issuerName=US Government must still narrow to US Government only',
    ).toEqual(['US Government']);
  });
});

test.describe('Dashboard route <title> matches route (#306 title-typo cleanup)', () => {
  for (const { url, expected } of ROUTE_TITLES) {
    test(`${url} → "${expected}"`, async ({ page }) => {
      const response = await page.goto(url);
      expect(response!.status()).toBeLessThan(500);
      await expect(page).toHaveTitle(expected, { timeout: 10_000 });
    });
  }
});
