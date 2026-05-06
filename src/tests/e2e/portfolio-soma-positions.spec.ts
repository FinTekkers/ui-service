/**
 * Playwright E2E for the /data/portfolios → /data/positions flow.
 *
 * Verifies that:
 *   1. /data/portfolios renders the seeded "Federal Reserve SOMA Holdings" row.
 *   2. Clicking the portfolio name link navigates to /data/positions with the
 *      portfolio's UUID as `portfolioId` in the query string.
 *   3. The positions page renders the default TRANSACTION view scoped to SOMA.
 *   4. Switching the request to fields=PRODUCT_TYPE & measures=DIRECTED_QUANTITY
 *      (the backend's group-by mode) renders one row per product type with the
 *      aggregated DIRECTED_QUANTITY value — i.e. the page surfaces a real
 *      Measure × Field aggregation by relying on the position-service's
 *      server-side aggregation when only one field is requested. The query is
 *      portfolio-scoped via the PORTFOLIO_ID PositionFilter wired through
 *      +page.server.ts → FetchPosition.
 *
 * Default-URL filter set (mirrored both in PortfolioGrid.getPositionsUrl and
 * step 4 of this test):
 *   - positionType=TRANSACTION (transaction-rolled-up state, not per tax lot).
 *   - tradeDate=<today> & tradeDateOperator=lesser_than_or_equals excludes
 *     future-dated trades while including those booked today, so the page
 *     reflects the as-of-now position.
 *   - hideZeros=true suppresses fully-zero rows.
 *   - portfolioId scopes the search to the clicked portfolio.
 *
 * Why the PortfolioGrid default URL was trimmed earlier in this branch's
 * history: the previous default included ACCRUED_INTEREST / DIRTY_PRICE /
 * CLEAN_PRICE / CONVEXITY / MODIFIED_DURATION — all of which the ledger-
 * service position-search returns `12 UNIMPLEMENTED` for. A single
 * unsupported measure 500s the entire stream. Backend gap tracked in
 * second-brain#219.
 */
import { test, expect } from '@playwright/test';

const SOMA_PORTFOLIO_NAME = 'Federal Reserve SOMA Holdings';

// Product types the SOMA seed loads. Hardcoded because the seed is stable; if
// the seed grows, prefer adding to this list over loosening the assertion.
const SOMA_PRODUCT_TYPES = ['NOTE', 'BILL', 'BOND', 'CASH'] as const;

test.describe('/data/portfolios → /data/positions (SOMA)', () => {
  test('clicking SOMA navigates to its positions and PRODUCT_TYPE aggregates DIRECTED_QUANTITY', async ({ page }) => {
    // 1. Land on the portfolios index. PortfolioGrid renders one row per
    //    portfolio returned by searchPortfolio. With the current SOMA-only
    //    seed there is exactly one row.
    await page.goto('/data/portfolios');
    await expect(page.getByRole('heading', { name: 'Portfolios' })).toBeVisible();

    const somaRow = page.locator('table tbody tr').filter({ hasText: SOMA_PORTFOLIO_NAME }).first();
    await expect(somaRow).toBeVisible();

    // 2. Click the portfolio-name link (the Portfolio column links to
    //    /data/positions?portfolioId=...). The Txns and Delete buttons in the
    //    same row use stopPropagation so they don't trigger this navigation.
    const positionsLink = somaRow.getByRole('link', { name: SOMA_PORTFOLIO_NAME });
    await expect(positionsLink).toHaveAttribute('href', /\/data\/positions\?.*portfolioId=[0-9a-f-]+/);
    await positionsLink.click();

    // 3. Land on the positions page. The default URL set by PortfolioGrid uses
    //    fields=SECURITY_DESCRIPTION,PORTFOLIO_NAME — i.e. the flat tax-lot
    //    list, not the PRODUCT_TYPE roll-up.
    await page.waitForURL(/\/data\/positions\?.*portfolioId=[0-9a-f-]+/);
    const portfolioId = new URL(page.url()).searchParams.get('portfolioId');
    expect(portfolioId).toMatch(/^[0-9a-f-]{8}-[0-9a-f-]{4}-[0-9a-f-]{4}-[0-9a-f-]{4}-[0-9a-f-]{12}$/);

    await expect(page.getByRole('heading', { name: 'Positions' })).toBeVisible({ timeout: 15_000 });
    // The "Back to Portfolios" link is rendered iff portfolioId is in scope —
    // confirms the page-server.ts read the param.
    await expect(page.getByRole('link', { name: /Back to Portfolios/ })).toBeVisible();

    // 4. Switch to the PRODUCT_TYPE × DIRECTED_QUANTITY view. The position
    //    service aggregates server-side: requesting only PRODUCT_TYPE collapses
    //    the result set to one row per product type with summed measures.
    //    Mirror the view/filter defaults set by PortfolioGrid (TRANSACTION
    //    view, tradeDate <= today, hideZeros) so the assertion exercises the
    //    same shape the user lands on, just with a different fields/measures
    //    selection. portfolioId keeps the search scoped to SOMA.
    const today = new Date().toISOString().slice(0, 10);
    await page.goto(
      `/data/positions?portfolioId=${portfolioId}` +
      `&fields=PRODUCT_TYPE` +
      `&measures=DIRECTED_QUANTITY` +
      `&positionView=DEFAULT_VIEW` +
      `&positionType=TRANSACTION` +
      `&tradeDate=${today}` +
      `&tradeDateOperator=lesser_than_or_equals` +
      `&hideZeros=true`,
    );

    await expect(page.getByRole('heading', { name: 'Positions' })).toBeVisible({ timeout: 15_000 });

    // Header row: one field column + one measure column.
    const headerCells = page.locator('table thead th');
    await expect(headerCells).toHaveCount(2);
    await expect(headerCells.nth(0)).toContainText('Product Type');
    await expect(headerCells.nth(1)).toContainText('Directed Quantity');

    // Data rows: PositionGrid emits a `summary-row` after the data rows when
    // sortedPositions.length > 0. Filter to data rows only via the
    // `.table-row` class (set on data <tr>s, not on the summary row).
    const dataRows = page.locator('table tbody tr.table-row');
    await expect(dataRows).toHaveCount(SOMA_PRODUCT_TYPES.length, { timeout: 10_000 });

    // Each known product type appears exactly once.
    for (const productType of SOMA_PRODUCT_TYPES) {
      await expect(
        dataRows.filter({ has: page.locator('td', { hasText: new RegExp(`^${productType}$`) }) }),
      ).toHaveCount(1);
    }

    // Every product type has a non-zero DIRECTED_QUANTITY. Under TRANSACTION
    // view + hideZeros=true the seed shows positive holdings for NOTE/BILL/
    // BOND and a negative CASH leg (the offsetting cash impact of the bond
    // purchases). formatAmount uses Intl.NumberFormat USD which renders
    // negatives as `-$1,234.56` and positives as `$1,234.56`; the regex
    // accepts either sign.
    for (const productType of SOMA_PRODUCT_TYPES) {
      const row = dataRows.filter({ has: page.locator('td', { hasText: new RegExp(`^${productType}$`) }) });
      const valueCell = row.locator('td').nth(1);
      await expect(valueCell).toHaveText(/^-?\$[1-9][\d,]*\.\d{2}$/);
    }
  });
});
