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
import {
  MOCK_SECURITY_MASTER,
  mockFiguresIn,
} from "../../src/tests/fixtures/free-tips-live";

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

test("/free/tips: FT_HOMEPAGE_API_KEY never reaches the browser", async ({
  page,
  request,
}) => {
  const key = process.env.FT_HOMEPAGE_API_KEY?.trim() ?? "";
  test.skip(
    !key,
    "FT_HOMEPAGE_API_KEY not set for this run (scripts/checks/e2e.sh exports it)"
  );
  for (const url of ["/free/tips", "/free/tips/__data.json"]) {
    const response = await request.get(url);
    expect(response.status(), `GET ${url}`).toBe(200);
    expect(await response.text(), `GET ${url} body`).not.toContain(key);
  }
  const headers: string[] = [];
  page.on("request", (req) => headers.push(JSON.stringify(req.headers())));
  await page.goto("/free/tips");
  await page.waitForLoadState("networkidle");
  expect(await page.content()).not.toContain(key);
  expect(headers.filter((h) => h.includes(key))).toEqual([]);
});
