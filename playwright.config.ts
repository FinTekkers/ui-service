import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for ui-service browser-driven E2E tests.
 *
 * The vitest-driven "e2e" suites in src/tests/ remain the home for HTTP/gRPC
 * level tests. Playwright is reserved for tests that genuinely need a browser:
 * hydration, JS-driven autocomplete, click handlers, chart rendering.
 *
 * Pre-reqs to run locally:
 *   - ui-service dev server on https://localhost:443
 *     (~/second-brain/services.sh restart ui-service)
 *   - broker-service on 127.0.0.1:80
 *   - grpcurl installed (used by the auth fixture)
 *
 * The config does NOT auto-start the dev server. The dev workflow (and
 * services.sh) keeps it running across sessions; bouncing it from the test
 * runner would create cache thrash for not much gain. Tests skip with a
 * console.warn if the server is unreachable, mirroring the pattern in
 * src/tests/auth-flow-e2e.test.ts.
 */
export default defineConfig({
  testDir: './src/tests/e2e',
  testMatch: /.*\.spec\.ts$/,

  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // Single worker locally — the dev server is shared and tests mutate
  // session state (login). Bump if/when the auth fixture is per-worker.
  workers: 1,

  reporter: process.env.CI ? 'github' : 'list',

  use: {
    // The dev server runs plain HTTP on :443 (vite dev with no https config).
    // Matches what src/tests/auth-flow-e2e.test.ts uses (http://localhost:443).
    baseURL: 'http://localhost:443',
    // Trace on first retry so flake reproduction is one click away.
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    // Setup project — logs in once and saves storageState. Every test project
    // that needs an authenticated session depends on this.
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/user.json',
      },
      dependencies: ['setup'],
      testIgnore: /auth\.setup\.ts/,
    },
  ],
});
