/**
 * Auth fixture for Playwright E2E and deploy smoke tests (US-233).
 *
 * Tests never register or log in. Since BS-33 every broker login rotates
 * the user's API key, so suites that logged in per run invalidated each
 * other mid-test. Instead the e2e user's API key is provisioned once
 * (BS-31) and Horizon passes it in (HZ-494):
 *
 *   FT_E2E_EMAIL    the e2e user's email, set as the `ft_user_email` cookie
 *   FT_E2E_API_KEY  the provisioned key, set as the `ft_api_key` cookie
 *
 * FT_E2E_PASSWORD is kept only for re-provisioning; tests don't read it.
 *
 * When a variable is missing, or the app can't load data with the key,
 * the logged-in tests skip with E2E_KEY_MISSING_OR_EXPIRED and the
 * variable's name. Messages hold names only, never values.
 *
 * `auth.setup.ts` and scripts/checks/e2e.sh write the session to
 * STORAGE_STATE_PATH, a gitignored temp file (`/playwright/.auth/`).
 */
import type {
  APIRequestContext,
  PlaywrightWorkerArgs,
  TestType,
} from "@playwright/test";
import * as path from "path";

export const STORAGE_STATE_PATH = path.resolve("playwright/.auth/user.json");

export const E2E_VARIABLES = ["FT_E2E_EMAIL", "FT_E2E_API_KEY"] as const;

export const E2E_KEY_MISSING_OR_EXPIRED =
  "e2e API key missing or expired; re-run BS-31's provisioning";

// A broker-backed page every logged-in suite can load: with a rejected key
// the CPI series search fails and the page shows this notice.
const SESSION_PROBE_PATH = "/data/cpi_index";
const SESSION_PROBE_FAILURE = "Could not load CPI series";

export type E2ECredentials = { email: string; apiKey: string };

export type StorageState = Awaited<
  ReturnType<APIRequestContext["storageState"]>
>;

type Env = Record<string, string | undefined>;

/** Names of the e2e variables that are unset or empty. */
export function missingE2EVariables(env: Env = process.env): string[] {
  return E2E_VARIABLES.filter((name) => !env[name]);
}

/** Why the logged-in tests skip, naming the missing variables; null if none. */
export function e2eSkipReason(env: Env = process.env): string | null {
  const missing = missingE2EVariables(env);
  if (missing.length === 0) return null;
  const verb = missing.length === 1 ? "is" : "are";
  return `${E2E_KEY_MISSING_OR_EXPIRED} (${missing.join(
    " and "
  )} ${verb} not set)`;
}

/** The e2e user's email and API key, from the environment only. */
export function getE2ECredentials(env: Env = process.env): E2ECredentials {
  const reason = e2eSkipReason(env);
  if (reason !== null) throw new Error(reason);
  return { email: env.FT_E2E_EMAIL!, apiKey: env.FT_E2E_API_KEY! };
}

/** Skips the calling file or describe block when a variable is missing. */
export function skipUnlessE2ECredentials(t: TestType<any, any>): void {
  const reason = e2eSkipReason();
  t.skip(reason !== null, reason ?? "");
}

/**
 * The session cookies hooks.server.ts reads, for `baseURL`'s host. The
 * same shape the login form action sets (setApiKeyCookie,
 * setUserInfoCookies), without a login.
 */
export function e2eStorageState(
  baseURL: string,
  creds: E2ECredentials
): StorageState {
  const url = new URL(baseURL);
  const cookie = (name: string, value: string) => ({
    name,
    value: encodeURIComponent(value),
    domain: url.hostname,
    path: "/",
    expires: -1,
    httpOnly: true,
    secure: url.protocol === "https:",
    sameSite: "Lax" as const,
  });
  return {
    cookies: [
      cookie("ft_api_key", creds.apiKey),
      cookie("ft_user_email", creds.email),
    ],
    origins: [],
  };
}

/**
 * Null if the app loads broker data with the session, else the reason to
 * skip. A redirect to /login or the probe page's load failure both mean
 * the key was not accepted.
 */
export async function e2eSessionRejection(
  playwright: PlaywrightWorkerArgs["playwright"],
  baseURL: string,
  state: StorageState
): Promise<string | null> {
  const ctx = await playwright.request.newContext({
    baseURL,
    storageState: state,
  });
  try {
    const res = await ctx.get(SESSION_PROBE_PATH, { maxRedirects: 0 });
    const location = res.headers()["location"] ?? "";
    if (res.status() >= 300 && res.status() < 400 && /\/login/.test(location))
      return `${E2E_KEY_MISSING_OR_EXPIRED} (${SESSION_PROBE_PATH} redirected to /login with FT_E2E_API_KEY)`;
    if (!res.ok())
      return `${E2E_KEY_MISSING_OR_EXPIRED} (${SESSION_PROBE_PATH} returned ${res.status()} with FT_E2E_API_KEY)`;
    if ((await res.text()).includes(SESSION_PROBE_FAILURE))
      return `${E2E_KEY_MISSING_OR_EXPIRED} (${SESSION_PROBE_PATH} could not load data with FT_E2E_API_KEY)`;
    return null;
  } finally {
    await ctx.dispose();
  }
}

/**
 * The e2e user's session for `baseURL`, from FT_E2E_EMAIL and
 * FT_E2E_API_KEY. Never logs in, so concurrent runs can't rotate the key,
 * and never calls test.skip: scripts/checks/e2e.sh calls it from plain node,
 * where a missing variable throws (naming it) and exits non-zero.
 */
export async function ensureTestUserSession(
  _playwright: Pick<PlaywrightWorkerArgs["playwright"], "request">,
  baseURL: string
): Promise<StorageState> {
  return e2eStorageState(baseURL, getE2ECredentials());
}

/**
 * ensureTestUserSession for Playwright hooks and tests: skips via `t` (from
 * beforeAll, the whole group) when a variable is missing or the app rejects
 * the key, naming the reason.
 */
export async function e2eSessionOrSkip(
  t: TestType<any, any>,
  playwright: PlaywrightWorkerArgs["playwright"],
  baseURL: string
): Promise<StorageState> {
  const missing = e2eSkipReason();
  t.skip(missing !== null, missing ?? "");
  const state = await ensureTestUserSession(playwright, baseURL);
  const rejection = await e2eSessionRejection(playwright, baseURL, state);
  t.skip(rejection !== null, rejection ?? "");
  return state;
}
