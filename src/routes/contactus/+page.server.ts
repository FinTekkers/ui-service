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

            // Configure the transporter
            const transporter = nodemailer.createTransport({
                service: "gmail", // or use host/port if using custom SMTP
                auth: {
                    user: "dave@fintekkers.org",         // replace with your real email
                    pass: "epsm ntsw vpma zhsv"       // use app password if 2FA is on
                }
            });

            // Email content
            const mailOptions = {
                from: email,
                to: "dave@fintekkers.org",
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
