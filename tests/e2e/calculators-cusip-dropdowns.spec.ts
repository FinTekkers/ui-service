/**
 * US-237: the calculators' CUSIP dropdowns list the live US Government
 * securities, and picking a TIPS CUSIP fills Reference CPI from its
 * `baseCpi`, against the real broker and ledger-service.
 *
 * The page searches by issuer only: the `RATES` asset-class search returned
 * 0 securities, so every dropdown was empty and Reference CPI never filled.
 * The suggestions only render once the streamed securities arrive, so each
 * wait is on an option, not a fixed timeout.
 */
import { test, expect, type Page } from "@playwright/test";

const TIPS_CUSIP = "912810RL4";

async function openTab(page: Page, tab: "bond" | "tips" | "frn") {
  await page.goto(`/data/calculators?tab=${tab}`);
  // The field handlers only exist once the page has hydrated.
  await page.waitForLoadState("networkidle");
  const cusipLookup = page.getByRole("button", { name: "CUSIP Lookup" });
  await expect(cusipLookup).toBeVisible({ timeout: 15_000 });
  // The FRN Pricer opens in manual entry.
  await cusipLookup.click();
}

test.describe("/data/calculators CUSIP dropdowns list US Government securities (US-237)", () => {
  test("TIPS: 912810RL4 is offered, and picking it fills Reference CPI from the Security master", async ({
    page,
  }) => {
    await openTab(page, "tips");
    await page.getByLabel("CUSIP", { exact: true }).fill(TIPS_CUSIP);
    const option = page.locator("ul.suggestions li", { hasText: TIPS_CUSIP });
    await expect(option).toBeVisible({ timeout: 30_000 });

    await option.click();
    await expect(page.getByLabel(/Reference CPI/)).toHaveValue(/^\d+\.\d+$/);
    await expect(page.getByText("from Security master")).toBeVisible();
  });

  for (const tab of ["bond", "frn"] as const) {
    test(`${tab}: the CUSIP dropdown shows at least one option`, async ({
      page,
    }) => {
      await openTab(page, tab);
      // Every US Treasury CUSIP starts 912.
      await page.getByLabel("CUSIP", { exact: true }).fill("912");
      await expect(page.locator("ul.suggestions li").first()).toBeVisible({
        timeout: 30_000,
      });
    });
  }
});
