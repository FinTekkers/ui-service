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
 *
 * US-337: the time-series charts (SPY's three, Holdings over time) are
 * Plotly plots, loaded lazily: range buttons, hover, a fitted shares axis.
 *
 * US-339: /free/tech-vs-sp500, linked from the dataset picker, draws the
 * XLK ÷ SPY drawdown in two Plotly panels or says why it can't.
 *
 * US-341: /free/sigma-moves draws each fund's σ moves in a Plotly panel, or
 * says why it can't, and fits a 375 px screen.
 *
 * US-346: SPY's fee chart must plot, with its annualised run-rate line on a
 * right-hand axis; one hover shows the month's fee and its run rate.
 *
 * US-352: /free/request, reached from the dataset picker, shows field
 * errors, never claims success when mail can't be sent, and confirms a
 * request; the mail transport ships in no client script.
 */
import { test, expect, type Locator, type Page } from "@playwright/test";
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
    // US-311: clean value, accrued interest and full value. Accrued comes
    // from valuation-service; without it, accrued and full both read
    // Unavailable and clean still shows. Full = clean + accrued to the cent.
    const tile = (label: string) =>
      calc
        .locator(".tile")
        .filter({
          has: page.locator("dt", { hasText: new RegExp(`^${label}$`) }),
        })
        .locator("dd");
    const clean = (await tile("Clean value").textContent()) ?? "";
    const accrued = (await tile("Accrued interest").textContent()) ?? "";
    const full =
      (await tile("Full value \\(clean \\+ accrued\\)").textContent()) ?? "";
    const DOLLARS = /^\$[\d,]+\.\d{2}$/;
    const cents = (shown: string) =>
      Math.round(Number(shown.replace(/[$,]/g, "")) * 100);
    if (clean === "Unavailable") {
      // The whole valuation failed: every valuation tile says so.
      expect([accrued, full]).toEqual(["Unavailable", "Unavailable"]);
    } else {
      expect(clean).toMatch(DOLLARS);
      if (accrued === "Unavailable") {
        expect(full).toBe("Unavailable");
      } else {
        expect(accrued).toMatch(DOLLARS);
        expect(full).toMatch(DOLLARS);
        expect(cents(full)).toBe(cents(clean) + cents(accrued));
      }
    }
    test.info().annotations.push({
      type: "accrued-interest",
      description:
        accrued === "Unavailable"
          ? "accrued interest unavailable"
          : `clean ${clean} + accrued ${accrued} = full ${full}`,
    });
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
  // US-311: the page no longer assumes a coupon date, and the clean value
  // is labelled as such.
  await expect(
    page.getByText("Assumes valuation on a coupon date")
  ).toHaveCount(0);
  await expect(calc.getByText("Position value")).toHaveCount(0);

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

// US-317: Holdings over time is the ledger's weekly SOMA par, streamed after
// the rest of the page. The host ledger may hold no SOMA history for the
// week, so each check accepts the chart or the unavailable text, both naming
// the week, and records which branch ran.

// US-337: the time-series charts are Plotly plots. Plotly adds
// .js-plotly-plot to a chart's box once it has drawn; the box itself is
// rendered (empty) on the server.
const UNAVAILABLE = /^Unavailable( for [^:]+)?: .{10,}/;

/** A chart section shows one Plotly plot, or "Unavailable…" and no plot. */
async function plotBranch(section: Locator): Promise<"plot" | "unavailable"> {
  const plot = section.locator(".js-plotly-plot");
  const unavailable = section.getByText(UNAVAILABLE);
  await expect(plot.or(unavailable).first()).toBeVisible({ timeout: 30_000 });
  if (await unavailable.count()) {
    await expect(plot).toHaveCount(0);
    return "unavailable";
  }
  await expect(plot).toHaveCount(1);
  return "plot";
}

/** A plot's x and y ranges as drawn, and its first trace's points. */
async function plotState(plot: Locator) {
  return plot.evaluate((el: any) => ({
    x: (el._fullLayout.xaxis.range as unknown[]).map(String),
    y: [...el._fullLayout.yaxis.range] as number[],
    xs: el.data[0].x as string[],
    ys: el.data[0].y as (number | null)[],
  }));
}

/** Waits for Holdings over time to finish loading for `week`, and checks it
 * names the week: the chart's latest point, or the unavailable text. */
async function expectHistoryNames(
  page: Page,
  week: string
): Promise<"live" | "unavailable"> {
  const label = weekLabel(week);
  const section = page.getByRole("region", { name: "Holdings over time" });
  const summary = section.getByText(/^Latest: /);
  const unavailable = section.getByText(`Unavailable for ${label}`);
  await expect(summary.or(unavailable)).toBeVisible({ timeout: 30_000 });
  if (await unavailable.isVisible()) return "unavailable";
  await expect(summary).toHaveText(
    new RegExp(`^Latest: \\$\\d+\\.\\d{3}T on ${label}$`)
  );
  await expect(section.getByTestId("hist-plot")).toHaveAccessibleName(
    new RegExp(`to \\$\\d+\\.\\d{3}T on ${label}, stacked by`)
  );
  return "live";
}

for (const route of ["/free/soma", "/free"]) {
  test(`${route} Holdings over time: Plotly's 1Y, 5Y and All, each ending at the week, the stack from 0`, async ({
    page,
  }) => {
    test.setTimeout(90_000);
    await page.goto(route);
    await page.waitForLoadState("networkidle");
    const week = pastWednesday(0);
    const branch = await expectHistoryNames(page, week);
    test.info().annotations.push({
      type: "live-data",
      description:
        branch === "live" ? "SOMA history from the ledger" : "unavailable",
    });
    const section = page.getByRole("region", { name: "Holdings over time" });
    const plot = section.locator(".js-plotly-plot");
    if (branch === "unavailable") {
      await expect(plot).toHaveCount(0);
      await expect(page.getByRole("main").locator("h2")).toHaveText(H2S);
      return;
    }
    await expect(plot).toHaveCount(1, { timeout: 30_000 });
    // A range the ledger can't fill keeps its note.
    for (const name of ["1Y", "5Y"]) {
      const note = section.locator(`[id="hist-note-${name}"]`);
      if (await note.count()) {
        await expect(note).toContainText(`${name} needs history from`);
      }
    }
    // Each range twice, via All: a second pick must not break it.
    for (const name of ["1Y", "5Y", "All", "1Y", "5Y"]) {
      await section.getByText(name, { exact: true }).click();
      await expect.poll(() => plotState(plot).then((s) => s.y[0])).toBe(0);
      const state = await plotState(plot);
      // The last week is the page's week, and it is in view.
      expect(state.xs[state.xs.length - 1]).toBe(week);
      expect(state.x[1] >= week).toBe(true);
    }
  });

  test(`${route} Holdings over time follows the Business date, and on reload`, async ({
    page,
  }) => {
    test.setTimeout(90_000);
    await page.goto(route);
    await page.waitForLoadState("networkidle");
    await expectHistoryNames(page, pastWednesday(0));
    const week = pastWednesday(3);
    await page.getByLabel("Business date").fill(week);
    await expect(page).toHaveURL(new RegExp(`\\?asOf=${week}$`), {
      timeout: 30_000,
    });
    // A client navigation: the chart streams in through __data.json.
    const branch = await expectHistoryNames(page, week);
    test.info().annotations.push({ type: "live-data", description: branch });

    await page.reload();
    await page.waitForLoadState("networkidle");
    await expectHistoryNames(page, week);
  });
}

// US-334: /free/spy, SPY's stored SecurityMetric series. US-338: one page,
// /free/etf/[ticker], for every fund in ETF_FUNDS (SPY and TQQQ); /free/spy
// is a 301 to /free/etf/spy, and any other ticker is a 404. The host stores
// every series these pages read for both funds, so each chart must plot.
test.describe("US-338 /free/etf/[ticker]", () => {
  const FUNDS = [
    { slug: "spy", ticker: "SPY" },
    { slug: "tqqq", ticker: "TQQQ" },
  ];
  const ETF_HEADINGS = [
    "Shares outstanding over time",
    "Monthly AUM change: net flows vs market move",
    "Sponsor fee revenue over time",
  ];

  /** Each chart's region holds exactly one drawn Plotly plot. */
  async function expectEtfCharts(page: Page, ticker: string) {
    await expect(
      page.getByRole("heading", { name: `What is ${ticker}?` })
    ).toBeVisible();
    for (const name of ETF_HEADINGS) {
      const section = page.getByRole("region", { name });
      await expect(section.getByRole("heading", { name })).toBeVisible();
      expect(await plotBranch(section), `${ticker}: ${name}`).toBe("plot");
    }
  }

  /** Opens the dataset picker and checks it links both funds. */
  async function openPickerWithFunds(page: Page) {
    // The picker opens only once the page has hydrated.
    await page.waitForLoadState("networkidle");
    const picker = page.getByRole("button", { name: /Public dataset/ });
    await picker.click();
    await expect(picker).toHaveAttribute("aria-expanded", "true");
    for (const { slug, ticker } of FUNDS) {
      await expect(
        page.getByRole("link", { name: new RegExp(`\\(${ticker}\\)`) })
      ).toHaveAttribute("href", `/free/etf/${slug}`);
    }
  }

  for (const { slug, ticker } of FUNDS) {
    test(`journey: /free → dataset picker → ${ticker} → three Plotly charts, and on reload`, async ({
      page,
    }) => {
      test.setTimeout(90_000);
      await page.goto("/free");
      await openPickerWithFunds(page);
      await page
        .getByRole("link", { name: new RegExp(`\\(${ticker}\\)`) })
        .click();
      await expect(page).toHaveURL(new RegExp(`/free/etf/${slug}$`));
      await expectEtfCharts(page, ticker);
      const response = await page.reload();
      expect(response?.status()).toBe(200);
      await expectEtfCharts(page, ticker);
    });

    test(`/free/etf/${slug} at 375 px: no horizontal scroll, nothing wider than the viewport`, async ({
      page,
    }) => {
      test.setTimeout(90_000);
      await page.setViewportSize({ width: 375, height: 812 });
      const response = await page.goto(`/free/etf/${slug}`);
      expect(response?.status()).toBe(200);
      await expectEtfCharts(page, ticker);
      const widths = await page.evaluate(() => ({
        scroll: document.documentElement.scrollWidth,
        client: document.documentElement.clientWidth,
      }));
      expect(widths.scroll).toBeLessThanOrEqual(widths.client);
      const tooWide = await page.evaluate(() =>
        [...document.querySelectorAll("main *")]
          .filter((el) => el.getBoundingClientRect().right > 375 + 1)
          .map((el) => `${el.tagName}.${el.className}`)
      );
      expect(tooWide).toEqual([]);
    });

    test(`/free/etf/${slug}: FT_HOMEPAGE_API_KEY never reaches the browser`, async ({
      page,
      request,
    }) => {
      const key = process.env.FT_HOMEPAGE_API_KEY?.trim() ?? "";
      test.skip(
        !key,
        "FT_HOMEPAGE_API_KEY not set for this run (scripts/checks/e2e.sh exports it)"
      );
      for (const url of [
        `/free/etf/${slug}`,
        `/free/etf/${slug}/__data.json`,
      ]) {
        const response = await request.get(url);
        expect(response.status(), `GET ${url}`).toBe(200);
        expect(await response.text(), `GET ${url} body`).not.toContain(key);
      }
      const headers: string[] = [];
      page.on("request", (req) => headers.push(JSON.stringify(req.headers())));
      await page.goto(`/free/etf/${slug}`);
      await page.waitForLoadState("networkidle");
      expect(await page.content()).not.toContain(key);
      expect(headers.filter((h) => h.includes(key))).toEqual([]);
    });
  }

  test("the dataset picker on /free/etf/tqqq links both funds", async ({
    page,
  }) => {
    await page.goto("/free/etf/tqqq");
    await openPickerWithFunds(page);
  });

  test("/free/spy: GET and HEAD are a 301 to /free/etf/spy; a visit lands there", async ({
    page,
    request,
  }) => {
    for (const method of ["get", "head"] as const) {
      const response = await request[method]("/free/spy", { maxRedirects: 0 });
      expect(response.status(), method).toBe(301);
      expect(response.headers()["location"], method).toBe("/free/etf/spy");
    }
    const response = await page.goto("/free/spy");
    expect(response?.status()).toBe(200);
    await expect(page).toHaveURL(/\/free\/etf\/spy$/);
    await expectEtfCharts(page, "SPY");
  });

  test("an unknown or uppercase ticker is a 404", async ({ request }) => {
    for (const url of [
      "/free/etf/xyz",
      "/free/etf/SPY",
      "/free/etf/xyz/__data.json",
    ]) {
      const response = await request.get(url);
      expect(response.status(), url).toBe(404);
    }
  });

  // Metric 3's PR screenshots, on request only:
  // ETF_SHOTS=<dir> npx playwright test free-pages -g "ETF screenshots"
  test("ETF screenshots at 1,280 px and 390 px", async ({ page }) => {
    const dir = process.env.ETF_SHOTS;
    test.skip(!dir, "ETF_SHOTS not set: PR screenshots only");
    test.setTimeout(120_000);
    for (const { slug, ticker } of FUNDS) {
      for (const width of [1280, 390]) {
        // The app shell scrolls inside its own container, so a full-page
        // shot stops at the viewport: make the viewport the page's height.
        await page.setViewportSize({ width, height: 900 });
        await page.goto(`/free/etf/${slug}`);
        await expectEtfCharts(page, ticker);
        const height = await page
          .locator(".ft-free")
          .evaluate((el) => Math.ceil(el.getBoundingClientRect().height) + 200);
        await page.setViewportSize({ width, height });
        await page.screenshot({
          path: path.join(dir as string, `${slug}-${width}.png`),
        });
      }
    }
  });
});

// US-337: the free pages' time-series charts are Plotly plots, loaded only
// on the pages that show them. Each chart is a plot or "Unavailable" with no
// plot; shares outstanding and Holdings over time must plot on the host.
test.describe("US-337 Plotly charts", () => {
  const DAY = /[A-Z][a-z]{2} \d{1,2}, \d{4}/;
  const MONTH = /[A-Z][a-z]{2} \d{4}/;
  // A hover row: "Shares outstanding: 1,021,382,116", "Net flows: −$4.1B".
  const VALUE = /: −?\$?\d[\d,]*(\.\d+)?/;
  const FEES = "Sponsor fee revenue over time";
  const CHARTS: Record<string, [string, RegExp, boolean][]> = {
    "/free/etf/spy": [
      ["Shares outstanding over time", DAY, true],
      ["Monthly AUM change: net flows vs market move", MONTH, false],
      // US-346: the host stores SPY's EXPENSE_RATIO and AUM, so it plots.
      ["Sponsor fee revenue over time", MONTH, true],
    ],
    "/free/soma": [["Holdings over time", DAY, true]],
    "/free": [["Holdings over time", DAY, true]],
  };

  for (const width of [1280, 375]) {
    for (const [route, charts] of Object.entries(CHARTS)) {
      test(`${route} at ${width} px: each chart is a Plotly plot or Unavailable, hover shows a date and value, no horizontal scroll`, async ({
        page,
      }) => {
        test.setTimeout(120_000);
        await page.setViewportSize({ width, height: 812 });
        await page.goto(route);
        const branches: string[] = [];
        for (const [name, date, mustPlot] of charts) {
          const section = page.getByRole("region", { name });
          const branch = await plotBranch(section);
          branches.push(`${name}: ${branch}`);
          if (mustPlot) expect(branch, `${name} must plot`).toBe("plot");
          if (branch === "unavailable") continue;

          // Hover a drawn point near the middle: between two thin bars
          // there may be nothing to show. Re-measured on each try, as a
          // late resize (Plotly is responsive) can move the plot.
          const plot = section.locator(".js-plotly-plot");
          const hover = section.locator(".hoverlayer");
          await plot.scrollIntoViewIfNeeded();
          await expect(async () => {
            const box = await plot.boundingBox();
            if (!box) throw new Error(`${name}: no plot`);
            const [px, py] = await plot.evaluate((el: any) => {
              const { x, y } = el.data[0];
              let i = Math.floor(x.length / 2);
              while (i < x.length - 1 && y[i] === null) i++;
              const xa = el._fullLayout.xaxis;
              const ya = el._fullLayout.yaxis;
              return [
                xa._offset + xa.d2p(x[i]),
                ya._offset + ya.d2p(Math.max(y[i], 0) / 2),
              ];
            });
            await page.mouse.move(box.x + px - 2, box.y + py);
            await page.mouse.move(box.x + px, box.y + py);
            // Plotly throttles hover: the label can follow the move.
            await expect(hover).toContainText(date, { timeout: 2_000 });
            await expect(hover).toContainText(VALUE, { timeout: 2_000 });
            // US-346: one hover shows the month's fee and its run rate.
            if (name === FEES) {
              await expect(hover).toContainText("Annualised run rate", {
                timeout: 2_000,
              });
              await expect(hover).toContainText("a year", { timeout: 2_000 });
            }
          }).toPass({ timeout: 20_000 });
          await page.mouse.move(0, 0);
          if (name === FEES) {
            // US-346: bars and the run-rate line on a right-hand axis.
            const drawn = await plot.evaluate((el: any) => ({
              traces: el.data.length,
              right: el._fullLayout.yaxis2?.title?.text,
            }));
            expect(drawn).toEqual({
              traces: 2,
              right: "Annualised run rate ($ per year)",
            });
          }
        }
        test.info().annotations.push({
          type: "branches",
          description: branches.join("; "),
        });
        if (width !== 375) return;

        const widths = await page.evaluate(() => ({
          scroll: document.documentElement.scrollWidth,
          client: document.documentElement.clientWidth,
        }));
        expect(widths.scroll).toBeLessThanOrEqual(widths.client);
        for (const [name] of charts) {
          const tooWide = await page
            .getByRole("region", { name })
            .evaluate((section) =>
              [section, ...section.querySelectorAll("*")]
                .filter((el) => el.getBoundingClientRect().right > 375 + 1)
                .map((el) => `${el.tagName}.${el.getAttribute("class")}`)
            );
          expect(tooWide, name).toEqual([]);
        }
      });
    }
  }

  test("metric 3: /free/etf/spy after 1Y, the shares y-axis starts above 0, within 10% of the 1Y span below the 1Y minimum", async ({
    page,
  }) => {
    test.setTimeout(90_000);
    await page.goto("/free/etf/spy");
    const section = page.getByRole("region", {
      name: "Shares outstanding over time",
    });
    expect(await plotBranch(section)).toBe("plot");
    const plot = section.locator(".js-plotly-plot");
    const before = await plotState(plot);
    await section.getByText("1Y", { exact: true }).click();
    // The refit hook has run once the y range moves off the All fit.
    await expect
      .poll(() => plotState(plot).then((s) => s.y[0]), { timeout: 10_000 })
      .not.toBe(before.y[0]);
    const { x, y, xs, ys } = await plotState(plot);
    const visible = ys.filter(
      (v, i): v is number => v !== null && xs[i] >= x[0] && xs[i] <= x[1]
    );
    expect(visible.length).toBeGreaterThan(100);
    const min = Math.min(...visible);
    const max = Math.max(...visible);
    const lo = y[0];
    test.info().annotations.push({
      type: "1Y",
      description: `x ${x.join(" to ")}; data ${min}–${max}B; y from ${lo}`,
    });
    expect(lo).toBeGreaterThan(0);
    expect(lo).toBeLessThanOrEqual(min);
    expect(lo).toBeGreaterThanOrEqual(min - 0.1 * (max - min));
  });

  test("metric 4: /free/etf/spy loads the plotly.js-dist chunk; /free/tips requests no Plotly chunk", async ({
    page,
  }) => {
    test.setTimeout(90_000);
    const requested: string[] = [];
    page.on("request", (req) => requested.push(req.url()));
    await page.goto("/free/tips");
    await page.waitForLoadState("networkidle");
    expect(requested.filter((url) => /plotly/i.test(url))).toEqual([]);

    // Vite names the library's chunk plotly.<hash>.js (PlotlyChart.<hash>.js
    // is the wrapper's, so it doesn't count).
    const chunk = page.waitForResponse((res) =>
      /\/plotly\.[\w-]+\.js$/.test(new URL(res.url()).pathname)
    );
    await page.goto("/free/etf/spy");
    const response = await chunk;
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toMatch(/javascript/);
    await expect(page.locator(".js-plotly-plot").first()).toBeVisible({
      timeout: 30_000,
    });
  });

  // Metric 5's PR screenshots, on request only:
  // CHART_SHOTS=<dir> npx playwright test free-pages -g "chart screenshots"
  test("US-337 chart screenshots: each chart at All and 1Y, at 1,280 px and 390 px", async ({
    page,
  }) => {
    const dir = process.env.CHART_SHOTS;
    test.skip(!dir, "CHART_SHOTS not set: PR screenshots only");
    test.setTimeout(180_000);
    const shots: [string, string, string][] = [
      ["/free/etf/spy", "Shares outstanding over time", "spy-shares"],
      [
        "/free/etf/spy",
        "Monthly AUM change: net flows vs market move",
        "spy-flows",
      ],
      ["/free/etf/spy", "Sponsor fee revenue over time", "spy-fees"],
      ["/free/soma", "Holdings over time", "soma-history"],
    ];
    for (const width of [1280, 390]) {
      await page.setViewportSize({ width, height: 900 });
      for (const [route, name, file] of shots) {
        await page.goto(route);
        const section = page.getByRole("region", { name });
        if ((await plotBranch(section)) === "unavailable") continue;
        await section.scrollIntoViewIfNeeded();
        for (const range of ["All", "1Y"]) {
          await section.getByText(range, { exact: true }).click();
          // Off the buttons: a hovered button is drawn like the active one.
          await page.mouse.move(0, 0);
          await page.waitForTimeout(500);
          await section.screenshot({
            path: path.join(dir as string, `${file}-${range}-${width}.png`),
          });
        }
      }
    }
  });
});

// US-339: /free/tech-vs-sp500, the XLK ÷ SPY drawdown from its 252-session
// high, from PriceService closes. The host may not hold XLK or SPY closes
// deep enough (MDI-162), so each panel accepts its Plotly plot or
// "Unavailable" with a reason, and records which branch ran.
test.describe("US-339 /free/tech-vs-sp500", () => {
  const ROUTE = "/free/tech-vs-sp500";
  const PANELS = ["Full history", "Since 2004"];

  /** Both panels drawn (plus the 'worst since' line) or both unavailable. */
  async function expectTechPanels(page: Page): Promise<string> {
    await expect(
      page.getByRole("heading", {
        name: "Tech's drawdown relative to the S&P 500",
      })
    ).toBeVisible();
    const branches: string[] = [];
    for (const name of PANELS) {
      branches.push(await plotBranch(page.getByRole("region", { name })));
    }
    expect(branches[1]).toBe(branches[0]);
    const headline = page.getByTestId("tech-headline");
    if (branches[0] === "plot") {
      await expect(headline).toHaveText(
        /(worst since [A-Z][a-z]{2} \d{1,2}, \d{4}|52-week relative high|deepest on record)/
      );
    } else {
      await expect(headline).toHaveCount(0);
    }
    return branches[0];
  }

  test("journey: /free → dataset picker → tech vs S&P 500 → both panels, and on reload", async ({
    page,
  }) => {
    test.setTimeout(90_000);
    await page.goto("/free");
    // The picker opens only once the page has hydrated.
    await page.waitForLoadState("networkidle");
    const picker = page.getByRole("button", { name: /Public dataset/ });
    await picker.click();
    await expect(picker).toHaveAttribute("aria-expanded", "true");
    await page
      .getByRole("link", { name: /drawdown relative to the S&P 500/ })
      .click();
    await expect(page).toHaveURL(/\/free\/tech-vs-sp500$/);
    const branch = await expectTechPanels(page);
    test.info().annotations.push({ type: "branch", description: branch });
    const response = await page.reload();
    expect(response?.status()).toBe(200);
    expect(await expectTechPanels(page)).toBe(branch);
  });

  test("/free/tech-vs-sp500 at 375 px: no horizontal scroll once the panels have drawn", async ({
    page,
  }) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width: 375, height: 812 });
    const response = await page.goto(ROUTE);
    expect(response?.status()).toBe(200);
    // Plotly draws after hydration and could widen the page: measure after.
    const branch = await expectTechPanels(page);
    test.info().annotations.push({ type: "branch", description: branch });
    const widths = await page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      client: document.documentElement.clientWidth,
    }));
    expect(widths.scroll).toBeLessThanOrEqual(widths.client);
  });

  test("/free/tech-vs-sp500: FT_HOMEPAGE_API_KEY never reaches the browser", async ({
    page,
    request,
  }) => {
    const key = process.env.FT_HOMEPAGE_API_KEY?.trim() ?? "";
    test.skip(
      !key,
      "FT_HOMEPAGE_API_KEY not set for this run (scripts/checks/e2e.sh exports it)"
    );
    for (const url of [ROUTE, `${ROUTE}/__data.json`]) {
      const response = await request.get(url);
      expect(response.status(), `GET ${url}`).toBe(200);
      expect(await response.text(), `GET ${url} body`).not.toContain(key);
    }
    const headers: string[] = [];
    page.on("request", (req) => headers.push(JSON.stringify(req.headers())));
    await page.goto(ROUTE);
    await page.waitForLoadState("networkidle");
    expect(await page.content()).not.toContain(key);
    expect(headers.filter((h) => h.includes(key))).toEqual([]);
  });

  // US-347: closes.ts reads every stored close, not the newest 1,000. The
  // host holds XLK from 1998 and SPY from 1993 (MDI-162), so both panels
  // must plot, "Full history" starts in Dec 1999 (a 252-session warm-up
  // after 1998-12-22) and reaches the dot-com trough, and "Since 2004"
  // starts in Jan 2004 with no "Data available from" note.
  test("US-347 /free/tech-vs-sp500: full history from Dec 1999 reaches the 2000–2002 trough, and on reload", async ({
    page,
  }) => {
    test.setTimeout(90_000);
    const response = await page.goto(ROUTE);
    expect(response?.status()).toBe(200);
    for (const pass of ["load", "reload"]) {
      if (pass === "reload") {
        expect((await page.reload())?.status()).toBe(200);
      }
      expect(
        await expectTechPanels(page),
        `${pass}: both panels plot (host holds XLK and SPY since the 1990s)`
      ).toBe("plot");
      const items = await page
        .getByTestId("tech-troughs")
        .locator("li")
        .allInnerTexts();
      const dotCom = items.filter((text) => {
        const year = Number(text.match(/\b(\d{4})\b/)?.[1]);
        const pct = Number(text.match(/−(\d+(?:\.\d+)?)%/)?.[1] ?? 0);
        return year >= 2000 && year <= 2002 && pct >= 40;
      });
      expect(dotCom, `${pass}: troughs ${JSON.stringify(items)}`).not.toEqual(
        []
      );
      const [full, since2004] = await Promise.all(
        PANELS.map((name) =>
          page.getByRole("region", { name }).locator(".caption").innerText()
        )
      );
      expect(full, `${pass}: Full history caption`).toMatch(
        /Daily, Dec \d{1,2}, 1999 to/
      );
      expect(since2004, `${pass}: Since 2004 caption`).toMatch(
        /Daily, Jan \d{1,2}, 2004 to/
      );
      expect(since2004, `${pass}: Since 2004 caption`).not.toContain(
        "Data available from"
      );
      expect(since2004, `${pass}: the panels differ`).not.toBe(full);
    }
  });

  // Metric 5's PR screenshots, on request only:
  // TECH_SHOTS=<dir> npx playwright test free-pages -g "tech vs S&P 500 screenshots"
  test("tech vs S&P 500 screenshots at 1,280 px and 390 px", async ({
    page,
  }) => {
    const dir = process.env.TECH_SHOTS;
    test.skip(!dir, "TECH_SHOTS not set: PR screenshots only");
    for (const width of [1280, 390]) {
      // The app shell scrolls inside its own container: make the viewport
      // the page's height for a whole-page shot.
      await page.setViewportSize({ width, height: 900 });
      await page.goto(ROUTE);
      await expectTechPanels(page);
      const height = await page
        .locator(".ft-free")
        .evaluate((el) => Math.ceil(el.getBoundingClientRect().height) + 200);
      await page.setViewportSize({ width, height });
      await page.screenshot({
        path: path.join(dir as string, `tech-vs-sp500-${width}.png`),
      });
    }
  });
});

