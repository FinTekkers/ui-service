/**
 * Phase 3 of second-brain#226 (PR-B): PortfolioFilter primitive on
 * /data/transactions, completing the rollout started in PR #146
 * (PR-A migrated /data/positions). Two cases mirror the
 * /data/positions e2e (tests/e2e/portfolio-filter.spec.ts):
 *
 *   1. Autocomplete: typing 'Federal' surfaces the SOMA suggestion;
 *      selecting it sets ?portfolioId=<uuid> on Filter.
 *
 *   2. Inbound URL hydration: loading /data/transactions?portfolioId=<uuid>
 *      populates the PortfolioFilter input with the resolved portfolio
 *      name (Federal Reserve SOMA Holdings, not the raw UUID).
 *
 * Hardening matches PR #147 (positions-side):
 *   - waitForLoadState('networkidle') before typing so the universe
 *     data has finished loading.
 *   - 10s timeout on the suggestion-visible assertion.
 *
 * Assumes the SOMA seed is loaded — same dependency as the existing
 * portfolio-soma-transactions / portfolio-soma-positions specs.
 */
import { test, expect, type Page } from '@playwright/test';

const SOMA_NAME = 'Federal Reserve SOMA Holdings';

async function resolveSomaPortfolioId(page: Page): Promise<string> {
  await page.goto('/data/portfolios');
  const link = page.getByRole('link', { name: SOMA_NAME });
  const href = await link.getAttribute('href');
  expect(href).toMatch(/portfolioId=[0-9a-f-]{36}/);
  return new URL(href!, page.url()).searchParams.get('portfolioId')!;
}

test.describe('/data/transactions PortfolioFilter (#226 Phase 3 PR-B)', () => {
  test('typing "Federal" suggests SOMA; selecting sets ?portfolioId on Filter', async ({ page }) => {
    const expectedPortfolioId = await resolveSomaPortfolioId(page);

    await page.goto('/data/transactions');
    const portfolioInput = page.locator('#transaction-portfolio-input');
    await expect(portfolioInput).toBeVisible({ timeout: 15_000 });
    await expect(portfolioInput, 'starts empty when URL has no portfolioId').toHaveValue('');
    // Wait for universe data to land before typing — the universe is
    // a page-server prop and a fast `.fill()` against an empty list
    // produces zero suggestions. Same hardening shipped in PR #147
    // for the positions-side test.
    await page.waitForLoadState('networkidle');

    await portfolioInput.click();
    await portfolioInput.fill('Federal');

    const suggestion = page.locator('.suggestion', { hasText: SOMA_NAME });
    await expect(suggestion, 'autocomplete surfaces SOMA').toBeVisible({ timeout: 10_000 });

    await suggestion.click();
    await expect(portfolioInput).toHaveValue(SOMA_NAME);

    // Click Filter — URL re-emits with portfolioId set to SOMA.
    await page.getByRole('button', { name: /^Filter$/ }).click();
    await page.waitForURL(/\/data\/transactions\?.*portfolioId=/, { timeout: 10_000 });

    const params = new URL(page.url()).searchParams;
    expect(params.get('portfolioId'), 'portfolioId emitted from selection')
      .toBe(expectedPortfolioId);
  });

  test('?portfolioId=<uuid> hydrates the input with the resolved name', async ({ page }) => {
    const portfolioId = await resolveSomaPortfolioId(page);

    await page.goto(`/data/transactions?portfolioId=${portfolioId}`);

    const portfolioInput = page.locator('#transaction-portfolio-input');
    await expect(portfolioInput, 'page-server resolves UUID → portfolio name')
      .toHaveValue(SOMA_NAME, { timeout: 15_000 });

    // Round-trip through Filter — the form is now authoritative for
    // portfolioId (no inheritKeys). Should re-emit the same UUID.
    await page.getByRole('button', { name: /^Filter$/ }).click();
    await page.waitForURL(/\/data\/transactions\?.*portfolioId=/, { timeout: 10_000 });
    const params = new URL(page.url()).searchParams;
    expect(params.get('portfolioId'), 'form re-emits the inbound portfolioId')
      .toBe(portfolioId);
  });
});
