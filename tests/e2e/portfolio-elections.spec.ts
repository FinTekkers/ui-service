/**
 * US-242: view and edit a portfolio's amortisation elections next to the
 * portfolio list.
 *
 * On a fresh probe portfolio (all elections UNSPECIFIED):
 * - metric 1: each election shows "Default (…)";
 * - metric 5: §171, §1278(b) and §1276(b)(2) each appear once, with the
 *   panel alone and with the confirmation open;
 * - metric 2: Save opens a dialog listing each change old → new and sends
 *   no POST; Cancel sends nothing, and a reload still shows the defaults;
 * - metric 3: Confirm sends exactly one POST, and after a full reload the
 *   new values are read back through the broker.
 *
 * Uses the storageState session from scripts/checks/e2e.sh (no login here)
 * and the per-worker probe portfolio, deleted in the fixture's teardown.
 */
import { expect, type Page } from "@playwright/test";
import { test } from "./fixtures/probe";

const SECTIONS = ["§171", "§1278(b)", "§1276(b)(2)"];

async function expectEachSectionOnce(page: Page) {
  const text = await page.locator("body").innerText();
  for (const section of SECTIONS) {
    expect(
      text.split(section).length - 1,
      `${section} appears exactly once`
    ).toBe(1);
  }
}

async function expectCurrent(page: Page, key: string, label: string) {
  await expect(page.getByTestId(`election-current-${key}`)).toHaveText(label);
}

test.describe("/data/portfolios amortisation elections (US-242)", () => {
  test("defaults, confirm/cancel and a saved change read back", async ({
    page,
    probePortfolio,
  }) => {
    test.setTimeout(120_000);

    let posts = 0;
    page.on("request", (req) => {
      if (req.method() === "POST" && req.url().includes("saveElections")) {
        posts += 1;
      }
    });

    await page.goto("/data/portfolios");
    const probeRow = page.locator("table tbody tr", {
      hasText: probePortfolio,
    });
    await expect(probeRow).toHaveCount(1, { timeout: 15_000 });
    await probeRow.getByRole("link", { name: "Elections" }).click();
    await expect(page).toHaveURL(/[?&]portfolioId=/);
    await expect(
      page.getByRole("heading", { name: "Amortisation elections" })
    ).toBeVisible({ timeout: 15_000 });
    const electionsUrl = page.url();

    // Metric 1.
    await expectCurrent(page, "bondPremium", "Default (Premium elected)");
    await expectCurrent(
      page,
      "marketDiscountInclusion",
      "Default (At disposition)"
    );
    await expectCurrent(page, "marketDiscountAccrual", "Default (Ratable)");
    // Metric 5, panel alone.
    await expectEachSectionOnce(page);

    // Changes made before hydration fire no handler.
    await page.waitForLoadState("networkidle");

    async function makeChanges() {
      await page.getByLabel("Bond premium").selectOption("2");
      await page.getByLabel("Market discount inclusion").selectOption("2");
      await page.getByRole("button", { name: "Save" }).click();
    }

    // Metric 2: the dialog lists both changes and nothing is sent.
    await makeChanges();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText(
      "Default (Premium elected) → Premium not elected"
    );
    await expect(dialog).toContainText(
      "Default (At disposition) → Include currently"
    );
    expect(posts, "no POST before Confirm").toBe(0);
    // Metric 5, confirmation open.
    await expectEachSectionOnce(page);

    // Metric 2: Cancel sends nothing and writes nothing.
    await dialog.getByRole("button", { name: "Cancel" }).click();
    await expect(dialog).toBeHidden();
    expect(posts, "no POST after Cancel").toBe(0);
    await page.reload();
    await expectCurrent(page, "bondPremium", "Default (Premium elected)");
    await expectCurrent(
      page,
      "marketDiscountInclusion",
      "Default (At disposition)"
    );
    expect(posts).toBe(0);

    // Metric 3: Confirm sends one POST; a full reload reads the values back.
    await page.waitForLoadState("networkidle");
    await makeChanges();
    const saved = page.waitForResponse(
      (r) =>
        r.request().method() === "POST" && r.url().includes("saveElections")
    );
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Confirm" })
      .click();
    expect((await saved).status()).toBeLessThan(400);
    await expect(
      page
        .getByRole("region", { name: "Amortisation elections" })
        .getByRole("status")
    ).toHaveText("Elections saved.");
    expect(posts, "exactly one POST on Confirm").toBe(1);

    await page.reload();
    expect(page.url()).toBe(electionsUrl);
    await expectCurrent(page, "bondPremium", "Premium not elected");
    await expectCurrent(page, "marketDiscountInclusion", "Include currently");
    await expectCurrent(page, "marketDiscountAccrual", "Default (Ratable)");
    expect(posts).toBe(1);
  });
});
