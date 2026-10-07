/**
 * US-201 — sidebar: Profile first, greeting links to it, readable greeting.
 *
 * Assertions:
 *   1. Keyboard: Tab reaches the "Hi <name>" link, it shows a focus
 *      outline, and Enter lands on /data/profile.
 *   2. Contrast: the greeting colour against the sidebar background is
 *      at least WCAG AA (4.5:1), at rest and on hover. The sidebar has a
 *      single theme because <html> is hard-coded to class="dark"; if that
 *      changes this test fails so the other theme gets checked too.
 *   3. Collapsed: the greeting text hides, the avatar stays inside the
 *      rail without overlapping the first menu link, and that first
 *      link (Profile) goes to /data/profile.
 */

import { test, expect, type Locator, type Page } from "@playwright/test";

// storageState is provided by the chromium project (auth.setup.ts dependency).
test.use({
  viewport: { width: 1920, height: 1080 },
});

// Password login doesn't set ft_user_name, so the greeting reads "Hi User"
// rather than the test user's name; match any "Hi <name>".
const GREETING = /\bHi \S/;

const sidebar = (page: Page) => page.locator(".dashboard-sidebar");
const greetingLink = (page: Page) =>
  sidebar(page).getByRole("link", { name: GREETING });
// Collapsed, the "Hi" span is hidden and the link's name is just "Profile".
const greetingAvatar = (page: Page) =>
  sidebar(page).locator('a[href="/data/profile"] > img');
const menuLinks = (page: Page) =>
  sidebar(page).locator(".dashboard_user_menu_options a");

async function openPortfolios(page: Page) {
  await page.goto("/data/portfolios");
  await expect(greetingLink(page)).toBeVisible({ timeout: 10_000 });
}

/** WCAG 2.x contrast ratio between the text colour and the sidebar bg. */
async function greetingContrast(page: Page, span: Locator): Promise<number> {
  const textColor = await span.evaluate((el) => getComputedStyle(el).color);
  const bgColor = await sidebar(page).evaluate(
    (el) => getComputedStyle(el).backgroundColor
  );
  const luminance = (rgb: string) => {
    const [r, g, b] = (rgb.match(/\d+(\.\d+)?/g) ?? []).map(Number);
    const lin = (c: number) => {
      const s = c / 255;
      return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  };
  const [hi, lo] = [luminance(textColor), luminance(bgColor)].sort(
    (a, b) => b - a
  );
  const ratio = (hi + 0.05) / (lo + 0.05);
  console.log(
    `greeting ${textColor} on ${bgColor}: contrast ${ratio.toFixed(2)}:1`
  );
  return ratio;
}

test("keyboard: Tab reaches the greeting, focus is visible, Enter opens profile", async ({
  page,
}) => {
  await openPortfolios(page);
  const link = greetingLink(page);

  let reached = false;
  for (let i = 0; i < 15 && !reached; i++) {
    await page.keyboard.press("Tab");
    reached = await link.evaluate((el) => el === document.activeElement);
  }
  expect(reached, "Tab never reached the greeting link").toBe(true);

  const outline = await link.evaluate((el) => {
    const cs = getComputedStyle(el);
    return { style: cs.outlineStyle, width: parseFloat(cs.outlineWidth) };
  });
  expect(outline.style).not.toBe("none");
  expect(outline.width).toBeGreaterThan(0);

  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/data\/profile$/);
});

test("contrast: greeting meets WCAG AA at rest and on hover", async ({
  page,
}) => {
  await openPortfolios(page);
  await expect(page.locator("html")).toHaveClass(/\bdark\b/);

  const span = greetingLink(page).locator("span");
  expect(await greetingContrast(page, span)).toBeGreaterThanOrEqual(4.5);

  await greetingLink(page).hover();
  // .user-menu's colour transition is 0.5s; poll until it settles.
  await expect
    .poll(() => greetingContrast(page, span), { timeout: 2_000 })
    .toBeGreaterThanOrEqual(4.5);
});

test("collapsed: greeting hides, avatar fits, Profile is the first icon", async ({
  page,
}, testInfo) => {
  await openPortfolios(page);
  await page.screenshot({
    path: testInfo.outputPath("sidebar-expanded.png"),
  });

  await page.locator(".dashboard-sidebar > button").click();
  await expect
    .poll(async () => (await sidebar(page).boundingBox())?.width ?? 999)
    .toBeLessThan(100);

  await expect(sidebar(page).getByText(GREETING)).toBeHidden();

  const sidebarBox = await sidebar(page).boundingBox();
  const avatarBox = await greetingAvatar(page).boundingBox();
  const firstLink = menuLinks(page).first();
  const firstLinkBox = await firstLink.boundingBox();
  expect(sidebarBox && avatarBox && firstLinkBox).toBeTruthy();
  if (!sidebarBox || !avatarBox || !firstLinkBox) return;

  // Avatar sits inside the rail.
  expect(avatarBox.x).toBeGreaterThanOrEqual(sidebarBox.x);
  expect(avatarBox.x + avatarBox.width).toBeLessThanOrEqual(
    sidebarBox.x + sidebarBox.width
  );
  // Avatar does not overlap the first menu link.
  const overlaps =
    avatarBox.x < firstLinkBox.x + firstLinkBox.width &&
    firstLinkBox.x < avatarBox.x + avatarBox.width &&
    avatarBox.y < firstLinkBox.y + firstLinkBox.height &&
    firstLinkBox.y < avatarBox.y + avatarBox.height;
  expect(overlaps).toBe(false);

  await page.screenshot({
    path: testInfo.outputPath("sidebar-collapsed.png"),
  });

  await firstLink.click();
  await expect(page).toHaveURL(/\/data\/profile$/);
});
