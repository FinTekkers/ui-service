// /contactus (US-356): each valid message is one email, through the Gmail
// transport (src/lib/server/gmail.ts), from and to CONTACT_GMAIL_USER with
// Reply-To the visitor. Nothing is stored. The action keeps its name,
// ?/message, so older posts still land here.
import { fail } from "@sveltejs/kit";
import type { Actions } from "./$types";
import { getGmailTransport, gmailUser } from "$lib/server/gmail";
import { buildContactEmail, validateContact } from "$lib/server/contact";
import type { ContactValues } from "$lib/contact";

const UNAVAILABLE =
  "Contact form is temporarily unavailable. Please email us directly.";
const SEND_FAILED =
  "There was an error sending your message. Please try again later.";

export const actions: Actions = {
  message: async ({ request }) => {
    const data = await request.formData();
    const field = (name: string) =>
      (data.get(name)?.toString() ?? "").replace(/\r\n/g, "\n");

    const values: ContactValues = {
      firstname: field("firstname"),
      lastname: field("lastname"),
      email: field("email"),
      message: field("message"),
    };
    const result = validateContact(values);
    if (!result.ok) return fail(400, { errors: result.errors, values });

    const transporter = getGmailTransport();
    if (!transporter) {
      console.error(
        "Contact form: CONTACT_GMAIL_USER / CONTACT_GMAIL_APP_PASSWORD env vars not configured."
      );
      return fail(503, { formError: UNAVAILABLE, values });
    }

    try {
      await transporter.sendMail(buildContactEmail(result.value, gmailUser()));
    } catch (error) {
      console.error("Contact form email error:", error);
      return fail(500, { formError: SEND_FAILED, values });
    }
    return { success: true };
  },
};
