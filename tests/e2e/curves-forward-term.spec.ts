/**
 * E2E coverage for the term-forward view on /data/curves (#264).
 *
 * What's verified end-to-end:
 *   1. The page loads with the forward-term selector defaulted to 10Y.
 *   2. Switching the selector to 1Y triggers a navigation to
 *      /data/curves?asof=…&term=1 and the new term is sticky on reload.
 *   3. The forward table heading reflects the selected term ("1Y Forward Rate
 *      by Start Year") — which proves data.termYears propagated and the page
 *      rendered the new forward series rather than the legacy single line.
 *
 * What's NOT verified here:
 *   - Numerical correctness of f(t, t+T) — that's validated in
 *     valuation-service against FRED in PR #50, and against fixed inputs in
 *     the curves-server-helpers vitest. Adding it here would require
 *     pinning a curve fixture, and the e2e environment uses live curves.
 */
import { test, expect } from "@playwright/test";

test.describe("/data/curves — forward-term selector (#264)", () => {
  test("selector defaults to 10Y and is wired to ?term=", async ({ page }) => {
    await page.goto("/data/curves");

    const selector = page.getByLabel("Forward term");
    await expect(selector).toBeVisible({ timeout: 15_000 });
    await expect(selector).toHaveValue("10");

    // Forward table heading proves termYears flowed from server to page.
    await expect(
      page.getByRole("heading", { name: /10Y Forward Rate by Start Year/ })
    ).toBeVisible({ timeout: 15_000 });
  });

  test("switching to 1Y reloads the page with term=1 and re-renders the forward table", async ({
    page,
  }) => {
    await page.goto("/data/curves");

    const selector = page.getByLabel("Forward term");
    await expect(selector).toBeVisible({ timeout: 15_000 });

    await Promise.all([
      page.waitForURL(/term=1(?:&|$)/, { timeout: 15_000 }),
      selector.selectOption("1"),
    ]);

    // Post-navigation: selector remembers, heading reflects 1Y.
    await expect(page.getByLabel("Forward term")).toHaveValue("1");
    await expect(
      page.getByRole("heading", { name: /1Y Forward Rate by Start Year/ })
    ).toBeVisible({ timeout: 15_000 });
  });

  test("decimal-year tenors render verbatim (no bucket snapping) when backend returns curve data", async ({
    page,
  }) => {
    // Spec callout: the prior tenorLabel() snapped 9–14Y → "10Y". The new
    // formatYears() renders "9.95Y". The unit assertion lives in
    // curves-page.test.ts where the fixture is pinned; this e2e check is
    // data-dependent and runs only when the live backend returns rows. If
    // RunCurve errors (e.g. pre-existing M6 bug 5 coupon-rate gap), we skip
    // — we don't want UI-correctness signal swallowed by a separate
    // data-sourcing regression.
    //
    // US-218: the host now builds a curve (US-216), so a backend error fails
    // this test instead of skipping it: a skip would not prove the page
    // rendered on the new ledger-models release.
    await page.goto("/data/curves");
    await expect(
      page.getByRole("heading", { name: /Par & Spot Curves/ })
    ).toBeVisible({ timeout: 15_000 });

    const errorBanner = page.locator(".error-banner");
    expect(
      await errorBanner.isVisible().catch(() => false),
      `backend RunCurve returned an error: ${
        (await errorBanner.textContent().catch(() => null)) ?? ""
      }`
    ).toBe(false);

    const tenorCells = await page
      .locator(".table-wrapper")
      .first()
      .locator("tbody td strong")
      .allTextContents();

    const decimalish = tenorCells.find((s) => /^\d+\.\d+Y$/.test(s));
    expect(
      decimalish,
      `expected at least one decimal-year tenor, saw ${JSON.stringify(
        tenorCells
      )}`
    ).toBeDefined();
  });

  test("forward table renders start-year rows from the LM-313 from/to tenors (US-218)", async ({
    page,
  }) => {
    // Forward points now take their start year from CurvePointProto's
    // from_tenor (LM-313). If the backend left it unset every forward point
    // would be dropped and the table would show only its empty-state row,
    // while the par trace alone still drew the chart.
    await page.goto("/data/curves");
    const heading = page.getByRole("heading", {
      name: /Forward Rate by Start Year/,
    });
    await expect(heading).toBeVisible({ timeout: 15_000 });

    const errorBanner = page.locator(".error-banner");
    expect(
      await errorBanner.isVisible().catch(() => false),
      `backend RunCurve returned an error: ${
        (await errorBanner.textContent().catch(() => null)) ?? ""
      }`
    ).toBe(false);

    const startYears = page
      .locator(".table-wrapper", { has: heading })
      .locator("tbody td strong");
    await expect(startYears.first()).toBeVisible({ timeout: 15_000 });
    expect((await startYears.first().textContent())?.trim()).toBeTruthy();
  });
});
