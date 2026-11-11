/**
 * US-252: /free/soma, logged out. The 7 DataExplorer.dc.html sections, the
 * maturity profile, and the code cards' text after hydration.
 *
 * US-305: the maturity profile shows Treasuries only. US-307: the snapshot,
 * findings and maturity profile are the ledger's live SOMA Treasury
 * holdings for the Business date's H.4.1 week. The host ledger may hold no
 * SOMA portfolio, or not that week, so each check accepts live figures or
 * the unavailable text, both naming the week, and records which branch ran.
 * The deleted SOMA mock is imported nowhere and ships in no client script.
 * Each bar's rendered width equals the share its label shows.
 *
 * US-309: Positions by CUSIP is live too: search and paging work after
 * hydration, and at 375 px the page itself never scrolls sideways.
 */
import { test, expect, type Page } from "@playwright/test";
import { existsSync, readdirSync, readFileSync } from "fs";
import path from "path";
import {
  MOCK_SECURITY_MASTER,
  mockFiguresIn,
} from "../../src/tests/fixtures/free-tips-live";
import { SOMA_PAGE_SIZE } from "../../src/lib/free/soma";
import { NEXT_COUPON_NOTE } from "../../src/lib/free/tips";

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

const BUCKET_LABELS = [
  "Within 15 days",
  "16–90 days",
  "91 days–1 yr",
  "1–5 yrs",
  "5–10 yrs",
  "Over 10 yrs",
];
const SCOPE_NOTE = "Excludes SOMA's mortgage-backed securities (MBS).";
const TOTAL_LABEL = "Total held outright, excluding MBS";
// Bracketed so the pattern does not match its own source line.
const EXCLUDED_WORDS = /m[b]s|mor[t]gage|a[g]ency/i;
// Prose only the deleted SOMA mock (src/lib/free/mock/soma.ts before
// US-307) held: the live load never writes these sentences, so a hit in the
// client bundle means the mock shipped again. Figures are no use here: live
// notes & bonds is 79.1% for 2026-11-04, the same string as the mock's.
const SOMA_MOCK_PROSE = [
  "Bills nearly tripled",
  "With runoff over, total holdings rose",
  "Since December 2025 the Fed has bought bills",
];
// An import of the deleted mock module, static or dynamic.
const SOMA_MOCK_IMPORT =
  /(from|import)\s*\(?\s*["'][^"']*free\/mock\/soma(\.ts)?["']/;
const MONTHS = "Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split(" ");

/** "2026-10-14" → "Oct 14, 2026", as the page names a week. */
function weekLabel(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return `${MONTHS[m - 1]} ${d}, ${y}`;
}

/** The H.4.1 Wednesday `weeksBack` weeks before the latest one (UTC). */
function pastWednesday(weeksBack: number): string {
  const now = new Date();
  const back = (now.getUTCDay() - 3 + 7) % 7;
  const ms =
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) -
    (back + 7 * weeksBack) * 86_400_000;
  return new Date(ms).toISOString().slice(0, 10);
}

/** The text of the four live SOMA sections. */
async function somaSections(page: Page): Promise<string[]> {
  return Promise.all(
    [
      page.locator('section[aria-labelledby="snap-title"]'),
      page.locator("article.findings"),
      page.getByRole("region", { name: "When the holdings come due" }),
      page.getByRole("region", { name: "Positions by CUSIP" }),
    ].map(async (s) => (await s.textContent()) ?? "")
  );
}

/** Each section names `week`: "As of <week>" when live, "Unavailable for
 * <week>" when not. Returns which branch each took. */
async function expectSectionsName(page: Page, week: string) {
  const label = weekLabel(week);
  await expect(
    page.locator('section[aria-labelledby="snap-title"] .as-of')
  ).toHaveText(`As of ${label}`);
  const branches: string[] = [];
  for (const text of await somaSections(page)) {
    const unavailable = text.includes(`Unavailable for ${label}`);
    expect(
      unavailable || new RegExp(`as of ${label}`, "i").test(text),
      text
    ).toBe(true);
    branches.push(unavailable ? "unavailable" : "live");
  }
  return branches;
}

// US-254: /free, /free/soma and /free/tips each answer 200 inside the shell.
for (const route of ["/free", "/free/soma", "/free/tips"]) {
  test(`${route} returns 200 with the Free data explorer heading`, async ({
    page,
  }) => {
    const response = await page.goto(route);
    expect(response?.status()).toBe(200);
    await expect(
      page.getByRole("heading", { level: 1, name: "Free data explorer" })
    ).toBeVisible();
  });
}

