/**
 * Named screenshots for the PR (US-205).
 *
 * captureScreenshot writes a full-page PNG to e2e/__screenshots__/<name>.png
 * at the repo root; Horizon publishes that folder on the PR and diffs it
 * against the e2e-baseline branch. The folder is gitignored.
 *
 * Screenshots never fail a test by themselves: both helpers catch every
 * error, log a warning and return null.
 */
import { test, type Locator, type Page } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";
import { isSafeToCapture } from "../../../scripts/checks/verify-screenshots.mjs";

// Anything else could escape the folder or clash with Horizon's naming.
const NAME = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;
// Taller pages are captured from the top down to this height.
const MAX_HEIGHT = 10_000;

/**
 * <repo root>/e2e/__screenshots__, from the Playwright config's location.
 * Resolved per call: test.info() only works inside a test or hook.
 */
export function screenshotDir(): string {
  const configFile = test.info().config.configFile;
  const root = configFile ? path.dirname(configFile) : process.cwd();
  return path.join(root, "e2e", "__screenshots__");
}

/** Returns the PNG's path, or null (with a warning) if it wasn't written. */
export async function captureScreenshot(
  page: Page,
  name: string,
  opts: { mask?: Locator[] } = {}
): Promise<string | null> {
  try {
    if (!NAME.test(name)) throw new Error("invalid screenshot name");
    const dir = screenshotDir();
    fs.mkdirSync(dir, { recursive: true });
    const file = path.join(dir, `${name}.png`);
    // A very tall page (/data/securities lists every security, ~180,000px)
    // times out or crashes the browser as one full-page PNG, so cap it.
    const { width, height } = await page.evaluate(() => ({
      width: document.documentElement.scrollWidth,
      height: document.documentElement.scrollHeight,
    }));
    await page.screenshot({
      path: file,
      fullPage: true,
      clip:
        height > MAX_HEIGHT
          ? { x: 0, y: 0, width, height: MAX_HEIGHT }
          : undefined,
      animations: "disabled",
      mask: opts.mask,
      timeout: 10_000,
    });
    return file;
  } catch (err) {
    console.warn(
      `screenshot ${JSON.stringify(name)} not captured: ${
        (err as Error).message
      }`
    );
    return null;
  }
}

export type KeyScreenOptions = {
  /** Drop <html class="dark"> (src/app.html) for the light variant. */
  light: boolean;
  /** The session's API key; the page must not show it in full. */
  apiKey?: string;
  /** No new navigation starts after this time (ms since epoch). */
  deadline: number;
  gotoTimeout?: number;
  idleTimeout?: number;
};

/**
 * Open `url` and capture it as `name`. The API key display is always
 * masked, and nothing is written if the full key is on the page.
 */
export async function captureKeyScreen(
  page: Page,
  url: string,
  name: string,
  opts: KeyScreenOptions
): Promise<string | null> {
  try {
    if (Date.now() > opts.deadline) {
      throw new Error("capture budget used up");
    }
    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: opts.gotoTimeout ?? 15_000,
    });
    await page
      .waitForLoadState("networkidle", { timeout: opts.idleTimeout ?? 5_000 })
      .catch(() => undefined);
    // Every goto reloads app.html, which puts the class back.
    if (opts.light) {
      await page.evaluate(() =>
        document.documentElement.classList.remove("dark")
      );
    }
    const text = await page.locator("body").innerText({ timeout: 5_000 });
    if (!isSafeToCapture(text, opts.apiKey)) {
      throw new Error("the full API key is visible");
    }
  } catch (err) {
    console.warn(
      `screenshot ${JSON.stringify(name)} not captured: ${
        (err as Error).message
      }`
    );
    return null;
  }
  return captureScreenshot(page, name, {
    mask: [page.locator(".api-key-display")],
  });
}
