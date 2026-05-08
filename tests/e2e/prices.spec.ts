/**
 * Reference Playwright test for /data/prices.
 *
 * Exercises the parts that the vitest "e2e" tests can't: the JS-driven
 * identifier-type dropdown, the autocomplete suggestion list, and the chart
 * re-rendering after a navigation. The vitest e2e covers the load() function
 * and the SSR HTML; this one covers what happens once the browser hydrates.
 *
 * Pattern for new browser tests: import { test, expect } from '@playwright/test',
 * write a test that authenticates implicitly via storageState (set in
 * playwright.config.ts), and use page.* APIs to drive the UI.
 */
import { test, expect } from '@playwright/test';

test.describe('/data/prices', () => {
  test('default landing renders the AAPL chart and price table', async ({ page }) => {
    await page.goto('/data/prices');

    // Default identifier is AAPL ticker (set in +page.server.ts after PR #110).
    await expect(page.getByRole('heading', { name: /Price History/i })).toBeVisible();
    await expect(page.locator('h3.chart-title')).toContainText('AAPL');

    // Chart is plotly-rendered; the container is populated client-side after
    // the dynamic import resolves. The svg.main-svg is plotly's root.
    await expect(page.locator('.price-chart svg.main-svg').first()).toBeVisible({ timeout: 15_000 });

    // Table renders the price rows. AAPL has 10k+ daily bars; just confirm
    // many are present rather than pinning an exact count (the upstream price
    // service can grow).
    const rowCount = await page.locator('table tbody tr').count();
    expect(rowCount).toBeGreaterThan(100);
  });

  test('switching the identifier-type dropdown clears the input', async ({ page }) => {
    await page.goto('/data/prices');

    // Universe is streamed; the {#await} block can transiently render two
    // matching inputs while the promise settles. Wait for the network to
    // go idle so we operate on a stable DOM.
    await page.waitForLoadState('networkidle');

    const input = page.locator('input.cusip-input');

    // Default landing is AAPL → input is pre-populated.
    await expect(input).toHaveValue('AAPL');

    // Switching to CUSIP fires handleTypeChange which clears the input
    // and updates the placeholder. The dropdown values are now proto names
    // (IdentifierTypeName) since Phase 2 of #226 moved the controls into
    // the IdentifierFilter primitive — the URL convention is still
    // ?type=cusip, but the form's internal state speaks proto names.
    await page.locator('select.type-select').selectOption('CUSIP');
    await expect(input).toHaveValue('');
    // Placeholder consolidated to the IdentifierFilter default ("e.g.
    // 912828ZT0") — the bare value, no "CUSIP" prefix. Use the example
    // CUSIP as a stable proxy for "the CUSIP placeholder is showing".
    await expect(input).toHaveAttribute('placeholder', /912828ZT0/);
  });

  test('autocomplete suggests TSLA and selecting it navigates to /data/prices?id=TSLA (#239)', async ({ page }) => {
    // What this test exercises: the autocomplete dropdown surfaces a
    // matching ticker and clicking the suggestion navigates to that
    // ticker's prices URL. Chart rendering is covered by the AAPL
    // default-landing test above; deliberately NOT re-asserted here
    // because price-history availability is a seed-data concern, not
    // something the autocomplete-and-navigate flow controls.
    //
    // Pre-#239 this test asserted h3.chart-title + svg.main-svg + 100+
    // table rows on TSLA. The seed (correctly) has no TSLA prices, so
    // the page shows the empty-state ("No price history found for
    // TSLA") and the chart selectors don't match. Test drift, not a
    // product bug — the user-facing flow works as intended.
    await page.goto('/data/prices');
    await page.waitForLoadState('networkidle');

    const input = page.locator('input.cusip-input');
    await expect(input).toBeEnabled({ timeout: 15_000 });

    // Type to surface the suggestion. The autocomplete prefix-matches on
    // identifier, so TSL → TSLA.
    await input.click();
    await input.fill('TSL');

    const suggestion = page.locator('ul.suggestions li').filter({ hasText: 'TSLA' }).first();
    await expect(suggestion, 'autocomplete surfaces TSLA').toBeVisible({ timeout: 10_000 });
    await suggestion.click();

    // The select navigates via window.location.href; assert the new URL.
    await page.waitForURL(/\/data\/prices\?type=ticker&id=TSLA/, { timeout: 10_000 });

    // After navigation: input reflects the picked ticker, page renders
    // TSLA in the security description (whether or not a price chart
    // accompanies it). These assertions prove the autocomplete →
    // navigation → SSR-hydration round-trip without coupling to
    // price-data availability for TSLA.
    await expect(input, 'input mirrors the picked ticker').toHaveValue('TSLA');
    await expect(
      page.locator('p.security-desc'),
      'security description renders TSLA',
    ).toContainText('TSLA');
  });
});
