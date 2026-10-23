/**
 * US-251: the Free data explorer shell (src/routes/free/+layout.svelte)
 * hides the app's Navbar with `body:has(.ft-free)`. Every other route keeps
 * it. US-254: /free renders the explorer shell, so it hides the Navbar too.
 * Logged out, at the desktop viewport where the Navbar (not SidebarNav)
 * is the visible app nav.
 */
import { test, expect } from "@playwright/test";

test.use({ storageState: { cookies: [], origins: [] } });

for (const route of ["/treasuries", "/login"]) {
  test(`${route} keeps the app Navbar and has no .ft-free shell`, async ({
    page,
  }) => {
    await page.goto(route);
    await expect(page.locator(".navigation_bar")).toBeVisible();
    await expect(page.locator(".ft-free")).toHaveCount(0);
  });
}

test("/free stays on /free in the shell, without the app Navbar", async ({
  page,
}) => {
  await page.goto("/free");
  await expect(page).toHaveURL(/\/free$/);
  await expect(page.locator(".ft-free")).toHaveCount(1);
  await expect(page.locator(".navigation_bar")).toBeHidden();
});
