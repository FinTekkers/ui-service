/**
 * M6 #263 bug 3: /data/securities used to display 'BILL' / 'NOTE' / 'BOND'
 * in the Product Type column for any bond-shape leaf — the BondSecurity
 * wrapper override re-derived a coarse label from tenor and discarded
 * the proto's canonical leaf name. Data-sourcing-dev confirmed zero
 * securities on the wire have product_type=BOND; any 'BOND' visible in
 * the UI was therefore a phantom from the wrapper.
 *
 * Post-fix the grid must show the canonical leaf names — TBILL,
 * TREASURY_NOTE, TREASURY_BOND, TIPS, TREASURY_FRN (the on-the-run
 * cycle), plus the indexes / cash leaves that round through Security.
 */
import { test, expect } from '@playwright/test';

// Coarse override strings that should NEVER appear in the Product Type
// column post-fix (they are not in ProductTypeProto and the wire never
// carries them).
const FORBIDDEN_OVERRIDE_LABELS = ['BILL', 'NOTE', 'BOND'];

// Canonical leaf names we expect to see at least one of in a seeded
// dev DB — keep generous (any single one passes).
const EXPECTED_LEAF_RE = /^(TBILL|TREASURY_NOTE|TREASURY_BOND|TIPS|TREASURY_FRN|CASH|EQUITY|EQUITY_INDEX|BOND_INDEX|COMMODITY_INDEX|CPI_SERIES|UNKNOWN_PRODUCT_TYPE)$/;

test.describe('/data/securities Product Type column (#263 bug 3)', () => {
  test('Product Type cells never show the wrapper-override labels BILL/NOTE/BOND', async ({ page }) => {
    await page.goto('/data/securities');
    await expect(page.getByRole('heading', { name: /Security/ })).toBeVisible({ timeout: 15_000 });

    const dataRows = page.locator('table tbody tr.table-row');
    await expect(dataRows.first()).toBeVisible({ timeout: 15_000 });

    const headerLabels = await page.locator('thead th').allTextContents();
    const cleanLabels = headerLabels.map((s) => s.trim().replace(/[▲▼↕↑↓]\s*$/, '').trim());
    const productTypeColIndex = cleanLabels.findIndex((l) => l === 'Product Type');
    expect(productTypeColIndex, 'Product Type column present').toBeGreaterThanOrEqual(0);

    const count = await dataRows.count();
    expect(count, 'seed has at least one security').toBeGreaterThan(0);

    // Batched extract: pull every Product Type cell in one call. With
    // ~2.6k rows of seed data, per-row textContent overflows the
    // default 30s test timeout — this single CSS-driven evaluate stays
    // well under a second.
    const productTypeTexts: string[] = await page.$$eval(
      // nth-child is 1-indexed; productTypeColIndex is the position
      // of 'Product Type' in the full <thead><tr> (which includes
      // Actions at index 0). The <tbody><tr> has the same column
      // ordering, so add 1 to convert 0-based JS index to 1-based CSS.
      `table tbody tr.table-row td:nth-child(${productTypeColIndex + 1})`,
      (cells) => cells.map((c) => (c.textContent ?? '').trim()),
    );
    const productTypes = new Set(productTypeTexts.filter((t) => t && t !== '-'));

    for (const forbidden of FORBIDDEN_OVERRIDE_LABELS) {
      expect(
        productTypes.has(forbidden),
        `phantom override label '${forbidden}' must not appear post-fix`,
      ).toBe(false);
    }

    // At least one row's product type must be a canonical leaf — if
    // everything is a dash, something else is broken.
    const anyLeaf = [...productTypes].some((p) => EXPECTED_LEAF_RE.test(p));
    expect(anyLeaf, `at least one row has a canonical leaf product type (saw: ${[...productTypes].join(', ')})`).toBe(true);
  });
});
