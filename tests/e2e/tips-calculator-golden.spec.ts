/**
 * US-238: the TIPS Pricer's numbers for one known trade, against the real
 * broker, security master, price service and valuation-service (VS-115).
 *
 * 912810RL4 settling 2026-10-21 at a price of 66.765: Webull's last trade on
 * 20 Oct 2026, quoted at a 3.134% yield (Public.com 3.13%). The golden values
 * came from the live stack on 21 Oct (owner ruling):
 * - Reference CPI at issuance (the security's `baseCpi`): 235.4815.
 * - Reference CPI on settlement: 334.6032, interpolating the Jul (333.918)
 *   and Aug (334.980) 2026 CPI-U readings for day 21 of Oct. Unadjusted
 *   CPI-U is not revised, so the value is stable.
 * - Index ratio 1.42093; adjusted principal 1,420.93 per 1,000 face.
 * - Real yield and yield to maturity 3.1302%, within 0.01 percentage points
 *   of Webull's 3.134%.
 *
 * The values are fixed: on a mismatch, report it, do not edit them. The
 * CUSIP is picked from the suggestion list, so an empty dropdown (US-237)
 * fails the spec before any value is checked.
 */
import { test, expect, type Page } from "@playwright/test";

const CUSIP = "912810RL4";
// The suggestions are capped at 8 and more than 8 TIPS CUSIPs start 912810.
const CUSIP_PREFIX = "912810RL";
const SETTLEMENT = "2026-10-21";
const PRICE = "66.765";

const BASE_CPI = "235.4815";
const REF_CPI_SETTLE = "334.6032";
const INDEX_RATIO = "1.42093";
const ADJ_PRINCIPAL = "1,420.93";
const REAL_YIELD = "3.1302%";
const WEBULL_YIELD = 3.134;
const MARKET_TOL_PP = 0.01;

/** The value cell beside a results-table label. */
function resultValue(page: Page, label: string) {
  return page
    .locator("table.results-table td.label", { hasText: label })
    .locator("xpath=following-sibling::td[1]");
}

/** The CPI inputs hold raw `type=number` strings; round to compare. */
function fixed(value: string, dp: number): string {
  return Number(value).toFixed(dp);
}

test.describe("/data/calculators TIPS Pricer — golden numbers for 912810RL4 (US-238)", () => {
  test(`${CUSIP} @ ${SETTLEMENT}, price ${PRICE}: Reference CPI, index ratio, adjusted principal and real yield`, async ({
    page,
  }) => {
    // Two page loads, a CPI lookup and a valuation: past the 30 s default.
    test.setTimeout(120_000);

    await page.goto("/data/calculators?tab=tips");
    // The field handlers only exist once the page has hydrated.
    await page.waitForLoadState("networkidle");
    const cusipLookup = page.getByRole("button", { name: "CUSIP Lookup" });
    await expect(cusipLookup).toBeVisible({ timeout: 15_000 });
    await cusipLookup.click();

    await page.getByLabel("CUSIP", { exact: true }).fill(CUSIP_PREFIX);
    const options = page.locator("ul.suggestions li");
    await expect(options.first()).toBeVisible({ timeout: 30_000 });
    expect(await options.count()).toBeGreaterThanOrEqual(1);
    const option = options.filter({ hasText: CUSIP });
    await expect(option).toHaveCount(1);
    await option.click();

    const referenceCpi = page.locator("#referenceCpi");
    const currentCpi = page.locator("#currentCpi");
    await expect(referenceCpi).not.toHaveValue("", { timeout: 30_000 });
    await expect(page.getByText("from Security master")).toBeVisible();

    // Price first: with no date yet it does not trigger a lookup, and the
    // date's lookup then carries it, which valuation needs for the CPI.
    await page.getByLabel("Price (% of par)").fill(PRICE);
    await page.keyboard.press("Tab");
    await page.getByLabel("Settlement Date", { exact: true }).fill(SETTLEMENT);
    await page.keyboard.press("Tab");
    await page.waitForURL(
      (url) =>
        url.searchParams.get("settlementDate") === SETTLEMENT &&
        url.searchParams.get("cpiPreview") === "1",
      { timeout: 30_000 }
    );

    await expect(referenceCpi).not.toHaveValue("", { timeout: 30_000 });
    await expect(currentCpi).not.toHaveValue("", { timeout: 30_000 });
    expect(fixed(await referenceCpi.inputValue(), 4)).toBe(BASE_CPI);
    expect(fixed(await currentCpi.inputValue(), 4)).toBe(REF_CPI_SETTLE);

    await page.getByRole("button", { name: /^Calculate$/i }).click();
    await expect(page.locator("table.results-table")).toBeVisible({
      timeout: 30_000,
    });

    // The formatters fix the shown precision: 5 dp, 2 dp and 4 dp.
    await expect(resultValue(page, "Index Ratio (CPI)")).toHaveText(
      INDEX_RATIO,
      { timeout: 30_000 }
    );
    await expect(resultValue(page, "Inflation-Adjusted Principal")).toHaveText(
      ADJ_PRINCIPAL
    );
    for (const label of ["Real Yield", "Yield to Maturity"]) {
      const cell = resultValue(page, label);
      await expect(cell).toHaveText(REAL_YIELD);
      const y = parseFloat((await cell.innerText()).replace("%", ""));
      expect(
        Math.abs(y - WEBULL_YIELD),
        `${label} ${y}% is within ${MARKET_TOL_PP} pp of Webull's ${WEBULL_YIELD}%`
      ).toBeLessThanOrEqual(MARKET_TOL_PP);
    }
  });
});
