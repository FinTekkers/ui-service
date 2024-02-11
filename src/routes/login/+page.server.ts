import {  redirect, fail } from "@sveltejs/kit";
import * as Yup from 'yup';
import { isValidationError } from "$lib/helper.js";


const signInSchema = Yup.object({
    email:Yup.string().email().required('email'),
    password:Yup.string().required('password')
})

const signUpSchema = Yup.object({
    email:Yup.string().email().required('email'),
    password:Yup.string().required('password'),
    confirmpassword:Yup.string().required('confirmpassword'),
    firstname: Yup.string(),
    lastname: Yup.string()
})

type fieldInput = FormDataEntryValue | null;


let email:fieldInput, password:fieldInput, registerFirstName: fieldInput,
    registerLastName: fieldInput,
    registerEmail: fieldInput,
    registerPassword: fieldInput,
    registerConfirmPassword: fieldInput;

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


    register: async({request}:{request:Request})=>{
         let formError = null;
         let isValid = null;
        try{
            const data = await request.formData();
            registerFirstName = data.get('firstname');
            registerLastName = data.get('lastname');
            registerEmail = data.get('email');
            registerPassword = data.get('password');
            registerConfirmPassword = data.get('confirmpassword');


        
            isValid = await signUpSchema.validate({ registerEmail,registerPassword, registerConfirmPassword, registerFirstName, registerLastName }, { abortEarly: false });

            
            

        }catch(validationError){
             if (isValidationError(validationError)) {
                const validationErrors = validationError.inner.map((error: { message: string }) => error.message);
                formError = validationErrors;
                console.log('form error', formError)
            }
        }

          // Perform redirection outside the try...catch block if validation succeeded
        if (isValid && !formError) {
            throw redirect(303, "/contactus");
        }

        // Return formError if there are any validation errors
        return { formError,registerEmail,registerPassword, registerConfirmPassword, registerFirstName, registerLastName };
    }
};


