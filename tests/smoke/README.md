# Production smoke tests

`npm run test:smoke:prod` submits the public contact form at
`https://www.fintekkers.org/contactus` **once**, then polls the fintekkers.org
Gmail inbox (read-only) until the matching email arrives. The test passes only
if that exact message reaches the inbox within 5 minutes of the click. A green
form submission without the email is a failure.

This is a manual command. It is **not** part of `npx vitest run`, `npm run
test`, `npm run test:e2e`, CI, git hooks or the deploy script.

## What a run does

1. Checks the required env vars and exchanges the refresh token for an access
   token. The token must carry **only** the `gmail.readonly` scope. Any failure
   here stops the run before mail is sent.
2. Builds a unique marker, `FTSMOKE` + UTC `YYYYMMDDHHmmss` + 8 hex chars, and
   puts it in the last name (so it lands in the email subject) and the message.
3. Fills and submits the form once, and asserts the success banner and exactly
   one POST to `/contactus`.
4. Polls `in:inbox <marker> newer_than:1d` every 10 s. A candidate counts only
   if its `Subject` header contains the exact marker. Only message metadata is
   read; bodies are never fetched.
5. Logs `PASS marker=… messageId=… elapsedS=…`, or fails with
   `never arrived within …s` / `not in inbox after …s (found outside inbox: …)`.

Each run leaves one `FTSMOKE…` message in the inbox. Read-only access cannot
remove it; filter on `FTSMOKE` to clean up by hand.

## Environment variables

| Variable                      | Required | Purpose                                                                        |
| ----------------------------- | -------- | ------------------------------------------------------------------------------ |
| `GMAIL_CLIENT_ID`             | yes      | OAuth client ID                                                                |
| `GMAIL_CLIENT_SECRET`         | yes      | OAuth client secret                                                            |
| `GMAIL_REFRESH_TOKEN`         | yes      | Refresh token for the `$CONTACT_GMAIL_USER` inbox, `gmail.readonly` scope only |
| `SMOKE_EMAIL_TIMEOUT_MS`      | no       | Shortens the 300000 ms email window. Larger values are capped at 5 minutes     |
| `SMOKE_SELFTEST_WRONG_MARKER` | no       | `1` searches for a wrong marker; the run must fail (negative check)            |

A missing or empty required var fails the test with
`Missing required env var(s): …`, naming each one. Never commit real values;
`.env.example` lists the names with empty values.

### Minting the credentials

1. In a Google Cloud project, enable the Gmail API and create an OAuth client
   (type "Desktop app").
2. Authorise it as the `$CONTACT_GMAIL_USER` account requesting **only**
   `https://www.googleapis.com/auth/gmail.readonly` (for example with the
   OAuth 2.0 Playground, using your own client credentials).
3. Export the client ID, client secret and refresh token as the three vars
   above. The test rejects a token with any other scope.

## Running

```bash
npx playwright install chromium   # once per machine
npm run test:smoke:prod

# Negative check: must exit non-zero with "never arrived"
SMOKE_SELFTEST_WRONG_MARKER=1 SMOKE_EMAIL_TIMEOUT_MS=60000 npm run test:smoke:prod
```

Every run, including the negative check, sends one real email. Do not pass
`--retries` or `--repeat-each`; the test refuses to run again within a
process so it never resubmits the production form.
