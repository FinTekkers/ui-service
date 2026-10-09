/**
 * US-207 — /data/securities dropdowns from ledger-models, in a real browser.
 *
 *   - The page hydrates without a page error (no grpc in the client bundle:
 *     the `process is not defined` crash).
 *   - Each of the four selects keeps its id and `filter-select text-black`
 *     class, and lists exactly ledger-models' option count.
 *   - Selecting EQUITY and clicking Fetch Securities puts assetClass=EQUITY in
 *     the URL, and the select still shows EQUITY after a reload.
 */
import { test, expect, type Page } from "@playwright/test";
import {
  activeProductTypes,
  allAssetClasses,
  allInstrumentTypes,
} from "@fintekkers/ledger-models/node/wrappers/models/security/product_hierarchy.js";
import { Identifier } from "@fintekkers/ledger-models/node/wrappers/models/security/identifier.js";
import { ensureTestUserSession, type StorageState } from "./fixtures/auth";

// Never load the setup project's file; the session comes from beforeAll.
test.use({ storageState: { cookies: [], origins: [] } });

let session: StorageState;

test.beforeAll(async ({ playwright }) => {
  session = await ensureTestUserSession(
    playwright,
    test.info().project.use.baseURL!
  );
});

const fetchButton = (page: Page) =>
  page.getByRole("button", { name: /Fetch Securities/ });

// [locator, ledger-models option count, has an "All" option]
const SELECTS: Array<[string, () => number, boolean]> = [
  [
    'select[aria-label="Identifier type"]',
    () => Identifier.getAllTypeNames().length,
    false,
  ],
  ["#asset-class-input", () => allAssetClasses().length, true],
  ["#product-type-select", () => activeProductTypes().length, true],
  ["#instrument-type-select", () => allInstrumentTypes().length, true],
];

test("securities filters list ledger-models values and round-trip EQUITY", async ({
  playwright,
}) => {
  // Own browser: key-screens can leave the worker's shared browser closed
  // (its securities capture times out), which would fail this test unrun.
  const browser = await playwright.chromium.launch();
  try {
    const context = await browser.newContext({
      baseURL: test.info().project.use.baseURL,
      viewport: { width: 1920, height: 1080 },
      storageState: session,
    });
    await checkSecuritiesFilters(await context.newPage());
  } finally {
    await browser.close();
  }
});

async function checkSecuritiesFilters(page: Page) {
  const pageErrors: Error[] = [];
  page.on("pageerror", (err) => pageErrors.push(err));

  await page.goto("/data/securities");
  await expect(fetchButton(page)).toBeVisible({ timeout: 15_000 });

  for (const [selector, count, hasAll] of SELECTS) {
    const select = page.locator(selector);
    await expect(select, selector).toHaveClass(/(^|\s)filter-select(\s|$)/);
    await expect(select, selector).toHaveClass(/(^|\s)text-black(\s|$)/);
    await expect(select.locator("option"), selector).toHaveCount(
      count() + (hasAll ? 1 : 0)
    );
  }

  const assetClass = page.locator("#asset-class-input");
  await assetClass.selectOption("EQUITY");
  await fetchButton(page).click();
  await page.waitForURL(/\/data\/securities\?(.*&)?assetClass=EQUITY(&|$)/, {
    timeout: 15_000,
  });
  expect(new URL(page.url()).searchParams.get("assetClass")).toBe("EQUITY");

  await page.reload();
  await expect(fetchButton(page)).toBeVisible({ timeout: 15_000 });
  await expect(assetClass).toHaveValue("EQUITY");

  expect(pageErrors.map((e) => e.message)).toEqual([]);
}
