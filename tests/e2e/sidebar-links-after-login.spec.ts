/**
 * US-203 — sidebar links go to the same page straight after login.
 *
 * Starts at /data/portfolios/ (trailing slash) with the e2e user's session,
 * and every sidebar link must then go to its fixed /data/<route> (clicks
 * are client-side). Before the fix, Portfolio went to
 * /data/portfolios/portfolios.
 *
 * US-233: no form login. A login rotates the e2e user's API key (BS-33)
 * and breaks any other run using it; the session is the provisioned key.
 */
import { test, expect, type Page } from "@playwright/test";
import {
  ensureTestUserSession,
  skipUnlessE2ECredentials,
  type StorageState,
} from "./fixtures/auth";

skipUnlessE2ECredentials(test);

// The session comes from beforeAll, never the setup project's file. Traces
// and failure screenshots would record the session cookie.
test.use({
  storageState: { cookies: [], origins: [] },
  viewport: { width: 1920, height: 1080 },
  trace: "off",
  screenshot: "off",
  video: "off",
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

let session: StorageState;

test.beforeAll(async ({ playwright }) => {
  // Skips here, naming the reason, if the key is missing or rejected —
  // rather than as a URL timeout on the /login redirect below.
  session = await ensureTestUserSession(
    playwright,
    test.info().project.use.baseURL!
  );
});

test("logged in at /data/portfolios/, every sidebar link goes to its fixed path", async ({
  page,
}) => {
  await page.context().addCookies(session.cookies);
  await page.goto("/data/portfolios/");
  await expect(page).toHaveURL(/\/data\/portfolios\/?$/, { timeout: 15_000 });

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