// US-341: /free/sigma-moves, each fund's daily return in standard
// deviations of its previous 100, from PriceService closes. The host may not
// hold enough closes for a fund (TQQQ is unconfirmed), so each panel accepts
// its Plotly plot or "Unavailable" with a reason, and records which ran.
test.describe("US-341 /free/sigma-moves", () => {
  const ROUTE = "/free/sigma-moves";
  const FUNDS = [
    { ticker: "SPY", name: "SPDR S&P 500 ETF Trust (SPY)" },
    { ticker: "TQQQ", name: "ProShares UltraPro QQQ (TQQQ)" },
  ];

  /** The selected fund's panel drawn (with the summary line) or unavailable. */
  async function expectSigmaPanel(page: Page, name: string): Promise<string> {
    const branch = await plotBranch(page.getByRole("region", { name }));
    const summary = page.getByTestId("sigma-summary");
    if (branch === "plot") {
      await expect(summary).toHaveText(
        /^Latest: [−+]?\d+\.\d{2}σ on [A-Z][a-z]{2} \d{1,2}, \d{4}\. \d+ days? in this range fell outside ±3σ\.$/
      );
    } else {
      await expect(summary).toHaveCount(0);
    }
    return branch;
  }

  test("/free/sigma-moves at 375 px: no horizontal scroll for either fund once drawn", async ({
    page,
  }) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width: 375, height: 812 });
    const response = await page.goto(ROUTE);
    expect(response?.status()).toBe(200);
    // The fund buttons work only once the page has hydrated.
    await page.waitForLoadState("networkidle");
    for (const { ticker, name } of FUNDS) {
      const button = page.getByRole("button", { name: ticker, exact: true });
      await button.click();
      await expect(button).toHaveAttribute("aria-pressed", "true");
      // Plotly draws after hydration and could widen the page: measure after.
      const branch = await expectSigmaPanel(page, name);
      test.info().annotations.push({
        type: "branch",
        description: `${ticker}: ${branch}`,
      });
      const widths = await page.evaluate(() => ({
        scroll: document.documentElement.scrollWidth,
        client: document.documentElement.clientWidth,
      }));
      expect(widths.scroll, ticker).toBeLessThanOrEqual(widths.client);
      const tooWide = await page.evaluate(() =>
        [...document.querySelectorAll("main *")]
          .filter((el) => el.getBoundingClientRect().right > 375 + 1)
          .map((el) => `${el.tagName}.${el.className}`)
      );
      expect(tooWide, ticker).toEqual([]);
    }
  });

  test("/free/sigma-moves: FT_HOMEPAGE_API_KEY never reaches the browser", async ({
    page,
    request,
  }) => {
    const key = process.env.FT_HOMEPAGE_API_KEY?.trim() ?? "";
    test.skip(
      !key,
      "FT_HOMEPAGE_API_KEY not set for this run (scripts/checks/e2e.sh exports it)"
    );
    for (const url of [ROUTE, `${ROUTE}/__data.json`]) {
      const response = await request.get(url);
      expect(response.status(), `GET ${url}`).toBe(200);
      expect(await response.text(), `GET ${url} body`).not.toContain(key);
    }
    const headers: string[] = [];
    page.on("request", (req) => headers.push(JSON.stringify(req.headers())));
    await page.goto(ROUTE);
    await page.waitForLoadState("networkidle");
    expect(await page.content()).not.toContain(key);
    expect(headers.filter((h) => h.includes(key))).toEqual([]);
  });

  // US-347: with every stored close read, SPY's "All" reaches back to 1993
  // (the host holds SPY from 1993-01-29; the 100-day lookback puts the
  // first point in mid-1993). Reads the panel's "Daily, <first> to" caption.
  test("US-347 /free/sigma-moves: SPY at All starts in 1993, and on reload", async ({
    page,
  }) => {
    test.setTimeout(90_000);
    const response = await page.goto(ROUTE);
    expect(response?.status()).toBe(200);
    const name = FUNDS[0].name;
    for (const pass of ["load", "reload"]) {
      if (pass === "reload") {
        expect((await page.reload())?.status()).toBe(200);
      }
      // The fund and range buttons work only once the page has hydrated.
      await page.waitForLoadState("networkidle");
      const fund = page.getByRole("button", { name: "SPY", exact: true });
      await fund.click();
      await expect(fund).toHaveAttribute("aria-pressed", "true");
      const all = page
        .getByRole("group", { name: "Range" })
        .getByRole("button", { name: "All", exact: true });
      await all.click();
      await expect(all).toHaveAttribute("aria-pressed", "true");
      expect(await expectSigmaPanel(page, name), `${pass}: SPY plots`).toBe(
        "plot"
      );
      await expect(
        page.getByRole("region", { name }).locator(".caption"),
        `${pass}: SPY All caption`
      ).toHaveText(/Daily, [A-Z][a-z]{2} \d{1,2}, 1993 to/);
    }
  });

  // US-359: the Method note says the closes are dividend-adjusted and that σ
  // is not a probability. The note renders whatever the host data holds.
  // US-360: the "previous 100 trading days" clause is the 100-day method's,
  // so this reads ?method=100d; the toggle journey checks the EWMA default.
  test("US-359 /free/sigma-moves: the Method note's price basis and σ caveat, and on reload", async ({
    page,
  }) => {
    const response = await page.goto(`${ROUTE}?method=100d`);
    expect(response?.status()).toBe(200);
    for (const pass of ["load", "reload"]) {
      if (pass === "reload") {
        expect((await page.reload())?.status()).toBe(200);
      }
      const note = page.getByRole("region", { name: "Method" });
      await expect(note, `${pass}: price basis`).toContainText(
        "Daily closes adjusted for dividends and splits (Yahoo Finance adjusted closes, as stored by the Fintekkers price service), so each return includes dividends."
      );
      await expect(note, `${pass}: not a probability`).toContainText(
        "σ compares a day with the previous 100 trading days. It is not a probability: market returns have fat tails, so moves beyond ±3σ happen far more often than a normal distribution predicts."
      );
      await expect(note, `${pass}: old basis gone`).not.toContainText(
        "not adjusted for dividends"
      );
      await expect(note, `${pass}: old basis gone`).not.toContainText(
        "price change only"
      );
    }
  });

  // US-360: the method toggle, by a real click. EWMA is the default; "Last
  // 100 days" puts ?method=100d in the URL, keeps the range, survives a
  // reload; EWMA drops the parameter. The Method note follows the method.
  test("US-360 /free/sigma-moves: the method toggle, kept in the URL and on reload", async ({
    page,
  }) => {
    test.setTimeout(90_000);
    const response = await page.goto(ROUTE);
    expect(response?.status()).toBe(200);
    // The buttons work only once the page has hydrated.
    await page.waitForLoadState("networkidle");
    const method = page.getByRole("group", { name: "Method" });
    const ewma = method.getByRole("button", { name: "EWMA (λ 0.94)" });
    const window100 = method.getByRole("button", { name: "Last 100 days" });
    const all = page
      .getByRole("group", { name: "Range" })
      .getByRole("button", { name: "All", exact: true });
    const note = page.getByRole("region", { name: "Method" });
    const name = FUNDS[0].name;
    const summary = page.getByTestId("sigma-summary");

    await expect(ewma).toHaveAttribute("aria-pressed", "true");
    await expect(window100).toHaveAttribute("aria-pressed", "false");
    await expect(note).toContainText("each day back counts 6% less");
    await expect(note).toContainText(
      "J.P. Morgan/Reuters, RiskMetrics Technical Document, 4th ed., 1996"
    );
    await expect(note).toContainText("It is not a probability");
    await expect(note).not.toContainText("previous 100 trading days");
    await all.click();
    await expect(all).toHaveAttribute("aria-pressed", "true");
    const branch = await expectSigmaPanel(page, name);
    test.info().annotations.push({ type: "branch", description: branch });
    const ewmaSummary = branch === "plot" ? await summary.textContent() : "";

    await window100.click();
    await expect(page).toHaveURL(/[?&]method=100d(&|$)/);
    await expect(window100).toHaveAttribute("aria-pressed", "true");
    await expect(ewma).toHaveAttribute("aria-pressed", "false");
    await expect(all).toHaveAttribute("aria-pressed", "true");
    await expect(note).toContainText("previous 100 daily returns");
    await expect(note).not.toContainText("RiskMetrics");
    await expect(note).toContainText("It is not a probability");
    expect(await expectSigmaPanel(page, name)).toBe(branch);
    if (branch === "plot") {
      await expect(summary).not.toHaveText(ewmaSummary ?? "");
    }

    expect((await page.reload())?.status()).toBe(200);
    await page.waitForLoadState("networkidle");
    await expect(window100).toHaveAttribute("aria-pressed", "true");
    await expect(note).toContainText("previous 100 daily returns");

    await ewma.click();
    await expect(ewma).toHaveAttribute("aria-pressed", "true");
    await expect(page).toHaveURL((url) => !url.searchParams.has("method"));
    await expect(note).toContainText("each day back counts 6% less");
  });

  // Metric 5's PR screenshots, on request only:
  // SIGMA_SHOTS=<dir> npx playwright test free-pages -g "sigma moves screenshots"
  test("sigma moves screenshots at 1Y for each fund", async ({ page }) => {
    const dir = process.env.SIGMA_SHOTS;
    test.skip(!dir, "SIGMA_SHOTS not set: PR screenshots only");
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(ROUTE);
    await page.waitForLoadState("networkidle");
    for (const { ticker, name } of FUNDS) {
      await page.getByRole("button", { name: ticker, exact: true }).click();
      await expectSigmaPanel(page, name);
      // The app shell scrolls inside its own container: make the viewport
      // the page's height for a whole-page shot.
      const height = await page
        .locator(".ft-free")
        .evaluate((el) => Math.ceil(el.getBoundingClientRect().height) + 200);
      await page.setViewportSize({ width: 1280, height });
      await page.screenshot({
        path: path.join(dir as string, `sigma-moves-${ticker}-1Y.png`),
      });
      await page.setViewportSize({ width: 1280, height: 900 });
    }
  });

  // US-360 metric 4: SPY at All on each method, on request only.
  test("sigma moves screenshots of SPY at All on each method", async ({
    page,
  }) => {
    const dir = process.env.SIGMA_SHOTS;
    test.skip(!dir, "SIGMA_SHOTS not set: PR screenshots only");
    for (const [method, search] of [
      ["ewma", ""],
      ["100d", "?method=100d"],
    ]) {
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.goto(`${ROUTE}${search}`);
      await page.waitForLoadState("networkidle");
      await page.getByRole("button", { name: "SPY", exact: true }).click();
      await page
        .getByRole("group", { name: "Range" })
        .getByRole("button", { name: "All", exact: true })
        .click();
      await expectSigmaPanel(page, FUNDS[0].name);
      const height = await page
        .locator(".ft-free")
        .evaluate((el) => Math.ceil(el.getBoundingClientRect().height) + 200);
      await page.setViewportSize({ width: 1280, height });
      await page.screenshot({
        path: path.join(dir as string, `sigma-moves-SPY-All-${method}.png`),
      });
    }
  });
});

