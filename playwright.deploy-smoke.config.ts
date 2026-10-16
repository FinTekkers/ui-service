import { defineConfig, devices } from "@playwright/test";

/**
 * Deploy smoke check (`npm run test:smoke:deploy`, US-233): read-only
 * logged-in journeys against https://www.fintekkers.org/ as the e2e user
 * (FT_E2E_EMAIL, FT_E2E_API_KEY). Its own folder, so it never collects
 * tests/smoke's contact-form spec, which sends a real email.
 *
 * No traces, videos or screenshots: they would record the session cookie.
 */
export default defineConfig({
  testDir: "./tests/deploy-smoke",
  testMatch: /.*\.spec\.ts$/,

  fullyParallel: false,
  forbidOnly: true,
  retries: 0,
  workers: 1,

  timeout: 2 * 60_000,
  reporter: "list",

  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "https://www.fintekkers.org/",
    trace: "off",
    video: "off",
    screenshot: "off",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
