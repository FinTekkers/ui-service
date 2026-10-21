/**
 * E2E regression for #266: TIPS pricer auto-populates Reference CPI
 * from the picked Security's TipsDetailsProto.base_cpi.
 *
 * Picks 912810RL4 from the CUSIP suggestion list and asserts that the
 * Reference CPI input fills with a number > 0 and shows the "from Security
 * master" indicator pill.
 *
 * US-238: this used to accept an empty Reference CPI as a data gap, so it
 * passed while the CUSIP dropdown was empty (US-237). It now fails when the
 * dropdown has no 912810RL4 or Reference CPI stays empty.
 */
import { test, expect } from "@playwright/test";

const CUSIP = "912810RL4";
// The suggestions are capped at 8 and more than 8 TIPS CUSIPs start 912810.
const CUSIP_PREFIX = "912810RL";

test.describe("/data/calculators TIPS pricer auto-populates Reference CPI from Security (#266)", () => {
  test("picking 912810RL4 from the list fills Reference CPI from the Security master", async ({
    page,
  }) => {
    test.setTimeout(120_000);
    await page.goto("/data/calculators?tab=tips");
    // The field handlers only exist once the page has hydrated.
    await page.waitForLoadState("networkidle");
    const cusipLookup = page.getByRole("button", { name: "CUSIP Lookup" });
    await expect(cusipLookup).toBeVisible({ timeout: 15_000 });
    await cusipLookup.click();

    await page.getByLabel("CUSIP", { exact: true }).fill(CUSIP_PREFIX);
    const option = page.locator("ul.suggestions li", { hasText: CUSIP });
    await expect(option).toBeVisible({ timeout: 30_000 });
    await option.click();

    const refCpiInput = page.getByLabel(/Reference CPI/);
    await expect(refCpiInput).not.toHaveValue("", { timeout: 30_000 });
    const value = await refCpiInput.inputValue();
    expect(value).toMatch(/^\d+(\.\d+)?$/);
    expect(parseFloat(value)).toBeGreaterThan(0);
    await expect(page.getByText("from Security master")).toBeVisible();
    await expect(page.getByText("manual override")).toHaveCount(0);
  });

  test("CUSIP with no matching Security leaves Reference CPI empty + no indicator (manual fallback ready)", async ({
    page,
  }) => {
    await page.goto("/data/calculators?tab=tips&tipsCusip=ZZZZZ9999");
    await expect(
      page.getByRole("button", { name: "CUSIP Lookup" })
    ).toBeVisible({ timeout: 15_000 });
    await page.waitForTimeout(2_000);

    const refCpiInput = page.getByLabel(/Reference CPI/);
    await expect(refCpiInput).toHaveValue("");
    await expect(page.getByText("from Security master")).toHaveCount(0);
    await expect(page.getByText("manual override")).toHaveCount(0);
  });
});
