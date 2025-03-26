import { redirect } from "@sveltejs/kit";
import * as Yup from 'yup';
import { isValidationError } from "$lib/helper";





const validationSchema = Yup.object({
    firstname: Yup.string().required('firstname'),
    lastname: Yup.string().required('lastname'),
    email: Yup.string().required('email').email('Invalid email'),
    message: Yup.string().required('message'),

})

let firstname: FormDataEntryValue | null, lastname: FormDataEntryValue | null, email: FormDataEntryValue | null, message: FormDataEntryValue | null;

export const actions = {
    message: async ({ request }: { request: Request }) => {
        console.log("Will attempt to send mail");
        let isValid: any = null;
        let formError: string[] | null = null;;
        try {

            const data = await request.formData();

            firstname = data.get('firstname');
            lastname = data.get('lastname');
            email = data.get('email');
            message = data.get('message');

            isValid = await validationSchema.validate({ firstname, lastname, email, message }, { abortEarly: false });




        } catch (validationError) {

            // Validation failed
            if (isValidationError(validationError)) {
                const validationErrors = validationError.inner.map((error: { message: string }) => error.message);
                formError = validationErrors;
            }

        }

        // Perform redirection outside the try...catch block if validation succeeded
        if (isValid && !formError) {
            console.log("TODO: Implement");
            throw redirect(303, "/contactus");
        }

        // Return formError if there are any validation errors && form data to persist value / form manual enhacement
        return { formError, firstname, lastname, email, message, success: true };
    }
}
