/**
 * US-243: the redesigned homepage (/). Sections in design order with their
 * landmarks and headings, the live chart, the hero card showing
 * src/lib/home/first-call.ts, and the phone and desktop layouts.
 *
 * US-250: the live chart draws AAPL's daily closes for every visitor, with
 * the server-held FT_HOMEPAGE_API_KEY that scripts/checks/e2e.sh exports to
 * the server and to this spec. The chart tests run logged out and skip only
 * when that key isn't set for the run or the price service (asked over the
 * broker, never the page) holds no AAPL close.
 */
import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "fs";
import path from "path";
import { priceServiceHasAaplCloses } from "./fixtures/data-preconditions";

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
  ["live", "A year of Apple (AAPL) closes, straight from the API."],
  ["get-started", "From install to first query in minutes."],
  ["support", "Talk to the engineers who built it."],
];

const section = (page: Page, name: string) =>
  page.locator(`[data-section="${name}"]`);

const HOMEPAGE_KEY = process.env.FT_HOMEPAGE_API_KEY?.trim() ?? "";

// Skips unless the server under test can draw the AAPL chart. Never judged
// from the page: an empty state with data available fails the test.
async function skipUnlessAaplCloses() {
  test.skip(
    !HOMEPAGE_KEY,
    "FT_HOMEPAGE_API_KEY not set for this run (scripts/checks/e2e.sh exports it)"
  );
  test.skip(
    !(await priceServiceHasAaplCloses(HOMEPAGE_KEY)),
    "the price service holds no AAPL close: chart check not applicable"
  );
}

async function expectAaplChart(page: Page) {
  const live = section(page, "live");
  await expect(
    live.getByRole("heading", { level: 2, name: /AAPL/ })
  ).toBeVisible();
  await expect(live.locator("#plot svg.main-svg").first()).toBeVisible({
    timeout: 30_000,
  });
  await expect(live.locator(".empty")).toBeHidden();
  const x = await live
    .locator("#plot")
    .evaluate(
      (el) =>
        (el as HTMLElement & { data?: { x: string[] }[] }).data?.[0]?.x ?? []
    );
  expect(x.length).toBeGreaterThanOrEqual(1);
  for (let i = 1; i < x.length; i++) {
    expect(x[i] > x[i - 1], `${x[i - 1]} before ${x[i]}`).toBe(true);
  }
}

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

// Measured logged out (the public page) and with the e2e session. The chart
// draws for both since US-250, when FT_HOMEPAGE_API_KEY is set.
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
      if (HOMEPAGE_KEY) {
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

// US-250: logged out, the server-held key draws the chart.
test.describe("AAPL chart, logged out", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("AAPL chart renders in live section, oldest to newest", async ({
    page,
  }) => {
    await skipUnlessAaplCloses();
    await page.goto("/");
    await expectAaplChart(page);
    await page.reload();
    await expectAaplChart(page);
  });

  test("FT_HOMEPAGE_API_KEY never reaches the browser", async ({
    page,
    request,
  }) => {
    test.skip(
      !HOMEPAGE_KEY,
      "FT_HOMEPAGE_API_KEY not set for this run (scripts/checks/e2e.sh exports it)"
    );
    for (const url of ["/", "/__data.json"]) {
      const response = await request.get(url);
      expect(response.status(), `GET ${url}`).toBe(200);
      expect(await response.text(), `GET ${url} body`).not.toContain(
        HOMEPAGE_KEY
      );
    }
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    expect(await page.content()).not.toContain(HOMEPAGE_KEY);
  });
});
