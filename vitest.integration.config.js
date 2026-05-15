import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import path from "path";

// Integration tests — require services running (ui-service on :443,
// broker on :80, valuation on :8080). Run via `npm run test:integration`,
// not as part of the default unit run / pre-push / unit CI workflow.
// See processes/test-discipline.md.
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
    include: [
      "src/tests/*-e2e.test.ts",
      "src/tests/smoke.test.ts",
      "src/tests/qa-s*-*.test.ts",
    ],
  },
});
