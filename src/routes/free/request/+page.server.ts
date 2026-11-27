// /free/request (US-352): each valid request is one email, through the
// contact form's Gmail transport, to FREE_REQUEST_TO (default
// dave@fintekkers.org). Nothing is stored. A filled honeypot or a client
// over the per-IP limit gets the same success reply and no email.
import { fail } from "@sveltejs/kit";
import type { Actions } from "./$types";
import { getGmailTransport, gmailUser } from "$lib/server/gmail";
import {
  allowRequest,
  buildRequestEmail,
  releaseRequest,
  requestRecipient,
  validateRequest,
} from "$lib/server/free-request";
import type { FreeRequestValues } from "$lib/free/request";

const UNAVAILABLE =
  "Requests are temporarily unavailable. Please email us directly.";
const SEND_FAILED =
  "There was an error sending your request. Please try again later.";

export const actions: Actions = {
  default: async ({ request, getClientAddress }) => {
    const data = await request.formData();
    // Forms send line breaks as CRLF; count them as one character, as the
    // page's counter and maxlength do.
    const field = (name: string) =>
      (data.get(name)?.toString() ?? "").replace(/\r\n/g, "\n");

    if (field("website")) {
      console.warn("Free request: honeypot filled; not sent.");
      return { success: true };
    }

    const values: FreeRequestValues = {
      kind: field("kind") || "chart",
      title: field("title"),
      description: field("description"),
      url: field("url"),
      useCase: field("useCase"),
      email: field("email"),
    };
    const result = validateRequest(values);
    if (!result.ok) return fail(400, { errors: result.errors, values });

    const transporter = getGmailTransport();
    if (!transporter) {
      console.error(
        "Free request: CONTACT_GMAIL_USER / CONTACT_GMAIL_APP_PASSWORD env vars not configured."
      );
      return fail(503, { formError: UNAVAILABLE, values });
    }

    const ip = getClientAddress();
    const at = Date.now();
    if (!allowRequest(ip, at)) {
      console.warn(`Free request: rate limit reached for ${ip}; not sent.`);
      return { success: true };
    }

    try {
      await transporter.sendMail(
        buildRequestEmail(result.value, requestRecipient(), gmailUser())
      );
    } catch (error) {
      releaseRequest(ip, at);
      console.error("Free request email error:", error);
      return fail(500, { formError: SEND_FAILED, values });
    }
    return { success: true };
  },
};
