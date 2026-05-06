/**
 * Playwright E2E for the /data/portfolios → /data/positions flow.
 *
 * Verifies that:
 *   1. /data/portfolios renders the seeded "Federal Reserve SOMA Holdings" row.
 *   2. Clicking the portfolio name link navigates to /data/positions with the
 *      portfolio's UUID as `portfolioId` in the query string.
 *   3. The positions page renders the default flat tax-lot view for SOMA.
 *   4. Switching the request to fields=PRODUCT_TYPE & measures=DIRECTED_QUANTITY
 *      (the backend's group-by mode) renders one row per product type with the
 *      aggregated DIRECTED_QUANTITY value — i.e. the page surfaces a real
 *      Measure × Field aggregation by relying on the position-service's
 *      server-side aggregation when only one field is requested.
 *
 * Why URL-driven for step 4 (instead of driving the PositionSelect controls):
 *   PositionSelect.fetchPositions() drops the inbound `portfolioId` query param
 *   when constructing the next URL — second-brain#220. Until that is fixed,
 *   the only way to keep the request portfolio-scoped through a UI flow is to
 *   URL-navigate. Filed as an issue rather than fixed inline because the
 *   workaround is clean and the fix needs careful thought (which params to
 *   preserve generically).
 *
 * Why the PortfolioGrid default URL was trimmed in this PR:
 *   The previous default included ACCRUED_INTEREST/DIRTY_PRICE/CLEAN_PRICE/
 *   CONVEXITY/MODIFIED_DURATION — all of which the ledger-service
 *   position-search returns `12 UNIMPLEMENTED` for. A single unsupported
 *   measure 500s the entire stream, so every portfolio click landed on the
 *   error page. Trimmed to working measures only; backend gap tracked in
 *   second-brain#219.
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
    await page.goto(
      `/data/positions?portfolioId=${portfolioId}` +
      `&fields=PRODUCT_TYPE` +
      `&measures=DIRECTED_QUANTITY` +
      `&positionView=DEFAULT_VIEW` +
      `&positionType=TAX_LOT`,
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

    // The non-cash product types have a non-zero DIRECTED_QUANTITY rendered as
    // a $-prefixed amount with two decimals (formatAmount in formatUtils).
    // CASH is allowed to be $0.00 — SOMA's reported holdings don't include
    // standalone cash positions.
    for (const productType of ['NOTE', 'BILL', 'BOND'] as const) {
      const row = dataRows.filter({ has: page.locator('td', { hasText: new RegExp(`^${productType}$`) }) });
      const valueCell = row.locator('td').nth(1);
      await expect(valueCell).toHaveText(/\$[1-9][\d,]*\.\d{2}/);
    }
  });
});
