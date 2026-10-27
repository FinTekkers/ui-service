/**
 * Helpers for the Business date specs (US-291).
 */
import { expect, type Page } from "@playwright/test";
import { ledgerHasTransactions } from "./data-preconditions";

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

/** The golden portfolio the ValuationTest golden test seeds: 4 buys
 * (91282CJG7, 912810RL4, 2 × 91282CQM6, 100,000 each) and their 4
 * future-dated MATURATION transactions. */
export const VALUATION_TEST = "ValuationTest";

/** "2026-10-27" → "27 Oct 2026", as the page renders it. */
export function formatDate(iso: string): string {
  const [year, month, day] = iso.split("-");
  return `${Number(day)} ${MONTHS[Number(month) - 1]} ${year}`;
}

export function utcToday(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * The server fixes "today" in UTC per request. Read the date before and
 * after the page loads, and accept either, so a run across midnight UTC
 * doesn't fail.
 */
export async function withToday<T>(
  load: () => Promise<T>
): Promise<{ result: T; todays: string[] }> {
  const before = utcToday();
  const result = await load();
  const after = utcToday();
  return { result, todays: [...new Set([before, after])] };
}

/**
 * The ValuationTest portfolio's ID. Fails (never skips) when the host
 * ledger lacks it or serves no transactions: the US-291 metrics are only
 * proven against this data. The ledger is asked over the broker, not
 * through the page under test.
 */
export async function valuationTestPortfolioId(page: Page): Promise<string> {
  expect(
    await ledgerHasTransactions(),
    "the host ledger serves no transactions, so ValuationTest's are missing (check the ledger's startup replay in journalctl -u fintekkers-ledger)"
  ).toBe(true);
  await page.goto("/data/portfolios");
  await expect(page.getByRole("heading", { name: "Portfolios" })).toBeVisible({
    timeout: 15_000,
  });
  const row = page.locator("table tbody tr", { hasText: VALUATION_TEST });
  await expect(
    row.first(),
    `the ${VALUATION_TEST} portfolio is missing from the host ledger: seed it with the ValuationTest golden test's data`
  ).toBeVisible({ timeout: 15_000 });
  const link = row
    .first()
    .getByRole("link")
    .filter({ hasNotText: /^(Txns|Elections|Delete)$/ })
    .first();
  const href = await link.getAttribute("href");
  expect(href).toMatch(/portfolioId=[0-9a-f-]{36}/);
  return new URL(href as string, page.url()).searchParams.get(
    "portfolioId"
  ) as string;
}

/** The Business date control's parts, found by role and label. */
export function businessDateControl(page: Page) {
  return {
    picker: page.getByLabel("Business date", { exact: true }),
    today: page.getByRole("button", { name: "Today", exact: true }),
    allDates: page.getByRole("button", { name: "All dates", exact: true }),
    info: page.getByRole("button", { name: "About business date" }),
    explainer: page.getByRole("region", { name: "About business date" }),
    note: page.locator(".business-date-note"),
  };
}

/** (i) opens the explainer and Close shuts it again. */
export async function expectExplainerToggles(page: Page): Promise<void> {
  const c = businessDateControl(page);
  await expect(c.explainer).toBeHidden();
  await expect(c.info).toHaveAttribute("aria-expanded", "false");
  await c.info.click();
  await expect(c.explainer).toBeVisible();
  await expect(c.info).toHaveAttribute("aria-expanded", "true");
  await expect(c.explainer).toContainText("All dates");
  await c.explainer.getByRole("button", { name: "Close" }).click();
  await expect(c.explainer).toBeHidden();
  await expect(c.info).toHaveAttribute("aria-expanded", "false");
  await expect(c.info).toBeFocused();
}
