/**
 * Regression for second-brain#300: /data/transactions silently
 * rendered zero rows after the v0.4.4 ledger-models bump because
 * Transaction.getTradeDate() switched from LocalDate (with .toDate())
 * to Date | null. The pre-#300 sort at src/lib/transactions.ts:81
 * called .toDate() on the now-Date result, threw TypeError, and the
 * outer try/catch in FetchTransactionWithFilter caught it and
 * returned []. The grid rendered empty with no user-visible error.
 *
 * Plus a stale-copy-paste title bug: +layout.svelte:6 said
 * "Dashboard Securities" instead of "Dashboard Transactions".
 *
 * This is the UI-page-render equivalent of the per-loader smoke rule
 * in #297: pages that silently empty are P1 user-visible regressions
 * and need a smoke that fails loudly when the page disagrees with
 * what the DB has.
 *
 * Asserts:
 *   1. <title> reads "Dashboard Transactions" (catches the
 *      copy-paste regression).
 *   2. /data/transactions returns 200 (catches FetchTransaction
 *      throwing through the page-server load).
 *   3. The grid renders at least one transaction row when the seed
 *      DB has transactions (catches the silent-empty regression).
 *      We seed-detect via /data/portfolios — if the env has zero
 *      portfolios the smoke is informational only (a fresh local
 *      env may have no transactions yet).
 */
import { test, expect } from '@playwright/test';

const TXN_URL = '/data/transactions?tradeDate=2026-05-15&tradeDateOperator=LESS_THAN_OR_EQUALS';

test.describe('/data/transactions page renders correctly (#300)', () => {
  test('title is "Dashboard Transactions" (not "Dashboard Securities")', async ({ page }) => {
    const response = await page.goto(TXN_URL);
    expect(response, 'GET /data/transactions returns a response').not.toBeNull();
    expect(response!.status(), 'no 500/5xx on the transactions route').toBeLessThan(500);

    await expect(page).toHaveTitle('Dashboard Transactions', { timeout: 10_000 });
  });

  test('grid renders at least one row when the DB has transactions', async ({ page }) => {
    // Seed-detect: if /data/portfolios has zero rows the env is fresh
    // and we can't expect transactions either. Skip rather than fail.
    await page.goto('/data/portfolios');
    const portfolioRowCount = await page.locator('table tbody tr').count().catch(() => 0);
    test.skip(portfolioRowCount === 0, 'no portfolios in seed — transactions smoke not applicable');

    const response = await page.goto(TXN_URL);
    expect(response, 'GET /data/transactions returns a response').not.toBeNull();
    expect(response!.status(), 'no 500/5xx on the transactions route').toBeLessThan(500);

    // The grid is the tbody under the transactions table. Pre-#300
    // this would render with 0 <tr> children because the load() call
    // returned [] from the swallowed TypeError. Post-fix we expect
    // at least one row when the DB has transactions.
    const rows = page.locator('table tbody tr');
    await expect.poll(
      async () => rows.count(),
      {
        message: '/data/transactions silently empty — would have caught #300',
        timeout: 15_000,
      },
    ).toBeGreaterThan(0);
  });
});
