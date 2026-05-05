# Playwright E2E tests

Browser-driven tests for `ui-service`. Covers what the vitest "e2e" suites
in `src/tests/*.test.ts` can't: hydration, JS-driven autocomplete, click
handlers, async chart rendering, keyboard navigation.

## When to write a test here vs. in vitest

| Need to validate… | Write it as… |
|---|---|
| `load()` returns the right data shape, server-side error handling | vitest (`*.test.ts`) — direct call |
| HTTP status, SSR HTML, auth redirects | vitest (`*-e2e.test.ts`) — Node `http` + cookies |
| **DOM renders correctly after JS runs**, click sequences, autocomplete, chart interaction | Playwright (`*.spec.ts`) — this directory |

If you're not sure, default to vitest — it's faster and has no infra
dependencies. Move to Playwright only when the test genuinely needs a browser.

## Running

```bash
# All E2E tests (chromium-only)
npm run test:e2e

# Single file
npx playwright test src/tests/e2e/prices.spec.ts

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
- `grpcurl` on `PATH` (used by the auth fixture)

If the broker is unreachable, `auth.setup.ts` skips with a `console.warn`
and downstream tests fail with auth-redirect errors. That's the right
signal — fix the infra rather than the test.

## Auth fixture

`auth.setup.ts` runs once before any test. It registers (idempotent) and
logs in a dedicated test user — `playwright@fintekkers-test.local` — then
saves the SvelteKit `ft_api_key` session cookie to
`playwright/.auth/user.json`. Every test in the `chromium` project picks
that up via `storageState` in `playwright.config.ts`.

Tests don't need to call any auth helpers themselves — they just navigate
to `/data/anything` and the cookie is already attached.

To rotate the session (e.g. after broker auth changes), delete
`playwright/.auth/user.json` and re-run.

## Adding a test

```ts
// src/tests/e2e/something.spec.ts
import { test, expect } from '@playwright/test';

test('something', async ({ page }) => {
  await page.goto('/data/something');
  await expect(page.locator('h1')).toContainText('Something');
});
```

Name files `*.spec.ts` (Playwright's default) — vitest tests use `*.test.ts`,
so the two suites stay disjoint.

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
