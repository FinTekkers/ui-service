/**
 * US-243: the redesigned homepage (/). Sections in design order with their
 * landmarks and headings, the live chart inside "Live from the backend",
 * the hero card showing src/lib/home/first-call.ts, and the phone and
 * desktop layouts.
 *
 * The broker refuses calls without an API key, so the chart only has data
 * for a signed-in visitor: the chart test uses the e2e session that
 * scripts/checks/e2e.sh writes for the chromium project. Everything else
 * runs logged out.
 */
import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "fs";
import path from "path";

const SECTIONS = [
  "nav",
  "hero",
  "languages",
  "pillars",
  "live",
  "get-started",
  "support",
  "footer",
];

const SECTION_H2S: [string, string][] = [
  [
    "pillars",
    "Infrastructure you'd build yourself, if you had a year to spare.",
  ],
  ["live", "Thousands of data points, rendered as they stream in."],
  ["get-started", "From install to first query in minutes."],
  ["support", "Talk to the engineers who built it."],
];

const section = (page: Page, name: string) =>
  page.locator(`[data-section="${name}"]`);

async function expectSingleSiteNav(page: Page) {
  await expect(page.locator(".navigation_bar")).toBeHidden();
  await expect(page.locator(".mobile-nav")).toBeHidden();
  const primary = page.getByRole("navigation", { name: "Primary" });
  await expect(primary).toBeVisible();
  // Every visible nav landmark is Primary or one of the footer's three.
  const visibleNavs = await page.getByRole("navigation").evaluateAll((navs) =>
    navs
      .filter((nav) => (nav as HTMLElement).offsetParent !== null)
      .map((nav) => ({
        label: nav.getAttribute("aria-label"),
        inFooter: !!nav.closest('[data-section="footer"]'),
      }))
  );
  expect(visibleNavs.filter((nav) => !nav.inFooter)).toEqual([
    { label: "Primary", inFooter: false },
  ]);
}

test.describe("logged out", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("sections in design order", async ({ page }) => {
    await page.goto("/");

    const order = await page
      .locator("[data-section]")
      .evaluateAll((els) => els.map((el) => el.getAttribute("data-section")));
    expect(order).toEqual(SECTIONS);

    await expect(
      section(page, "nav").getByRole("navigation", { name: "Primary" })
    ).toBeVisible();
    await expect(
      section(page, "hero").getByRole("heading", {
        level: 1,
        name: "The plumbing behind your fintech product.",
      })
    ).toBeVisible();
    for (const [name, h2] of SECTION_H2S) {
      await expect(
        section(page, name).getByRole("heading", { level: 2, name: h2 })
      ).toBeVisible();
    }
    for (const label of ["Product", "Developers", "Company"]) {
      await expect(
        section(page, "footer").getByRole("navigation", { name: label })
      ).toBeVisible();
    }
  });

  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 390, height: 844 },
  ]) {
    test(`exactly one site nav at ${viewport.width}px`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto("/");
      await expectSingleSiteNav(page);
    });
  }

  test("hero card shows first-call.ts exactly", async ({ page }) => {
    await page.goto("/");
    const file = readFileSync(
      path.resolve("src/lib/home/first-call.ts"),
      "utf8"
    );
    const shown = await section(page, "hero").locator("pre").textContent();
    expect(shown?.trim()).toBe(file.trim());
  });
});

// Measured logged out (the public page) and with the e2e session (the
// chart drawn, since Plotly's width is the likeliest thing to overflow).
for (const session of ["logged out", "signed in"] as const) {
  test.describe(`responsive layout, ${session}`, () => {
    if (session === "logged out") {
      test.use({ storageState: { cookies: [], origins: [] } });
    }

    test("390px: no horizontal scroll, code card scrolls in its box", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto("/");
      if (session === "signed in") {
        await expect(
          section(page, "live").locator("#plot svg.main-svg").first()
        ).toBeVisible({ timeout: 30_000 });
      }

      const scroll = await page.evaluate(() => {
        const pageEl = document.getElementById("page");
        return {
          doc: [
            document.documentElement.scrollWidth,
            document.documentElement.clientWidth,
          ],
          page: [pageEl?.scrollWidth ?? Infinity, pageEl?.clientWidth ?? 0],
        };
      });
      expect(scroll.doc[0]).toBeLessThanOrEqual(scroll.doc[1]);
      // AppShell's #page is the scroll container; missing fails the check.
      expect(scroll.page[0]).toBeLessThanOrEqual(scroll.page[1]);

      const links = page
        .getByRole("navigation", { name: "Primary" })
        .getByRole("link");
      expect(await links.count()).toBe(4);
      for (const link of await links.all()) {
        await expect(link).toBeVisible();
        const box = await link.boundingBox();
        expect(box?.x).toBeGreaterThanOrEqual(0);
        expect((box?.x ?? Infinity) + (box?.width ?? 0)).toBeLessThanOrEqual(
          390
        );
      }

      const pre = section(page, "hero").locator("pre");
      const card = await pre.evaluate((el) => ({
        scrollWidth: el.scrollWidth,
        clientWidth: el.clientWidth,
        overflowX: getComputedStyle(el).overflowX,
      }));
      expect(card.overflowX).toBe("auto");
      expect(card.scrollWidth).toBeGreaterThan(card.clientWidth);
    });

    test("1440px: every section's content is at most 1200px wide", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto("/");
      const containers = page.locator("[data-section] > .container");
      await expect(containers).toHaveCount(SECTIONS.length);
      for (const container of await containers.all()) {
        const box = await container.boundingBox();
        expect(box?.width).toBeLessThanOrEqual(1200);
      }
    });
  });
}

// Signed in (the chromium project's storageState): the broker answers the
// unchanged +page.server.ts load only with an API key.
test.describe("signed in", () => {
  test("SOMA chart renders in live section", async ({ page }) => {
    await page.goto("/");
    const live = section(page, "live");
    await expect(live.locator("#plot svg.main-svg").first()).toBeVisible({
      timeout: 30_000,
    });
    const points = await live
      .locator("#plot")
      .evaluate(
        (el) =>
          (el as HTMLElement & { data?: { x: unknown[] }[] }).data?.[0]?.x
            ?.length ?? 0
      );
    expect(points).toBeGreaterThanOrEqual(1);
  });
});
