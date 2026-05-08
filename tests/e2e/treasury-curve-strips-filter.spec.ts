/**
 * Regression for second-brain#232 — /data/treasury_curve's
 * on-the-run picker (selectOnTheRunBonds) used to admit zero-coupon
 * Treasury STRIPS, biasing the 30Y bucket. Fix at the picker (not
 * the calculator); see valuation-service PR #45 for the full
 * investigation. This spec asserts the rendered table no longer
 * shows zero-coupon rows for any actual bond pick.
 *
 * Assertion shape: every row that has a CUSIP must have a
 * non-zero coupon rate. The "no matching bond" placeholder rows
 * also render with couponRate=0 but have an empty CUSIP cell —
 * those are intentional and excluded from the assertion.
 */
import { test, expect } from '@playwright/test';

test.describe('/data/treasury_curve picker excludes STRIPS (#232)', () => {
  test('no row with a populated CUSIP has couponRate=0.000%', async ({ page }) => {
    await page.goto('/data/treasury_curve');

    // The page renders an h2 + a curve table. Wait for the table to
    // populate (or for the empty-state to render) before reading rows.
    await expect(page.locator('table tbody')).toBeVisible({ timeout: 15_000 });

    // Read every (cusip, coupon) pair from the rendered rows.
    const rows = await page.locator('table tbody tr').evaluateAll((trs) =>
      trs.map((tr) => {
        const cells = Array.from(tr.querySelectorAll('td'));
        // Column order from +page.svelte: Tenor, CUSIP, Description,
        // Issue Date, Maturity Date, Coupon Rate (%), Clean Price.
        return {
          tenor: cells[0]?.textContent?.trim() ?? '',
          cusip: cells[1]?.textContent?.trim() ?? '',
          coupon: cells[5]?.textContent?.trim() ?? '',
        };
      }),
    );

    // We need the page to have actually rendered something — bail if
    // the seed isn't available, instead of letting the assertion
    // pass vacuously.
    expect(rows.length, 'curve table populated').toBeGreaterThan(0);

    const populatedRows = rows.filter((r) => r.cusip && r.cusip !== '—');
    expect(populatedRows.length, 'at least one populated tenor row').toBeGreaterThan(0);

    for (const row of populatedRows) {
      // The picker excludes STRIPS (couponRate > 0); no populated row
      // should now render "0.000%".
      expect(
        row.coupon,
        `tenor=${row.tenor} cusip=${row.cusip} should not be zero-coupon (STRIPS)`,
      ).not.toBe('0.000%');
    }
  });
});
