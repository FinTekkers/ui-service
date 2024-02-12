import {  redirect, fail } from "@sveltejs/kit";
import * as Yup from 'yup';
import { isValidationError } from "$lib/helper.js";


const signUpSchema = Yup.object({
    email:Yup.string().email().required('email'),
    password:Yup.string().required('password'),
    confirmpassword:Yup.string().required('confirmpassword'),
    firstname: Yup.string(),
    lastname: Yup.string()
})

type fieldInput = FormDataEntryValue | null;


let firstname: fieldInput,
    lastname: fieldInput,
    email: fieldInput,
    password: fieldInput,
    confirmpassword: fieldInput;

export const actions = {

    register: async({request}:{request:Request})=>{
         let formError = null;
         let isValid = null;
     
         try{
            const data = await request.formData();
            console.log('the form data check', data)
            firstname = data.get('firstname');
            lastname = data.get('lastname');
            email = data.get('email');
            password = data.get('password');
            confirmpassword = data.get('confirmpassword');

            
        
           isValid = await signUpSchema.validate({ firstname,lastname,email, password, confirmpassword}, { abortEarly: false });


        }catch(validationError){
                console.log('validation errors', validationError)

             if (isValidationError(validationError)) {
                const validationErrors = validationError.inner.map((error: { message: string }) => error.message);
                formError = validationErrors;
            }
        }

          // Perform redirection outside the try...catch block if validation succeeded
        if (!formError) {
            throw redirect(303, "/login");
        }

        // Return formError if there are any validation errors
        return { formError,email,password, confirmpassword, firstname, lastname };
    }
};


