/**
 * Phase 3 of second-brain#226 (PR-A): PortfolioFilter primitive on
 * /data/positions. Two cases:
 *
 *   1. Autocomplete: typing 'Federal' surfaces the SOMA suggestion, and
 *      selecting it sets ?portfolioId=<uuid> on Fetch.
 *
 *   2. Inbound URL hydration: loading /data/positions?portfolioId=<uuid>
 *      populates the PortfolioFilter input with the resolved portfolio
 *      name (so the user sees 'Federal Reserve SOMA Holdings', not just
 *      the UUID).
 *
 * Assumes the SOMA seed is loaded — same dependency as the existing
 * portfolio-soma-positions / portfolio-soma-transactions specs.
 */
import { test, expect, type Page } from '@playwright/test';

/**
 * Resolve a portfolio for autocomplete testing. Pre-M5 the seed was
 * known to contain a 'Federal Reserve SOMA Holdings' entry; the M5
 * clean-slate migration (#256) regenerated the seed with whatever
 * test-runs accumulate, so the helper now picks the first portfolio
 * in the table rather than SOMA-specifically. Returns {id, name} so
 * tests can match the autocomplete suggestion against the actual
 * name. Skip-with-warn if /data/portfolios is empty entirely (which
 * shouldn't happen on a healthy backend but is worth surfacing).
 */
async function resolveFirstPortfolio(page: Page): Promise<{ id: string; name: string }> {
  await page.goto('/data/portfolios');
  // Wait for the table to render before reading rows — page-server
  // streams the search response.
  await expect(page.getByRole('heading', { name: 'Portfolios' })).toBeVisible({ timeout: 15_000 });
  const firstRow = page.locator('table tbody tr').first();
  await expect(firstRow, 'at least one portfolio in seed').toBeVisible({ timeout: 10_000 });
  // The Portfolio-column link carries the portfolioId and the row
  // text contains the portfolio name. Pull both off the row.
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

test.describe('/data/positions PortfolioFilter (#226 Phase 3 PR-A)', () => {
  test('typing the first portfolio prefix surfaces the autocomplete suggestion; selecting sets ?portfolioId on Fetch', async ({ page }) => {
    const { id: expectedPortfolioId, name: portfolioName } = await resolveFirstPortfolio(page);
    // M5 / #260: pre-M5 the seed deterministically contained
    // 'Federal Reserve SOMA Holdings'. M2's clean-slate migration
    // wiped + regenerated; we now type a prefix of whatever the
    // first portfolio name is.
    const prefix = portfolioName.slice(0, Math.min(4, portfolioName.length));

    await page.goto('/data/positions');
    const portfolioInput = page.locator('#position-portfolio-input');
    await expect(portfolioInput).toBeVisible({ timeout: 15_000 });
    await expect(portfolioInput, 'starts empty when URL has no portfolioId').toHaveValue('');
    await page.waitForLoadState('networkidle');

    await portfolioInput.click();
    await portfolioInput.fill(prefix);

    const suggestion = page.locator('.suggestion', { hasText: portfolioName });
    await expect(suggestion, 'autocomplete surfaces the first portfolio').toBeVisible({ timeout: 10_000 });

    await suggestion.click();
    await expect(portfolioInput).toHaveValue(portfolioName);

    await page.getByRole('button', { name: 'Fetch position' }).click();
    await page.waitForURL(/\/data\/positions\?.*portfolioId=/, { timeout: 10_000 });

    const params = new URL(page.url()).searchParams;
    expect(params.get('portfolioId'), 'portfolioId emitted from selection')
      .toBe(expectedPortfolioId);
  });

  test('?portfolioId=<uuid> hydrates the input with the resolved name', async ({ page }) => {
    const { id: portfolioId, name: portfolioName } = await resolveFirstPortfolio(page);

    await page.goto(
      `/data/positions?portfolioId=${portfolioId}` +
      '&fields=SECURITY_DESCRIPTION&measures=DIRECTED_QUANTITY' +
      '&positionView=DEFAULT_VIEW&positionType=TRANSACTION',
    );

    const portfolioInput = page.locator('#position-portfolio-input');
    await expect(portfolioInput, 'page-server resolves UUID → portfolio name')
      .toHaveValue(portfolioName, { timeout: 15_000 });

    // Round-trip through Fetch — the form is now authoritative for
    // portfolioId (no inheritKeys). Should re-emit the same UUID.
    await page.getByRole('button', { name: 'Fetch position' }).click();
    await page.waitForURL(/\/data\/positions\?.*portfolioId=/, { timeout: 10_000 });
    const params = new URL(page.url()).searchParams;
    expect(params.get('portfolioId'), 'form re-emits the inbound portfolioId')
      .toBe(portfolioId);
  });
});
