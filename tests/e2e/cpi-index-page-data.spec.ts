/**
 * M6 #263 bug 6: /data/cpi_index returned no series and no historical
 * data despite the ledger holding 4,798 CPI prices. The page-server's
 * security filter used asset_class='Index' — that's the abstract
 * product_type *parent*, not an asset_class value, so the search
 * matched zero rows. Post-fix the page-server filters by
 * asset_class='RATES' + post-filters by product_type=CPI_SERIES,
 * which is where CPI_SERIES lives in hierarchy.json.
 *
 * Asserts both layers: the series picker is populated AND at least
 * one historical CPI data point renders in the monthly-data table.
 */
import { test, expect } from '@playwright/test';

test.describe('/data/cpi_index — series + historical data (#263 bug 6)', () => {
  test('series dropdown is non-empty and the historical table has data', async ({ page }) => {
    await page.goto('/data/cpi_index');
    await expect(page.getByRole('heading', { name: /CPI/i }).first()).toBeVisible({ timeout: 15_000 });

    // The page-server picks DEFAULT_SERIES_ID = 'CUUR0000SA0' (BLS CPI-U All
    // Items) when no ?series= is set. The dropdown should be populated and
    // include CUUR0000SA0.
    const seriesSelect = page.locator('#series-select');
    await expect(seriesSelect).toBeVisible({ timeout: 10_000 });
    await expect(seriesSelect).toBeEnabled();

    const options = await seriesSelect.locator('option').allTextContents();
    const seriesIds = options.map((o) => o.split('—')[0]?.trim()).filter(Boolean);
    expect(seriesIds.length, 'series dropdown is non-empty').toBeGreaterThan(0);
    expect(seriesIds.some((id) => /^CUUR/.test(id)), `at least one BLS CPI-U series surfaced (got: ${seriesIds.join(', ')})`).toBe(true);

    // No "No CPI series" empty-state banner.
    await expect(page.locator('.empty-state')).toHaveCount(0);

    // The monthly-data table renders one row per observation. With 4,798
    // CPI prices in the ledger, the default CPI-U series has hundreds of
    // observations — assert a generous lower bound so this test isn't
    // a flake risk if the seed shrinks.
    const valueCells = page.locator('table td.value-cell');
    await expect(valueCells.first()).toBeVisible({ timeout: 10_000 });
    const count = await valueCells.count();
    expect(count, 'monthly-data table renders historical CPI rows').toBeGreaterThan(10);

    // Each value cell carries a 3-decimal numeric — sanity-check the
    // formatting wires through.
    const firstValue = (await valueCells.first().textContent() ?? '').trim();
    expect(firstValue, 'CPI value renders numerically').toMatch(/^-?\d+\.\d{3}$/);
  });
});