test.describe("US-352 /free/request", () => {
  const ROUTE = "/free/request";
  const BAND = "Missing a chart or dataset?";
  const VALID = {
    title: "Corporate bond spreads",
    description: "Daily IG and HY spreads since 2000.",
    email: "e2e-visitor@example.com",
  };

  async function fill(page: Page, fields: typeof VALID) {
    await page.getByLabel("Short title").fill(fields.title);
    await page.getByLabel("Description").fill(fields.description);
    await page.getByLabel("Email").fill(fields.email);
  }

  test("journey: /free/soma → dataset picker → + Request a free analysis → the request page, with no band", async ({
    page,
  }) => {
    await page.goto("/free/soma");
    // The picker opens only once the page has hydrated.
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("region", { name: BAND })).toBeVisible();
    const picker = page.getByRole("button", { name: /Public dataset/ });
    await picker.click();
    await expect(picker).toHaveAttribute("aria-expanded", "true");
    await page.getByRole("link", { name: "+ Request a free analysis" }).click();
    await expect(page).toHaveURL(/\/free\/request$/);
    await expect(
      page.getByRole("heading", { name: "Request a free analysis" })
    ).toBeVisible();
    await expect(page.getByRole("region", { name: BAND })).toHaveCount(0);
  });

  test("a whitespace-only title and description show field errors; email and kind are kept", async ({
    page,
  }) => {
    await page.goto(ROUTE);
    await page.waitForLoadState("networkidle");
    await page.getByText("A new dataset", { exact: true }).click();
    // Native `required` accepts spaces; the server's trim() rejects them.
    await fill(page, { ...VALID, title: "   ", description: "   " });
    await page.getByRole("button", { name: "Send request" }).click();

    const title = page.getByLabel("Short title");
    const description = page.getByLabel("Description");
    await expect(page.locator("#title-error")).toHaveText(
      "Enter a short title"
    );
    await expect(page.locator("#description-error")).toHaveText(
      "Describe what you'd like to see"
    );
    await expect(title).toHaveAttribute("aria-describedby", "title-error");
    await expect(title).toHaveAttribute("aria-invalid", "true");
    await expect(description).toHaveAttribute(
      "aria-describedby",
      "description-error"
    );
    await expect(page.getByLabel("Email")).toHaveValue(VALID.email);
    await expect(
      page.getByRole("radio", { name: "A new dataset" })
    ).toBeChecked();
    await expect(
      page.getByRole("heading", { name: /we've got your request/ })
    ).toHaveCount(0);
  });

  test("a valid request while mail is unconfigured says so and never shows the confirmation", async ({
    page,
  }) => {
    test.skip(
      Boolean(process.env.CONTACT_GMAIL_USER?.trim()),
      "CONTACT_GMAIL_USER is set: a valid submit would send real mail"
    );
    await page.goto(ROUTE);
    await page.waitForLoadState("networkidle");
    await fill(page, VALID);
    await page.getByRole("button", { name: "Send request" }).click();
    await expect(page.getByRole("alert")).toHaveText(
      "Requests are temporarily unavailable. Please email us directly."
    );
    await expect(
      page.getByRole("heading", { name: /we've got your request/ })
    ).toHaveCount(0);
    await expect(page.getByLabel("Short title")).toHaveValue(VALID.title);
  });

  test("confirmation: links back, and Send another request starts an empty form", async ({
    page,
  }) => {
    await page.goto(ROUTE);
    await page.waitForLoadState("networkidle");
    await page.getByText("Both", { exact: true }).click();
    await fill(page, VALID);
    // The honeypot: the server replies with success and sends no email.
    await page
      .locator('input[name="website"]')
      .fill("https://spam.test", { force: true });
    await page.getByRole("button", { name: "Send request" }).click();

    await expect(
      page.getByRole("heading", { name: /we've got your request/ })
    ).toBeVisible();
    const again = page.getByRole("link", { name: "Send another request" });
    await expect(again).toHaveAttribute("href", "/free/request");
    await expect(
      page.getByRole("link", { name: "Back to the free data explorer" })
    ).toHaveAttribute("href", "/free");

    await again.click();
    await expect(page).toHaveURL(/\/free\/request$/);
    await expect(page.getByLabel("Short title")).toHaveValue("");
    await expect(page.getByLabel("Description")).toHaveValue("");
    await expect(page.getByLabel("Email")).toHaveValue("");
    await expect(page.getByText("0 / 2,000")).toBeVisible();
    await expect(
      page.getByRole("radio", { name: "A new chart" })
    ).toBeChecked();
  });

  test("the mail transport and its settings ship in no client script", async ({
    page,
  }) => {
    const scripts: string[] = [];
    page.on("response", async (response) => {
      if (response.request().resourceType() !== "script") return;
      scripts.push(await response.text().catch(() => ""));
    });
    await page.goto(ROUTE);
    await page.waitForLoadState("networkidle");
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
      ["CONTACT_GMAIL", "createTransport", "FREE_REQUEST_TO"].filter((s) =>
        scripts.some((script) => script.includes(s))
      )
    ).toEqual([]);
  });
});
