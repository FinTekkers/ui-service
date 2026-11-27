// The Gmail SMTP transport shared by the contact form (/contactus) and the
// free-analysis request form (/free/request, US-352). Credentials come from
// CONTACT_GMAIL_USER / CONTACT_GMAIL_APP_PASSWORD, read when called; this
// module is under $lib/server, so they never reach the client bundle.
import nodemailer from "nodemailer";

// The part of nodemailer's Transporter the forms use.
export interface GmailTransport {
  sendMail(options: GmailMessage): Promise<unknown>;
}

export interface GmailMessage {
  from: string;
  to: string;
  replyTo?: string;
  subject: string;
  text: string;
  html: string;
}

/** The Gmail account the transport authenticates as ("" when unset). */
export function gmailUser(): string {
  return process.env.CONTACT_GMAIL_USER ?? "";
}

/** A Gmail transport, or null when either credential is empty. */
export function getGmailTransport(): GmailTransport | null {
  const user = gmailUser();
  const pass = process.env.CONTACT_GMAIL_APP_PASSWORD ?? "";
  if (!user || !pass) return null;
  return nodemailer.createTransport({
    service: "gmail", // or use host/port if using custom SMTP
    auth: { user, pass },
  });
}
