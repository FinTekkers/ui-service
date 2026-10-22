/**
 * US-243: every same-site link on the redesigned homepage works for a
 * logged-out visitor: 200 after redirects, and only the login links end on
 * /login. The four free-data links go to /free, which redirects (302) to
 * /treasuries until US-244 ships the Free data explorer there.
 */
import { test, expect } from "@playwright/test";

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

test("/free redirects 302 to /treasuries", async ({ page }) => {
  const response = await page.request.get("/free", { maxRedirects: 0 });
  expect(response.status()).toBe(302);
  expect(response.headers()["location"]).toBe("/treasuries");
});
