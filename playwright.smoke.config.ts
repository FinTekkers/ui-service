import { defineConfig, devices } from "@playwright/test";

/**
 * Production smoke tests (`npm run test:smoke:prod`). Kept apart from the
 * local suites: vitest only collects src/**, and playwright.config.ts only
 * collects tests/e2e/. These tests hit https://www.fintekkers.org/ and send
 * one real contact-form email per run — see tests/smoke/README.md.
 */
export default defineConfig({
  testDir: "./tests/smoke",
  testMatch: /.*\.spec\.ts$/,

  fullyParallel: false,
  forbidOnly: true,
  // Always 0, even under CI: a retry would submit the production form again.
  retries: 0,
  workers: 1,

  // 5-minute email window plus page load and Gmail preflight.
  timeout: 7 * 60_000,
  reporter: "list",

  use: {
    baseURL: "https://www.fintekkers.org/",
    trace: "off",
    video: "off",
    screenshot: "only-on-failure",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
