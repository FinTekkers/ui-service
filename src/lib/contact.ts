// The contact form (/contactus, US-356): its fields and what the action
// returns to the page. Shared by the page and src/lib/server/contact.ts.
// Nothing here is secret.

export const CONTACT_FIELDS = [
  "firstname",
  "lastname",
  "email",
  "message",
] as const;

export type ContactField = (typeof CONTACT_FIELDS)[number];

export type ContactValues = Record<ContactField, string>;

export interface ContactFormState {
  success?: boolean;
  errors?: Partial<Record<ContactField, string>>;
  values?: ContactValues;
  formError?: string;
}
