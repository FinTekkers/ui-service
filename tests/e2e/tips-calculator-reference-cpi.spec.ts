/**
 * E2E regression for M6 #263 BUG 2: TIPS pricer ignored Reference CPI in
 * CUSIP mode. Two cooperating bugs (one in TipsCalculator.svelte, one in
 * RunTipsValuation in $lib/valuation.ts) — fixed in the same PR.
 *
 * This spec verifies the browser-visible behavior: a user in CUSIP mode
 * who types a Reference CPI value, clicks Calculate, lands on a URL that
 * carries `referenceCpi=…`. Doesn't bind on a valuation numeric — that's
 * covered by the vitest unit `tips-reference-cpi-override.test.ts`.
 */
import { test, expect } from '@playwright/test';

test.describe('/data/calculators TIPS pricer — referenceCpi flows in CUSIP mode (#263 bug 2)', () => {
  test('typing Reference CPI in CUSIP mode places it on the URL', async ({ page }) => {
    await page.goto('/data/calculators?tab=tips');
    await expect(page.getByRole('button', { name: 'CUSIP Lookup' }))
      .toBeVisible({ timeout: 15_000 });

    // The CUSIP input shows an autocomplete dropdown on input; fill the
    // CUSIP first, then dismiss the dropdown via Tab before touching other
    // fields so the popup doesn't intercept later interactions.
    await page.getByLabel('CUSIP').fill('912810RL4');
    await page.keyboard.press('Tab');
    await page.getByLabel('Current CPI').fill('350');
    await page.getByLabel(/Reference CPI/).fill('258.446');
    await page.getByLabel('Price (% of par)').fill('98');

    await page.getByRole('button', { name: /^Calculate$/i }).click();

    // Calculate sets window.location.href synchronously; the load() of the
    // destination page can be slow (live valuation backend), so we wait on
    // the URL string changing rather than networkidle.
    await page.waitForFunction(
      () => window.location.search.includes('referenceCpi=258.446'),
      undefined,
      { timeout: 30_000 },
    );

    expect(page.url(), 'CUSIP-mode submit must carry referenceCpi').toContain('referenceCpi=258.446');
    expect(page.url()).toContain('tipsMode=cusip');
    expect(page.url()).toContain('tipsCusip=912810RL4');
  });
});