test("/free shows the same 7 SOMA sections as /free/soma, in order", async ({
  page,
}) => {
  const sectionTitles = async (route: string): Promise<string[]> => {
    await page.goto(route);
    const h2s = page.getByRole("main").locator("h2");
    await expect(h2s).toHaveCount(7);
    await expect(h2s).toHaveText(H2S);
    return h2s.allTextContents();
  };
  expect(await sectionTitles("/free")).toEqual(
    await sectionTitles("/free/soma")
  );
});

test("/free/soma returns 200 with the 7 artboard sections", async ({
  page,
}) => {
  const response = await page.goto("/free/soma");
  expect(response?.status()).toBe(200);
  await expect(page.locator(".ft-free .content h2")).toHaveText(H2S);
});

test("the maturity profile shows Treasuries only, with no Asset type toggle", async ({
  page,
}) => {
  await page.goto("/free/soma");
  await page.waitForLoadState("networkidle");

  const maturity = page.getByRole("region", {
    name: "When the holdings come due",
  });
  await expect(maturity.getByRole("group", { name: "Asset type" })).toHaveCount(
    0
  );
  await expect(maturity.getByRole("button")).toHaveCount(0);

  const buckets = maturity.locator(".bucket");
  const live = (await buckets.count()) > 0;
  test.info().annotations.push({
    type: "live-data",
    description: live ? "SOMA buckets from the ledger" : "unavailable branch",
  });
  if (!live) {
    await expect(maturity).toContainText(/Unavailable for /);
    return;
  }
  await expect(buckets).toHaveCount(BUCKET_LABELS.length);
  for (const [i, label] of BUCKET_LABELS.entries()) {
    const row = buckets.nth(i);
    await expect(row).toContainText(label);
    const share = /· (\d+\.\d)%/.exec(
      (await row.locator(".share").textContent()) ?? ""
    );
    expect(share).not.toBeNull();
    const track = await row.locator(".track").boundingBox();
    const fill = await row.locator(".fill").boundingBox();
    expect(track).not.toBeNull();
    // A zero-width bar has no box.
    const fillWidth = fill?.width ?? 0;
    expect(
      Math.abs(fillWidth - ((track?.width ?? 0) * Number(share?.[1])) / 100)
    ).toBeLessThanOrEqual(1.5);
  }
});

for (const route of ["/free/soma", "/free"]) {
  test(`${route} shows live SOMA figures or says they are unavailable, never excluded securities`, async ({
    page,
  }) => {
    await page.goto(route);
    await page.waitForLoadState("networkidle");
    const branches = await expectSectionsName(page, pastWednesday(0));
    test.info().annotations.push({
      type: "live-data",
      description: branches.join(", "),
    });
    await expect(page.getByText(SCOPE_NOTE)).toBeVisible();
    await expect(page.getByRole("group", { name: "Asset type" })).toHaveCount(
      0
    );
    // Drop the build's hashed asset paths: their hash changes every build.
    const html = (await page.content()).replace(
      /_app\/immutable\/[^"'\s]+/g,
      ""
    );
    const stripped = html
      .split(SCOPE_NOTE)
      .join("")
      .split(TOTAL_LABEL)
      .join("");
    expect(stripped.match(EXCLUDED_WORDS)?.[0]).toBeUndefined();
  });

  test(`${route}: the Business date picker shows a past week, and it persists on reload`, async ({
    page,
  }) => {
    test.setTimeout(90_000);
    await page.goto(route);
    await page.waitForLoadState("networkidle");
    const week = pastWednesday(3);
    const picker = page.getByLabel("Business date");
    await expect(picker).toHaveValue(pastWednesday(0));
    await picker.fill(week);
    await expect(page).toHaveURL(new RegExp(`\\?asOf=${week}$`), {
      timeout: 30_000,
    });
    await expectSectionsName(page, week);

    await page.reload();
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL(new RegExp(`\\?asOf=${week}$`));
    await expect(page.getByLabel("Business date")).toHaveValue(week);
    await expectSectionsName(page, week);
  });
}

/** Every file under `dir`, recursively. */
function filesUnder(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory()
      ? filesUnder(path.join(dir, e.name))
      : [path.join(dir, e.name)]
  );
}

