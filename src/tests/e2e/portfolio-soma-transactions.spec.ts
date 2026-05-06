/**
 * Playwright E2E for the /data/portfolios → /data/transactions flow.
 *
 * Verifies that:
 *   1. /data/portfolios renders the seeded "Federal Reserve SOMA Holdings" row.
 *   2. The row's "Txns" button links to /data/transactions?portfolioId=<UUID>
 *      (issue second-brain#222: previously linked to /data/portfolios — a
 *      no-op).
 *   3. Clicking it lands on the transactions page with portfolioId in the URL.
 *   4. The transactions page renders ≥1 transaction row, scoped to SOMA via
 *      the PORTFOLIO_ID PositionFilter wired through the page-server's
 *      FetchTransactionByPortfolio path.
 *
 * Independent of portfolio-soma-positions.spec.ts because the two flows
 * (clicking the portfolio name link vs. clicking the Txns action button) are
 * separately breakable and exercise different page-server load paths.
 */
import { test, expect } from '@playwright/test';

const SOMA_PORTFOLIO_NAME = 'Federal Reserve SOMA Holdings';

test.describe('/data/portfolios → /data/transactions (SOMA)', () => {
  test('clicking Txns on SOMA navigates to its transactions and renders rows', async ({ page }) => {
    await page.goto('/data/portfolios');
    await expect(page.getByRole('heading', { name: 'Portfolios' })).toBeVisible();

    const somaRow = page.locator('table tbody tr').filter({ hasText: SOMA_PORTFOLIO_NAME }).first();
    await expect(somaRow).toBeVisible();

    // The Txns button is an <a> with class .txn-btn — find it inside the SOMA
    // row. Its href must be /data/transactions?portfolioId=<uuid>; the prior
    // bug pointed at /data/portfolios which made the click a refresh-no-op.
    const txnsLink = somaRow.getByRole('link', { name: /^Txns$/ });
    await expect(txnsLink).toHaveAttribute(
      'href',
      /^\/data\/transactions\?portfolioId=[0-9a-f-]{8}-[0-9a-f-]{4}-[0-9a-f-]{4}-[0-9a-f-]{4}-[0-9a-f-]{12}$/,
    );

    await txnsLink.click();

    await page.waitForURL(/\/data\/transactions\?portfolioId=[0-9a-f-]+/);
    const portfolioId = new URL(page.url()).searchParams.get('portfolioId');
    expect(portfolioId).toMatch(/^[0-9a-f-]{8}-[0-9a-f-]{4}-[0-9a-f-]{4}-[0-9a-f-]{4}-[0-9a-f-]{12}$/);

    await expect(page.getByRole('heading', { name: /Transactions/ })).toBeVisible({ timeout: 15_000 });

    // TransactionGrid renders data rows as tr.table-row and a separate
    // tfoot summary-row. Filter to data rows only.
    const dataRows = page.locator('table tbody tr.table-row');
    // SOMA seed loads multiple bond / bill / note transactions plus the
    // offsetting cash legs — assert at least one row to prove scoping
    // returned data (rather than an empty page hidden behind the heading).
    await expect(dataRows.first()).toBeVisible({ timeout: 10_000 });
    expect(await dataRows.count()).toBeGreaterThan(0);
  });
});
