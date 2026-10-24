# Playwright E2E tests

Browser-driven tests for `ui-service`. Covers what the vitest "e2e" suites
in `src/tests/*.test.ts` can't: hydration, JS-driven autocomplete, click
handlers, async chart rendering, keyboard navigation.

## When to write a test here vs. in vitest

| Need to validate…                                                                         | Write it as…                                     |
| ----------------------------------------------------------------------------------------- | ------------------------------------------------ |
| `load()` returns the right data shape, server-side error handling                         | vitest (`*.test.ts`) — direct call               |
| HTTP status, SSR HTML, auth redirects                                                     | vitest (`*-e2e.test.ts`) — Node `http` + cookies |
| **DOM renders correctly after JS runs**, click sequences, autocomplete, chart interaction | Playwright (`*.spec.ts`) — this directory        |

If you're not sure, default to vitest — it's faster and has no infra
dependencies. Move to Playwright only when the test genuinely needs a browser.

## Running

```bash
# All E2E tests (chromium-only)
npm run test:e2e

# Single file
npx playwright test tests/e2e/prices.spec.ts

# UI mode — recommended for writing/debugging new tests
npx playwright test --ui

# Open the last run's HTML report (with traces, screenshots, videos)
npx playwright show-report
```

## Pre-reqs

The runner does **not** start services for you (matches the local dev
workflow — `~/second-brain/services.sh` keeps them up across sessions).
Before running, ensure:

- `ui-service` dev server on `https://localhost:443`
  (`~/second-brain/services.sh restart ui-service`)
- `broker-service` on `127.0.0.1:80`
- `FT_E2E_EMAIL` and `FT_E2E_API_KEY` set (see below)

## Auth fixture

Tests never register a user or log in. Since BS-33 every broker login
rotates the user's API key, so a suite that logged in per run broke any
other run using the same user. Instead the e2e user's API key is
provisioned once (BS-31) and Horizon passes it in (HZ-494):

| Variable          | Used as                                           |
| ----------------- | ------------------------------------------------- |
| `FT_E2E_EMAIL`    | the `ft_user_email` cookie                        |
| `FT_E2E_API_KEY`  | the `ft_api_key` cookie                           |
| `FT_E2E_PASSWORD` | re-provisioning only (BS-31); tests never read it |

`auth.setup.ts` writes those cookies to `playwright/.auth/user.json`, a
temp file under the gitignored `/playwright/.auth/`. Every test in the
`chromium` project picks that up via `storageState` in
`playwright.config.ts`. Specs that build their own session call
`e2eSessionOrSkip` from `fixtures/auth.ts`. `ensureTestUserSession` builds
the same session without ever calling `test.skip`, so plain node (e.g.
`scripts/checks/e2e.sh`) can call it; a missing variable throws, naming it.

If a variable is unset, or the app can't load data with the key,
`auth.setup.ts` and the specs that call `e2eSessionOrSkip` skip with
"e2e API key missing or expired; re-run BS-31's provisioning" and the
variable's name. Messages hold names only, never values. Specs that use the
session turn traces, screenshots and videos off: they would record the cookie.

## Deploy smoke check

`npm run test:smoke:deploy` runs `tests/deploy-smoke/` against
`https://www.fintekkers.org/` with the same variables: the TIPS Pricer
CUSIP flow, the CPI index page and the securities list. It is read-only:
each test fails if its page sends anything but a GET.

Tests don't need to call any auth helpers themselves — they just navigate
to `/data/anything` and the cookie is already attached.

## Adding a test

```ts
// tests/e2e/something.spec.ts
import { test, expect } from "@playwright/test";

test("something", async ({ page }) => {
  await page.goto("/data/something");
  await expect(page.locator("h1")).toContainText("Something");
});
```

Name files `*.spec.ts` (Playwright's default) — vitest tests use `*.test.ts`,
so the two suites stay disjoint.

## Screenshots

Screens are captured, diffed and approved by Horizon's shared screenshot
runner, not by these specs. `.horizon/screenshots.json` at the repo root is
the list: each screen's path, whether it needs the e2e login, what to wait
for and what to mask (the profile page's API key display). The runner serves
the production build, writes the PNGs to the gitignored `.horizon/screenshots/`
and publishes them on the PR with a diff against the baseline.

- To add or change a screen, edit `.horizon/screenshots.json`;
  `src/tests/horizon-screenshots-config.test.ts` checks its shape.
- Baselines live on git refs, never as PNGs on `main`.
- Don't capture screenshots from a spec. `scripts/checks/e2e.sh` only checks
  that no session file (`.auth/`, `user.json`) is under `.horizon/screenshots/`.
- The legacy `key-screens*.spec.ts`, `capture-screenshot.spec.ts`,
  `fixtures/screenshot.ts` and `scripts/checks/verify-screenshots.mjs` are no
  longer run by this branch's `e2e.sh`. They stay only until it reaches
  `main` (Horizon runs `main`'s copy of the check), then a follow-up deletes
  them.

## Debugging

- **`npx playwright test --ui`** — best for writing tests; gives a time-travel
  view of every action.
- **`--debug`** — pauses at each step, opens devtools.
- **`--trace on`** — writes a trace zip; open with `npx playwright show-trace`.
- Failed tests automatically retain trace + screenshot in `test-results/`.

## CI

Not yet wired. The harness needs broker + price-service + ui-service all
running, which requires CI infra changes that haven't been made. Track in
the parent issue (#187).
