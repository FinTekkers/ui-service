/**
 * US-233 — read-only logged-in journeys for the deploy smoke check
 * (`npm run test:smoke:deploy`, against https://www.fintekkers.org/).
 *
 *   - CPI index: the CPI-U series shows at least 1 data row.
 *   - Securities: Fetch Securities lists at least 1 row.
 *   - TIPS Pricer, CUSIP Lookup: Current CPI fills "from price service" and
 *     the last results row is `CPI source` = `Price service` (US-229).
 *
 * The session is the e2e user's provisioned API key (FT_E2E_API_KEY), held
 * in memory only. No login: it would rotate the key (BS-33). Skips, naming
 * the reason, when a variable is missing or the key is rejected.
 *
 * Read-only by construction: every test fails if its page sends anything
 * but a GET. No screenshots, traces or videos (see the config).
 */
import {
  test,
  expect,
  type Browser,
  type BrowserContext,
  type Page,
} from "@playwright/test";
import {
  ensureTestUserSession,
  skipUnlessE2ECredentials,
  type StorageState,
} from "../e2e/fixtures/auth";

skipUnlessE2ECredentials(test);

// Non-GET requests a journey may send. Keep it empty: every journey here
// only navigates, and Calculate is a goto() with query params.
const ALLOWED_POSTS: string[] = [];

const CPI_U = "CUUR0000SA0";
const CUSIP = "912810RL4";

type YearMonth = { year: number; month: number };

let session: StorageState;

// The session check (ensureTestUserSession's GET) uses its own request
// context, so it is outside the per-test read-only guard below.
test.beforeAll(async ({ playwright }) => {
  session = await ensureTestUserSession(
    playwright,
    test.info().project.use.baseURL!
  );
});

/** A logged-in page whose non-GET requests are recorded in `writes`. */
async function openGuarded(
  browser: Browser
): Promise<{ context: BrowserContext; page: Page; writes: string[] }> {
  const context = await browser.newContext({
    baseURL: test.info().project.use.baseURL,
    storageState: session,
  });
  const writes: string[] = [];
  // Attached before the first goto, so no request escapes it.
  context.on("request", (request) => {
    const { pathname } = new URL(request.url());
    if (request.method() !== "GET" && !ALLOWED_POSTS.includes(pathname))
      writes.push(`${request.method()} ${pathname}`);
  });
  return { context, page: await context.newPage(), writes };
}

/** Opens /data/cpi_index on CPI-U and waits for its data rows. */
async function openCpiU(page: Page) {
  await page.goto(`/data/cpi_index?series=${CPI_U}`);
  await expect(page).not.toHaveURL(/\/login/);
  await expect(page.locator("#series-select")).toHaveValue(CPI_U, {
    timeout: 30_000,
  });
  const valueCells = page.locator("table td.value-cell");
  await expect(valueCells.first()).toBeVisible({ timeout: 30_000 });
  return valueCells;
}

function addMonths(m: YearMonth, n: number): YearMonth {
  const i = m.year * 12 + (m.month - 1) + n;
  return { year: Math.floor(i / 12), month: (i % 12) + 1 };
}

function firstOf(m: YearMonth): string {
  return `${m.year}-${String(m.month).padStart(2, "0")}-01`;
}

test.describe("deploy smoke: logged-in pages, read-only (US-233)", () => {
  test("CPI index shows CPI-U data rows", async ({ browser }) => {
    const { context, page, writes } = await openGuarded(browser);
    try {
      const valueCells = await openCpiU(page);
      expect(await valueCells.count()).toBeGreaterThanOrEqual(1);
      expect(writes).toEqual([]);
    } finally {
      await context.close();
    }
  });

  test("securities list shows rows", async ({ browser }) => {
    const { context, page, writes } = await openGuarded(browser);
    try {
      await page.goto("/data/securities");
      await expect(page).not.toHaveURL(/\/login/);
      const fetchButton = page.getByRole("button", {
        name: /Fetch Securities/,
      });
      await expect(fetchButton).toBeVisible({ timeout: 30_000 });
      await page.waitForLoadState("networkidle");
      await fetchButton.click();
      await expect(page.locator("tr.table-row").first()).toBeVisible({
        timeout: 60_000,
      });
      expect(await page.locator("tr.table-row").count()).toBeGreaterThanOrEqual(
        1
      );
      expect(writes).toEqual([]);
    } finally {
      await context.close();
    }
  });

  test("TIPS Pricer CUSIP flow: Current CPI from price service, CPI source row", async ({
    browser,
  }) => {
    const { context, page, writes } = await openGuarded(browser);
    try {
      // The newest CPI-U month L (the table lists newest first). The 1st of
      // L+2 has readings for m-3 and m-2 (US-229).
      await openCpiU(page);
      const newest = (
        await page
          .locator("table tbody tr")
          .first()
          .locator("td")
          .first()
          .innerText()
      ).trim();
      const match = /^(\d{4})-(\d{2})-\d{2}$/.exec(newest);
      expect(
        match,
        `newest CPI-U row has an ISO date (got ${newest})`
      ).not.toBeNull();
      const latest = { year: Number(match![1]), month: Number(match![2]) };
      const settlement = firstOf(addMonths(latest, 2));

      await page.goto("/data/calculators?tab=tips");
      // The field handlers only exist once the page has hydrated.
      await page.waitForLoadState("networkidle");
      await expect(
        page.getByRole("button", { name: "CUSIP Lookup" })
      ).toBeVisible({ timeout: 30_000 });
      await page.getByLabel("CUSIP", { exact: true }).fill(CUSIP);
      await page.keyboard.press("Tab");
      await page.getByLabel("Price (% of par)").fill("98");
      await page.getByLabel(/Reference CPI/).fill("258.446");
      await page
        .getByLabel("Settlement Date", { exact: true })
        .fill(settlement);
      await page.keyboard.press("Tab");
      await page.waitForURL(
        (url) => url.searchParams.get("settlementDate") === settlement,
        { timeout: 30_000 }
      );

      await expect(page.getByLabel(/Current CPI/)).not.toHaveValue("", {
        timeout: 30_000,
      });
      await expect(page.getByText("from price service")).toBeVisible();

      await page.getByRole("button", { name: /^Calculate$/i }).click();
      const last = page.locator("table.results-table tr").last();
      await expect(last).toBeVisible({ timeout: 30_000 });
      await expect(last.locator("td.label")).toHaveText("CPI source");
      await expect(last.locator("td.value")).toHaveText("Price service");
      expect(writes).toEqual([]);
    } finally {
      await context.close();
    }
  });
});
