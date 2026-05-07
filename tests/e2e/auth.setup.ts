/**
 * Playwright "setup" project — runs once before any test, persists the
 * authenticated session cookie to playwright/.auth/user.json. Tests pick up
 * the storageState via playwright.config.ts.
 *
 * Auth contract (matches src/tests/auth-flow-e2e.test.ts):
 *   1. Register the dedicated test user via grpc Auth/Register (idempotent).
 *   2. POST /login?/login as form-encoded — the SvelteKit form action sets
 *      the `ft_api_key` cookie. We POST via Playwright's APIRequestContext
 *      so the response cookie ends up in the storage state.
 *   3. Save the cookie jar via context.storageState({ path }).
 *
 * Why request-context instead of driving the rendered form:
 *   - The form uses SvelteKit's `use:enhance` for client-side form handling,
 *     which can be flaky to wait on from outside. The form action itself is
 *     stable — auth-flow-e2e.test.ts uses the same POST.
 *   - Faster: no browser navigation, no hydration wait.
 */
import { test as setup, request } from '@playwright/test';
import { TEST_USER, STORAGE_STATE_PATH, ensureTestUserRegistered, brokerAvailable } from './fixtures/auth';

setup('authenticate', async ({}, testInfo) => {
  if (!brokerAvailable()) {
    console.warn('SKIP auth.setup: broker not reachable on 127.0.0.1:80');
    setup.skip();
    return;
  }

  ensureTestUserRegistered();

  const ctx = await request.newContext({ baseURL: 'http://localhost:443' });
  const res = await ctx.post('/login?/login', {
    form: { email: TEST_USER.email, password: TEST_USER.password },
    headers: { origin: 'http://localhost:443', accept: 'text/html' },
  });

  // SvelteKit form actions return either 200 (validation error) or 303 (redirect on success).
  if (res.status() !== 303 && res.status() !== 200) {
    throw new Error(`Login POST returned ${res.status()}: ${await res.text()}`);
  }

  // Confirm the cookie is in the request context's jar.
  const state = await ctx.storageState({ path: STORAGE_STATE_PATH });
  const apiKeyCookie = state.cookies.find((c) => c.name === 'ft_api_key');
  if (!apiKeyCookie) {
    throw new Error(`Login did not set ft_api_key cookie. Status was ${res.status()}.`);
  }

  await ctx.dispose();
});
