/**
 * US-243: every same-site link on the redesigned homepage works for a
 * logged-out visitor: 200 after redirects, and only the login links end on
 * /login. US-254: the four free-data links go to /free, which renders the
 * Free data explorer with the SOMA dataset selected.
 */
import { test, expect, type Page } from "@playwright/test";

test.use({ storageState: { cookies: [], origins: [] } });

const FREE_DATA_LINKS: [string, string][] = [
  ["nav", "Free data explorer"],
  ["hero", "Explore our free data/insights"],
  ["live", "Open the data explorer"],
  ["footer", "Data explorer"],
];

test("every same-site link on / returns 200 without sending to /login", async ({
  page,
}) => {
  await page.goto("/");
  const origin = new URL(page.url()).origin;
  const hrefs = await page.locator("a[href]").evaluateAll((links) =>
    links
      // Rendered links only: the app shell's Navbar and SidebarNav stay in
      // the DOM on / but are display: none (the page has its own nav).
      .filter((link) => link.getClientRects().length > 0)
      .map((link) => (link as HTMLAnchorElement).href)
  );
  const sameSite = [
    ...new Set(
      hrefs
        .map((href) => new URL(href))
        .filter((url) => url.origin === origin)
        .map((url) => url.pathname + url.search)
    ),
  ];
  expect(sameSite).toEqual(
    expect.arrayContaining(["/", "/free", "/login", "/contactus"])
  );

  for (const href of sameSite) {
    const response = await page.request.get(href);
    expect(response.status(), `${href} status`).toBe(200);
    const finalPath = new URL(response.url()).pathname;
    if (href === "/free") {
      expect(finalPath, "/free must not redirect").toBe("/free");
    }
    if (href !== "/login") {
      expect(finalPath, `${href} must not end on /login`).not.toMatch(
        /^\/login/
      );
    }
  }
});

test("the four free-data links point to /free", async ({ page }) => {
  await page.goto("/");
  for (const [name, text] of FREE_DATA_LINKS) {
    await expect(
      page
        .locator(`[data-section="${name}"]`)
        .getByRole("link", { name: text, exact: true })
    ).toHaveAttribute("href", "/free");
  }
});

const EXPLORER = "Free data explorer";
const SOMA = "Federal Reserve SOMA Holdings";

/** The explorer heading, and the dataset picker set to SOMA. */
async function expectSomaExplorer(page: Page): Promise<void> {
  await expect(
    page.getByRole("heading", { level: 1, name: EXPLORER })
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: `Public dataset ${SOMA}`, exact: true })
  ).toBeVisible();
}

test("/free returns 200 with no redirect", async ({ page }) => {
  const response = await page.request.get("/free", { maxRedirects: 0 });
  expect(response.status()).toBe(200);
  expect(response.headers()["location"]).toBeUndefined();
});

test("/free renders the Free data explorer with SOMA selected", async ({
  page,
}) => {
  const response = await page.goto("/free");
  expect(response?.status()).toBe(200);
  await expectSomaExplorer(page);
});

for (const [name, text] of FREE_DATA_LINKS) {
  test(`the ${name} link "${text}" opens the explorer on SOMA`, async ({
    page,
    baseURL,
  }) => {
    // A click before hydration is a full page load, not the client-side
    // navigation that runs /free's universal load in the browser, so wait
    // for "networkidle". Abort third-party requests (gtag, fonts) first: a
    // stalled one can hold "networkidle" off past the timeout.
    const origin = new URL(baseURL ?? "http://127.0.0.1").origin;
    await page.route(
      (url) => url.origin !== origin,
      (route) => route.abort()
    );
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page
      .locator(`[data-section="${name}"]`)
      .getByRole("link", { name: text, exact: true })
      .click();
    await expect(page).toHaveURL(/\/free$/);
    await expectSomaExplorer(page);
  });
}
