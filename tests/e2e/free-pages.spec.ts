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
import { tips, tipsMeasure } from "../../src/lib/free/mock/tips";

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

// US-253: /free/tips, logged out. The 5 DataExplorerTIPS.dc.html sections,
// the figures from src/lib/free/mock/tips.ts, and the display-only
// calculator.
const TIPS_H2S = [
  "What are Treasury Inflation-Protected Securities?",
  "TII 1⅞ 01/15/36 · 10-Year TIPS, Series A-2036",
  "How this bond tracks inflation",
  "Value a TIPS position",
  "Pull TIPS data from the API",
];

test("/free/tips returns 200 with the 5 artboard sections in the shell", async ({
  page,
}) => {
  const response = await page.goto("/free/tips");
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("navigation", { name: "Primary" })).toBeVisible();
  await expect(page.locator(".ft-free .content h2")).toHaveText(TIPS_H2S);
});

test("/free/tips shows the stored security and worked-example figures", async ({
  page,
}) => {
  await page.goto("/free/tips");
  const widget = page.getByRole("region", { name: TIPS_H2S[1] });
  const example = page.getByRole("article", { name: TIPS_H2S[2] });

  /** The dd next to the widget's `label`. */
  const field = (label: string) =>
    widget.locator("dl > div").filter({ hasText: label }).locator("dd");

  const cusip = tips.security.identifiersList[0].identifierValue;
  expect(cusip).toBe("91282CPU9");
  await expect(field("CUSIP")).toHaveText(cusip);

  expect(tips.security.tipsExtension.baseCpi).toBe("324.93471");
  await expect(field("Base ref CPI")).toHaveText(
    tips.security.tipsExtension.baseCpi
  );
  expect(tipsMeasure(tips, "REFERENCE_CPI").display).toBe("332.92643");
  await expect(field("Ref CPI (Jun 30)")).toHaveText(
    tipsMeasure(tips, "REFERENCE_CPI").display
  );
  expect(tipsMeasure(tips, "INDEX_RATIO").display).toBe("1.02459");
  await expect(field("Index ratio")).toHaveText(
    tipsMeasure(tips, "INDEX_RATIO").display
  );

  const figures = example.locator("ol > li > :last-child");
  const stored = tips.workedExample;
  expect([
    stored.baseCpi,
    stored.refCpi,
    stored.indexRatio,
    stored.adjustedPrincipal,
    stored.coupon,
  ]).toEqual(["324.93471", "332.92643", "1.02459", "$10,245.90", "$96.06"]);
  await expect(figures).toHaveText([
    stored.baseCpi,
    stored.refCpi,
    stored.indexRatio,
    stored.adjustedPrincipal,
    stored.coupon,
    "max(adj., par)",
  ]);
});

test("/free/tips calculator is disabled and shows its defaults", async ({
  page,
}) => {
  await page.goto("/free/tips");
  await page.waitForLoadState("networkidle");
  const calc = page.getByRole("region", { name: TIPS_H2S[3] });

  for (const [label, value] of [
    ["Face value ($)", "10000"],
    ["Real coupon (%)", "1.875"],
    ["Base ref CPI", "324.93471"],
    ["Current ref CPI", "332.92643"],
    ["Years to maturity", "9.5"],
    ["Real yield (%)", "2.25"],
    ["Assumed annual inflation (%)", "2.30"],
  ]) {
    const input = calc.getByLabel(label, { exact: true });
    await expect(input).toBeDisabled();
    await expect(input).toHaveValue(value);
  }
  await expect(calc.getByRole("textbox")).toHaveCount(7);
  await expect(calc.locator("tbody tr")).toHaveCount(19);
  await expect(calc.locator("button:enabled")).toHaveCount(0);

  await expect(calc).toContainText(
    "Pre-filled with the January 2036 bond. This preview shows the default result; sign in to change the real yield and inflation."
  );
  await expect(
    page.getByText("Change the real yield and your inflation assumption")
  ).toHaveCount(0);
});
