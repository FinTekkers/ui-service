/**
 * Regression for second-brain#227 (PositionSelect → IdentifierFilter).
 *
 * Three cases — explicit per-type coverage:
 *   1. CUSIP — ?identifier+identifierType=CUSIP loads into the form,
 *      Fetch round-trips the URL with portfolioId carried via inheritKeys
 *      (#220-style guard).
 *   2. EXCH_TICKER — same flow with identifierType=EXCH_TICKER.
 *   3. Legacy ?cusip=… bookmark loads into the IdentifierFilter input
 *      and re-emits as canonical (?identifier+identifierType=CUSIP) on
 *      next Fetch, with no ?cusip= residue.
 *
 * Why URL-load instead of dropdown-then-fill: testing via the dropdown
 * triggers IdentifierFilter's clearOnTypeChange handler, whose bind
 * propagation up through the component boundary races with subsequent
 * DOM operations under Playwright. The load-and-emit form covers the
 * acceptance criterion ("identifier-type-aware filter survives Fetch")
 * without that flakiness, and exercises the same code paths a real user
 * hits when they bookmark or share a positions URL.
 *
 * Identifier values are deliberately unlikely-to-match probes — this
 * spec asserts URL shape, not row contents.
 */
import { test, expect, type Page } from '@playwright/test';

const SOMA_PORTFOLIO_NAME = 'Federal Reserve SOMA Holdings';
const PROBE_CUSIP = 'ZZZZZZZZZ';
const PROBE_TICKER = 'ZZTOP';

async function resolvePortfolioId(page: Page): Promise<string> {
  await page.goto('/data/portfolios');
  const link = page.getByRole('link', { name: SOMA_PORTFOLIO_NAME });
  const href = await link.getAttribute('href');
  expect(href).toMatch(/portfolioId=[0-9a-f-]{36}/);
  return new URL(href!, page.url()).searchParams.get('portfolioId')!;
}

test.describe('/data/positions IdentifierFilter (#227)', () => {
  test('CUSIP filter survives Fetch with portfolio scope', async ({ page }) => {
    const portfolioId = await resolvePortfolioId(page);

    await page.goto(
      `/data/positions?portfolioId=${portfolioId}` +
      `&identifier=${PROBE_CUSIP}&identifierType=CUSIP` +
      `&fields=SECURITY_DESCRIPTION&measures=DIRECTED_QUANTITY`,
    );
    const idInput = page.locator('#position-identifier-input');
    await expect(idInput).toBeVisible({ timeout: 10_000 });
    await expect(idInput, 'CUSIP value loaded from URL').toHaveValue(PROBE_CUSIP);
    await expect(page.getByLabel('Identifier type'), 'CUSIP type loaded from URL').toHaveValue('CUSIP');

    await page.getByRole('button', { name: 'Fetch' }).click();
    await page.waitForURL(/\/data\/positions\?.*identifier=/, { timeout: 10_000 });

    const params = new URL(page.url()).searchParams;
    expect(params.get('identifier'), 'identifier value').toBe(PROBE_CUSIP);
    expect(params.get('identifierType'), 'identifierType pinned to CUSIP').toBe('CUSIP');
    expect(params.get('cusip'), 'no legacy ?cusip= re-emitted').toBeNull();
    expect(params.get('portfolioId'), '#220 guard: portfolioId preserved').toBe(portfolioId);
  });

  test('EXCH_TICKER (Ticker) filter survives Fetch with portfolio scope', async ({ page }) => {
    const portfolioId = await resolvePortfolioId(page);

    await page.goto(
      `/data/positions?portfolioId=${portfolioId}` +
      `&identifier=${PROBE_TICKER}&identifierType=EXCH_TICKER` +
      `&fields=SECURITY_DESCRIPTION&measures=DIRECTED_QUANTITY`,
    );
    const idInput = page.locator('#position-identifier-input');
    await expect(idInput).toBeVisible({ timeout: 10_000 });
    await expect(idInput, 'ticker value loaded from URL').toHaveValue(PROBE_TICKER);
    await expect(page.getByLabel('Identifier type'), 'EXCH_TICKER type loaded from URL').toHaveValue('EXCH_TICKER');

    await page.getByRole('button', { name: 'Fetch' }).click();
    await page.waitForURL(/\/data\/positions\?.*identifier=/, { timeout: 10_000 });

    const params = new URL(page.url()).searchParams;
    expect(params.get('identifier'), 'identifier value').toBe(PROBE_TICKER);
    expect(params.get('identifierType'), 'identifierType pinned to EXCH_TICKER').toBe('EXCH_TICKER');
    expect(params.get('cusip'), 'no legacy ?cusip= re-emitted').toBeNull();
    expect(params.get('portfolioId'), '#220 guard: portfolioId preserved').toBe(portfolioId);
  });

  test('legacy ?cusip= bookmark migrates to canonical shape on Fetch', async ({ page }) => {
    const portfolioId = await resolvePortfolioId(page);

    await page.goto(
      `/data/positions?portfolioId=${portfolioId}` +
      `&cusip=${PROBE_CUSIP}` +
      `&fields=SECURITY_DESCRIPTION&measures=DIRECTED_QUANTITY`,
    );
    const idInput = page.locator('#position-identifier-input');
    await expect(idInput).toBeVisible({ timeout: 10_000 });
    await expect(idInput, 'legacy cusip value populates IdentifierFilter input').toHaveValue(PROBE_CUSIP);
    await expect(page.getByLabel('Identifier type'), 'legacy entry pins type=CUSIP').toHaveValue('CUSIP');

    await page.getByRole('button', { name: 'Fetch' }).click();
    await page.waitForURL(/\/data\/positions\?.*identifier=/, { timeout: 10_000 });

    const params = new URL(page.url()).searchParams;
    expect(params.get('identifier')).toBe(PROBE_CUSIP);
    expect(params.get('identifierType'), 'legacy entry re-emits with type=CUSIP').toBe('CUSIP');
    expect(params.get('cusip'), 'legacy ?cusip= must be gone after re-emission').toBeNull();
    expect(params.get('portfolioId')).toBe(portfolioId);
  });
});
