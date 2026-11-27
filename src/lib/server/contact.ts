// Server side of the contact form (/contactus, US-356): field validation
// and the email each message becomes. Messages are emailed only, never
// stored. Every visitor value is HTML-escaped; the visitor's email goes only
// in Reply-To, and only once it has passed validation.
import * as Yup from "yup";
import type { ContactField, ContactValues } from "$lib/contact";
import type { GmailMessage } from "./gmail";
import { escapeHtml } from "./mail-html";

const INVALID_EMAIL = "Enter a valid email";
const CR_OR_LF = /[\r\n]/;

const contactSchema = Yup.object({
  firstname: Yup.string().trim().required("Enter your first name"),
  lastname: Yup.string().trim().required("Enter your last name"),
  email: Yup.string()
    .trim()
    .required("Enter your email")
    .email(INVALID_EMAIL)
    // A CR or LF could start a new mail header once in Reply-To.
    .test("single-line", INVALID_EMAIL, (v) => !v || !CR_OR_LF.test(v)),
  message: Yup.string().trim().required("Enter a message"),
});

export type ContactValidation =
  | { ok: true; value: ContactValues }
  | { ok: false; errors: Partial<Record<ContactField, string>> };

/** Validates and trims the form's fields; one error message per field. */
export function validateContact(input: ContactValues): ContactValidation {
  try {
    const value = contactSchema.validateSync(input, {
      abortEarly: false,
      stripUnknown: true,
    });
    return {
      ok: true,
      value: {
        firstname: value.firstname,
        lastname: value.lastname,
        email: value.email,
        message: value.message,
      },
    };
  } catch (error) {
    if (!(error instanceof Yup.ValidationError)) throw error;
    const errors: Partial<Record<ContactField, string>> = {};
    for (const err of error.inner.length ? error.inner : [error]) {
      const field = err.path as ContactField | undefined;
      if (field && !Object.prototype.hasOwnProperty.call(errors, field)) {
        errors[field] = err.message;
      }
    }
    return { ok: false, errors };
  }
}

/** One email for a validated message, from and to `inbox`, Reply-To the
 * visitor. Throws if the visitor's email could break a header. */
export function buildContactEmail(
  msg: ContactValues,
  inbox: string
): GmailMessage {
  if (CR_OR_LF.test(msg.email)) {
    throw new Error("Contact email contains a line break");
  }
  const name = `${msg.firstname} ${msg.lastname}`;
  const fields: [string, string][] = [
    ["Name", name],
    ["Email", msg.email],
    ["Message", msg.message],
  ];
  return {
    from: inbox,
    to: inbox,
    replyTo: msg.email,
    // A CR or LF in a name must never start a new header.
    subject: `New message from ${name}`.replace(/[\r\n]+/g, " "),
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
