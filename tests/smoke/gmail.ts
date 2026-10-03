import { OAuth2Client } from "google-auth-library";
import { assertReadonlyScopes, subjectHasMarker } from "./checks";

/**
 * Read-only Gmail helpers for the production contact-form smoke test.
 *
 * Only GET requests against messages.list / messages.get(format=metadata)
 * are made: bodies are never downloaded, and nothing is modified, labelled,
 * archived or sent. Errors carry the HTTP status only, never headers or the
 * response body.
 */

const GMAIL_API = "https://gmail.googleapis.com/gmail/v1/users/me";

export interface GmailEnv {
  GMAIL_CLIENT_ID: string;
  GMAIL_CLIENT_SECRET: string;
  GMAIL_REFRESH_TOKEN: string;
}

/** Thrown for 429/5xx so polling can back off instead of failing the run. */
export class GmailTransientError extends Error {}

/**
 * Exchanges the refresh token for an access token and rejects it unless its
 * granted scopes are exactly gmail.readonly.
 */
export async function getReadonlyAccessToken(env: GmailEnv): Promise<string> {
  const client = new OAuth2Client(env.GMAIL_CLIENT_ID, env.GMAIL_CLIENT_SECRET);
  client.setCredentials({ refresh_token: env.GMAIL_REFRESH_TOKEN });

  let token: string | null | undefined;
  try {
    ({ token } = await client.getAccessToken());
  } catch {
    // The library error can echo request details; keep the message generic.
    throw new Error("Gmail OAuth token refresh failed (check GMAIL_* vars)");
  }
  if (!token) throw new Error("Gmail OAuth token refresh returned no token");

  let scopes: string[];
  try {
    ({ scopes } = await client.getTokenInfo(token));
  } catch {
    throw new Error("Gmail OAuth token info lookup failed");
  }
  assertReadonlyScopes(scopes ?? []);
  return token;
}

async function gmailGet<T>(token: string, path: string): Promise<T> {
  const res = await fetch(`${GMAIL_API}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 429 || res.status >= 500) {
    throw new GmailTransientError(`Gmail API returned HTTP ${res.status}`);
  }
  if (!res.ok) {
    throw new Error(`Gmail API returned HTTP ${res.status}`);
  }
  return (await res.json()) as T;
}

/**
 * Returns the first message matching `query` whose Subject header contains
 * the exact marker, or null. Gmail search is a candidate filter only.
 */
export async function findMessage(
  token: string,
  query: string,
  marker: string
): Promise<{ id: string } | null> {
  const list = await gmailGet<{ messages?: { id: string }[] }>(
    token,
    `/messages?${new URLSearchParams({ q: query, maxResults: "5" })}`
  );
  for (const { id } of list.messages ?? []) {
    const meta = await gmailGet<{
      payload?: { headers?: { name: string; value: string }[] };
    }>(
      token,
      `/messages/${encodeURIComponent(id)}?${new URLSearchParams({
        format: "metadata",
        metadataHeaders: "Subject",
      })}`
    );
    const subject = meta.payload?.headers?.find(
      (h) => h.name.toLowerCase() === "subject"
    )?.value;
    if (subjectHasMarker(subject, marker)) return { id };
  }
  return null;
}

export const inboxQuery = (marker: string) =>
  `in:inbox ${marker} newer_than:1d`;
export const anywhereQuery = (marker: string) =>
  `in:anywhere ${marker} newer_than:1d`;

/**
 * Polls the inbox until a message with the marker appears or `deadline`
 * (epoch ms) passes. Never resubmits the form.
 */
export async function waitForInboxMessage(
  token: string,
  marker: string,
  { deadline, intervalMs = 10_000 }: { deadline: number; intervalMs?: number }
): Promise<{ id: string } | null> {
  let delay = intervalMs;
  for (;;) {
    try {
      const found = await findMessage(token, inboxQuery(marker), marker);
      if (found) return found;
      delay = intervalMs;
    } catch (error) {
      if (!(error instanceof GmailTransientError)) throw error;
      delay = Math.min(delay * 2, 60_000);
    }
    const remaining = deadline - Date.now();
    if (remaining <= 0) return null;
    await new Promise((resolve) =>
      setTimeout(resolve, Math.min(delay, remaining))
    );
  }
}
