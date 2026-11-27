/**
 * US-356: /contactus renders in the public-site shell (PublicShell: FreeNav,
 * FreeFooter, the .ft-free theme root) with four labelled, required fields,
 * field-level errors like /free/request's, and, after a real successful
 * send, a "Thanks, your message is sent" confirmation with no emoji.
 */
import { render, screen, within } from "@testing-library/svelte";
import { afterEach, describe, expect, test, vi } from "vitest";

const sendMail = vi.fn();
vi.mock("nodemailer", () => ({
  default: { createTransport: () => ({ sendMail }) },
}));

import ContactPage from "../routes/contactus/+page.svelte";
import { actions } from "../routes/contactus/+page.server";
import type { ContactFormState } from "$lib/contact";

const EMOJI = /\p{Emoji_Presentation}|\u{FE0F}/u;
const LABELS = ["First name", "Last name", "Email", "Message"];

describe("/contactus page", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  test("renders in the public-site shell with four labelled, required fields", () => {
    const { container } = render(ContactPage);
    expect(container.querySelectorAll(".ft-free")).toHaveLength(1);
    const nav = screen.getByRole("navigation", { name: "Primary" });
    expect(within(nav).getByRole("link", { name: "Contact" })).toHaveAttribute(
      "aria-current",
      "page"
    );
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Contact us" })
    ).toBeInTheDocument();
    for (const label of LABELS) {
      expect(screen.getByLabelText(label)).toBeRequired();
    }
    expect(screen.getByLabelText("Message").tagName).toBe("TEXTAREA");
    expect(
      screen.getByRole("button", { name: "Send message" })
    ).toBeInTheDocument();
  });

  test("a field error sits under its field and keeps what was typed", () => {
    render(ContactPage, {
      props: {
        form: {
          errors: { email: "Enter a valid email" },
          values: {
            firstname: "Ada",
            lastname: "Lovelace",
            email: "nope",
            message: "Hi",
          },
        },
      },
    });
    const email = screen.getByLabelText("Email");
    expect(email).toHaveAttribute("aria-invalid", "true");
    expect(email).toHaveAttribute("aria-describedby", "email-error");
    expect(document.getElementById("email-error")).toHaveTextContent(
      "Enter a valid email"
    );
    expect(screen.getByLabelText("First name")).toHaveValue("Ada");
    expect(screen.getByLabelText("First name")).not.toHaveAttribute(
      "aria-invalid"
    );
  });

  test("a real successful send shows the confirmation, with no emoji", async () => {
    vi.stubEnv("CONTACT_GMAIL_USER", "inbox@example.com");
    vi.stubEnv("CONTACT_GMAIL_APP_PASSWORD", "app password");
    sendMail.mockReset().mockResolvedValue({});
    const body = new FormData();
    body.set("firstname", "Ada");
    body.set("lastname", "Lovelace");
    body.set("email", "ada@example.com");
    body.set("message", "Hello there");
    const run = actions.message as unknown as (
      e: unknown
    ) => Promise<ContactFormState>;
    const form = await run({
      request: new Request("http://localhost/contactus?/message", {
        method: "POST",
        body,
      }),
    });
    expect(form).toEqual({ success: true });
    expect(sendMail).toHaveBeenCalledTimes(1);

    const { container } = render(ContactPage, { props: { form } });
    const card = screen.getByRole("region", {
      name: "Thanks, your message is sent",
    });
    expect(
      within(card).getByRole("heading", {
        name: "Thanks, your message is sent",
      })
    ).toBeInTheDocument();
    expect(card.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    expect(
      within(card).getByRole("link", { name: "Send another message" })
    ).toHaveAttribute("href", "/contactus");
    for (const label of LABELS) {
      expect(screen.queryByLabelText(label)).toBeNull();
    }
    // Emoji-style characters (the old page's ✅), not text symbols such as
    // the footer's ©, which is Extended_Pictographic too.
    expect("✅").toMatch(EMOJI);
    expect(container.textContent).not.toMatch(EMOJI);
  });
});