test("the deleted SOMA mock is imported nowhere in src/ and ships in no client script", async ({
  page,
}) => {
  expect(existsSync(path.resolve("src/lib/free/mock/soma.ts"))).toBe(false);
  const importers = filesUnder(path.resolve("src"))
    .filter((f) => /\.(ts|js|svelte)$/.test(f))
    .filter((f) => SOMA_MOCK_IMPORT.test(readFileSync(f, "utf8")));
  expect(importers).toEqual([]);

  // The scripts both SOMA routes load, as the server serves them.
  const scripts: string[] = [];
  page.on("response", async (response) => {
    if (response.request().resourceType() !== "script") return;
    scripts.push(await response.text().catch(() => ""));
  });
  for (const route of ["/free/soma", "/free"]) {
    await page.goto(route);
    await page.waitForLoadState("networkidle");
  }
  expect(scripts.length).toBeGreaterThan(0);
  // The whole built client too, when this run serves a production build.
  const client = path.resolve("build/client");
  if (existsSync(client)) {
    scripts.push(
      ...filesUnder(client)
        .filter((f) => f.endsWith(".js"))
        .map((f) => readFileSync(f, "utf8"))
    );
  }
  expect(
    SOMA_MOCK_PROSE.filter((p) => scripts.some((s) => s.includes(p)))
  ).toEqual([]);
});

test("/free/soma Positions by CUSIP: search a CUSIP, then page 100 at a time with Next", async ({
  page,
}) => {
  test.setTimeout(90_000);
  await page.goto("/free/soma");
  await page.waitForLoadState("networkidle");
  const section = page.getByRole("region", { name: "Positions by CUSIP" });
  const label = weekLabel(pastWednesday(0));
  await expect(section).toContainText(`As of ${label}`);
  const rows = section.locator("tbody tr");
  const live = (await rows.count()) > 0;
  test.info().annotations.push({
    type: "live-data",
    description: live ? "SOMA positions from the ledger" : "unavailable branch",
  });
  if (!live) {
    await expect(section).toContainText(`Unavailable for ${label}`);
    await expect(section.locator("table")).toHaveCount(0);
    return;
  }

  const status = section.getByText(/^Showing /);
  const total = Number(
    /of (\d+) positions$/.exec((await status.textContent()) ?? "")?.[1]
  );
  expect(total).toBeGreaterThan(SOMA_PAGE_SIZE);
  const firstPage = `Showing 1–${SOMA_PAGE_SIZE} of ${total} positions`;
  await expect(status).toHaveText(firstPage);
  await expect(rows).toHaveCount(SOMA_PAGE_SIZE);
  const next = section.getByRole("button", { name: "Next" });
  const previous = section.getByRole("button", { name: "Previous" });
  await expect(previous).toBeDisabled();
  await expect(next).toBeEnabled();
  const cusip = (await rows.first().locator("td").first().textContent()) ?? "";
  expect(cusip).toMatch(/^[0-9A-Z]{9}$/);

  const search = section.getByRole("searchbox", { name: "Search positions" });
  await search.fill(cusip.toLowerCase());
  await expect(rows).toHaveCount(1);
  await expect(rows.first()).toContainText(cusip);
  await expect(status).toHaveText("Showing 1–1 of 1 positions");

  await search.fill("");
  await expect(status).toHaveText(firstPage);
  await next.click();
  const secondEnd = Math.min(2 * SOMA_PAGE_SIZE, total);
  await expect(status).toHaveText(
    `Showing ${SOMA_PAGE_SIZE + 1}–${secondEnd} of ${total} positions`
  );
  await expect(rows).toHaveCount(secondEnd - SOMA_PAGE_SIZE);
  await expect(previous).toBeEnabled();
});

test("/free/soma at 375 px: no page-level horizontal scroll; only the tables scroll", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/free/soma");
  await page.waitForLoadState("networkidle");
  const widths = await page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    client: document.documentElement.clientWidth,
  }));
  expect(widths.scroll).toBeLessThanOrEqual(widths.client);

  // Every element wider than its box scrolls itself: a table wrapper or a
  // code block, nothing else.
  const scrollers = await page.evaluate(() =>
    [...document.querySelectorAll("main *")]
      .filter((el) => el.scrollWidth > el.clientWidth + 1)
      .filter((el) => /auto|scroll/.test(getComputedStyle(el).overflowX))
      .map((el) =>
        el.classList.contains("table-scroll") ? "table-scroll" : el.tagName
      )
  );
  expect(scrollers.filter((c) => c !== "table-scroll" && c !== "PRE")).toEqual(
    []
  );
  expect(scrollers).toContain("table-scroll");
  const section = page.getByRole("region", { name: "Positions by CUSIP" });
  const box = await section.boundingBox();
  expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(375);
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

