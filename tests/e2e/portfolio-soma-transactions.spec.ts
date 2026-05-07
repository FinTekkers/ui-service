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

const PORTFOLIO_NAME = 'Federal Reserve SOMA Holdings';

test.describe('/data/portfolios → /data/transactions (SOMA)', () => {
  test('clicking Txns on SOMA navigates to its transactions and renders rows', async ({ page }) => {
    await page.goto('/data/portfolios');
    await expect(page.getByRole('heading', { name: 'Portfolios' })).toBeVisible();

    const somaRow = page.locator('table tbody tr').filter({ hasText: PORTFOLIO_NAME }).first();
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

    // second-brain#223: the table-wrapper around the grid must NOT have its
    // own overflow scroll. Page-level .content-area (in (authenticated)/+layout)
    // owns scrolling so the user sees a single horizontal/vertical scrollbar.
    // The 223-followup spec has the broader page-shell single-scroll
    // assertions; this one just guards the per-grid invariant.
    const tableWrapper = page.locator('.table-wrapper').first();
    const wrapperOverflow = await tableWrapper.evaluate((el) => {
      const cs = window.getComputedStyle(el);
      return { x: cs.overflowX, y: cs.overflowY };
    });
    expect(wrapperOverflow.x).toBe('visible');
    expect(wrapperOverflow.y).toBe('visible');
  });

  // Phase 3 PR-B of #226: tradeDate DateFilter on /data/transactions.
  test('tradeDate + tradeDateOperator round-trip through Filter with portfolioId preserved', async ({ page }) => {
    await page.goto('/data/portfolios');
    const txnsLink = page
      .locator('table tbody tr').filter({ hasText: PORTFOLIO_NAME }).first()
      .getByRole('link', { name: /^Txns$/ });
    const href = await txnsLink.getAttribute('href');
    const portfolioId = new URL(href!, page.url()).searchParams.get('portfolioId')!;

    // Land with both URL params set; DateFilter (via TransactionSelect's
    // onMount) should populate the date input and operator select. The
    // operator dropdown must be enabled because the date is set.
    await page.goto(
      `/data/transactions?portfolioId=${portfolioId}` +
      `&tradeDate=2026-05-06&tradeDateOperator=LESS_THAN_OR_EQUALS`,
    );

    const dateInput = page.locator('#trade-date-input');
    await expect(dateInput).toBeVisible({ timeout: 10_000 });
    await expect(dateInput).toHaveValue('2026-05-06');
    const opSelect = page.getByLabel('Date operator');
    await expect(opSelect).toHaveValue('LESS_THAN_OR_EQUALS');
    await expect(opSelect).toBeEnabled();

    // Click Filter → the form re-emits the same URL shape; portfolioId
    // is carried via TransactionSelect's inheritKeys (#220 guard).
    await page.getByRole('button', { name: /^Filter$/ }).click();
    await page.waitForURL(/\/data\/transactions\?.*tradeDate=/, { timeout: 10_000 });

    const params = new URL(page.url()).searchParams;
    expect(params.get('tradeDate')).toBe('2026-05-06');
    expect(params.get('tradeDateOperator')).toBe('LESS_THAN_OR_EQUALS');
    expect(params.get('portfolioId'), '#220 guard: portfolioId preserved').toBe(portfolioId);
  });

  test('tradeDate without operator: filter dropped on re-emit (half-applied guard)', async ({ page }) => {
    await page.goto('/data/portfolios');
    const txnsLink = page
      .locator('table tbody tr').filter({ hasText: PORTFOLIO_NAME }).first()
      .getByRole('link', { name: /^Txns$/ });
    const href = await txnsLink.getAttribute('href');
    const portfolioId = new URL(href!, page.url()).searchParams.get('portfolioId')!;

    // URL has tradeDate but no operator. DateFilter populates the date
    // input; operator stays empty. Clicking Filter drops both params
    // on re-emit (the form's emit guard mirrors the page-server's
    // half-formed-filter rule).
    await page.goto(
      `/data/transactions?portfolioId=${portfolioId}&tradeDate=2026-05-06`,
    );
    const dateInput = page.locator('#trade-date-input');
    await expect(dateInput).toHaveValue('2026-05-06');
    await expect(page.getByLabel('Date operator')).toHaveValue('');

    await page.getByRole('button', { name: /^Filter$/ }).click();
    await page.waitForURL(/\/data\/transactions/, { timeout: 10_000 });

    const params = new URL(page.url()).searchParams;
    expect(params.get('tradeDate'), 'half-applied filter dropped').toBeNull();
    expect(params.get('tradeDateOperator'), 'no orphan operator emitted').toBeNull();
    expect(params.get('portfolioId'), '#220 guard: portfolioId preserved').toBe(portfolioId);
  });
});
