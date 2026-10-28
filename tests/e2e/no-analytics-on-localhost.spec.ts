/**
 * US-300: Google Analytics loads only on the production host, so a page
 * served on localhost carries no GA tag and never requests
 * googletagmanager.com.
 */
import { test, expect } from "@playwright/test";

test.use({ storageState: { cookies: [], origins: [] } });

test("a page on localhost has no GA tag and requests no googletagmanager.com", async ({
  page,
  baseURL,
}) => {
  const requested: string[] = [];
  page.on("request", (request) => requested.push(request.url()));
  // Abort third-party requests (fonts) so a stalled one can't hold
  // "networkidle" off; an aborted request still fires "request" above.
  const origin = new URL(baseURL ?? "http://127.0.0.1").origin;
  await page.route(
    (url) => url.origin !== origin,
    (route) => route.abort()
  );
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  expect(
    requested.filter((url) => url.includes("googletagmanager.com"))
  ).toEqual([]);
  await expect(page.locator('script[src*="googletagmanager"]')).toHaveCount(0);
});
