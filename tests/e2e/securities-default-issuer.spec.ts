/**
 * Regression for second-brain#306: /data/securities (no params) used to
 * default issuerName='US Government', silently hiding every non-US-Government
 * security (incl. all equities). Same family as #292 / #300 / #302 — a
 * hardcoded UI-side filter making real data invisible.
 *
 * The default has been dropped; FetchSecurity now fans out across the
 * known asset-class strings (M5 hierarchy + legacy display names) when
 * no user-driven filter is set, so the no-params landing view returns
 * every visible security regardless of issuer.
 *
 * Plus the title-typo cleanup also requested on this PR (3 stale
 * copy-pasted layout titles): securities → "Dashboard Positions",
 * positions → "Dashboard Transactions", portfolios → "Dashboard Portfolio".
 *
 * Asserts:
 *   1. /data/securities (no params) returns ≥1 row whose issuer is NOT
 *      'US Government', and ≥1 that is, across ≥100 distinct issuers.
 *      Pre-#306 this was 0 by construction. US-225: every no-params
 *      check reads one shared page load (beforeAll).
 *   2. /data/securities?issuerName=US%20Government still returns ≥1 row
 *      and EVERY rendered row's issuer is 'US Government' (sampling
 *      first 50 rows for perf — explicit filter is exclusive by design).
 *   3. <title> on each of the 4 dashboard data routes matches the route.
 */
import { test, expect, type BrowserContext, type Page } from "@playwright/test";
import { STORAGE_STATE_PATH } from "./fixtures/auth";

const ROUTE_TITLES: { url: string; expected: string }[] = [
  { url: "/data/securities", expected: "Dashboard Securities" },
  { url: "/data/positions", expected: "Dashboard Positions" },
  { url: "/data/portfolios", expected: "Dashboard Portfolios" },
  { url: "/data/transactions", expected: "Dashboard Transactions" },
];

// US-225: one unfiltered /data/securities load per file. The per-issuer
// fanout takes ~15 s, so the no-params tests below read this one page
// instead of each loading their own. Serial-in-file keeps every test in
// the worker that ran the hook.
test.describe.configure({ mode: "default" });

let ledgerContext: BrowserContext;
let ledgerPage: Page;
let ledgerStatus: number | undefined;

test.beforeAll(async ({ browser }) => {
  test.setTimeout(60_000); // per-issuer fanout takes ~15s on a warm cache
  ledgerContext = await browser.newContext({
    baseURL: test.info().project.use.baseURL,
    storageState: STORAGE_STATE_PATH,
  });
  ledgerPage = await ledgerContext.newPage();
  const response = await ledgerPage.goto("/data/securities");
  ledgerStatus = response?.status();
});

test.afterAll(async () => {
  await ledgerContext?.close();
});

test.describe("/data/securities default issuer filter (#306)", () => {
  // US-225: the "≥10k rows" floor that used to lead this test was deleted:
  // the e2e host holds ~3.5k securities, so it could never pass there, and
  // a ledger-side count would need the same fanout. The rest of the #306
  // checks stay here and run on every host.
  test("no params: shows both US Government AND non-US-Government issuers (≥100 distinct)", async () => {
    expect(
      ledgerStatus,
      "GET /data/securities returns a response"
    ).toBeDefined();
    expect(ledgerStatus!, "no 5xx — load() must not throw").toBeLessThan(500);

    // Issuer column is index 3 in SecurityGrid (nth-child is 1-indexed).
    // One evaluate reads every row; per-row locators would take minutes.
    const issuers: string[] = await ledgerPage.$$eval(
      "table tbody tr.table-row td:nth-child(4)",
      (cells) => cells.map((c) => (c.textContent ?? "").trim())
    );
    const distinct = new Set(issuers.filter(Boolean));
    expect(
      distinct.size,
      `expected ≥100 distinct issuers across ${issuers.length} rows; saw ${distinct.size}`
    ).toBeGreaterThanOrEqual(100);

    // Both buckets must be present (asymmetric coverage was the original
    // bug — pre-fix US Government was the only thing visible; post-asset-
    // class-fanout US Government was the one thing missing).
    expect(
      distinct.has("US Government"),
      "US Government missing from no-filter landing"
    ).toBe(true);
    const nonGovt = [...distinct].filter((i) => i !== "US Government");
    expect(
      nonGovt.length,
      "no non-US-Government issuers in no-filter landing"
    ).toBeGreaterThan(0);
  });

  test("?issuerName=US Government still works (back-compat for existing URLs)", async ({
    page,
  }) => {
    const response = await page.goto(
      "/data/securities?issuerName=US%20Government"
    );
    expect(response!.status()).toBeLessThan(500);

    const rows = page.locator("table tbody tr.table-row");
    await expect
      .poll(async () => rows.count(), { timeout: 15_000 })
      .toBeGreaterThan(0);

    // Same 50-row sample — assert every sampled issuer is exactly
    // 'US Government'. US-225: one evaluate reads the sample; 50
    // per-row locators took ~4 s.
    const issuers: string[] = (
      await page.$$eval("table tbody tr.table-row td:nth-child(4)", (cells) =>
        cells.map((c) => (c.textContent ?? "").trim())
      )
    ).slice(0, 50);
    const distinct = new Set(issuers.filter(Boolean));
    expect(
      [...distinct],
      "explicit ?issuerName=US Government must still narrow to US Government only"
    ).toEqual(["US Government"]);
  });
});

test.describe("Dashboard route <title> matches route (#306 title-typo cleanup)", () => {
  for (const { url, expected } of ROUTE_TITLES) {
    test(`${url} → "${expected}"`, async ({ page }) => {
      if (url === "/data/securities") {
        // US-225: reuse the page beforeAll loaded, not a second fanout.
        expect(ledgerStatus!).toBeLessThan(500);
        await expect(ledgerPage).toHaveTitle(expected, { timeout: 10_000 });
        return;
      }
      const response = await page.goto(url);
      expect(response!.status()).toBeLessThan(500);
      await expect(page).toHaveTitle(expected, { timeout: 10_000 });
    });
  }
});
