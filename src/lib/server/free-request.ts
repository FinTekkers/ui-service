// Server side of "Request a free analysis" (/free/request, US-352): field
// validation, the email each request becomes, its recipient and a per-IP
// rate limit. Requests are emailed only, never stored (owner, 26 Nov).
import * as Yup from "yup";
import {
  DESCRIPTION_MAX,
  REQUEST_KINDS,
  TITLE_MAX,
  URL_MAX,
  USE_CASES,
  kindLabel,
  useCaseLabel,
  type FreeRequestField,
  type FreeRequestValues,
} from "$lib/free/request";
import type { GmailMessage } from "./gmail";
import { escapeHtml } from "./mail-html";

export const DEFAULT_REQUEST_TO = "dave@fintekkers.org";
export const RATE_LIMIT = 5;
export const RATE_WINDOW_MS = 60 * 60 * 1000;

const requestSchema = Yup.object({
  kind: Yup.string()
    .oneOf(
      REQUEST_KINDS.map((k) => k.value),
      "Choose what you're asking for"
    )
    .required("Choose what you're asking for"),
  title: Yup.string()
    .trim()
    .required("Enter a short title")
    .max(TITLE_MAX, `Title must be at most ${TITLE_MAX} characters`),
  description: Yup.string()
    .trim()
    .required("Describe what you'd like to see")
    .max(
      DESCRIPTION_MAX,
      `Description must be at most ${DESCRIPTION_MAX.toLocaleString(
        "en-US"
      )} characters`
    ),
  url: Yup.string()
    .trim()
    .url("Enter a full URL, starting with https://")
    .max(URL_MAX, `URL must be at most ${URL_MAX} characters`),
  useCase: Yup.string().oneOf(
    USE_CASES.map((u) => u.value),
    "Choose one of the options"
  ),
  email: Yup.string()
    .trim()
    .required("Enter your email")
    .email("Enter a valid email"),
});

export type ValidationResult =
  | { ok: true; value: FreeRequestValues }
  | { ok: false; errors: Partial<Record<FreeRequestField, string>> };

/** Validates and trims the form's fields; one error message per field. */
export function validateRequest(input: FreeRequestValues): ValidationResult {
  try {
    const value = requestSchema.validateSync(input, {
      abortEarly: false,
      stripUnknown: true,
    });
    return {
      ok: true,
      value: {
        kind: value.kind,
        title: value.title,
        description: value.description,
        url: value.url ?? "",
        useCase: value.useCase ?? "",
        email: value.email,
      },
    };
  } catch (error) {
    if (!(error instanceof Yup.ValidationError)) throw error;
    const errors: Partial<Record<FreeRequestField, string>> = {};
    for (const err of error.inner.length ? error.inner : [error]) {
      const field = err.path as FreeRequestField | undefined;
      if (field && !Object.prototype.hasOwnProperty.call(errors, field)) {
        errors[field] = err.message;
      }
    }
    return { ok: false, errors };
  }
}

export { escapeHtml };

/** FREE_REQUEST_TO, else dave@fintekkers.org. */
export function requestRecipient(): string {
  return process.env.FREE_REQUEST_TO?.trim() || DEFAULT_REQUEST_TO;
}

/** One email for a validated request, Reply-To the visitor. */
export function buildRequestEmail(
  req: FreeRequestValues,
  to: string,
  from: string
): GmailMessage {
  const fields: [string, string][] = [
    ["What's being asked for", kindLabel(req.kind)],
    ["Title", req.title],
    ["Description", req.description],
    ["Example or data-source URL", req.url || "(none)"],
    ["How would you use it?", useCaseLabel(req.useCase) || "(none)"],
    ["Email", req.email],
  ];
  return {
    from,
    to,
    replyTo: req.email,
    // A CR or LF in the title must never start a new header.
    subject: `Free analysis request: ${req.title}`.replace(/[\r\n]+/g, " "),
    text: fields.map(([label, value]) => `${label}: ${value}`).join("\n"),
    html: `<dl>${fields
      .map(
        ([label, value]) =>
          `<dt><strong>${escapeHtml(label)}</strong></dt><dd>${escapeHtml(
            value
          ).replace(/\r?\n/g, "<br>")}</dd>`
      )
      .join("")}</dl>`,
  };
}

// Timestamps of each IP's recent requests, in this process only.
const recent = new Map<string, number[]>();

/** Takes one of the IP's RATE_LIMIT slots per hour; false when none left. */
export function allowRequest(ip: string, now = Date.now()): boolean {
  for (const [key, times] of recent) {
    const live = times.filter((t) => now - t < RATE_WINDOW_MS);
    if (live.length) recent.set(key, live);
    else recent.delete(key);
  }
  const times = recent.get(ip) ?? [];
  if (times.length >= RATE_LIMIT) return false;
  recent.set(ip, [...times, now]);
  return true;
}

/** Gives back the slot allowRequest took at `at`, after a failed send. */
export function releaseRequest(ip: string, at: number): void {
  const times = recent.get(ip);
  if (!times) return;
  const i = times.lastIndexOf(at);
  if (i >= 0) times.splice(i, 1);
  if (!times.length) recent.delete(ip);
}

/** Tests only. */
export function resetRateLimit(): void {
  recent.clear();
}
