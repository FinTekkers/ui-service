/**
 * Regression for second-brain#227 (PositionSelect → IdentifierFilter).
 *
 * Two cases:
 *   1. CUSIP — ?identifier+identifierType=CUSIP loads into the form,
 *      Fetch round-trips the URL with portfolioId carried via inheritKeys
 *      (#220-style guard).
 *   2. EXCH_TICKER — same flow with identifierType=EXCH_TICKER.
 *
 * Pre-existing case removed: the "legacy ?cusip= bookmark migrates"
 * test covered the PR #134 deprecation shim that's been removed
 * post-#239 — see the chore: drop-deprecation-shims commit. The
 * "no legacy ?cusip= re-emitted" negative assertions on the canonical
 * cases are kept as harmless regression guards (still meaningful: the
 * form must not accidentally emit ?cusip= on its own).
 *
 * Why URL-load instead of dropdown-then-fill: testing via the dropdown
 * triggers IdentifierFilter's clearOnTypeChange handler, whose bind
 * propagation up through the component boundary races with subsequent
 * DOM operations under Playwright. The load-and-emit form covers the
 * acceptance criterion ("identifier-type-aware filter survives Fetch")
 * without that flakiness, and exercises the same code paths a real user
 * hits when they bookmark or share a positions URL.
 *
 * Identifier values are deliberately unlikely-to-match probes — this
 * spec asserts URL shape, not row contents.
 */
import { test, expect, type Page } from "@playwright/test";

const PROBE_CUSIP = "ZZZZZZZZZ";
const PROBE_TICKER = "ZZTOP";

// M5 / #260: pre-M5 this helper looked specifically for
// 'Federal Reserve SOMA Holdings' (the deterministic seed name).
// Clean-slate migration regenerated the seed; helper now picks the
// first portfolio in the table. These tests only need a valid
// portfolioId as scope context — they don't assert SOMA-specific
// behaviour.
async function resolvePortfolioId(page: Page): Promise<string> {
  await page.goto("/data/portfolios");
  await expect(page.getByRole("heading", { name: "Portfolios" })).toBeVisible({
    timeout: 15_000,
  });
  const firstRow = page.locator("table tbody tr").first();
  await expect(firstRow, "at least one portfolio in seed").toBeVisible({
    timeout: 10_000,
  });
  const link = firstRow
    .getByRole("link")
    .filter({ hasNotText: /^(Txns|Elections|Delete)$/ })
    .first();
  const href = await link.getAttribute("href");
  expect(href).toMatch(/portfolioId=[0-9a-f-]{36}/);
  return new URL(href!, page.url()).searchParams.get("portfolioId")!;
}

test.describe("/data/positions IdentifierFilter (#227)", () => {
  test("CUSIP filter survives Fetch with portfolio scope", async ({ page }) => {
    const portfolioId = await resolvePortfolioId(page);

    await page.goto(
      `/data/positions?portfolioId=${portfolioId}` +
        `&identifier=${PROBE_CUSIP}&identifierType=CUSIP` +
        `&fields=SECURITY_DESCRIPTION&measures=DIRECTED_QUANTITY`
    );
    const idInput = page.locator("#position-identifier-input");
    await expect(idInput).toBeVisible({ timeout: 10_000 });
    await expect(idInput, "CUSIP value loaded from URL").toHaveValue(
      PROBE_CUSIP
    );
    await expect(
      page.getByLabel("Identifier type"),
      "CUSIP type loaded from URL"
    ).toHaveValue("CUSIP");

    await page.getByRole("button", { name: "Fetch" }).click();
    await page.waitForURL(/\/data\/positions\?.*identifier=/, {
      timeout: 10_000,
    });

    const params = new URL(page.url()).searchParams;
    expect(params.get("identifier"), "identifier value").toBe(PROBE_CUSIP);
    expect(params.get("identifierType"), "identifierType pinned to CUSIP").toBe(
      "CUSIP"
    );
    expect(params.get("cusip"), "no legacy ?cusip= re-emitted").toBeNull();
    expect(params.get("portfolioId"), "#220 guard: portfolioId preserved").toBe(
      portfolioId
    );
  });

  test("EXCH_TICKER (Ticker) filter survives Fetch with portfolio scope", async ({
    page,
  }) => {
    const portfolioId = await resolvePortfolioId(page);

    await page.goto(
      `/data/positions?portfolioId=${portfolioId}` +
        `&identifier=${PROBE_TICKER}&identifierType=EXCH_TICKER` +
        `&fields=SECURITY_DESCRIPTION&measures=DIRECTED_QUANTITY`
    );
    const idInput = page.locator("#position-identifier-input");
    await expect(idInput).toBeVisible({ timeout: 10_000 });
    await expect(idInput, "ticker value loaded from URL").toHaveValue(
      PROBE_TICKER
    );
    await expect(
      page.getByLabel("Identifier type"),
      "EXCH_TICKER type loaded from URL"
    ).toHaveValue("EXCH_TICKER");

    await page.getByRole("button", { name: "Fetch" }).click();
    await page.waitForURL(/\/data\/positions\?.*identifier=/, {
      timeout: 10_000,
    });

    const params = new URL(page.url()).searchParams;
    expect(params.get("identifier"), "identifier value").toBe(PROBE_TICKER);
    expect(
      params.get("identifierType"),
      "identifierType pinned to EXCH_TICKER"
    ).toBe("EXCH_TICKER");
    expect(params.get("cusip"), "no legacy ?cusip= re-emitted").toBeNull();
    expect(params.get("portfolioId"), "#220 guard: portfolioId preserved").toBe(
      portfolioId
    );
  });
});
