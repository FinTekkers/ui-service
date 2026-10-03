import { randomBytes } from "node:crypto";

/**
 * Pure helpers for the production contact-form smoke test.
 *
 * Kept free of @playwright/test and google-auth-library so the vitest unit
 * suite (src/tests/smoke-checks.test.ts) can cover them without collecting
 * the smoke spec itself.
 */

export const REQUIRED_ENV = [
  "GMAIL_CLIENT_ID",
  "GMAIL_CLIENT_SECRET",
  "GMAIL_REFRESH_TOKEN",
] as const;

export const GMAIL_READONLY_SCOPE =
  "https://www.googleapis.com/auth/gmail.readonly";

/** Hard ceiling from the success metric: the email must arrive within 5 min. */
export const MAX_EMAIL_TIMEOUT_MS = 5 * 60_000;

/**
 * Returns every named variable, or throws naming all that are missing.
 * Empty and whitespace-only values count as missing (a copied .env.example
 * sets them to "").
 */
export function requireEnv<T extends string>(
  names: readonly T[],
  env: Record<string, string | undefined> = process.env
): Record<T, string> {
  const missing = names.filter(
    (name) =>
      !Object.prototype.hasOwnProperty.call(env, name) ||
      typeof env[name] !== "string" ||
      (env[name] as string).trim() === ""
  );
  if (missing.length > 0) {
    throw new Error(`Missing required env var(s): ${missing.join(", ")}`);
  }
  const values = {} as Record<T, string>;
  for (const name of names) values[name] = env[name] as string;
  return values;
}

/**
 * Unique, alphanumeric-only marker so Gmail search treats it as one token:
 * FTSMOKE + UTC YYYYMMDDHHmmss + 8 random hex chars.
 */
export function makeMarker(now: Date = new Date()): string {
  const stamp = now
    .toISOString()
    .replace(/\.\d{3}Z$/, "")
    .replace(/[-:T]/g, "");
  return `FTSMOKE${stamp}${randomBytes(4).toString("hex")}`;
}

/** Throws unless the granted scopes are exactly gmail.readonly (guardrail 3). */
export function assertReadonlyScopes(scopes: readonly string[]): void {
  if (scopes.length === 0) {
    throw new Error("Gmail token has no scopes; expected gmail.readonly only");
  }
  const extra = scopes.filter((scope) => scope !== GMAIL_READONLY_SCOPE);
  if (extra.length > 0) {
    throw new Error(
      `Gmail token has scopes beyond gmail.readonly: ${extra.join(", ")}`
    );
  }
}

/**
 * Parses SMOKE_EMAIL_TIMEOUT_MS. A run may shorten the 5-minute window but
 * never lengthen it; an invalid value fails before the form is submitted.
 */
export function resolveEmailTimeoutMs(raw: string | undefined): number {
  if (raw === undefined || raw.trim() === "") return MAX_EMAIL_TIMEOUT_MS;
  const value = Number(raw);
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(
      `SMOKE_EMAIL_TIMEOUT_MS must be a positive integer, got "${raw}"`
    );
  }
  return Math.min(value, MAX_EMAIL_TIMEOUT_MS);
}

/** Exact-marker check applied to a candidate message's Subject header. */
export function subjectHasMarker(
  subject: string | undefined,
  marker: string
): boolean {
  return typeof subject === "string" && subject.includes(marker);
}
