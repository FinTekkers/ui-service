/**
 * US-252: /free/soma, logged out. The 7 DataExplorer.dc.html sections, the
 * Treasuries / MBS toggle on the maturity profile, and the code cards'
 * text after hydration.
 *
 * Bar widths: metric 3 reads "each bar's rendered width then equals its MBS
 * share stored in soma.ts". No owner ruling on #252 redefines "share", so
 * each bar's width is the stored `sharePct` (% of the asset type's total)
 * in src/lib/free/mock/soma.ts, the same figure its label shows.
 */
import { test, expect } from "@playwright/test";
import { readFileSync } from "fs";
import path from "path";
import { soma } from "../../src/lib/free/mock/soma";

test.use({ storageState: { cookies: [], origins: [] } });

// The layout's gtag and Google Fonts requests are third-party: a stalled one
// held off "networkidle" past the test timeout under host load. Abort them,
// so "networkidle" waits only on this server's page and bundle.
test.beforeEach(async ({ page, baseURL }) => {
  const origin = new URL(baseURL ?? "http://127.0.0.1").origin;
  await page.route(
    (url) => url.origin !== origin,
    (route) => route.abort()
  );
});

const H2S = [
  "What is the Federal Reserve SOMA?",
  "Federal Reserve SOMA Holdings",
  "What the portfolio is telling us",
  "When the holdings come due",
  "Holdings over time",
  "Positions by CUSIP",
  "Pull SOMA data from the API",
];

test("/free/soma returns 200 with the 7 artboard sections", async ({
  page,
}) => {
  const response = await page.goto("/free/soma");
  expect(response?.status()).toBe(200);
  await expect(page.locator(".ft-free .content h2")).toHaveText(H2S);
});

test("MBS shows the stored MBS bar widths and note", async ({ page }) => {
  await page.goto("/free/soma");
  // A click before hydration does nothing.
  await page.waitForLoadState("networkidle");

  const maturity = page.getByRole("region", {
    name: "When the holdings come due",
  });
  const tsy = maturity.getByRole("button", { name: "Treasuries" });
  const mbs = maturity.getByRole("button", { name: "MBS" });
  await expect(tsy).toHaveAttribute("aria-pressed", "true");

  await mbs.click();
  await expect(mbs).toHaveAttribute("aria-pressed", "true");
  await expect(tsy).toHaveAttribute("aria-pressed", "false");
  await expect(maturity.getByText(soma.maturity.mbs.note)).toBeVisible();
  await expect(maturity.getByText(soma.maturity.tsy.note)).toHaveCount(0);

  const buckets = maturity.locator(".bucket");
  await expect(buckets).toHaveCount(soma.maturity.mbs.buckets.length);
  for (const [i, bucket] of soma.maturity.mbs.buckets.entries()) {
    const row = buckets.nth(i);
    await expect(row).toContainText(soma.maturity.labels[i]);
    await expect(row).toContainText(`${bucket.sharePct.toFixed(1)}%`);
    const track = await row.locator(".track").boundingBox();
    const fill = await row.locator(".fill").boundingBox();
    expect(track).not.toBeNull();
    // A zero-width bar has no box.
    const fillWidth = fill?.width ?? 0;
    expect(
      Math.abs(fillWidth - ((track?.width ?? 0) * bucket.sharePct) / 100)
    ).toBeLessThanOrEqual(1);
  }
});

test("the code cards show the sample files verbatim after hydration", async ({
  page,
}) => {
  await page.goto("/free/soma");
  await page.waitForLoadState("networkidle");
  for (const [name, file] of [
    ["Find the portfolio, TypeScript sample", "soma.ts"],
    ["Find the portfolio, Python sample", "soma.py"],
  ]) {
    const source = readFileSync(
      path.resolve("src/lib/free/samples", file),
      "utf8"
    );
    expect(await page.getByLabel(name).textContent()).toBe(source.trimEnd());
  }
});