// US-253 / US-298: /free/tips, logged out. The 5 DataExplorerTIPS.dc.html
// sections and the display-only calculator, with live figures from the
// server load. The host may hold no FedInvest price within 7 days, so a
// live check accepts either a dated as-of or the unavailable text, and
// records which branch ran; neither shows a mock figure.
const TIPS_H2S = [
  "What are Treasury Inflation-Protected Securities?",
  // The security's description, from the ledger security master.
  /\S/,
  "How this bond tracks inflation",
  "Value a TIPS position",
  "Pull TIPS data from the API",
];
const TIPS_UNAVAILABLE = /unavailable/i;

/** "2026-11-06" → "August–September 2026"; "2026-03-01" → "December
 * 2025–January 2026": the CPI-U months behind a date's reference CPI. */
function cpiMonthsBehind(iso: string): string {
  const [year, month] = iso.split("-").map(Number);
  const [first, second] = [3, 2].map((lag) => {
    const d = new Date(Date.UTC(year, month - 1 - lag, 1));
    return {
      year: d.getUTCFullYear(),
      name: d.toLocaleString("en-US", { month: "long", timeZone: "UTC" }),
    };
  });
  return first.year === second.year
    ? `${first.name}–${second.name} ${second.year}`
    : `${first.name} ${first.year}–${second.name} ${second.year}`;
}

test("/free/tips returns 200 with the 5 artboard sections in the shell", async ({
  page,
}) => {
  const response = await page.goto("/free/tips");
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("navigation", { name: "Primary" })).toBeVisible();
  await expect(page.locator(".ft-free .content h2")).toHaveText(TIPS_H2S);
});

