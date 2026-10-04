# US-193 test evidence

Recorded 2026-10-04 (UTC) on the `horizon/us-193` branch. Compare against
`origin/main`; the local `main` ref in the build workspace is stale.

## Test code in this change

| File                                    | Role                                                                        |
| --------------------------------------- | --------------------------------------------------------------------------- |
| `tests/smoke/contact-form-prod.spec.ts` | The production smoke test (Playwright, `npm run test:smoke:prod`)           |
| `tests/smoke/checks.ts`                 | Pure helpers: env preflight, marker, scope check, timeout, subject match    |
| `tests/smoke/gmail.ts`                  | Read-only Gmail REST helpers (`messages.list` / `messages.get` metadata)    |
| `playwright.smoke.config.ts`            | Separate config: `tests/smoke/`, prod `baseURL`, `retries: 0`, `workers: 1` |
| `src/tests/smoke-checks.test.ts`        | 12 vitest unit tests for `checks.ts`                                        |

## Blocking gap: metrics 1–3 not yet run

`GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET` and `GMAIL_REFRESH_TOKEN` are not set
in the build environment, so the credentialed runs have **not** been done:

- pass run: `npm run test:smoke:prod` → expect `PASS marker=… messageId=… elapsedS=…`
- negative run: `SMOKE_SELFTEST_WRONG_MARKER=1 SMOKE_EMAIL_TIMEOUT_MS=60000 npm run test:smoke:prod`
  → expect exit 1 with `never arrived within 60s`

A human must mint a `gmail.readonly`-only refresh token for the
`$CONTACT_GMAIL_USER` inbox (see README). No fallback to
`$CONTACT_GMAIL_APP_PASSWORD` or IMAP was used. The item is not Done until
both runs are recorded here.

Still open after review cycles 1 and 2 (re-checked 2026-10-04, fix-pass
attempt 6): none of the three vars is set in the build environment. These contract cases stay unverified
until a human provides them and runs the two commands above:

- pass run exits 0 with `PASS marker=… messageId=… elapsedS=…` (M1, M2)
- `SMOKE_SELFTEST_WRONG_MARKER=1` run exits 1 with `never arrived` (M3)
- in-spec `/contactus` POST count of `1` and the success-banner assertion,
  which only execute after preflight passes (M1, G4)
- R5 log-leak grep on the output of those two runs (G7)

## Read-only check of the live form (no submission)

To show the spec's selectors match production without sending mail, a
throwaway script (not committed) loaded `https://www.fintekkers.org/contactus`
in Playwright Chromium, counted the selectors the spec uses and clicked
nothing:

```
status 200
#firstname 1
#lastname 1
#email 1
#message 1
input.submit_btn 1
form[method=POST] 1
form action ?/message
non-GET requests 1
```

The single non-GET request was `POST www.google-analytics.com/g/collect`, the
page's analytics beacon. The spec counts only requests whose path is
`/contactus`, so the beacon does not affect the POST-count assertion. No
`/contactus` POST was made and no email was sent.

## Results without credentials

| Contract case                                      | Command                                                                                        | Result                                                                                                               |
| -------------------------------------------------- | ---------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Unit tests for `checks.ts` (G3, M6)                | `npx vitest run src/tests/smoke-checks.test.ts`                                                | `12 passed`                                                                                                          |
| Full unit suite, smoke spec not collected (M4, G1) | `CI=true npx vitest run`                                                                       | exit 0, `39 passed` files, `442 passed`; no `tests/smoke/*` file in the list                                         |
| `npm run test` (M4, G1)                            | `CI=true npm run test -- --run`                                                                | exit 0, `39 passed`; no `tests/smoke/*` or `contact-form-prod`                                                       |
| Integration tier (M4, G1)                          | `npx vitest run --config vitest.integration.config.js`                                         | no `tests/smoke/*` or `contact-form-prod` collected                                                                  |
| Default Playwright config (M4, G1)                 | `npx playwright test --list`                                                                   | `67 tests in 28 files`; `contact-form-prod` not listed                                                               |
| Smoke config collects only the smoke spec          | `npx playwright test -c playwright.smoke.config.ts --list`                                     | `1 test in 1 file`: `contact-form-prod.spec.ts`                                                                      |
| Refresh token unset (M6)                           | `env -u GMAIL_REFRESH_TOKEN GMAIL_CLIENT_ID=… GMAIL_CLIENT_SECRET=… npm run test:smoke:prod`   | exit 1, `1 failed`, `Missing required env var(s): GMAIL_REFRESH_TOKEN`                                               |
| Refresh token empty (M6, R3)                       | `GMAIL_REFRESH_TOKEN= … npm run test:smoke:prod`                                               | exit 1, `1 failed`, `Missing required env var(s): GMAIL_REFRESH_TOKEN`                                               |
| All three unset (M6)                               | `env -u GMAIL_CLIENT_ID -u GMAIL_CLIENT_SECRET -u GMAIL_REFRESH_TOKEN npm run test:smoke:prod` | exit 1, `1 failed`, `Missing required env var(s): GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN`         |
| Invalid credentials fail before submit             | dummy values for all three                                                                     | exit 1, `1 failed`, `Gmail OAuth token refresh failed (check GMAIL_* vars)`                                          |
| Invalid timeout fails before submit                | `SMOKE_EMAIL_TIMEOUT_MS=5m …`                                                                  | exit 1, `1 failed`, `SMOKE_EMAIL_TIMEOUT_MS must be a positive integer, got "5m"`                                    |
| No email sent by any failing preflight run         | grep the five run logs for `marker=` / `contactus`                                             | no hits: every run stopped before `page.goto`                                                                        |
| No secrets or bodies in logs (G7, R5)              | R5 grep (token prefixes, body text, the dummy values) on the five logs                         | no hits                                                                                                              |
| No credential values in repo (M5, G2)              | Test contract `git grep` for Google secret, refresh and access token prefixes                  | no hits; no `.env` in the diff                                                                                       |
| No mutating Gmail calls (G3)                       | Test contract `git grep` for write methods and modify and trash endpoints in `tests/smoke`     | no hits                                                                                                              |
| No app, CI, hook or deploy change (G5, G6)         | `git diff origin/main --stat`                                                                  | only `.env.example`, `package.json`, `playwright.smoke.config.ts`, `src/tests/smoke-checks.test.ts`, `tests/smoke/*` |
| `package.json` adds one script, no deps (G8)       | `git diff origin/main -- package.json`                                                         | only `"test:smoke:prod"` added                                                                                       |
| Lint                                               | `npm run lint`                                                                                 | exit 0, 0 errors; no warnings in the new files                                                                       |
| Formatting                                         | `npx prettier --check playwright.smoke.config.ts tests/smoke src/tests/smoke-checks.test.ts`   | all files pass                                                                                                       |
| Type check                                         | `npx svelte-check --tsconfig ./tsconfig.json`                                                  | no errors or warnings in the new files (existing errors elsewhere are unchanged)                                     |

`npx vitest list` is not available in the repo's vitest 0.34.6 (it is treated
as a name filter), so collection was checked with `vitest run` instead.

### Sample output: all three vars unset

```
Running 1 test using 1 worker

  ✘  1 [chromium] › tests/smoke/contact-form-prod.spec.ts:22:1 › contact form submission is delivered to the Gmail inbox (665ms)

  1) [chromium] › tests/smoke/contact-form-prod.spec.ts:22:1 › contact form submission is delivered to the Gmail inbox

    Error: Missing required env var(s): GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN

       at checks.ts:39

  1 failed
```
