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

const SOMA_NAME = 'Federal Reserve SOMA Holdings';

async function resolveSomaPortfolioId(page: Page): Promise<string> {
  await page.goto('/data/portfolios');
  const link = page.getByRole('link', { name: SOMA_NAME });
  const href = await link.getAttribute('href');
  expect(href).toMatch(/portfolioId=[0-9a-f-]{36}/);
  return new URL(href!, page.url()).searchParams.get('portfolioId')!;
}

test.describe('/data/positions PortfolioFilter (#226 Phase 3 PR-A)', () => {
  test('typing "Federal" suggests SOMA; selecting sets ?portfolioId on Fetch', async ({ page }) => {
    const expectedPortfolioId = await resolveSomaPortfolioId(page);

    // Land on /data/positions WITHOUT a portfolioId AND without
    // fields/measures so the page-server early-returns `positions: []`
    // (avoids the unscoped FetchPosition path, which can be slow on
    // the full SOMA seed). The form still renders, the universe is
    // still loaded, and we exercise the autocomplete + URL emission
    // — which is all this test cares about.
    await page.goto('/data/positions');
    const portfolioInput = page.locator('#position-portfolio-input');
    await expect(portfolioInput).toBeVisible({ timeout: 15_000 });
    await expect(portfolioInput, 'starts empty when URL has no portfolioId').toHaveValue('');

    // Fill 'Federal' — fires a single input event after Playwright sets
    // the value. The primitive's onInput handler runs and (after the
    // 250ms debounce) opens the suggestion list. .type() with per-char
    // delays was flaky here; .fill() is the same UX outcome (typed
    // text + onInput fired) without the multi-event timing surface.
    await portfolioInput.click();
    await portfolioInput.fill('Federal');

    const suggestion = page.locator('.suggestion', { hasText: SOMA_NAME });
    await expect(suggestion, 'autocomplete surfaces SOMA').toBeVisible({ timeout: 5_000 });

    // Click the suggestion (use mousedown via .click — Playwright
    // dispatches mousedown before click, which is what the primitive
    // listens to).
    await suggestion.click();
    await expect(portfolioInput).toHaveValue(SOMA_NAME);

    // Click Fetch — URL re-emits with portfolioId set to the SOMA UUID.
    await page.getByRole('button', { name: 'Fetch position' }).click();
    await page.waitForURL(/\/data\/positions\?.*portfolioId=/, { timeout: 10_000 });

    const params = new URL(page.url()).searchParams;
    expect(params.get('portfolioId'), 'portfolioId emitted from selection')
      .toBe(expectedPortfolioId);
  });

  test('?portfolioId=<uuid> hydrates the input with the resolved name', async ({ page }) => {
    const portfolioId = await resolveSomaPortfolioId(page);

    await page.goto(
      `/data/positions?portfolioId=${portfolioId}` +
      '&fields=SECURITY_DESCRIPTION&measures=DIRECTED_QUANTITY' +
      '&positionView=DEFAULT_VIEW&positionType=TRANSACTION',
    );

    const portfolioInput = page.locator('#position-portfolio-input');
    await expect(portfolioInput, 'page-server resolves UUID → portfolio name')
      .toHaveValue(SOMA_NAME, { timeout: 15_000 });

    // Round-trip through Fetch — the form is now authoritative for
    // portfolioId (no inheritKeys). Should re-emit the same UUID.
    await page.getByRole('button', { name: 'Fetch position' }).click();
    await page.waitForURL(/\/data\/positions\?.*portfolioId=/, { timeout: 10_000 });
    const params = new URL(page.url()).searchParams;
    expect(params.get('portfolioId'), 'form re-emits the inbound portfolioId')
      .toBe(portfolioId);
  });
});
