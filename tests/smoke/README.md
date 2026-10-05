# Production smoke tests

`npm run test:smoke:prod` submits the public contact form at
`https://www.fintekkers.org/contactus` **once**, then polls the fintekkers.org
Gmail inbox over IMAP (read-only) until the matching email arrives. The test passes only
if that exact message reaches the inbox within 5 minutes of the click. A green
form submission without the email is a failure.

This is a manual command. It is **not** part of `npx vitest run`, `npm run
test`, `npm run test:e2e`, CI, git hooks or the deploy script.

## What a run does

1. Checks the required env vars, logs in to `imap.gmail.com:993` as
   `$CONTACT_GMAIL_USER` and opens `INBOX` with `EXAMINE` (read-only). Any
   failure here, including IMAP being disabled on the account, stops the run
   before mail is sent.
2. Builds a unique marker, `FTSMOKE` + UTC `YYYYMMDDHHmmss` + 8 hex chars, and
   puts it in the last name (so it lands in the email subject) and the message.
3. Fills and submits the form once, and asserts the success banner and exactly
   one POST to `/contactus`.
4. Polls the inbox every 10 s with the Gmail search `<marker> newer_than:1d`.
   A candidate counts only if its `Subject` header contains the exact marker.
   Only envelopes are fetched; bodies are never downloaded.
5. Logs `PASS marker=… messageId=… elapsedS=…`, or fails with
   `never arrived within …s` / `not in inbox after …s (found outside inbox: …)`.

Each run leaves one `FTSMOKE…` message in the inbox. The test never deletes,
moves, flags or marks mail read; filter on `FTSMOKE` to clean up by hand.

## Environment variables

| Variable                      | Required | Purpose                                                                    |
| ----------------------------- | -------- | -------------------------------------------------------------------------- |
| `CONTACT_GMAIL_USER`          | yes      | The Gmail account the contact form sends to; its inbox is read over IMAP   |
| `CONTACT_GMAIL_APP_PASSWORD`  | yes      | The same app password the form uses for SMTP, reused here for IMAP login   |
| `SMOKE_EMAIL_TIMEOUT_MS`      | no       | Shortens the 300000 ms email window. Larger values are capped at 5 minutes |
| `SMOKE_SELFTEST_WRONG_MARKER` | no       | `1` searches for a wrong marker; the run must fail (negative check)        |

A missing or empty required var fails the test with
`Missing required env var(s): …`, naming each one. Never commit real values;
`.env.example` lists the names with empty values.

These are the app's existing contact-form credentials, so no second set is
needed. IMAP must be enabled on the account (Gmail settings → Forwarding and
POP/IMAP). On the production host they live in `/opt/fintekkers/ui-service/.env`.

## Running

```bash
npx playwright install chromium   # once per machine
set -a; . /opt/fintekkers/ui-service/.env; set +a   # or export the two vars
npm run test:smoke:prod

# Negative check: must exit non-zero with "never arrived"
SMOKE_SELFTEST_WRONG_MARKER=1 SMOKE_EMAIL_TIMEOUT_MS=60000 npm run test:smoke:prod
```

Every run, including the negative check, sends one real email. Do not pass
`--retries` or `--repeat-each`; the test refuses to run again within a
process so it never resubmits the production form.
