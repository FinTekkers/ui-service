/**
 * US-352: /free/request's form action emails each valid request once,
 * through the contact form's Gmail transport, to FREE_REQUEST_TO (default
 * dave@fintekkers.org) with Reply-To the visitor. Invalid fields are
 * rejected with field-level errors; a filled honeypot or a client over its
 * 5-per-hour limit gets a silent success and no email; a failed send gives
 * back its rate-limit slot. User input is HTML-escaped in the body and can't
 * add a header through the subject.
 */
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const sendMail = vi.fn();
const createTransport = vi.fn((..._args: unknown[]) => ({ sendMail }));
vi.mock("nodemailer", () => ({
  default: { createTransport: (...a: unknown[]) => createTransport(...a) },
}));

import { actions } from "../routes/free/request/+page.server";
import { buildRequestEmail, resetRateLimit } from "$lib/server/free-request";

const USER = "inbox@example.com";

const VALID = {
  kind: "dataset",
  title: "Corporate bond spreads",
  description: "Daily IG and HY spreads since 2000.",
  url: "https://example.com/spreads",
  useCase: "research",
  email: "visitor@example.com",
};

type Result = { status?: number; data?: any; success?: boolean };

async function submit(
  fields: Record<string, string>,
  ip = "203.0.113.7"
): Promise<Result> {
  const body = new FormData();
  for (const [k, v] of Object.entries(fields)) body.set(k, v);
  const request = new Request("http://localhost/free/request", {
    method: "POST",
    body,
  });
  const run = actions.default as unknown as (e: unknown) => Promise<Result>;
  return run({ request, getClientAddress: () => ip });
}

