import { randomBytes } from "node:crypto";

/**
 * Pure helpers for the production contact-form smoke test.
 *
 * Kept free of @playwright/test and imapflow so the vitest unit suite
 * (src/tests/smoke-checks.test.ts) can cover them without collecting the
 * smoke spec itself.
 */

/**
 * The contact form sends to CONTACT_GMAIL_USER, so the test reads that same
 * inbox over IMAP with the app password the app already holds.
 */
export const REQUIRED_ENV = [
  "CONTACT_GMAIL_USER",
  "CONTACT_GMAIL_APP_PASSWORD",
] as const;

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

/**
 * Throws unless the server confirmed the mailbox was opened read-only
 * (IMAP EXAMINE), so nothing in it can be flagged, moved or marked read
 * (guardrail 3).
 */
export function assertReadOnlyMailbox(mailbox: {
  path: string;
  readOnly?: boolean;
}): void {
  if (mailbox.readOnly !== true) {
    throw new Error(
      `IMAP mailbox ${mailbox.path} was not opened read-only; refusing to continue`
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
