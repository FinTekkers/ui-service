/**
 * Phase 3 of second-brain#226 (PR-B): PortfolioFilter primitive on
 * /data/transactions, completing the rollout started in PR #146
 * (PR-A migrated /data/positions). Two cases mirror the
 * /data/positions e2e (tests/e2e/portfolio-filter.spec.ts):
 *
 *   1. Autocomplete: typing a portfolio-name prefix surfaces the
 *      matching suggestion; selecting it sets ?portfolioId=<uuid>
 *      on Filter.
 *
 *   2. Inbound URL hydration: loading /data/transactions?portfolioId=<uuid>
 *      populates the PortfolioFilter input with the resolved portfolio
 *      name.
 *
 * Hardening matches PR #147 (positions-side):
 *   - waitForLoadState('networkidle') before typing so the universe
 *     data has finished loading.
 *   - 10s timeout on the suggestion-visible assertion.
 *
 * M5 / #260: pre-M5 the seed was known to contain
 * 'Federal Reserve SOMA Holdings'. The clean-slate migration (#256)
 * regenerated the seed; the helper now picks the first portfolio in
 * the table rather than SOMA-specifically.
 */
import { test, expect, type Page } from '@playwright/test';

async function resolveFirstPortfolio(page: Page): Promise<{ id: string; name: string }> {
  await page.goto('/data/portfolios');
  await expect(page.getByRole('heading', { name: 'Portfolios' })).toBeVisible({ timeout: 15_000 });
  const firstRow = page.locator('table tbody tr').first();
  await expect(firstRow, 'at least one portfolio in seed').toBeVisible({ timeout: 10_000 });
  const link = firstRow.getByRole('link').filter({ hasNotText: /^(Txns|Delete)$/ }).first();
  const href = await link.getAttribute('href');
  expect(href).toMatch(/portfolioId=[0-9a-f-]{36}/);
  const name = (await link.textContent())?.trim() ?? '';
  expect(name.length, 'portfolio has a non-empty name').toBeGreaterThan(0);
  return {
    id: new URL(href!, page.url()).searchParams.get('portfolioId')!,
    name,
  };
}

test.describe('/data/transactions PortfolioFilter (#226 Phase 3 PR-B)', () => {
  test('typing a portfolio prefix surfaces the suggestion; selecting sets ?portfolioId on Filter', async ({ page }) => {
    const { id: expectedPortfolioId, name: portfolioName } = await resolveFirstPortfolio(page);
    const prefix = portfolioName.slice(0, Math.min(4, portfolioName.length));

    await page.goto('/data/transactions');
    const portfolioInput = page.locator('#transaction-portfolio-input');
    await expect(portfolioInput).toBeVisible({ timeout: 15_000 });
    await expect(portfolioInput, 'starts empty when URL has no portfolioId').toHaveValue('');
    await page.waitForLoadState('networkidle');

    await portfolioInput.click();
    await portfolioInput.fill(prefix);

    // .first() — seed may have duplicate-named portfolios from
    // accumulated test runs; clicking any matching suggestion is
    // sufficient to prove the autocomplete-and-emit path.
    const suggestion = page.locator('.suggestion', { hasText: portfolioName }).first();
    await expect(suggestion, 'autocomplete surfaces the first portfolio').toBeVisible({ timeout: 10_000 });

    await suggestion.click();
    await expect(portfolioInput).toHaveValue(portfolioName);

    await page.getByRole('button', { name: /^Filter$/ }).click();
    await page.waitForURL(/\/data\/transactions\?.*portfolioId=/, { timeout: 10_000 });

    const params = new URL(page.url()).searchParams;
    expect(params.get('portfolioId'), 'portfolioId emitted from selection')
      .toBe(expectedPortfolioId);
  });

  test('?portfolioId=<uuid> hydrates the input with the resolved name', async ({ page }) => {
    const { id: portfolioId, name: portfolioName } = await resolveFirstPortfolio(page);

    await page.goto(`/data/transactions?portfolioId=${portfolioId}`);

    const portfolioInput = page.locator('#transaction-portfolio-input');
    await expect(portfolioInput, 'page-server resolves UUID → portfolio name')
      .toHaveValue(portfolioName, { timeout: 15_000 });

    await page.getByRole('button', { name: /^Filter$/ }).click();
    await page.waitForURL(/\/data\/transactions\?.*portfolioId=/, { timeout: 10_000 });
    const params = new URL(page.url()).searchParams;
    expect(params.get('portfolioId'), 'form re-emits the inbound portfolioId')
      .toBe(portfolioId);
  });
});