describe("/free/request action", () => {
  beforeEach(() => {
    resetRateLimit();
    sendMail.mockReset().mockResolvedValue({});
    createTransport.mockClear();
    vi.stubEnv("CONTACT_GMAIL_USER", USER);
    vi.stubEnv("CONTACT_GMAIL_APP_PASSWORD", "app password");
    vi.stubEnv("FREE_REQUEST_TO", "");
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  test("metric 1: a valid request is one email to dave@fintekkers.org, Reply-To the visitor, listing every field", async () => {
    expect(await submit(VALID)).toEqual({ success: true });

    expect(createTransport).toHaveBeenCalledWith({
      service: "gmail",
      auth: { user: USER, pass: "app password" },
    });
    expect(sendMail).toHaveBeenCalledTimes(1);
    const mail = sendMail.mock.calls[0][0];
    expect(mail.to).toBe("dave@fintekkers.org");
    expect(mail.from).toBe(USER);
    expect(mail.replyTo).toBe("visitor@example.com");
    expect(mail.subject).toBe("Free analysis request: Corporate bond spreads");
    expect(mail.text).toBe(
      [
        "What's being asked for: A new dataset",
        "Title: Corporate bond spreads",
        "Description: Daily IG and HY spreads since 2000.",
        "Example or data-source URL: https://example.com/spreads",
        "How would you use it?: Research or analysis",
        "Email: visitor@example.com",
      ].join("\n")
    );
  });

  test("metric 1: FREE_REQUEST_TO overrides the recipient", async () => {
    vi.stubEnv("FREE_REQUEST_TO", "ops@example.com");
    await submit(VALID);
    expect(sendMail).toHaveBeenCalledTimes(1);
    expect(sendMail.mock.calls[0][0].to).toBe("ops@example.com");
  });

  test("empty optional fields are (none) in the body", async () => {
    await submit({ ...VALID, url: "", useCase: "" });
    const { text } = sendMail.mock.calls[0][0];
    expect(text).toContain("Example or data-source URL: (none)");
    expect(text).toContain("How would you use it?: (none)");
  });

  test.each([
    ["missing email", { email: "" }, "email"],
    ["invalid email", { email: "not-an-email" }, "email"],
    ["missing title", { title: "" }, "title"],
    ["whitespace-only title", { title: "   " }, "title"],
    ["title over 120 characters", { title: "t".repeat(121) }, "title"],
    ["missing description", { description: "" }, "description"],
    ["whitespace-only description", { description: " \n\t " }, "description"],
    [
      "description over 2,000 characters",
      { description: "d".repeat(2001) },
      "description",
    ],
  ])(
    "metric 2: %s is a 400 with a %s error and no email",
    async (_n, change, field) => {
      const fields = { ...VALID, ...change };
      const result = await submit(fields);
      expect(result.status).toBe(400);
      expect(Object.keys(result.data.errors)).toEqual([field]);
      expect(result.data.errors[field]).toEqual(expect.any(String));
      expect(result.data.values).toEqual(fields);
      expect(sendMail).not.toHaveBeenCalled();
    }
  );

  test("a 120-character title and a 2,000-character description are accepted", async () => {
    expect(
      await submit({
        ...VALID,
        title: "t".repeat(120),
        description: "d".repeat(2000),
      })
    ).toEqual({ success: true });
    expect(sendMail).toHaveBeenCalledTimes(1);
  });

  test("a CRLF line break counts as one character toward the 2,000 limit", async () => {
    const description = "d".repeat(999) + "\r\n" + "d".repeat(1000);
    expect(await submit({ ...VALID, description })).toEqual({ success: true });
    expect(sendMail.mock.calls[0][0].text).toContain(
      "d".repeat(999) + "\n" + "d"
    );
  });

  test("metric 3: HTML in the title and description is escaped in the html body", async () => {
    await submit({
      ...VALID,
      title: "<script>alert(1)</script>",
      description: `<img src=x onerror="steal()"> & more`,
    });
    const { html } = sendMail.mock.calls[0][0];
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("<img");
    expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(html).toContain(
      "&lt;img src=x onerror=&quot;steal()&quot;&gt; &amp; more"
    );
  });

  test("metric 3: a newline in the title adds no header to the email", async () => {
    await submit({ ...VALID, title: "Hi\r\nBcc: x@evil.test" });
    const mail = sendMail.mock.calls[0][0];
    expect(mail.subject).not.toMatch(/[\r\n]/);

    // nodemailer ships no type declarations here.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const real = await vi.importActual<any>("nodemailer");
    const info = await real.default
      .createTransport({ streamTransport: true, buffer: true })
      .sendMail(mail);
    const raw = (info.message as Buffer).toString("utf8");
    const headers = raw.slice(0, raw.indexOf("\r\n\r\n"));
    expect(headers).not.toMatch(/^bcc:/im);
    expect(headers).toMatch(/^Reply-To: visitor@example\.com$/m);
    expect(headers).toMatch(/^To: dave@fintekkers\.org$/m);
  });

  test("buildRequestEmail escapes every field it lists", () => {
    const mail = buildRequestEmail(
      { ...VALID, url: "https://e.com/?a=1&b=<2>" },
      "to@example.com",
      "from@example.com"
    );
    expect(mail.html).toContain("https://e.com/?a=1&amp;b=&lt;2&gt;");
  });

  test("guardrail: a filled honeypot is a silent success with no email", async () => {
    expect(await submit({ ...VALID, website: "http://spam.test" })).toEqual({
      success: true,
    });
    expect(sendMail).not.toHaveBeenCalled();
  });

  test("guardrail: the 6th request from one IP within an hour sends nothing; another IP still sends", async () => {
    for (let i = 0; i < 5; i++) {
      expect(await submit(VALID, "198.51.100.1")).toEqual({ success: true });
    }
    expect(sendMail).toHaveBeenCalledTimes(5);

    expect(await submit(VALID, "198.51.100.1")).toEqual({ success: true });
    expect(sendMail).toHaveBeenCalledTimes(5);

    expect(await submit(VALID, "198.51.100.2")).toEqual({ success: true });
    expect(sendMail).toHaveBeenCalledTimes(6);
  });

  test("guardrail: a failed (500) send gives back its rate-limit slot", async () => {
    sendMail.mockRejectedValueOnce(new Error("smtp down"));
    const failed = await submit(VALID, "198.51.100.3");
    expect(failed.status).toBe(500);
    expect(failed.data.formError).toMatch(/error sending your request/);

    for (let i = 0; i < 5; i++) await submit(VALID, "198.51.100.3");
    expect(sendMail).toHaveBeenCalledTimes(6);
  });

  test("guardrail: with no Gmail credentials, a 503 takes no slot and creates no transport", async () => {
    vi.stubEnv("CONTACT_GMAIL_USER", "");
    for (let i = 0; i < 6; i++) {
      const result = await submit(VALID, "198.51.100.4");
      expect(result.status).toBe(503);
      expect(result.data.formError).toBe(
        "Requests are temporarily unavailable. Please email us directly."
      );
    }
    expect(createTransport).not.toHaveBeenCalled();

    vi.stubEnv("CONTACT_GMAIL_USER", USER);
    for (let i = 0; i < 5; i++) await submit(VALID, "198.51.100.4");
    expect(sendMail).toHaveBeenCalledTimes(5);
  });
});
