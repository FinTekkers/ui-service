/**
 * US-291: the Business date control on /data/transactions.
 *
 *   1. Bare URL: the control shows today, the note reads "Trades on or
 *      before <today>", and (i) opens and closes the explainer (metric 1).
 *   2. ValuationTest: no MATURATION rows by default; All dates shows "No
 *      date filter: showing all data", sets businessDate=all, survives a
 *      reload and lists the 4 maturity rows (metrics 1 and 2).
 *   3. An old tradeDate/tradeDateOperator link is read as before, and All
 *      dates drops both params (metric 2).
 *   4. The SSR note equals the hydrated note, with no hydration messages
 *      (guardrail 3).
 *
 * Maturity rows are the rows whose Side cell is a MATURATION type.
 * ValuationTest holds 4 buys traded before today and 4 maturities dated 2028–2045.
 */
import { test, expect, type Page } from "@playwright/test";
import {
  businessDateControl,
  expectExplainerToggles,
  formatDate,
  valuationTestPortfolioId,
  withToday,
} from "./fixtures/business-date";

const maturityRows = (page: Page) =>
  page
    .locator("table tbody tr")
    .filter({ has: page.locator("td", { hasText: /^\s*MATURATION/ }) });

async function open(page: Page, url: string) {
  return withToday(async () => {
    await page.goto(url);
    await page.waitForLoadState("networkidle");
  });
}

test.describe("/data/transactions Business date (US-291)", () => {
  test.beforeEach(async ({ page, baseURL }) => {
    // Third-party scripts (gtag, fonts) can hold networkidle open.
    const origin = new URL(baseURL ?? "http://localhost").origin;
    await page.route(
      (url) => url.origin !== origin,
      (route) => route.abort()
    );
  });

  test("bare URL shows today and the explainer opens and closes", async ({
    page,
  }) => {
    const { todays } = await open(page, "/data/transactions");
    const c = businessDateControl(page);

    const value = await c.picker.inputValue();
    expect(todays, "the control shows today's (UTC) date").toContain(value);
    await expect(c.note).toHaveText(`Trades on or before ${formatDate(value)}`);
    await expect(page.locator("#transactions-heading")).toContainText(
      `trades on or before ${formatDate(value)}`
    );
    await expect(page).not.toHaveURL(/businessDate=/);

    await expectExplainerToggles(page);
  });

  test("ValuationTest: no maturities by default; All dates lists all 4 and survives a reload", async ({
    page,
  }) => {
    test.setTimeout(90_000);
    const portfolioId = await valuationTestPortfolioId(page);
    await open(page, `/data/transactions?portfolioId=${portfolioId}`);
    const c = businessDateControl(page);

    const rows = page.locator("table tbody tr");
    await expect(rows, "ValuationTest's 4 buys up to today").toHaveCount(4, {
      timeout: 15_000,
    });
    await expect(maturityRows(page), "no maturity rows today").toHaveCount(0);

    await c.allDates.click();
    await page.waitForURL(/[?&]businessDate=all/, { timeout: 15_000 });
    await page.waitForLoadState("networkidle");
    expect(new URL(page.url()).searchParams.get("portfolioId")).toBe(
      portfolioId
    );
    await expect(c.note).toHaveText("No date filter: showing all data");
    await expect(c.picker).toHaveValue("");
    await expect(c.allDates).toHaveAttribute("aria-pressed", "true");
    await expect(maturityRows(page), "the 4 maturity rows").toHaveCount(4, {
      timeout: 15_000,
    });

    await page.reload();
    await page.waitForLoadState("networkidle");
    expect(new URL(page.url()).searchParams.get("businessDate")).toBe("all");
    await expect(c.note).toHaveText("No date filter: showing all data");
    await expect(page.locator("#transactions-heading")).toContainText(
      "all dates, including future-dated activity"
    );
    await expect(maturityRows(page)).toHaveCount(4, { timeout: 15_000 });
  });

  test("an old tradeDate link is read as before; All dates drops it", async ({
    page,
  }) => {
    await open(
      page,
      "/data/transactions?tradeDate=2026-05-06&tradeDateOperator=MORE_THAN"
    );
    const c = businessDateControl(page);
    await expect(c.note).toHaveText("Trade date filter: MORE_THAN 6 May 2026");
    await expect(c.picker).toHaveValue("2026-05-06");

    await c.allDates.click();
    await page.waitForURL(/[?&]businessDate=all/, { timeout: 15_000 });
    const params = new URL(page.url()).searchParams;
    expect(params.get("businessDate")).toBe("all");
    expect(params.get("tradeDate"), "old tradeDate dropped").toBeNull();
    expect(params.get("tradeDateOperator"), "old operator dropped").toBeNull();
    await expect(c.note).toHaveText("No date filter: showing all data");
  });

  test("the SSR note matches the hydrated note, with no hydration messages", async ({
    page,
  }) => {
    const messages: string[] = [];
    page.on("console", (msg) => messages.push(msg.text()));

    const response = await page.request.get("/data/transactions");
    expect(response.status()).toBeLessThan(500);
    const html = await response.text();
    const ssrNote = html.match(
      /class="business-date-note[^"]*"[^>]*>([^<]*)</
    )?.[1];
    expect(ssrNote, "the note is in the server-rendered HTML").toMatch(
      /^Trades on or before \d{1,2} [A-Z][a-z]{2} \d{4}$/
    );

    await open(page, "/data/transactions");
    await expect(businessDateControl(page).note).toHaveText(ssrNote as string);
    expect(
      messages.filter((m) => /hydrat/i.test(m)),
      "no hydration warnings"
    ).toEqual([]);
  });
});
