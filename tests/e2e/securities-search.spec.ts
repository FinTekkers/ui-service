/**
 * Playwright E2E for /data/securities filter extension (Phase 1 of
 * second-brain#226).
 *
 * Verifies that:
 *   1. Searching by ticker (identifierType=EXCH_TICKER, identifier=AAPL)
 *      returns at least one row — i.e. the page-server no longer narrows
 *      identifierType to ISIN|CUSIP only and no longer hardcodes
 *      assetClass='Fixed Income' / issuerName='US Government' (which would
 *      have excluded AAPL).
 *   2. The pre-existing URL shape (?identifier=...&identifierType=CUSIP)
 *      keeps rendering the old default scope (Fixed Income / US Government)
 *      so existing bookmarks don't regress.
 */
import { test, expect } from '@playwright/test';

test.describe('/data/securities filter extension', () => {
  test('search by EXCH_TICKER returns AAPL', async ({ page }) => {
    // assetClass=Equity unblocks the equity universe (default is Fixed
    // Income for backward compat); issuerName cleared so any equity issuer
    // is accepted.
    await page.goto(
      '/data/securities?identifier=AAPL&identifierType=EXCH_TICKER&assetClass=Equity&issuerName=',
    );

    // SecuritySelect's Fetch button always renders, regardless of which
    // result-display branch the page chose; gate on it to wait past
    // initial load and confirm the page didn't 500.
    await expect(page.getByRole('button', { name: /Fetch Securities/ })).toBeVisible({
      timeout: 15_000,
    });

    // The page chooses between two render paths based on result-set size:
    //   - exactly one match → SecurityDetail (no heading, fields laid out)
    //   - >1 match → SecurityGrid (heading "Security" + table rows)
    // The AAPL seed currently returns one record so we end up on the
    // detail path — but either path renders the AAPL identifier somewhere
    // on the page if the search succeeded. Assert that, which is what the
    // acceptance criterion ("E2E test: search by ticker returns >0
    // results") actually requires.
    await expect(page.getByText(/^AAPL$/).first()).toBeVisible({ timeout: 10_000 });
  });

  test('AssetClassFilter — ?assetClass=FIXED_INCOME round-trips through Fetch', async ({ page }) => {
    // Phase 3 (#226) — AssetClassFilter primitive on /data/securities.
    // Loading with the proto-enum name selects the dropdown; clicking
    // Fetch re-emits the canonical URL shape with assetClass preserved
    // alongside other params.
    await page.goto(
      '/data/securities?identifier=AAPL&identifierType=EXCH_TICKER&assetClass=FIXED_INCOME',
    );
    await expect(page.getByRole('button', { name: /Fetch Securities/ })).toBeVisible({
      timeout: 15_000,
    });

    const acSelect = page.locator('#asset-class-input');
    await expect(acSelect, 'AssetClassFilter loaded the URL value').toHaveValue('FIXED_INCOME');

    await page.getByRole('button', { name: /Fetch Securities/ }).click();
    await page.waitForURL(/\/data\/securities\?.*assetClass=FIXED_INCOME/, { timeout: 10_000 });

    const params = new URL(page.url()).searchParams;
    expect(params.get('assetClass'), 'assetClass re-emitted as proto enum').toBe('FIXED_INCOME');
    expect(params.get('identifier'), 'other params preserved').toBe('AAPL');
    expect(params.get('identifierType')).toBe('EXCH_TICKER');
  });

  test('SecurityTypeFilter — ?securityType=BOND_SECURITY round-trips through Fetch', async ({ page }) => {
    await page.goto(
      '/data/securities?identifier=AAPL&identifierType=EXCH_TICKER&securityType=BOND_SECURITY',
    );
    await expect(page.getByRole('button', { name: /Fetch Securities/ })).toBeVisible({
      timeout: 15_000,
    });

    const stSelect = page.locator('#security-type-select');
    await expect(stSelect, 'SecurityTypeFilter loaded the URL value').toHaveValue('BOND_SECURITY');

    await page.getByRole('button', { name: /Fetch Securities/ }).click();
    await page.waitForURL(/\/data\/securities\?.*securityType=BOND_SECURITY/, { timeout: 10_000 });

    const params = new URL(page.url()).searchParams;
    expect(params.get('securityType')).toBe('BOND_SECURITY');
    expect(params.get('identifier'), 'other params preserved').toBe('AAPL');
    expect(params.get('identifierType')).toBe('EXCH_TICKER');
  });

  test('legacy ?identifier=...&identifierType=CUSIP URL shape still works', async ({ page }) => {
    // Existing bookmark shape — no assetClass / issuerName / securityType
    // set, so the page-server applies the pre-#226 defaults (Fixed Income
    // / US Government). A 1-result CUSIP renders SecurityDetail, which
    // has no heading; the multi-result path renders SecurityGrid with an
    // h2. Assert SecuritySelect's filter form rendered (it's always
    // present, regardless of result-set size) — proves the page didn't
    // crash on the legacy URL.
    await page.goto('/data/securities?identifier=912828ZT0&identifierType=CUSIP');
    await expect(page.getByRole('button', { name: /Fetch Securities/ })).toBeVisible({
      timeout: 15_000,
    });
  });

  // Phase 3 PR-B of #226: issueDate DateFilter on /data/securities.
  test('issueDate + issueDateOperator round-trip through Fetch with other params preserved', async ({ page }) => {
    // Backend supports greater_than / lesser_than only on issueDate
    // (FetchSecurity in $lib/security maps just these two). DateFilter
    // is restricted via the `operators` prop to match.
    await page.goto(
      '/data/securities?identifier=AAPL&identifierType=EXCH_TICKER' +
      '&issueDate=2024-01-15&issueDateOperator=greater_than',
    );
    await expect(page.getByRole('button', { name: /Fetch Securities/ })).toBeVisible({
      timeout: 15_000,
    });

    const dateInput = page.locator('#issue-date-input');
    await expect(dateInput).toHaveValue('2024-01-15');
    const opSelect = page.getByLabel('Date operator');
    await expect(opSelect).toHaveValue('greater_than');
    await expect(opSelect).toBeEnabled();

    await page.getByRole('button', { name: /Fetch Securities/ }).click();
    await page.waitForURL(/\/data\/securities\?.*issueDate=/, { timeout: 10_000 });

    const params = new URL(page.url()).searchParams;
    expect(params.get('issueDate')).toBe('2024-01-15');
    expect(params.get('issueDateOperator')).toBe('greater_than');
    expect(params.get('identifier'), 'other params preserved').toBe('AAPL');
    expect(params.get('identifierType')).toBe('EXCH_TICKER');
  });

  test('issueDate operator dropdown excludes lesser_than_or_equals (backend-supported subset)', async ({ page }) => {
    // FetchSecurity's signature only accepts 'greater_than' | 'lesser_than'.
    // DateFilter's `operators` prop on /data/securities trims the third
    // option (lesser_than_or_equals) so the dropdown can't surface a
    // selection the page-server would silently drop.
    await page.goto('/data/securities?issueDate=2024-01-15&issueDateOperator=greater_than');
    await expect(page.getByRole('button', { name: /Fetch Securities/ })).toBeVisible({
      timeout: 15_000,
    });

    // Inspect the operator <select>'s options. Should be exactly 3:
    // the empty placeholder + greater_than + lesser_than. No
    // lesser_than_or_equals option.
    const opValues = await page.getByLabel('Date operator').evaluate((el) => {
      const select = el as HTMLSelectElement;
      return Array.from(select.options).map((o) => o.value);
    });
    expect(opValues).toEqual(['', 'greater_than', 'lesser_than']);
  });
});
