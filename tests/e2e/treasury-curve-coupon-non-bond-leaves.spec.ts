/**
 * Regression for M6 #263 BUG 3 second-round: /data/treasury_curve renders
 * coupon=0% on every TREASURY_BOND on-the-run (typical: the 20Y bucket)
 * because `Security.create()` returns a plain Security wrapper for
 * leaves the BondSecurity factory case statement doesn't cover —
 * TREASURY_BOND, TBILL, STRIPS, SOVEREIGN_BOND — and the picker calls
 * `(security as BondSecurity).getCouponRate()` which throws on the
 * non-BondSecurity classes.
 *
 * After the fix, the 20Y row (TREASURY_BOND) must show a non-zero
 * coupon if the underlying wire data has one. Data-sourcing-dev's
 * #263 audit confirmed wire is populated (e.g. 912810UT3 = 4.625%).
 *
 * What this spec DOESN'T assert:
 *  - The specific coupon value (varies with the on-the-run cycle).
 *  - The 1M/3M/6M T-Bill rows showing 0% — TBills ARE zero-coupon by
 *    definition, so the displayed "0.000%" is correct on those.
 *  - TREASURY_FRN coupon: FRN coupons reset on a schedule; the wire
 *    value may legitimately be 0 between resets. Out of scope for
 *    this regression.
 *
 * If for the current cycle the 20Y bucket happens to be a TIPS or
 * TREASURY_NOTE (still wrapped as BondSecurity, so unaffected by this
 * bug), the spec falls through — it only asserts on rows whose
 * productType is in the previously-broken set.
 */
import { test, expect } from '@playwright/test';

const NON_BONDSECURITY_LEAVES = new Set(['TREASURY_BOND', 'STRIPS', 'SOVEREIGN_BOND']);

test.describe('/data/treasury_curve — coupon read for non-BondSecurity leaves (#263 bug 3 round 2)', () => {
  test('TREASURY_BOND / STRIPS / SOVEREIGN_BOND rows render their wire coupon, not 0%', async ({ page }) => {
    await page.goto('/data/treasury_curve');
    await expect(page.locator('table tbody')).toBeVisible({ timeout: 15_000 });

    type Row = { tenor: string; cusip: string; description: string; coupon: string };
    const rows: Row[] = await page.locator('table tbody tr').evaluateAll((trs) =>
      trs.map((tr) => {
        const c = Array.from(tr.querySelectorAll('td'));
        return {
          tenor:       c[0]?.textContent?.trim() ?? '',
          cusip:       c[1]?.textContent?.trim() ?? '',
          description: c[2]?.textContent?.trim() ?? '',
          coupon:      c[5]?.textContent?.trim() ?? '',
        };
      }),
    );

    // Only assert on rows whose product-type leaf would have been broken
    // by the BondSecurity-factory gap. Description format is e.g.
    // "TREASURY_BOND 4.625% 2046-02-15".
    const subject = rows.filter((r) =>
      [...NON_BONDSECURITY_LEAVES].some((leaf) => r.description.startsWith(leaf + ' ')),
    );

    test.skip(subject.length === 0, 'no TREASURY_BOND / STRIPS / SOVEREIGN_BOND row in the current on-the-run pick — nothing to assert');

    for (const r of subject) {
      // The bug surfaced as exactly the string "0.000%". We assert it isn't
      // that anymore for rows that should carry a wire coupon.
      const couponNum = parseFloat(r.coupon.replace('%', ''));
      expect(
        couponNum,
        `${r.cusip} (${r.tenor}, ${r.description.split(' ')[0]}) should have a wire coupon — saw "${r.coupon}"`,
      ).toBeGreaterThan(0);
    }
  });
});
