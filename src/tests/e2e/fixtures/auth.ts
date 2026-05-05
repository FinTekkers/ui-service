/**
 * Auth fixture for Playwright E2E tests.
 *
 * Logs a dedicated test user in once per run and persists the SvelteKit
 * `ft_api_key` cookie into Playwright's storageState. Tests opt in via
 * `playwright.config.ts`'s `storageState` field — they don't call this
 * directly.
 *
 * Pre-reqs (will skip-with-warn if any are missing):
 *   - broker-service on 127.0.0.1:80
 *   - ui-service dev server on https://localhost:443
 *   - grpcurl on PATH
 *
 * Test user:
 *   playwright@fintekkers-test.local / PlaywrightTest123 / signup_code S1GNUP.
 *   Re-registration is idempotent (the broker returns AlreadyExists, which
 *   we ignore — only Login matters for state).
 */
import { execSync } from 'child_process';
import * as path from 'path';

export const TEST_USER = {
  email: 'playwright@fintekkers-test.local',
  password: 'PlaywrightTest123',
  name: 'Playwright',
} as const;

export const STORAGE_STATE_PATH = path.resolve('playwright/.auth/user.json');

const BROKER_HOST = '127.0.0.1:80';
const PROTO_PATH = path.resolve(process.env.HOME!, 'projects/broker-service/proto');
const SIGNUP_CODE = 'S1GNUP';

function grpcurl(method: string, data: Record<string, string>): { code: number; stdout: string; stderr: string } {
  const cmd = [
    'grpcurl -plaintext',
    `-import-path ${PROTO_PATH}`,
    '-proto auth.proto',
    `-d '${JSON.stringify(data)}'`,
    BROKER_HOST,
    `fintekkers.services.auth.Auth/${method}`,
  ].join(' ');
  try {
    return { code: 0, stdout: execSync(cmd, { encoding: 'utf-8', timeout: 10_000, stdio: ['ignore', 'pipe', 'pipe'] }), stderr: '' };
  } catch (err: any) {
    // grpcurl writes its own error message to stderr AND throws; we capture
    // both so callers can decide whether to ignore (e.g. AlreadyExists on
    // re-register is fine).
    return { code: err.status ?? 1, stdout: err.stdout?.toString() ?? '', stderr: err.stderr?.toString() ?? '' };
  }
}

/**
 * Ensure the Playwright test user exists in the broker. Idempotent — re-running
 * is a no-op when the user already exists.
 */
export function ensureTestUserRegistered(): void {
  const result = grpcurl('Register', {
    email: TEST_USER.email,
    password: TEST_USER.password,
    name: TEST_USER.name,
    signup_code: SIGNUP_CODE,
  });
  // code 0 = newly created. Anything else is fine if it's AlreadyExists (the
  // broker rejects duplicate emails, which is what we want — the user already
  // existed from a prior run).
  if (result.code !== 0 && !/AlreadyExists|already registered/i.test(result.stderr)) {
    throw new Error(`Failed to register Playwright test user: ${result.stderr}`);
  }
}

/**
 * Login the test user via the broker and return the apiKey. The apiKey is
 * what the SvelteKit form action expects to set as `ft_api_key` cookie.
 */
export function loginTestUser(): string {
  const result = grpcurl('Login', { email: TEST_USER.email, password: TEST_USER.password });
  if (result.code !== 0) {
    throw new Error(`Failed to login Playwright test user: ${result.stderr}`);
  }
  const apiKey = JSON.parse(result.stdout).apiKey;
  if (!apiKey) {
    throw new Error(`Login returned no apiKey: ${result.stdout}`);
  }
  return apiKey;
}

/**
 * Probe whether the broker + grpcurl are available. Used by setup to skip
 * gracefully when the local infra isn't running.
 */
export function brokerAvailable(): boolean {
  try {
    execSync(`grpcurl -plaintext ${BROKER_HOST} list`, { timeout: 3000, stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}
