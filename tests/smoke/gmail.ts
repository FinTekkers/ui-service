import { ImapFlow } from "imapflow";
import { assertReadOnlyMailbox, subjectHasMarker } from "./checks";

/**
 * Read-only IMAP helpers for the production contact-form smoke test.
 *
 * Every mailbox is opened with EXAMINE (readOnly) and only SEARCH and
 * FETCH ENVELOPE are issued: bodies are never downloaded, and nothing is
 * deleted, moved, flagged, labelled, marked read or sent. Errors never carry
 * credentials, and imapflow's protocol logger is disabled.
 */

const IMAP_HOST = "imap.gmail.com";
const IMAP_PORT = 993;

export interface GmailEnv {
  CONTACT_GMAIL_USER: string;
  CONTACT_GMAIL_APP_PASSWORD: string;
}

/**
 * Logs in to the CONTACT_GMAIL_USER mailbox and opens INBOX read-only.
 * Fails here, before any mail is sent, if the login or IMAP is refused.
 */
export async function connectReadonlyInbox(env: GmailEnv): Promise<ImapFlow> {
  const client = new ImapFlow({
    host: IMAP_HOST,
    port: IMAP_PORT,
    secure: true,
    auth: {
      user: env.CONTACT_GMAIL_USER,
      pass: env.CONTACT_GMAIL_APP_PASSWORD,
    },
    logger: false,
  });
  // Socket errors surface through the pending command; keep them from
  // crashing the worker as an unhandled 'error' event.
  client.on("error", () => {});
  try {
    await client.connect();
  } catch (error) {
    const reason =
      (error as { responseText?: string }).responseText ??
      (error as Error).message;
    throw new Error(
      `IMAP login to ${IMAP_HOST} failed (check CONTACT_GMAIL_USER, CONTACT_GMAIL_APP_PASSWORD and that IMAP is enabled): ${reason}`
    );
  }
  assertReadOnlyMailbox(await client.mailboxOpen("INBOX", { readOnly: true }));
  return client;
}

/**
 * Returns the first message in the open mailbox whose Subject contains the
 * exact marker, or null. Gmail search is a candidate filter only.
 */
export async function findMessage(
  client: ImapFlow,
  marker: string
): Promise<{ messageId: string } | null> {
  const uids = await client.search(
    { gmraw: `${marker} newer_than:1d` },
    { uid: true }
  );
  if (!uids || uids.length === 0) return null;
  const messages = await client.fetchAll(
    uids,
    { uid: true, envelope: true },
    { uid: true }
  );
  for (const message of messages) {
    if (subjectHasMarker(message.envelope?.subject, marker)) {
      return { messageId: message.envelope?.messageId ?? `uid:${message.uid}` };
    }
  }
  return null;
}

/**
 * Polls the open INBOX until a message with the marker appears or `deadline`
 * (epoch ms) passes. Never resubmits the form.
 */
export async function waitForInboxMessage(
  client: ImapFlow,
  marker: string,
  { deadline, intervalMs = 10_000 }: { deadline: number; intervalMs?: number }
): Promise<{ messageId: string } | null> {
  for (;;) {
    const found = await findMessage(client, marker);
    if (found) return found;
    const remaining = deadline - Date.now();
    if (remaining <= 0) return null;
    await new Promise((resolve) =>
      setTimeout(resolve, Math.min(intervalMs, remaining))
    );
  }
}

/**
 * Looks for the marker in Gmail's All Mail folder (read-only), to tell
 * "filed outside the inbox" apart from "never arrived".
 */
export async function findOutsideInbox(
  client: ImapFlow,
  marker: string
): Promise<{ messageId: string } | null> {
  const allMail = (await client.list()).find(
    (mailbox) => mailbox.specialUse === "\\All"
  );
  if (!allMail) return null;
  assertReadOnlyMailbox(
    await client.mailboxOpen(allMail.path, { readOnly: true })
  );
  return findMessage(client, marker);
}

/** Logs out, ignoring errors so cleanup never masks the test result. */
export async function closeInbox(client: ImapFlow): Promise<void> {
  await client.logout().catch(() => {});
}
