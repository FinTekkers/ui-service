/**
 * US-205 — the key-screens run left all 18 named, valid PNGs.
 *
 * scripts/checks/e2e.sh runs this on its own, after key-screens.spec.ts, with
 * E2E_KEY_SCREENS_FILES=1; anywhere else it skips, since no capture ran
 * first. This is an assertion about the published set, so a failure here
 * fails the e2e check and shows in its per-test results.
 */
import { test, expect } from "@playwright/test";
import { verify } from "../../scripts/checks/verify-screenshots.mjs";
import { screenshotDir } from "./fixtures/screenshot";

test.use({ storageState: { cookies: [], origins: [] } });

test("key screens: all 18 named PNGs exist and are valid", () => {
  test.skip(
    process.env.E2E_KEY_SCREENS_FILES !== "1",
    "only after a key-screens run (scripts/checks/e2e.sh)"
  );
  const { found, missing, invalid, extra } = verify(screenshotDir());
  expect(missing, "missing").toEqual([]);
  expect(invalid, "not a valid PNG").toEqual([]);
  expect(extra, "unexpected files").toEqual([]);
  expect(found).toHaveLength(18);
});
