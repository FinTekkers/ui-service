import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import path from "path";

export default defineConfig({
  plugins: [svelte()],
  resolve: {
    alias: {
      $lib: path.resolve("src/lib"),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["src/setuptest.js"],
    // Vitest's default include is `**/*.{test,spec}.{js,ts,...}` from
    // the workspace root, which would pick up tests/e2e/*.spec.ts —
    // those are Playwright specs that import @playwright/test (not
    // jsdom-compatible) and would fail at collection. Scope vitest to
    // src/ so the two test runners stay disjoint by config; Playwright
    // owns tests/e2e/ via its own testDir in playwright.config.ts.
    include: ["src/**/*.{test,spec}.{js,ts}"],
    // Default `npm test` / pre-push / CI run is unit-only. Files that
    // hit a running dev server, broker, or valuation-service live in
    // *-e2e.test.ts and smoke.test.ts and require services up; they're
    // run via `npm run test:integration` which preflights the deps.
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "src/tests/*-e2e.test.ts",
      "src/tests/smoke.test.ts",
    ],
  },
});