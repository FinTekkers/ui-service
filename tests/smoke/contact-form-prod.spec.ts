import { test, expect } from "@playwright/test";
import {
  REQUIRED_ENV,
  makeMarker,
  requireEnv,
  resolveEmailTimeoutMs,
} from "./checks";
import {
  GmailTransientError,
  anywhereQuery,
  findMessage,
  getReadonlyAccessToken,
  waitForInboxMessage,
} from "./gmail";

/**
 * Production smoke test: submits the public contact form at
 * https://www.fintekkers.org/contactus exactly once, then confirms the
 * matching email reached the fintekkers.org Gmail inbox within 5 minutes.
 * A success banner without the email is a failure. See tests/smoke/README.md.
 */
test("contact form submission is delivered to the Gmail inbox", async ({
  page,
}, testInfo) => {
  // One prod submission per run: refuse --retries / --repeat-each re-runs.
  expect(testInfo.retry, "smoke test must not be retried").toBe(0);
  expect(testInfo.repeatEachIndex, "smoke test must not be repeated").toBe(0);

  // Preflight: everything that can fail without sending mail fails here.
  const env = requireEnv(REQUIRED_ENV);
  const timeoutMs = resolveEmailTimeoutMs(process.env.SMOKE_EMAIL_TIMEOUT_MS);
  const token = await getReadonlyAccessToken(env);

  const marker = makeMarker();
  console.log(`marker=${marker}`);

  let contactPosts = 0;
  page.on("request", (req) => {
    if (
      req.method() === "POST" &&
      new URL(req.url()).pathname === "/contactus"
    ) {
      contactPosts++;
    }
  });

  await page.goto("/contactus");
  await page.locator("#firstname").fill("Smoke");
  await page.locator("#lastname").fill(marker);
  await page.locator("#email").fill("smoke-test@example.com");
  await page.locator("#message").fill(`Automated smoke test ${marker}`);

  const submittedAt = Date.now();
  await page.locator("input.submit_btn").click();

  await expect(
    page.locator(".form_success"),
    "Form did not show success banner"
  ).toBeVisible({ timeout: 30_000 });
  expect(contactPosts, "contact form must be POSTed exactly once").toBe(1);

  const searchMarker =
    process.env.SMOKE_SELFTEST_WRONG_MARKER === "1" ? `${marker}X` : marker;
  const timeoutS = Math.round(timeoutMs / 1000);

  const found = await waitForInboxMessage(token, searchMarker, {
    deadline: submittedAt + timeoutMs,
  });
  if (!found) {
    // Best-effort diagnostic only: a transient Gmail error here must not
    // mask the "never arrived" failure.
    const elsewhere = await findMessage(
      token,
      anywhereQuery(searchMarker),
      searchMarker
    ).catch((err) => {
      if (err instanceof GmailTransientError) return null;
      throw err;
    });
    throw new Error(
      elsewhere
        ? `Email with marker ${searchMarker} not in inbox after ${timeoutS}s (found outside inbox: ${elsewhere.id})`
        : `Email with marker ${searchMarker} never arrived within ${timeoutS}s`
    );
  }

  const elapsedS = Math.round((Date.now() - submittedAt) / 1000);
  expect(
    elapsedS,
    "email arrived after the 5-minute limit"
  ).toBeLessThanOrEqual(300);
  console.log(
    `PASS marker=${searchMarker} messageId=${found.id} elapsedS=${elapsedS}`
  );
});
