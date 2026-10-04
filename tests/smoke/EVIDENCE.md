# US-193 test evidence

Recorded 2026-10-04 (UTC) on the `horizon/us-193` branch. Compare against
`origin/main`; the local `main` ref in the build workspace is stale.

## Test code in this change

| File                                    | Role                                                                         |
| --------------------------------------- | ---------------------------------------------------------------------------- |
| `tests/smoke/contact-form-prod.spec.ts` | The production smoke test (Playwright, `npm run test:smoke:prod`)            |
| `tests/smoke/checks.ts`                 | Pure helpers: env preflight, marker, read-only mailbox check, timeout, match |
| `tests/smoke/gmail.ts`                  | Read-only IMAP helpers (`imapflow`): EXAMINE INBOX, SEARCH, FETCH ENVELOPE   |
| `playwright.smoke.config.ts`            | Separate config: `tests/smoke/`, prod `baseURL`, `retries: 0`, `workers: 1`  |
| `src/tests/smoke-checks.test.ts`        | 12 vitest unit tests for `checks.ts`                                         |

Per the operator ruling of 2026-10-04, the inbox is read over IMAP
(`imap.gmail.com:993`) with the contact form's own `CONTACT_GMAIL_USER` and
`CONTACT_GMAIL_APP_PASSWORD`. The Gmail REST/OAuth code and the `GMAIL_*`
variables are gone. `imapflow` is the only new dependency (dev).

## Blocker: no contact-form credentials on the host, and production can't send mail

The credentialed runs (pass run and wrong-marker run) were **not** made:

- `/opt/fintekkers/ui-service/.env` is byte-identical to `.env.example`, so
  `CONTACT_GMAIL_USER=` and `CONTACT_GMAIL_APP_PASSWORD=` are both empty.
- The running `fintekkers-ui` service (systemd, `www.fintekkers.org` →
  `98.88.153.145`, this host) has neither variable in its environment. The
  unit file only sets `PORT`, `HOST` and `ORIGIN`.
- The only real values are GitHub Actions secrets used by
  `.github/workflows/deploy.yml`. The host deploy path
  (`infra/host/deploy-ui-service.sh`) never writes them to the host.

`set -a; . /opt/fintekkers/ui-service/.env; set +a; npm run test:smoke:prod`
therefore stopped at preflight with
`Missing required env var(s): CONTACT_GMAIL_USER, CONTACT_GMAIL_APP_PASSWORD`.
No form was submitted.

**Production delivery finding (reported, not patched, per guardrail 5).** The
live contact form can't send email. The service journal logs this on every
submission, most recently 2026-10-03:

```
Oct 02 20:00:59 … Contact form: CONTACT_GMAIL_USER / CONTACT_GMAIL_APP_PASSWORD env vars not configured.
Oct 03 16:42:15 … Contact form: CONTACT_GMAIL_USER / CONTACT_GMAIL_APP_PASSWORD env vars not configured.
```

The handler returns a "temporarily unavailable" `formError` that the page
never displays. Visitors get no error and no email is sent. Once the vars
are on the host, this smoke test is what would have caught it.

To unblock, a human with the secrets must:

1. Put real `CONTACT_GMAIL_USER` and `CONTACT_GMAIL_APP_PASSWORD` values in the
   `fintekkers-ui` service environment (for example in
   `/opt/fintekkers/ui-service/.env` plus an `EnvironmentFile=` line), then
   restart the service.
2. Confirm IMAP is enabled on that Gmail account.
3. Run, exactly once each:
   - `set -a; . /opt/fintekkers/ui-service/.env; set +a; npm run test:smoke:prod`
     → expect `PASS marker=FTSMOKE… messageId=<…> elapsedS=<n>`
   - the same with `SMOKE_SELFTEST_WRONG_MARKER=1 SMOKE_EMAIL_TIMEOUT_MS=60000`
     → expect exit 1 with `never arrived within 60s`
4. Paste both outputs here. The item is not Done until they are recorded.

Still unverified until then: metric lines 1–3, the in-spec `/contactus` POST
count, the exact-subject match and `elapsedS` on a live message, the IMAP
read-only open against Gmail, and the R5 log grep on those two runs.

## Results without credentials

| Contract case                                      | Command                                                                                       | Result                                                                                                                |
| -------------------------------------------------- | --------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Unit tests for `checks.ts` (G3, M6)                | `npx vitest run src/tests/smoke-checks.test.ts`                                               | `12 passed`                                                                                                           |
| Full unit suite, smoke spec not collected (M4, G1) | `CI=true npx vitest run`                                                                      | exit 0, `39 passed` files, `442 passed`; no `tests/smoke/*` file collected                                            |
| Integration tier (M4, G1)                          | `npx vitest run --config vitest.integration.config.js`                                        | no `tests/smoke/*` or `contact-form-prod` collected                                                                   |
| Default Playwright config (M4, G1)                 | `npx playwright test --list`                                                                  | `67 tests in 28 files`; `contact-form-prod` not listed                                                                |
| Smoke config collects only the smoke spec          | `npx playwright test -c playwright.smoke.config.ts --list`                                    | `1 test in 1 file`: `contact-form-prod.spec.ts`                                                                       |
| Both vars unset (M6)                               | `env -u CONTACT_GMAIL_USER -u CONTACT_GMAIL_APP_PASSWORD npm run test:smoke:prod`             | exit 1, `1 failed`, `Missing required env var(s): CONTACT_GMAIL_USER, CONTACT_GMAIL_APP_PASSWORD`                     |
| Password empty (M6, R3)                            | `CONTACT_GMAIL_USER=x@example.com CONTACT_GMAIL_APP_PASSWORD= npm run test:smoke:prod`        | exit 1, `1 failed`, `Missing required env var(s): CONTACT_GMAIL_APP_PASSWORD`                                         |
| Host `.env` (empty values)                         | `set -a; . /opt/fintekkers/ui-service/.env; set +a; npm run test:smoke:prod`                  | exit 1, `1 failed`, `Missing required env var(s): CONTACT_GMAIL_USER, CONTACT_GMAIL_APP_PASSWORD`                     |
| No email sent by any failing preflight run         | grep the run logs for `marker=`                                                               | no hits: every run stopped before `page.goto`                                                                         |
| No secrets or bodies in logs (G7, R5)              | grep the run logs for `Automated smoke test` and `PASSWORD=` values                           | no hits                                                                                                               |
| No credential values in repo (M5, G2)              | Test contract `git grep` for Google secret, refresh and access token prefixes                 | no hits; no `.env` in the diff                                                                                        |
| No mutating mail calls (G3)                        | `git grep` in `tests/smoke` for delete, move, copy, flag, append, mailbox-edit and send calls | no hits; every mailbox is opened `readOnly: true` and checked by `assertReadOnlyMailbox`                              |
| No app, CI, hook or deploy change (G5, G6)         | `git diff origin/main --stat`                                                                 | only `.env.example`, `package*.json`, `playwright.smoke.config.ts`, `src/tests/smoke-checks.test.ts`, `tests/smoke/*` |
| `package.json` changes (G8)                        | `git diff origin/main -- package.json`                                                        | `"test:smoke:prod"` script and the `imapflow` dev dependency only                                                     |
| Lint                                               | `npm run lint`                                                                                | exit 0, 0 errors; no warnings in the new files                                                                        |
| Formatting                                         | `npx prettier --check playwright.smoke.config.ts tests/smoke src/tests/smoke-checks.test.ts`  | all files pass                                                                                                        |

`npx vitest list` is not available in the repo's vitest 0.34.6 (it is treated
as a name filter), so collection was checked with `vitest run` instead.
