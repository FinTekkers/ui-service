import {  redirect } from "@sveltejs/kit";
import * as Yup from 'yup';
import { isValidationError } from "$lib/helper.js";


const signInSchema = Yup.object({
    email:Yup.string().email().required('email'),
    password:Yup.string().required('password')
})


type fieldInput = FormDataEntryValue | null;


let email:fieldInput, password:fieldInput;

export const actions = {

    login: async ({ request }: { request: Request }) => {
        let formError = null;
        let isValid = null;

        try {
            const data = await request.formData();
             email = data.get('Email');
             password = data.get('Password');

            isValid = await signInSchema.validate({ email, password }, { abortEarly: false });

        
        } catch (validationError) {
            // Validation failed
            if (isValidationError(validationError)) {
                const validationErrors = validationError.inner.map((error: { message: string }) => error.message);
                formError = validationErrors;
            }
        }

        // Perform redirection outside the try...catch block if validation succeeded
        if (isValid && !formError) {
            throw redirect(303, "/portfolios");
        }

        // Return formError if there are any validation errors
        return { formError, email, password };
    },


};


