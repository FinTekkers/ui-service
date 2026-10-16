/**
 * Playwright "setup" project — runs once before any test, persists the
 * e2e user's session cookies to playwright/.auth/user.json (gitignored).
 * Tests pick up the storageState via playwright.config.ts.
 *
 * No login (US-233): the session is the provisioned FT_E2E_API_KEY set as
 * the `ft_api_key` cookie, plus `ft_user_email` from FT_E2E_EMAIL. A login
 * would rotate the key and break any other run using it. Skips, naming
 * the variable, when one is missing or the key is rejected.
 */
import { test as setup } from "@playwright/test";
import { mkdirSync, writeFileSync } from "fs";
import { dirname } from "path";
import {
  STORAGE_STATE_PATH,
  ensureTestUserSession,
  skipUnlessE2ECredentials,
} from "./fixtures/auth";

skipUnlessE2ECredentials(setup);
// Traces record request cookies; keep the API key out of test-results/.
setup.use({ trace: "off", screenshot: "off", video: "off" });

setup("authenticate", async ({ playwright }) => {
  const state = await ensureTestUserSession(
    playwright,
    setup.info().project.use.baseURL!
  );
  mkdirSync(dirname(STORAGE_STATE_PATH), { recursive: true });
  writeFileSync(STORAGE_STATE_PATH, JSON.stringify(state), { mode: 0o600 });
});
