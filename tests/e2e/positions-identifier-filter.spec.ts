/**
 * Regression for second-brain#227 (PositionSelect → IdentifierFilter)
 * AND second-brain#226 phase 3 PR-A (PositionSelect → DateFilter).
 *
 * Four cases:
 *   1. CUSIP — ?identifier+identifierType=CUSIP loads into the form,
 *      Fetch round-trips the URL with portfolioId carried via inheritKeys
 *      (#220-style guard).
 *   2. EXCH_TICKER — same flow with identifierType=EXCH_TICKER.
 *   3. tradeDate + tradeDateOperator — both URL params load into
 *      DateFilter, Fetch round-trips both with portfolioId preserved.
 *   4. tradeDate alone (no operator) — the date populates the DateFilter
 *      input, the operator select stays empty (and disabled). Fetch
 *      doesn't crash; the half-applied filter guard in
 *      PositionSelect.fetchPositions drops both params on re-emit (a
 *      type-without-value or value-without-type filter is meaningless
 *      to the page-server). Documented behavior; not a UX regression
 *      for this PR.
 *
 * Pre-existing case removed: the "legacy ?cusip= bookmark migrates"
 * test covered the PR #134 deprecation shim that's been removed
 * post-#239 — see the chore: drop-deprecation-shims commit. The
 * "no legacy ?cusip= re-emitted" negative assertions on the canonical
 * cases are kept as harmless regression guards (still meaningful: the
 * form must not accidentally emit ?cusip= on its own).
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

const PROBE_CUSIP = 'ZZZZZZZZZ';
const PROBE_TICKER = 'ZZTOP';
const PROBE_TRADE_DATE = '2026-05-06';

// M5 / #260: pre-M5 this helper looked specifically for
// 'Federal Reserve SOMA Holdings' (the deterministic seed name).
// Clean-slate migration regenerated the seed; helper now picks the
// first portfolio in the table. These tests only need a valid
// portfolioId as scope context — they don't assert SOMA-specific
// behaviour.
async function resolvePortfolioId(page: Page): Promise<string> {
  await page.goto('/data/portfolios');
  await expect(page.getByRole('heading', { name: 'Portfolios' })).toBeVisible({ timeout: 15_000 });
  const firstRow = page.locator('table tbody tr').first();
  await expect(firstRow, 'at least one portfolio in seed').toBeVisible({ timeout: 10_000 });
  const link = firstRow.getByRole('link').filter({ hasNotText: /^(Txns|Delete)$/ }).first();
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

  test('tradeDate + tradeDateOperator round-trip through Fetch with portfolio scope', async ({ page }) => {
    const portfolioId = await resolvePortfolioId(page);

    await page.goto(
      `/data/positions?portfolioId=${portfolioId}` +
      `&tradeDate=${PROBE_TRADE_DATE}&tradeDateOperator=LESS_THAN_OR_EQUALS` +
      `&fields=SECURITY_DESCRIPTION&measures=DIRECTED_QUANTITY`,
    );

    // DateFilter loads both bound props from the URL via PositionSelect's
    // loadSelectedValues. The date input takes the date; the operator
    // select takes the operator and is enabled because the date is set.
    const dateInput = page.locator('#trade-date-input');
    await expect(dateInput).toBeVisible({ timeout: 10_000 });
    await expect(dateInput, 'tradeDate populates DateFilter input').toHaveValue(PROBE_TRADE_DATE);
    const opSelect = page.getByLabel('Date operator');
    await expect(opSelect, 'tradeDateOperator populates DateFilter select')
      .toHaveValue('LESS_THAN_OR_EQUALS');
    await expect(opSelect, 'operator select enabled when date is set').toBeEnabled();

    await page.getByRole('button', { name: 'Fetch' }).click();
    await page.waitForURL(/\/data\/positions\?.*tradeDate=/, { timeout: 10_000 });

    const params = new URL(page.url()).searchParams;
    expect(params.get('tradeDate'), 'tradeDate re-emitted').toBe(PROBE_TRADE_DATE);
    expect(params.get('tradeDateOperator'), 'tradeDateOperator re-emitted')
      .toBe('LESS_THAN_OR_EQUALS');
    expect(params.get('portfolioId'), '#220 guard: portfolioId preserved').toBe(portfolioId);
  });

  test('tradeDate alone (no operator) survives Fetch', async ({ page }) => {
    const portfolioId = await resolvePortfolioId(page);

    await page.goto(
      `/data/positions?portfolioId=${portfolioId}` +
      `&tradeDate=${PROBE_TRADE_DATE}` + // no &tradeDateOperator=
      `&fields=SECURITY_DESCRIPTION&measures=DIRECTED_QUANTITY`,
    );

    // Date populates; operator stays empty AND the select is enabled
    // because the date IS set (DateFilter only disables the select when
    // the date is empty).
    const dateInput = page.locator('#trade-date-input');
    await expect(dateInput).toBeVisible({ timeout: 10_000 });
    await expect(dateInput, 'tradeDate populates DateFilter input').toHaveValue(PROBE_TRADE_DATE);
    const opSelect = page.getByLabel('Date operator');
    await expect(opSelect, 'no operator in URL → select stays empty').toHaveValue('');

    // Fetch completes — half-applied filter guard in
    // PositionSelect.fetchPositions drops both tradeDate and
    // tradeDateOperator when only one is set (a type-without-value /
    // value-without-type filter is meaningless to the page-server).
    await page.getByRole('button', { name: 'Fetch' }).click();
    await page.waitForURL(/\/data\/positions/, { timeout: 10_000 });

    const params = new URL(page.url()).searchParams;
    expect(params.get('tradeDate'), 'half-applied filter dropped on re-emit').toBeNull();
    expect(params.get('tradeDateOperator'), 'no orphan operator emitted').toBeNull();
    expect(params.get('portfolioId'), '#220 guard: portfolioId preserved').toBe(portfolioId);
  });
});
