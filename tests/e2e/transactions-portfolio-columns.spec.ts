/**
 * Playwright E2E for second-brain#263 bug 4: /data/transactions must expose
 * the portfolio each row belongs to. TransactionGrid now renders a
 * 'Portfolio' (name) column and a 'Portfolio ID' (compact-UUID,
 * click-to-expand) column.
 *
 * Scope: with no portfolioId filter, the page loads ALL transactions and
 * each row should show a non-empty Portfolio cell + a UUID toggle in the
 * Portfolio ID cell.
 */
import { test, expect } from '@playwright/test';

test.describe('/data/transactions portfolio columns (#263 bug 4)', () => {
  test('Portfolio + Portfolio ID column headers are present', async ({ page }) => {
    await page.goto('/data/transactions');
    await expect(page.getByRole('heading', { name: /Transactions/ })).toBeVisible({ timeout: 15_000 });

    // Headers are clickable <th role="button"> elements. Match against the
    // accessible-name-normalized text (sort indicator whitespace already
    // collapses out of getByRole's name).
    await expect(page.getByRole('button', { name: 'Portfolio', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Portfolio ID', exact: true })).toBeVisible();
  });

  test('at least one data row renders a non-empty Portfolio name + a Portfolio ID toggle', async ({ page }) => {
    await page.goto('/data/transactions');
    await expect(page.getByRole('heading', { name: /Transactions/ })).toBeVisible({ timeout: 15_000 });

    const dataRows = page.locator('table tbody tr.table-row');
    await expect(dataRows.first()).toBeVisible({ timeout: 15_000 });

    // Resolve column indices from the header so the assertion survives
    // future column reorders without false-positives.
    const headerLabels = await page.locator('thead th').allTextContents();
    const cleanLabels = headerLabels.map((s) => s.trim().replace(/[▲▼↕↑↓]\s*$/, '').trim());
    const portfolioColIndex = cleanLabels.findIndex((l) => /^Portfolio$/i.test(l));
    const portfolioIdColIndex = cleanLabels.findIndex((l) => /^Portfolio ID$/i.test(l));
    expect(portfolioColIndex, 'Portfolio column present').toBeGreaterThanOrEqual(0);
    expect(portfolioIdColIndex, 'Portfolio ID column present').toBeGreaterThanOrEqual(0);

    const firstRow = dataRows.first();
    const cells = firstRow.locator('td');
    const portfolioName = (await cells.nth(portfolioColIndex).textContent() ?? '').trim();
    expect(portfolioName.length, 'first row portfolio name is non-empty').toBeGreaterThan(0);

    // Portfolio ID cell renders a clickable toggle whose title carries the
    // full UUID. Compact form is first 8 hex chars + an ellipsis.
    const toggle = cells.nth(portfolioIdColIndex).getByRole('button');
    await expect(toggle).toBeVisible();
    const title = await toggle.getAttribute('title');
    expect(title, 'toggle title carries the full portfolio UUID').toMatch(
      /^[0-9a-f-]{8}-[0-9a-f-]{4}-[0-9a-f-]{4}-[0-9a-f-]{4}-[0-9a-f-]{12}$/,
    );
    await expect(toggle).toHaveText(/^[0-9a-f]{8}…$/);

    // Click expands the compact UUID to the full UUID.
    await toggle.click();
    await expect(toggle).toHaveText(title!);
  });
});
