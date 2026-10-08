/**
 * US-205 — the screenshot helpers in fixtures/screenshot.ts.
 *
 * These are assertions about the helpers, so a failure here fails the e2e
 * check; a screenshot that can't be taken never does. Files the tests write
 * are deleted in `finally`, so they never reach the published set.
 */
import { test, expect, type Page } from "@playwright/test";
import { execFileSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { pngSize } from "../../scripts/checks/verify-screenshots.mjs";
import {
  captureKeyScreen,
  captureScreenshot,
  screenshotDir,
} from "./fixtures/screenshot";

test.use({ storageState: { cookies: [], origins: [] } });

const dirEntries = () =>
  fs.existsSync(screenshotDir()) ? fs.readdirSync(screenshotDir()) : [];

test("captureScreenshot writes a full-page, gitignored PNG", async ({
  page,
}) => {
  await page.setContent(
    '<body style="margin:0"><div style="height:3000px">tall</div></body>'
  );
  const file = path.join(screenshotDir(), "helper-selftest.png");
  try {
    expect(await captureScreenshot(page, "helper-selftest")).toBe(file);
    const size = pngSize(fs.readFileSync(file));
    expect(size, "valid PNG").not.toBeNull();
    const scrollHeight = await page.evaluate(
      () => document.documentElement.scrollHeight
    );
    expect(size!.height).toBeGreaterThanOrEqual(scrollHeight);
    // Throws (exit 1) unless git ignores the path.
    execFileSync("git", ["check-ignore", "-q", file], {
      cwd: path.dirname(file),
    });
  } finally {
    fs.rmSync(file, { force: true });
  }
});

test("captureScreenshot returns null instead of throwing", async ({
  browser,
}) => {
  const before = dirEntries();

  const page = await browser.newPage();
  await page.close();
  await expect(captureScreenshot(page, "closed-page-selftest")).resolves.toBe(
    null
  );

  const open = await browser.newPage();
  try {
    for (const name of ["bad\0name", "../escape-selftest", ""]) {
      await expect(captureScreenshot(open, name)).resolves.toBe(null);
    }
  } finally {
    await open.close();
  }

  expect(dirEntries()).toEqual(before);
});

test("a screen that never loads is skipped and the test still passes", async ({
  page,
}) => {
  test.setTimeout(10_000);
  const before = dirEntries();
  // Never fulfilled: the navigation stalls until its timeout.
  await page.route("**/stalled-selftest", () => undefined);
  const result = await captureKeyScreen(
    page,
    "http://127.0.0.1:9/stalled-selftest",
    "stalled-selftest",
    {
      light: false,
      deadline: Date.now() + 60_000,
      gotoTimeout: 1_000,
      idleTimeout: 500,
    }
  );
  // Drop the pending request, or closing the page waits on it.
  await page.unrouteAll({ behavior: "ignoreErrors" });
  expect(result).toBeNull();
  expect(dirEntries()).toEqual(before);
});

test("a page that shows the full API key is not captured", async ({ page }) => {
  const key = "ft_SECRETKEY1234567890abcd";
  // Whitespace around the key, as Svelte renders it in <code>.
  await page.route("**/profile-selftest", (route) =>
    route.fulfill({ contentType: "text/html", body: `<p> ${key} </p>` })
  );
  const before = dirEntries();
  const result = await captureKeyScreen(
    page,
    "http://127.0.0.1:9/profile-selftest",
    "profile-selftest",
    { light: false, apiKey: key, deadline: Date.now() + 60_000 }
  );
  expect(result).toBeNull();
  expect(dirEntries()).toEqual(before);
});

/** RGBA of every pixel of `png` inside `box`, decoded by the browser. */
async function pixelsIn(
  page: Page,
  png: Buffer,
  box: { x: number; y: number; width: number; height: number }
): Promise<number[]> {
  return page.evaluate(
    async ({ src, box }) => {
      const img = new Image();
      img.src = src;
      await img.decode();
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0);
      return Array.from(
        ctx.getImageData(box.x, box.y, box.width, box.height).data
      );
    },
    { src: `data:image/png;base64,${png.toString("base64")}`, box }
  );
}

test("the API key display is masked in the PNG", async ({ page }) => {
  await page.setContent(
    '<body style="margin:0;background:#fff;color:#000">' +
      '<code class="api-key-display" style="display:block;width:400px;' +
      'height:40px;margin:20px;font-size:20px">ft_SECRETKEY1234••••abcd</code>' +
      "</body>"
  );
  const display = page.locator(".api-key-display");
  const file = path.join(screenshotDir(), "mask-selftest.png");
  try {
    expect(
      await captureScreenshot(page, "mask-selftest", { mask: [display] })
    ).toBe(file);
    const b = (await display.boundingBox())!;
    const box = {
      x: Math.ceil(b.x) + 1,
      y: Math.ceil(b.y) + 1,
      width: Math.floor(b.width) - 2,
      height: Math.floor(b.height) - 2,
    };
    const rgba = await pixelsIn(page, fs.readFileSync(file), box);
    expect(rgba.length).toBe(box.width * box.height * 4);
    // Playwright's default mask colour is #FF00FF.
    let unmasked = 0;
    for (let i = 0; i < rgba.length; i += 4) {
      const [r, g, b2] = [rgba[i], rgba[i + 1], rgba[i + 2]];
      if (r < 250 || g > 5 || b2 < 250) unmasked++;
    }
    expect(unmasked, "pixels in the key's box that aren't mask colour").toBe(0);
  } finally {
    fs.rmSync(file, { force: true });
  }
});
