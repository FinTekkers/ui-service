/**
 * US-291: the Business date control on /data/positions.
 *
 *   1. Bare URL, before any fetch: the control shows today, the note reads
 *      "Trades on or before <today>", and (i) opens and closes the
 *      explainer (metric 1).
 *   2. ValuationTest, Transaction view, no businessDate: quantities
 *      100,000 / 100,000 / 200,000 (metric 1).
 *   3. Position Type Tax Lot: the control switches to All dates, the
 *      picker and Today are disabled, the tax-lot note shows, and the
 *      fetched page has no error and businessDate=all (metric 3). The
 *      load test (src/tests/positions-business-date-load.test.ts) proves
 *      no TRADE_DATE filter is sent.
 *
 * Named portfolio-* so scripts/checks/e2e.sh's portfolio*.spec.ts glob
 * runs it.
 */
import { test, expect, type Page } from "@playwright/test";
import {
  businessDateControl,
  expectExplainerToggles,
  formatDate,
  valuationTestPortfolioId,
  withToday,
} from "./fixtures/business-date";

const TAX_LOT_NOTE =
  "Business date isn't available for tax lots yet: showing all data";

function positionsUrl(portfolioId: string, positionType: string): string {
  const params = new URLSearchParams({
    portfolioId,
    fields: "SECURITY_DESCRIPTION",
    measures: "DIRECTED_QUANTITY",
    positionView: "DEFAULT_VIEW",
    positionType,
  });
  return `/data/positions?${params}`;
}

async function open(page: Page, url: string) {
  return withToday(async () => {
    await page.goto(url);
    await page.waitForLoadState("networkidle");
  });
}

/** The DIRECTED_QUANTITY cell of each security position row: not the
 * total row, and not the CASH:USD row the buys' cash legs build. */
async function quantities(page: Page): Promise<number[]> {
  const cells = page
    .locator(".portfolio_container table tbody tr:not(.summary-row)")
    .filter({ hasNotText: /^\s*CASH:/ })
    .locator("td:last-child");
  const texts = await cells.allTextContents();
  return texts
    .map((t) => Number(t.replace(/[^0-9.-]/g, "")))
    .sort((a, b) => a - b);
}

test.describe("/data/positions Business date (US-291)", () => {
  test.beforeEach(async ({ page, baseURL }) => {
    // Third-party scripts (gtag, fonts) can hold networkidle open.
    const origin = new URL(baseURL ?? "http://localhost").origin;
    await page.route(
      (url) => url.origin !== origin,
      (route) => route.abort()
    );
  });

  test("bare URL shows today before any fetch; the explainer opens and closes", async ({
    page,
  }) => {
    const { todays } = await open(page, "/data/positions");
    const c = businessDateControl(page);

    const value = await c.picker.inputValue();
    expect(todays, "the control shows today's (UTC) date").toContain(value);
    await expect(c.note).toHaveText(`Trades on or before ${formatDate(value)}`);
    await expect(page.locator("#positions-heading")).toContainText(
      `as of the end of ${formatDate(value)}`
    );
    await expect(c.today).toBeEnabled();

    await expectExplainerToggles(page);
  });

  test("ValuationTest Transaction view shows 100,000 / 100,000 / 200,000 as of today", async ({
    page,
  }) => {
    test.setTimeout(90_000);
    const portfolioId = await valuationTestPortfolioId(page);
    const { todays } = await open(
      page,
      positionsUrl(portfolioId, "TRANSACTION")
    );
    const c = businessDateControl(page);
    expect(todays).toContain(await c.picker.inputValue());

    await expect(page.getByRole("alert")).toHaveCount(0);
    await expect
      .poll(() => quantities(page), {
        message: "ValuationTest quantities as of today",
        timeout: 20_000,
      })
      .toEqual([100_000, 100_000, 200_000]);
  });

  test("Tax Lot switches to All dates, disables the picker and Today, and loads without error", async ({
    page,
  }) => {
    test.setTimeout(90_000);
    const portfolioId = await valuationTestPortfolioId(page);
    await open(page, positionsUrl(portfolioId, "TRANSACTION"));
    const c = businessDateControl(page);
    await expect(c.picker).toBeEnabled();

    await page.locator("#position-type-multiselect").click();
    await page
      .locator("ul.options li", { hasText: /^\s*Tax Lot\s*$/ })
      .first()
      .click();

    await expect(page.locator("[data-business-date-mode]")).toHaveAttribute(
      "data-business-date-mode",
      "all"
    );
    await expect(c.picker).toBeDisabled();
    await expect(c.today).toBeDisabled();
    await expect(c.allDates).toHaveAttribute("aria-pressed", "true");
    await expect(c.note).toHaveText(TAX_LOT_NOTE);

    await page.getByRole("button", { name: "Fetch position" }).click();
    await page.waitForURL(/[?&]positionType=TAX_LOT/, { timeout: 15_000 });
    await page.waitForLoadState("networkidle");
    const params = new URL(page.url()).searchParams;
    expect(params.get("businessDate")).toBe("all");
    expect(params.get("tradeDate")).toBeNull();

    await expect(page.getByRole("alert"), "no error banner").toHaveCount(0);
    await expect(c.note).toHaveText(TAX_LOT_NOTE);
    await expect(c.picker).toBeDisabled();
    await expect(c.today).toBeDisabled();
    await expect(page.locator("#positions-heading")).toContainText(
      "all dates, including future-dated activity"
    );
  });
});
