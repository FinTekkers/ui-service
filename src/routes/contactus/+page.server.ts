import { redirect } from "@sveltejs/kit";
import * as Yup from 'yup';
import { isValidationError } from "$lib/helper";
import nodemailer from 'nodemailer';

const validationSchema = Yup.object({
    firstname: Yup.string().required('firstname'),
    lastname: Yup.string().required('lastname'),
    email: Yup.string().required('email').email('Invalid email'),
    message: Yup.string().required('message'),
});

// Gmail SMTP credentials sourced from env vars. .env carries local-dev
// values (or is empty, in which case the contact form fails-soft); GH
// Actions secrets inject production values during deployment (see
// build_deploy.py + .github/workflows/deploy.yml). Hardcoded
// credentials were removed — the previously-committed app password
// MUST be rotated in Gmail (the leak is in git history regardless of
// this fix).
const CONTACT_GMAIL_USER = process.env.CONTACT_GMAIL_USER ?? '';
const CONTACT_GMAIL_APP_PASSWORD = process.env.CONTACT_GMAIL_APP_PASSWORD ?? '';

export const actions = {
    message: async ({ request }) => {
        console.log("Will attempt to send mail");

        let formError: string[] | null = null;

        try {
            const data = await request.formData();

            const firstname = data.get('firstname')?.toString() || "";
            const lastname = data.get('lastname')?.toString() || "";
            const email = data.get('email')?.toString() || "";
            const message = data.get('message')?.toString() || "";

            await validationSchema.validate({ firstname, lastname, email, message }, { abortEarly: false });

            if (!CONTACT_GMAIL_USER || !CONTACT_GMAIL_APP_PASSWORD) {
                // Surface a user-facing error rather than try-then-throw
                // against gmail (which would expose internals via the
                // catch branch below). Server log carries the real reason.
                console.error('Contact form: CONTACT_GMAIL_USER / CONTACT_GMAIL_APP_PASSWORD env vars not configured.');
                return { formError: ['Contact form is temporarily unavailable. Please email us directly.'] };
            }

            // Configure the transporter
            const transporter = nodemailer.createTransport({
                service: "gmail", // or use host/port if using custom SMTP
                auth: {
                    user: CONTACT_GMAIL_USER,
                    pass: CONTACT_GMAIL_APP_PASSWORD,
                }
            });

            // Email content. `to` mirrors the authenticated user
            // (the form just routes inbound contact messages to
            // whichever inbox the SMTP account belongs to) — one
            // env var configures both sender and destination.
            const mailOptions = {
                from: email,
                to: CONTACT_GMAIL_USER,
                subject: `New message from ${firstname} ${lastname}`,
                text: message,
                html: `<p><strong>From:</strong> ${firstname} ${lastname} (${email})</p>
                       <p><strong>Message:</strong></p>
                       <p>${message}</p>`
            };

            // Send the email
            await transporter.sendMail(mailOptions);
            console.log("Email sent");

            // After email is sent successfully
            return {
                success: true,
                firstname,
                lastname,
                email,
                message
            };

        } catch (error) {
            if (isValidationError(error)) {
                const validationErrors = error.inner.map((err: any) => err.message);
                formError = validationErrors;
            } else {
                console.error("Email error:", error);
                formError = ["There was an error sending your message. Please try again later."];
            }

            return { formError };
        }
    }
};
