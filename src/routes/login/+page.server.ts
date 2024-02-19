import {  redirect } from "@sveltejs/kit";
import * as Yup from 'yup';
import { isValidationError } from "$lib/helper.js";
import {OAuth2Client} from 'google-auth-library'
import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } from "$env/static/private";


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


     OAuth2:async({request})=>{
        
        const redirectURL = 'http://localhost:5173/portfolios';
        const oAuth2client = new OAuth2Client(
            GOOGLE_CLIENT_ID,
            GOOGLE_CLIENT_SECRET,
            redirectURL
            )

        const authorizeUrl = oAuth2client.generateAuthUrl({
            access_type:'offline',
            scope: "https://www.googleapis.com/auth/userinfo.profile openid",
            prompt:'consent'
            })
       

        throw redirect(302, authorizeUrl)

    }


};


