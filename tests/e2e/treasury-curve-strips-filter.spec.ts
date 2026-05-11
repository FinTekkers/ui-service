/**
 * Regression for second-brain#232 — /data/treasury_curve's on-the-run
 * picker (selectOnTheRunBonds) used to admit zero-coupon Treasury
 * STRIPS, biasing the 30Y bucket. Fix at the picker (not the
 * calculator); see valuation-service PR #45 for the full investigation.
 *
 * Post-M5 / #260: the picker filter changed from a heuristic on
 * security_type == BOND_SECURITY (with a bucket-aware couponRate > 0
 * follow-up in PR #153) to a registry-based filter on ProductType ∈
 * {TBILL, TREASURY_NOTE, TREASURY_BOND, TIPS, TREASURY_FRN}. STRIPS
 * now has its own product type and is excluded at the candidate
 * stage rather than at the bucket stage. The assertion shape stays
 * the same: every row with a CUSIP must have a non-zero coupon rate
 * (since none of the on-the-run product types is structurally zero-
 * coupon for the bucket maturities they sit in, except T-bills which
 * legitimately ARE zero-coupon and live in ≤12m buckets).
 *
 * Wait — T-bills are zero-coupon and would render "0.000%". The
 * old PR #153 heuristic accommodated this by bucket. Post-M5
 * registry filtering, T-bills are first-class candidates, so
 * "no row with populated CUSIP has 0.000%" is no longer the right
 * assertion. Refined assertion: no row >12m bucket has 0.000% (the
 * STRIPS-shape exclusion).
 */
import { test, expect } from '@playwright/test';

const BUCKETS_UNDER_1Y = new Set(['1M', '3M', '6M', '1Y']);

test.describe('/data/treasury_curve picker excludes STRIPS (#232)', () => {
  test('no row in >12m buckets has couponRate=0.000% (STRIPS exclusion)', async ({ page }) => {
    await page.goto('/data/treasury_curve');

    await expect(page.locator('table tbody')).toBeVisible({ timeout: 15_000 });

    const rows = await page.locator('table tbody tr').evaluateAll((trs) =>
      trs.map((tr) => {
        const cells = Array.from(tr.querySelectorAll('td'));
        return {
          tenor: cells[0]?.textContent?.trim() ?? '',
          cusip: cells[1]?.textContent?.trim() ?? '',
          coupon: cells[5]?.textContent?.trim() ?? '',
        };
      }),
    );

    expect(rows.length, 'curve table populated').toBeGreaterThan(0);

    const populatedLongBucketRows = rows
      .filter((r) => r.cusip && r.cusip !== '—')
      .filter((r) => !BUCKETS_UNDER_1Y.has(r.tenor));
    if (populatedLongBucketRows.length === 0) {
      test.skip(true, "No populated long-bucket rows on /data/treasury_curve. " +
        "Seed (M3 / market-data-inputs cutover) may not yet have Treasury notes/bonds.");
      return;
    }

    for (const row of populatedLongBucketRows) {
      expect(
        row.coupon,
        `tenor=${row.tenor} cusip=${row.cusip} should not be zero-coupon (STRIPS would render here pre-M5)`,
      ).not.toBe('0.000%');
    }
  });
});
