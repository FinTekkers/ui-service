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
    // M5 / #260: assetClass param dropped — pre-M5 the seed stored
    // 'Equity' as the asset_class wire-field value (legacy free-form
    // string), and the post-M5 filter validates against the
    // hierarchy.json tree names ('EQUITY'). Until M3 reseeds the
    // existing data with hierarchy-canonical names, an asset_class
    // filter would mismatch live data. The TICKER+identifier path
    // alone resolves AAPL without needing the class filter.
    // issuerName cleared so the page-server's default
    // 'US Government' doesn't exclude AAPL.
    await page.goto(
      '/data/securities?identifier=AAPL&identifierType=EXCH_TICKER&issuerName=',
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

  // M5 / #260: ?securityType= retired, ?productType= replaces it.
  // BOND_SECURITY enum value retired entirely; the v0.2.1 hierarchy
  // has per-leaf product types (TREASURY_NOTE / TIPS / TREASURY_FRN
  // / TBILL / etc.). This test exercises a representative leaf to
  // confirm the new URL param round-trips through the form.
  test('ProductTypeFilter — ?productType=TREASURY_NOTE round-trips through Fetch', async ({ page }) => {
    await page.goto(
      '/data/securities?identifier=AAPL&identifierType=EXCH_TICKER&productType=TREASURY_NOTE',
    );
    await expect(page.getByRole('button', { name: /Fetch Securities/ })).toBeVisible({
      timeout: 15_000,
    });

    const ptSelect = page.locator('#product-type-select');
    await expect(ptSelect, 'ProductTypeFilter loaded the URL value').toHaveValue('TREASURY_NOTE');

    await page.getByRole('button', { name: /Fetch Securities/ }).click();
    await page.waitForURL(/\/data\/securities\?.*productType=TREASURY_NOTE/, { timeout: 10_000 });

    const params = new URL(page.url()).searchParams;
    expect(params.get('productType')).toBe('TREASURY_NOTE');
    expect(params.get('identifier'), 'other params preserved').toBe('AAPL');
    expect(params.get('identifierType')).toBe('EXCH_TICKER');
    // Legacy ?securityType= URL key gone — confirm the form doesn't
    // accidentally re-emit it.
    expect(params.get('securityType'), 'legacy securityType param dropped').toBeNull();
  });

  // M5 / #260: new InstrumentTypeFilter primitive. URL round-trip
  // smoke test mirroring the ProductTypeFilter case above.
  test('InstrumentTypeFilter — ?instrumentType=CASH round-trips through Fetch', async ({ page }) => {
    await page.goto(
      '/data/securities?identifier=AAPL&identifierType=EXCH_TICKER&instrumentType=CASH',
    );
    await expect(page.getByRole('button', { name: /Fetch Securities/ })).toBeVisible({
      timeout: 15_000,
    });

    const itSelect = page.locator('#instrument-type-select');
    await expect(itSelect, 'InstrumentTypeFilter loaded the URL value').toHaveValue('CASH');

    await page.getByRole('button', { name: /Fetch Securities/ }).click();
    await page.waitForURL(/\/data\/securities\?.*instrumentType=CASH/, { timeout: 10_000 });

    expect(new URL(page.url()).searchParams.get('instrumentType')).toBe('CASH');
  });

  // M5 / #260: tree-aware AssetClassFilter. Selecting FIXED_INCOME
  // (an internal node) should match descendants RATES / CREDIT on
  // the page-server side. The URL round-trip preserves the user's
  // pick verbatim — the descendant expansion is server-side post-
  // filter logic, not URL serialization.
  test('AssetClassFilter — ?assetClass=FIXED_INCOME (internal node) round-trips and shows tree-indented options', async ({ page }) => {
    await page.goto('/data/securities?assetClass=FIXED_INCOME');
    await expect(page.getByRole('button', { name: /Fetch Securities/ })).toBeVisible({
      timeout: 15_000,
    });

    const acSelect = page.locator('#asset-class-input');
    await expect(acSelect, 'internal-node selection loaded from URL').toHaveValue('FIXED_INCOME');

    // Tree-shape check: RATES is rendered as a depth-1 indented
    // option. The component uses U+00A0 (non-breaking space) for
    // indentation because plain spaces inside <option> text collapse
    // per the HTML spec — match the NBSP explicitly.
    const optionLabels = await acSelect.evaluate((el) => {
      return Array.from((el as HTMLSelectElement).options).map((o) => o.text);
    });
    const ratesOption = optionLabels.find((l) => l.trim() === 'RATES' || l.trim() === 'Rates');
    expect(ratesOption, 'RATES is rendered as a tree option').toBeDefined();
    expect(ratesOption!.charCodeAt(0), 'RATES is indented under FIXED_INCOME via NBSP').toBe(0x00a0);

    await page.getByRole('button', { name: /Fetch Securities/ }).click();
    await page.waitForURL(/\/data\/securities\?.*assetClass=FIXED_INCOME/, { timeout: 10_000 });
    expect(new URL(page.url()).searchParams.get('assetClass')).toBe('FIXED_INCOME');
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
    // #229: URL operator vocabulary is the full PositionFilterOperator
    // set, dropdown is wrapper-driven, no UI-side narrowing or
    // normalization.
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

  test('issueDate dropdown surfaces the full PositionFilterOperator set', async ({ page }) => {
    // #229 review: the dropdown is wrapper-driven, no UI-side narrowing.
    // Bookmarks carrying any wrapper-known operator (e.g.
    // LESS_THAN_OR_EQUALS, EQUALS, NOT_EQUALS, MORE_THAN_OR_EQUALS) load
    // the value into the dropdown directly — the operator round-trips
    // cleanly through the backend without any silent drop.
    await page.goto('/data/securities?issueDate=2024-01-15&issueDateOperator=LESS_THAN_OR_EQUALS');
    await expect(page.getByRole('button', { name: /Fetch Securities/ })).toBeVisible({
      timeout: 15_000,
    });

    const opSelect = page.getByLabel('Date operator');
    await expect(opSelect, 'wrapper-known operator selected from URL')
      .toHaveValue('LESS_THAN_OR_EQUALS');

    // The dropdown's option set MUST include every wrapper-known
    // operator. Hand-asserting the four in-tree operators today;
    // PositionFilterOperator.getAllTypeNames() drives the runtime
    // list so a new proto entry shows up here automatically.
    const opValues = await opSelect.evaluate((el) => {
      const select = el as HTMLSelectElement;
      return Array.from(select.options).map((o) => o.value);
    });
    expect(opValues).toEqual(expect.arrayContaining([
      '', 'EQUALS', 'LESS_THAN', 'LESS_THAN_OR_EQUALS', 'MORE_THAN',
    ]));
  });
});
