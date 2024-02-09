import {  redirect } from "@sveltejs/kit";
import * as Yup from 'yup';
import { isValidationError } from "$lib/helper.js";


const signInSchema = Yup.object({
    email:Yup.string().email().required('please enter email'),
    password:Yup.string().required('please enter password')
})

export const actions = {
    login: async ({ request }: { request: Request }) => {
        let formError = null;
        let isValid = null;

        try {
            const data = await request.formData();
            const email = data.get('Email');
            const password = data.get('Password');

            isValid = await signInSchema.validate({ email, password }, { abortEarly: false });

            console.log('sign in is valid', isValid)

            // Check if email and password exist
            if (email && password) {
                // No validation errors and redirection is triggered outside the try block
            }
        } catch (validationError) {
            // Validation failed
            if (isValidationError(validationError)) {
                const validationErrors = validationError.inner.map((error: { message: string }) => error.message);
                formError = validationErrors;
                console.log('form error', formError)
            }
        }

        // Perform redirection outside the try...catch block if validation succeeded
        if (isValid && !formError) {
            throw redirect(303, "/portfolios");
        }

        // Return formError if there are any validation errors
        return { formError };
    }
};

// function isValidationError(error: unknown): error is Yup.ValidationError {
//     return (error as Yup.ValidationError)?.inner !== undefined;
// }
