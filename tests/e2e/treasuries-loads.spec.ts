/**
 * /treasuries lists models (US-218): its load() sends a QuerySecurityRequest
 * per maturing position, stamped with object_type and version through the
 * ledger-models `stamp` helper. The page must still render the Fed activity
 * grid with data on the new release.
 *
 * /treasuries is a top-level route (NOT under (authenticated)/), so assert
 * against the grid's own heading.
 */
import { test, expect } from "@playwright/test";

test.describe("/treasuries — page renders on the new ledger-models release", () => {
  test("/treasuries renders the Fed activity grid with at least one row", async ({
    page,
  }) => {
    const response = await page.goto("/treasuries");

    expect(response, "GET /treasuries returns a response").not.toBeNull();
    expect(response!.status(), "no 5xx").toBeLessThan(500);

    await expect(
      page.getByRole("heading", { name: /Recent Fed Balance Sheet Activity/ })
    ).toBeVisible({ timeout: 15_000 });

    await expect(page.locator(".error-banner")).toHaveCount(0);

    await expect(
      page.locator(".table-wrapper tbody tr").first(),
      "at least one data row"
    ).toBeVisible({ timeout: 15_000 });
  });
});
