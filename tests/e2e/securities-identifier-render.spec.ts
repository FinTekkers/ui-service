/**
 * #313: /data/securities was rendering UUID hex (e.g.
 * "1f3a2b9c-…-d2") in the Identifier column for every non-bond
 * product because `primaryIdentifier` hardcoded CUSIP→ISIN→UUID. With
 * the per-product-family fix, equities should now show their exchange
 * ticker.
 *
 * This guard fails loudly if the bug ever regresses by asserting
 * the Identifier cell of an equity row matches the ticker shape
 * (1-5 upper-case letters) rather than a UUID.
 */
import { test, expect } from '@playwright/test';

// Look up an equity directly by exchange ticker. Pre-fix this row's
// Identifier column rendered as the UUID hex; post-fix it should
// render as TSLA. Using a specific identifier avoids the assetClass /
// productType post-filter quirks on /data/securities (assetClass
// validation rejects legacy capitalizations, productType has no
// server-side filter so a productType-only query is empty and ledger
// rejects it). The seeded TSLA row is the same one /data/prices's
// autocomplete test relies on.
const EQUITIES_URL = '/data/securities?identifier=TSLA&identifierType=EXCH_TICKER';

const TICKER_SHAPE = /^[A-Z][A-Z0-9.]{0,5}$/;
const UUID_SHAPE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

test.describe('/data/securities identifier column (#313)', () => {
  test('equity rows render exchange ticker, not UUID', async ({ page }) => {
    const response = await page.goto(EQUITIES_URL);
    expect(response, 'GET /data/securities returns a response').not.toBeNull();
    expect(response!.status(), 'no 5xx — load() must not throw').toBeLessThan(500);

    // Wait for the grid to render at least one row. SecurityGrid lays
    // each row out as `<tr>` with the first `<td>` (action column) +
    // the Identifier column second.
    const rows = page.locator('table tbody tr');
    await expect.poll(async () => rows.count(), { timeout: 15_000 }).toBeGreaterThan(0);

    const rowCount = await rows.count();
    const samples: { identifier: string; idType: string }[] = [];
    for (let i = 0; i < rowCount; i++) {
      const cells = rows.nth(i).locator('td');
      // td 0 = action column, td 1 = Identifier value, td 2 = ID Type.
      const identifier = (await cells.nth(1).innerText()).trim();
      const idType = (await cells.nth(2).innerText()).trim();
      samples.push({ identifier, idType });
    }

    // Pre-fix every equity row would have an Identifier cell shaped
    // like a UUID. Post-fix every row should match the ticker shape.
    const uuidRows = samples.filter((r) => UUID_SHAPE.test(r.identifier));
    expect(
      uuidRows,
      `equity rows rendering as UUID (regression of #313): ${JSON.stringify(uuidRows)}`,
    ).toEqual([]);

    const tickerRows = samples.filter((r) => TICKER_SHAPE.test(r.identifier));
    expect(
      tickerRows.length,
      `expected at least one equity row to render a ticker — got ${JSON.stringify(samples)}`,
    ).toBeGreaterThan(0);
  });
});
