/**
 * US-203 — sidebar links go to the same page straight after login.
 *
 * Starts logged out at /data/portfolios/ (trailing slash) and signs in from
 * /login?redirectTo=%2Fdata%2Fportfolios%2F. Signing in through the form
 * (use:enhance, so the redirect and later clicks are client-side) must land
 * on /data/portfolios, and every sidebar link must then go to its fixed
 * /data/<route>. Before the fix, Portfolio went to /data/portfolios/portfolios.
 */
import { test, expect, type Page } from "@playwright/test";
import { TEST_USER, ensureTestUserSession } from "./fixtures/auth";

// Fresh, logged-out context: this spec logs in itself.
test.use({
  storageState: { cookies: [], origins: [] },
  viewport: { width: 1920, height: 1080 },
});

const MENU: [string, string][] = [
  ["Profile", "/data/profile"],
  ["Portfolio", "/data/portfolios"],
  ["Security", "/data/securities"],
  ["Transaction", "/data/transactions"],
  ["Position", "/data/positions"],
  ["Calculators", "/data/calculators"],
  ["Prices", "/data/prices"],
  ["Treasuries", "/data/treasury_curve"],
  ["Curves", "/data/curves"],
  ["CPI Index", "/data/cpi_index"],
  ["Data Catalog", "/data/catalog"],
];

const menuLink = (page: Page, name: string) =>
  page
    .locator(".dashboard-sidebar .dashboard_user_menu_options")
    .getByRole("link", { name, exact: true });

const pathname = (page: Page) => new URL(page.url()).pathname;

test.beforeAll(async ({ playwright }) => {
  // Fails here, with a clear message, if the test user can't log in —
  // rather than as a URL timeout after the form submit below.
  await ensureTestUserSession(playwright, test.info().project.use.baseURL!);
});

test("after login from /data/portfolios/, every sidebar link goes to its fixed path", async ({
  page,
}) => {
  await page.goto("/data/portfolios/");
  await expect(page).toHaveURL(/\/login\?redirectTo=%2Fdata%2Fportfolios/);
  // SvelteKit may already have dropped the slash on the way here; pin the
  // trailing-slash redirectTo so the case that broke is always exercised.
  await page.goto("/login?redirectTo=%2Fdata%2Fportfolios%2F");

  // SignInForm's <label for> points at ids the inputs don't have, so
  // getByLabel can't find them; use the field names.
  await page.locator('input[name="email"]').fill(TEST_USER.email);
  await page.locator('input[name="password"]').fill(TEST_USER.password);
  await page.getByRole("button", { name: /Sign In/ }).click();

  await expect(page).toHaveURL(/\/data\/portfolios$/, { timeout: 15_000 });

  for (const [name, path] of MENU) {
    await menuLink(page, name).click();
    await expect.poll(() => pathname(page), { message: name }).toBe(path);
  }

  await page.reload();
  await menuLink(page, "Portfolio").click();
  await expect.poll(() => pathname(page)).toBe("/data/portfolios");

  // The top bar's "Look at data now" was relative too: from /data/positions
  // it went to /data/data/portfolios.
  await menuLink(page, "Position").click();
  await expect.poll(() => pathname(page)).toBe("/data/positions");
  await page
    .locator(".navigation_bar")
    .getByRole("link", { name: "Look at data now" })
    .click();
  await expect.poll(() => pathname(page)).toBe("/data/portfolios");
});
