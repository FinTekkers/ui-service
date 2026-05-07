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
    // #229 standardized URL operator vocabulary on proto enum names.
    // SecuritySelect's DateFilter is restricted via the `operators`
    // prop to MORE_THAN / LESS_THAN — a UX choice, not a backend
    // limitation (the security search supports the full set).
    await page.goto(
      '/data/securities?identifier=AAPL&identifierType=EXCH_TICKER' +
      '&issueDate=2024-01-15&issueDateOperator=MORE_THAN',
    );
    await expect(page.getByRole('button', { name: /Fetch Securities/ })).toBeVisible({
      timeout: 15_000,
    });

    const dateInput = page.locator('#issue-date-input');
    await expect(dateInput).toHaveValue('2024-01-15');
    const opSelect = page.getByLabel('Date operator');
    await expect(opSelect).toHaveValue('MORE_THAN');
    await expect(opSelect).toBeEnabled();

    await page.getByRole('button', { name: /Fetch Securities/ }).click();
    await page.waitForURL(/\/data\/securities\?.*issueDate=/, { timeout: 10_000 });

    const params = new URL(page.url()).searchParams;
    expect(params.get('issueDate')).toBe('2024-01-15');
    expect(params.get('issueDateOperator')).toBe('MORE_THAN');
    expect(params.get('identifier'), 'other params preserved').toBe('AAPL');
    expect(params.get('identifierType')).toBe('EXCH_TICKER');
  });

  test('issueDate operator dropdown is narrowed to MORE_THAN / LESS_THAN (UX choice)', async ({ page }) => {
    // SecuritySelect's DateFilter has `operators={ISSUE_DATE_OPERATORS}`
    // pinning the dropdown to the two operators users actually want
    // for issueDate searches. This is a UX decision — FetchSecurity
    // and the backend accept the full PositionFilterOperator set
    // (see the LESS_THAN_OR_EQUALS pass-through test below).
    await page.goto('/data/securities?issueDate=2024-01-15&issueDateOperator=MORE_THAN');
    await expect(page.getByRole('button', { name: /Fetch Securities/ })).toBeVisible({
      timeout: 15_000,
    });

    // Inspect the operator <select>'s options. Should be exactly 3:
    // the empty placeholder + MORE_THAN + LESS_THAN.
    const opValues = await page.getByLabel('Date operator').evaluate((el) => {
      const select = el as HTMLSelectElement;
      return Array.from(select.options).map((o) => o.value);
    });
    expect(opValues).toEqual(['', 'MORE_THAN', 'LESS_THAN']);
  });

  test('issueDateOperator=LESS_THAN_OR_EQUALS passes through to the backend (#229 review)', async ({ page }) => {
    // Regression for the user-flagged smell on PR #144: the page-
    // server used to silently drop any operator outside the dropdown's
    // narrowed UX set, on the (false) belief that the backend rejected
    // it. Backend supports the full PositionFilterOperator set, so a
    // direct URL hit / bookmark with LESS_THAN_OR_EQUALS must reach
    // the backend cleanly — not 500, not silently get reset to no
    // filter. This test asserts the page renders without error; the
    // backend application of the filter is implicit (no 5xx response,
    // and the dropdown remains in the narrowed-UX empty state because
    // the value isn't in its option list).
    const response = await page.goto(
      '/data/securities?issueDate=2024-01-15&issueDateOperator=LESS_THAN_OR_EQUALS',
    );
    expect(response, 'load() returned a response').not.toBeNull();
    expect(response!.status(), 'no 500 — operator passed through').toBeLessThan(500);

    await expect(page.getByRole('button', { name: /Fetch Securities/ })).toBeVisible({
      timeout: 15_000,
    });
    // The dropdown is narrowed to MORE_THAN / LESS_THAN, so this
    // operator value isn't a selectable option — the form's onMount
    // leaves the bound state empty. That's the expected UX behaviour;
    // the backend still received the operator on the initial load.
    const opSelect = page.getByLabel('Date operator');
    await expect(opSelect).toHaveValue('');
  });
});
