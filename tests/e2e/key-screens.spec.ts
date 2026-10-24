/**
 * US-205 — named screenshots of the key screens, for the PR.
 *
 * Captures each screen in SCREENS once per VARIANT, as
 * e2e/__screenshots__/<screen>--<variant>.png (18 files). Horizon publishes
 * them on the PR with a diff against the e2e-baseline branch.
 *
 * This is a capture spec, not a behaviour test: it has no assertions, and a
 * screen that fails to load or capture only logs a warning. Captures stop at
 * a shared time budget so scripts/checks/e2e.sh stays within 3 minutes.
 *
 * The app is dark-only (src/app.html sets <html class="dark">), so the light
 * variant removes that class and shows the non-dark styles.
 */
import { test, devices, type BrowserContextOptions } from "@playwright/test";
import { SCREENS, VARIANTS } from "../../scripts/checks/verify-screenshots.mjs";
import {
  e2eSessionOrSkip,
  skipUnlessE2ECredentials,
  type StorageState,
} from "./fixtures/auth";
import { captureKeyScreen } from "./fixtures/screenshot";

const CAPTURE_BUDGET_MS = 75_000;
// Above the budget plus one in-flight screen (goto, idle wait, screenshot),
// so a slow screen can't time the test out.
test.setTimeout(CAPTURE_BUDGET_MS + 45_000);

skipUnlessE2ECredentials(test);

// Each screen gets its own context below; never load the setup project's file.
// Traces and failure screenshots would record the session cookie.
test.use({
  storageState: { cookies: [], origins: [] },
  trace: "off",
  screenshot: "off",
  video: "off",
});

// Keep the default browser (chromium) and small PNGs.
const { defaultBrowserType: _browser, ...iPhone } = devices["iPhone 13"];
const DESKTOP = { viewport: { width: 1920, height: 1080 } };

const VARIANT_OPTIONS: Record<
  string,
  { light: boolean; context: BrowserContextOptions }
> = {
  "light--desktop": {
    light: true,
    context: { ...DESKTOP, colorScheme: "light" },
  },
  "dark--desktop": {
    light: false,
    context: { ...DESKTOP, colorScheme: "dark" },
  },
  "dark--phone": {
    light: false,
    context: { ...iPhone, deviceScaleFactor: 1, colorScheme: "dark" },
  },
};

let session: StorageState | null = null;
let apiKey: string | undefined;
let deadline = 0;

test.beforeAll(async ({ playwright }) => {
  deadline = Date.now() + CAPTURE_BUDGET_MS;
  // Skips the file, naming the reason, when the e2e API key is missing or
  // rejected.
  const state = await e2eSessionOrSkip(
    test,
    playwright,
    test.info().project.use.baseURL!
  );
  const cookie = state.cookies.find((c) => c.name === "ft_api_key");
  apiKey = cookie && decodeURIComponent(cookie.value);
  // Only once the key is known, so the full-key guard is never off.
  session = state;
});

for (const variant of VARIANTS) {
  test(`capture key screens: ${variant}`, async ({ browser }) => {
    const { light, context } = VARIANT_OPTIONS[variant];
    const baseURL = test.info().project.use.baseURL;
    for (const screen of SCREENS) {
      const name = `${screen.name}--${variant}`;
      const loggedOut = screen.name === "login";
      if (!loggedOut && !session) {
        console.warn(`screenshot "${name}" not captured: no session`);
        continue;
      }
      try {
        const ctx = await browser.newContext({
          ...context,
          baseURL,
          storageState: loggedOut
            ? { cookies: [], origins: [] }
            : session ?? undefined,
        });
        try {
          const page = await ctx.newPage();
          await captureKeyScreen(page, screen.path, name, {
            light,
            apiKey,
            deadline,
          });
        } finally {
          await ctx.close().catch(() => undefined);
        }
      } catch (err) {
        console.warn(
          `screenshot "${name}" not captured: ${(err as Error).message}`
        );
      }
    }
  });
}
