/**
 * US-352 guardrail: /contactus keeps working unchanged after its Gmail
 * transport moved to src/lib/server/gmail.ts. Pins today's mail options
 * (sender is the visitor, recipient is CONTACT_GMAIL_USER), the success
 * shape and the formError array shapes. Env is set before each import, so
 * the action sees credentials however it reads them.
 */
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const sendMail = vi.fn();
const createTransport = vi.fn((..._args: unknown[]) => ({ sendMail }));
vi.mock("nodemailer", () => ({
  default: { createTransport: (...a: unknown[]) => createTransport(...a) },
}));

const USER = "inbox@example.com";
const PASS = "abcd efgh ijkl mnop";

function post(fields: Record<string, string>) {
  const body = new FormData();
  for (const [k, v] of Object.entries(fields)) body.set(k, v);
  return {
    request: new Request("http://localhost/contactus", {
      method: "POST",
      body,
    }),
  };
}

const VALID = {
  firstname: "Ada",
  lastname: "Lovelace",
  email: "ada@example.com",
  message: "Hello there",
};

async function loadAction() {
  vi.resetModules();
  const mod = await import("../routes/contactus/+page.server");
  return mod.actions.message as (e: unknown) => Promise<unknown>;
}

describe("/contactus mail (unchanged by US-352)", () => {
  beforeEach(() => {
    sendMail.mockReset().mockResolvedValue({});
    createTransport.mockClear();
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  test("sends from the visitor to CONTACT_GMAIL_USER with today's subject and body", async () => {
    vi.stubEnv("CONTACT_GMAIL_USER", USER);
    vi.stubEnv("CONTACT_GMAIL_APP_PASSWORD", PASS);
    const message = await loadAction();

    const result = await message(post(VALID));

    expect(createTransport).toHaveBeenCalledWith({
      service: "gmail",
      auth: { user: USER, pass: PASS },
    });
    expect(sendMail).toHaveBeenCalledTimes(1);
    expect(sendMail).toHaveBeenCalledWith({
      from: "ada@example.com",
      to: USER,
      subject: "New message from Ada Lovelace",
      text: "Hello there",
      html: `<p><strong>From:</strong> Ada Lovelace (ada@example.com)</p>
                       <p><strong>Message:</strong></p>
                       <p>Hello there</p>`,
    });
    expect(result).toEqual({ success: true, ...VALID });
  });

  test("without credentials: the unavailable formError array, no transport", async () => {
    vi.stubEnv("CONTACT_GMAIL_USER", "");
    vi.stubEnv("CONTACT_GMAIL_APP_PASSWORD", "");
    const message = await loadAction();

    expect(await message(post(VALID))).toEqual({
      formError: [
        "Contact form is temporarily unavailable. Please email us directly.",
      ],
    });
    expect(createTransport).not.toHaveBeenCalled();
  });

  test("a validation failure returns the field messages as a formError array", async () => {
    vi.stubEnv("CONTACT_GMAIL_USER", USER);
    vi.stubEnv("CONTACT_GMAIL_APP_PASSWORD", PASS);
    const message = await loadAction();

    expect(
      await message(post({ ...VALID, firstname: "", email: "nope" }))
    ).toEqual({ formError: ["firstname", "Invalid email"] });
    expect(sendMail).not.toHaveBeenCalled();
  });

  test("a send failure returns the generic formError array", async () => {
    vi.stubEnv("CONTACT_GMAIL_USER", USER);
    vi.stubEnv("CONTACT_GMAIL_APP_PASSWORD", PASS);
    sendMail.mockRejectedValue(new Error("smtp down"));
    const message = await loadAction();

    expect(await message(post(VALID))).toEqual({
      formError: [
        "There was an error sending your message. Please try again later.",
      ],
    });
  });
});
