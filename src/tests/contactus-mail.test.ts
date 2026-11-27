/**
 * US-356: /contactus's action emails each valid message once, through the
 * Gmail transport, from and to CONTACT_GMAIL_USER with Reply-To the visitor.
 * (Before US-356 it sent "from" the visitor with their text pasted raw into
 * the HTML; this file pinned that and now pins the fix.) Empty or invalid
 * fields get field-level errors and no send; every visitor value is
 * HTML-escaped; a CR or LF can't reach a header.
 */
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const sendMail = vi.fn();
const createTransport = vi.fn((..._args: unknown[]) => ({ sendMail }));
vi.mock("nodemailer", () => ({
  default: { createTransport: (...a: unknown[]) => createTransport(...a) },
}));

import { actions } from "../routes/contactus/+page.server";
import { buildContactEmail } from "$lib/server/contact";
import type { ContactValues } from "$lib/contact";

const USER = "inbox@example.com";
const PASS = "abcd efgh ijkl mnop";
const MARKUP = '<a href="x">hi</a><script>';

const VALID: ContactValues = {
  firstname: "Ada",
  lastname: "Lovelace",
  email: "ada@example.com",
  message: "Hello there",
};

type Result = { status?: number; data?: any; success?: boolean };

async function submit(fields: Record<string, string>): Promise<Result> {
  const body = new FormData();
  for (const [k, v] of Object.entries(fields)) body.set(k, v);
  const request = new Request("http://localhost/contactus?/message", {
    method: "POST",
    body,
  });
  const run = actions.message as unknown as (e: unknown) => Promise<Result>;
  return run({ request });
}

function sent() {
  expect(sendMail).toHaveBeenCalledTimes(1);
  return sendMail.mock.calls[0][0];
}

describe("/contactus action", () => {
  beforeEach(() => {
    sendMail.mockReset().mockResolvedValue({});
    createTransport.mockClear();
    vi.stubEnv("CONTACT_GMAIL_USER", USER);
    vi.stubEnv("CONTACT_GMAIL_APP_PASSWORD", PASS);
    vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  test("a valid message is sent once, from and to the inbox, Reply-To the visitor", async () => {
    expect(await submit(VALID)).toEqual({ success: true });
    expect(createTransport).toHaveBeenCalledWith({
      service: "gmail",
      auth: { user: USER, pass: PASS },
    });
    const mail = sent();
    expect(Object.keys(mail).sort()).toEqual(
      ["from", "html", "replyTo", "subject", "text", "to"].sort()
    );
    expect(mail.from).toBe(USER);
    expect(mail.to).toBe(USER);
    expect(mail.replyTo).toBe("ada@example.com");
    expect(mail.subject).toBe("New message from Ada Lovelace");
    expect(mail.text).toContain("Hello there");
    expect(mail.html).toContain("Hello there");
  });

  test.each([
    ["firstname", { firstname: "" }, "Enter your first name"],
    ["firstname", { firstname: "   " }, "Enter your first name"],
    ["lastname", { lastname: "" }, "Enter your last name"],
    ["email", { email: "" }, "Enter your email"],
    ["email", { email: "nope" }, "Enter a valid email"],
    ["message", { message: "" }, "Enter a message"],
  ] as const)(
    "%s %j: 400 with an error on that field only, no transport",
    async (field, change, message) => {
      const values = { ...VALID, ...change };
      const result = await submit(values);
      expect(result.status).toBe(400);
      expect(result.data.errors).toEqual({ [field]: message });
      expect(result.data.values).toEqual(values);
      expect(createTransport).not.toHaveBeenCalled();
      expect(sendMail).not.toHaveBeenCalled();
    }
  );

  test("markup in the names and message is escaped; From and To stay the inbox", async () => {
    expect(
      await submit({
        firstname: MARKUP,
        lastname: MARKUP,
        email: "ada@example.com",
        message: MARKUP,
      })
    ).toEqual({ success: true });
    const mail = sent();
    expect(mail.html).toContain("&lt;a href=&quot;x&quot;&gt;hi&lt;/a&gt;");
    expect(mail.html).toContain("&lt;script&gt;");
    expect(mail.html).not.toMatch(/<a[\s>]/i);
    expect(mail.html).not.toMatch(/<script/i);
    expect(mail.replyTo).toBe("ada@example.com");
    expect(mail.from).toBe(USER);
    expect(mail.to).toBe(USER);
  });

  test.each([
    ["CRLF", "a@b.com\r\nBcc: x@y.com"],
    ["bare LF", "a@b.com\nBcc: x@y.com"],
  ])("an email with a %s header injection: 400, no send", async (_, email) => {
    const result = await submit({ ...VALID, email });
    expect(result.status).toBe(400);
    expect(result.data.errors).toEqual({ email: "Enter a valid email" });
    expect(sendMail).not.toHaveBeenCalled();
  });

  test("a CR or LF in a name can't start a new header", async () => {
    await submit({ ...VALID, firstname: "Ada\r\nBcc: x@y.com" });
    expect(sent().subject).toBe("New message from Ada Bcc: x@y.com Lovelace");
  });

  test("without credentials: 503 with the unavailable formError, no transport", async () => {
    vi.stubEnv("CONTACT_GMAIL_USER", "");
    vi.stubEnv("CONTACT_GMAIL_APP_PASSWORD", "");
    const result = await submit(VALID);
    expect(result.status).toBe(503);
    expect(result.data).toEqual({
      formError:
        "Contact form is temporarily unavailable. Please email us directly.",
      values: VALID,
    });
    expect(createTransport).not.toHaveBeenCalled();
  });

  test("a send failure: 500 with the generic formError", async () => {
    sendMail.mockRejectedValue(new Error("smtp down"));
    const result = await submit(VALID);
    expect(result.status).toBe(500);
    expect(result.data).toEqual({
      formError:
        "There was an error sending your message. Please try again later.",
      values: VALID,
    });
  });
});

describe("buildContactEmail", () => {
  test("escapes markup in every field", () => {
    const mail = buildContactEmail(
      {
        firstname: MARKUP,
        lastname: MARKUP,
        email: `${MARKUP}@x.com`,
        message: MARKUP,
      },
      USER
    );
    expect(mail.html.match(/&lt;a href=&quot;x&quot;&gt;/g)).toHaveLength(4);
    expect(mail.html.match(/&lt;script&gt;/g)).toHaveLength(4);
    expect(mail.html).not.toMatch(/<a[\s>]/i);
    expect(mail.html).not.toMatch(/<script/i);
    expect(mail.from).toBe(USER);
    expect(mail.to).toBe(USER);
  });

  test.each(["a@b.com\r\nBcc: x@y.com", "a@b.com\nBcc: x@y.com"])(
    "throws on an email with a line break: %j",
    (email) => {
      expect(() => buildContactEmail({ ...VALID, email }, USER)).toThrow();
    }
  );
});