test("/free/tips shows live figures or says they are unavailable, never the mock", async ({
  page,
}) => {
  await page.goto("/free/tips");
  const widget = page.locator('section[aria-labelledby="sec-title"]');
  const asOf = widget.locator(".as-of");
  const asOfText = (await asOf.textContent()) ?? "";
  const calc = page.getByRole("region", { name: TIPS_H2S[3] as string });

  const dated = /As of (\d{4}-\d{2}-\d{2})/.exec(asOfText);
  test.info().annotations.push({
    type: "live-data",
    description: dated
      ? `FedInvest price dated ${dated[1]}`
      : "no FedInvest price within 7 days: unavailable branch",
  });
  if (dated) {
    const priceDate = dated[1];
    const ageDays = (Date.now() - Date.parse(priceDate)) / 86_400_000;
    expect(ageDays).toBeGreaterThanOrEqual(0);
    expect(ageDays).toBeLessThan(8);
    await expect(
      calc.getByText(`Real clean price (FedInvest, ${priceDate})`)
    ).toBeVisible();
    await expect(
      widget.locator("dl > div").filter({ hasText: "CUSIP" }).locator("dd")
    ).toHaveText("91282CPU9");
    await expect(
      widget
        .locator("dl > div")
        .filter({ hasText: "Index ratio" })
        .locator("dd")
    ).toHaveText(/^\d+\.\d{5}$|^Unavailable$/);
    // US-310: the next coupon is labelled with its pay date as an estimate
    // at today's index ratio, with the note on why the paid amount differs.
    // The date comes from the same valuation as the figure, so it is absent
    // only when the valuation is unavailable.
    const nextCoupon = calc
      .locator(".tile")
      .filter({ has: page.locator("dt", { hasText: "Next coupon" }) });
    const nextCouponValue =
      (await nextCoupon.locator("dd").textContent()) ?? "";
    await expect(nextCoupon.locator("dt")).toHaveText(
      nextCouponValue === "Unavailable"
        ? "Next coupon, at today's index ratio"
        : /^Next coupon \(\w+ \d{1,2}, \d{4}\), at today's index ratio$/
    );
    await expect(calc).toContainText(NEXT_COUPON_NOTE);
    // US-312: step 3 names the CPI-U months behind the as-of date's
    // reference CPI (months m-3 and m-2) and states the lag. The example
    // shows only when every source loaded; else it says unavailable.
    const example = page.getByRole("article", { name: TIPS_H2S[2] as string });
    const step3 = example
      .getByRole("listitem")
      .filter({ hasText: "The index ratio measures inflation so far" });
    if ((await example.getByRole("list").count()) > 0) {
      await expect(step3).toContainText(
        "Reference CPI lags about three months."
      );
      await expect(step3).toContainText(
        `built from ${cpiMonthsBehind(priceDate)} CPI`
      );
      const step5 = example
        .getByRole("listitem")
        .filter({ hasText: "Coupons are paid on the larger principal" });
      await expect(step5).toContainText("at today's index ratio");
      await expect(step5).toContainText(NEXT_COUPON_NOTE);
    } else {
      await expect(example).toContainText(TIPS_UNAVAILABLE);
    }
  } else {
    await expect(asOf).toHaveText(/Live price unavailable/);
    await expect(
      page.getByRole("article", { name: TIPS_H2S[2] as string })
    ).toContainText(TIPS_UNAVAILABLE);
  }

  // The ledger holds the same bond, so its static terms may equal the
  // mock's. Allow a security-master value only where the live panel shows
  // it in its own row; any other mock figure fails.
  const allowed = new Set<string>();
  for (const [label, value] of MOCK_SECURITY_MASTER) {
    const shown = await widget
      .locator("dl > div")
      .filter({ has: page.locator("dt", { hasText: label }) })
      .locator("dd")
      .allTextContents();
    if (shown.includes(value)) allowed.add(value.replace(/%$/, ""));
  }
  test.info().annotations.push({
    type: "security-master",
    description: `live values equal to the mock's: ${
      [...allowed].join(", ") || "none"
    }`,
  });
  // Drop the build's hashed asset paths: their hash changes every build, so
  // one like "nodes/9.5c…js" would read as the mock's "9.5" years.
  const html = (await page.content()).replace(/_app\/immutable\/[^"'\s]+/g, "");
  expect(mockFiguresIn(html).filter((f) => !allowed.has(f))).toEqual([]);
  expect(html).not.toContain("2026-06-30");
});

test("/free/tips calculator is disabled and shows its defaults", async ({
  page,
}) => {
  await page.goto("/free/tips");
  await page.waitForLoadState("networkidle");
  const calc = page.getByRole("region", { name: TIPS_H2S[3] as string });

  for (const label of [
    "Face value ($)",
    "Real coupon (%)",
    "Base ref CPI",
    "Current ref CPI",
    "Years to maturity",
    "Real yield (%)",
  ]) {
    await expect(calc.getByLabel(label, { exact: true })).toBeDisabled();
  }
  const inflation = calc.getByLabel("Assumed annual inflation (%)", {
    exact: true,
  });
  await expect(inflation).toBeDisabled();
  await expect(inflation).toHaveValue("2.30");
  await expect(calc.getByRole("textbox")).toHaveCount(7);
  // US-298b: the projected cashflows need an inflation forecast.
  await expect(calc.locator("tbody tr")).toHaveCount(1);
  await expect(calc.locator("tbody tr")).toContainText(TIPS_UNAVAILABLE);
  await expect(calc.locator("button:enabled")).toHaveCount(0);

  await expect(calc).toContainText(
    "Pre-filled with the January 2036 bond. This preview shows the default result; sign in to change the real yield and inflation."
  );
  await expect(
    page.getByText("Change the real yield and your inflation assumption")
  ).toHaveCount(0);
});

// US-307: the same for /free/soma and /free, including the __data.json a
// Business date pick fetches on the client.
for (const [route, extra] of [
  ["/free/tips", []],
  [
    "/free/soma",
    [
      `/free/soma/__data.json?asOf=${pastWednesday(3)}`,
      "/free/soma/__data.json",
    ],
  ],
  [
    "/free",
    [`/free/__data.json?asOf=${pastWednesday(3)}`, "/free/__data.json"],
  ],
] as const) {
  test(`${route}: FT_HOMEPAGE_API_KEY never reaches the browser`, async ({
    page,
    request,
  }) => {
    const key = process.env.FT_HOMEPAGE_API_KEY?.trim() ?? "";
    test.skip(
      !key,
      "FT_HOMEPAGE_API_KEY not set for this run (scripts/checks/e2e.sh exports it)"
    );
    const urls =
      route === "/free/tips"
        ? [route, "/free/tips/__data.json"]
        : [route, ...extra];
    for (const url of urls) {
      const response = await request.get(url);
      expect(response.status(), `GET ${url}`).toBe(200);
      expect(await response.text(), `GET ${url} body`).not.toContain(key);
    }
    const headers: string[] = [];
    page.on("request", (req) => headers.push(JSON.stringify(req.headers())));
    await page.goto(route);
    await page.waitForLoadState("networkidle");
    expect(await page.content()).not.toContain(key);
    expect(headers.filter((h) => h.includes(key))).toEqual([]);
  });
}
