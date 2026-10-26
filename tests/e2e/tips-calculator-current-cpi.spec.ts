/**
 * US-229: the TIPS Pricer's Current CPI in CUSIP Lookup mode, against the
 * real broker, price service and valuation-service.
 *
 * - Journey A: CPI-U readings exist for m-3 and m-2, so Current CPI shows
 *   valuation-service's REFERENCE_CPI under "from price service", and the
 *   last results row is `CPI source` = `Price service`.
 * - Journey B: no reading, so the field starts empty under "manual entry"
 *   with the note; a typed value prices with `CPI source` = `Manual entry`
 *   and survives a reload.
 * - Journey C: typing over the auto value flips the pill at once, and
 *   Calculate keeps the typed value.
 *
 * The settlement date is derived from the latest CPI-U month L the price
 * service holds (asked over the broker, not the page): the 1st of L+2 has
 * readings (m-2 = L, m-3 = L-1); the 1st of L+3 does not (m-2 = L+1).
 */
import { test, expect, type Page } from "@playwright/test";
import { latestCpiUMonth, type YearMonth } from "./fixtures/cpi-preconditions";

const CUSIP = "912810RL4";
const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function addMonths(m: YearMonth, n: number): YearMonth {
  const i = m.year * 12 + (m.month - 1) + n;
  return { year: Math.floor(i / 12), month: (i % 12) + 1 };
}

function firstOf(m: YearMonth): string {
  return `${m.year}-${String(m.month).padStart(2, "0")}-01`;
}

function label(m: YearMonth): string {
  return `${MONTHS[m.month - 1]} ${m.year}`;
}

let latest: YearMonth | null = null;

test.beforeAll(async () => {
  latest = await latestCpiUMonth();
});

async function openCusipMode(page: Page) {
  await page.goto("/data/calculators?tab=tips");
  // The field handlers only exist once the page has hydrated.
  await page.waitForLoadState("networkidle");
  await expect(page.getByRole("button", { name: "CUSIP Lookup" })).toBeVisible({
    timeout: 15_000,
  });
  await page.getByLabel("CUSIP", { exact: true }).fill(CUSIP);
  await page.keyboard.press("Tab");
}

/** Fills the Settlement Date and waits for `load` to look up the CPI. */
async function setSettlementDate(page: Page, date: string) {
  await page.getByLabel("Settlement Date", { exact: true }).fill(date);
  await page.keyboard.press("Tab");
  await page.waitForURL(
    (url) => url.searchParams.get("settlementDate") === date,
    {
      timeout: 30_000,
    }
  );
}

async function calculate(page: Page) {
  await page.getByRole("button", { name: /^Calculate$/i }).click();
  await expect(page.locator("table.results-table tr").last()).toBeVisible({
    timeout: 30_000,
  });
}

function lastResultRow(page: Page) {
  const row = page.locator("table.results-table tr").last();
  return { label: row.locator("td.label"), value: row.locator("td.value") };
}

test.describe("/data/calculators TIPS Pricer — Current CPI from the price service (US-229)", () => {
  test("Journey A: readings for m-3 and m-2 fill Current CPI; CPI source is Price service", async ({
    page,
  }) => {
    test.skip(!latest, "the price service holds no CPI-U (CUUR0000SA0) prices");
    const settlement = firstOf(addMonths(latest!, 2));
    await openCusipMode(page);
    await page.getByLabel("Price (% of par)").fill("98");
    await page.getByLabel(/Reference CPI/).fill("258.446");
    await setSettlementDate(page, settlement);

    const currentCpi = page.getByLabel(/Current CPI/);
    await expect(currentCpi).not.toHaveValue("", { timeout: 30_000 });
    await expect(page.getByText("from price service")).toBeVisible();
    await expect(
      page.getByText(`CPI-U ${label(addMonths(latest!, -1))}`, { exact: false })
    ).toBeVisible();

    await calculate(page);
    const last = lastResultRow(page);
    await expect(last.label).toHaveText("CPI source");
    await expect(last.value).toHaveText("Price service");
    for (const row of ["Index Ratio (CPI)", "Inflation-Adjusted Principal"]) {
      const value = page
        .locator("table.results-table td.label", { hasText: row })
        .locator("xpath=following-sibling::td[1]");
      const n = parseFloat((await value.innerText()).replace(/,/g, ""));
      expect(Number.isFinite(n), `${row} is numeric`).toBe(true);
    }
    await expect(currentCpi).not.toHaveValue("");
    await expect(page.getByText("from price service")).toBeVisible();
  });

  test("Journey B: no reading — empty field, manual entry and the note; a typed value prices and survives a reload", async ({
    page,
  }) => {
    test.skip(!latest, "the price service holds no CPI-U (CUUR0000SA0) prices");
    const settlement = firstOf(addMonths(latest!, 3));
    await openCusipMode(page);
    await setSettlementDate(page, settlement);

    await expect(
      page.getByText(
        `No CPI-U reading for ${settlement} in the price service (latest loaded: ${label(
          latest!
        )}). Enter it to calculate. It is not saved.`,
        { exact: true }
      )
    ).toBeVisible({ timeout: 30_000 });
    const currentCpi = page.getByLabel(/Current CPI/);
    await expect(currentCpi).toHaveValue("");
    await expect(page.getByText("manual entry", { exact: true })).toBeVisible();

    await currentCpi.fill("310.326");
    await page.getByLabel("Price (% of par)").fill("98");
    await page.getByLabel(/Reference CPI/).fill("258.446");
    await calculate(page);
    const last = lastResultRow(page);
    await expect(last.label).toHaveText("CPI source");
    await expect(last.value).toHaveText("Manual entry");

    await page.reload();
    await expect(page.getByLabel(/Current CPI/)).toHaveValue("310.326", {
      timeout: 30_000,
    });
    await expect(page.getByText("manual entry", { exact: true })).toBeVisible();
  });

  test("Journey C: typing over the auto value switches to manual entry and Calculate keeps it", async ({
    page,
  }) => {
    test.skip(!latest, "the price service holds no CPI-U (CUUR0000SA0) prices");
    const settlement = firstOf(addMonths(latest!, 2));
    await openCusipMode(page);
    await page.getByLabel("Price (% of par)").fill("98");
    await page.getByLabel(/Reference CPI/).fill("258.446");
    await setSettlementDate(page, settlement);
    const currentCpi = page.getByLabel(/Current CPI/);
    await expect(currentCpi).not.toHaveValue("", { timeout: 30_000 });
    await expect(page.getByText("from price service")).toBeVisible();

    await currentCpi.fill("330.5");
    await expect(page.getByText("manual entry", { exact: true })).toBeVisible();
    await expect(page.getByText("from price service")).toHaveCount(0);

    await calculate(page);
    await expect(page.getByLabel(/Current CPI/)).toHaveValue("330.5");
    const last = lastResultRow(page);
    await expect(last.label).toHaveText("CPI source");
    await expect(last.value).toHaveText("Manual entry");
  });
});
