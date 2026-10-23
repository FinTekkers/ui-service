/**
 * US-242 metric 4: an ADJUSTED_COST_BASIS request on the positions page
 * shows "ADJUSTED_COST_BASIS is not supported yet", not a blank cell.
 *
 * valuation-service answers UNIMPLEMENTED with that text; with no
 * transactions on the host the broker returns no rows instead, and the page
 * says the same thing from the ledger-models catalog (`implemented: false`).
 * Either path must show the text and never a 5xx.
 */
import { expect } from "@playwright/test";
import { test } from "./fixtures/probe";

test.describe("/data/positions ADJUSTED_COST_BASIS (US-242)", () => {
  test("shows the not-supported-yet error", async ({
    page,
    probePortfolio,
  }) => {
    test.setTimeout(60_000);

    // The probe's ID, from its Elections link on the portfolios index.
    await page.goto("/data/portfolios");
    const probeRow = page.locator("table tbody tr", {
      hasText: probePortfolio,
    });
    await expect(probeRow).toHaveCount(1, { timeout: 15_000 });
    const href = await probeRow
      .getByRole("link", { name: "Elections" })
      .getAttribute("href");
    const portfolioId = new URL(href!, page.url()).searchParams.get(
      "portfolioId"
    );
    expect(portfolioId).toBeTruthy();

    const params = new URLSearchParams({
      portfolioId: portfolioId!,
      fields: "SECURITY_DESCRIPTION,PORTFOLIO_NAME",
      measures: "ADJUSTED_COST_BASIS",
      positionView: "DEFAULT_VIEW",
      positionType: "TRANSACTION",
    });
    const response = await page.goto(`/data/positions?${params}`);
    expect(response!.status()).toBeLessThan(500);
    await expect(
      page
        .getByRole("alert")
        .filter({ hasText: "ADJUSTED_COST_BASIS is not supported yet" })
    ).toBeVisible({ timeout: 15_000 });
  });
});
