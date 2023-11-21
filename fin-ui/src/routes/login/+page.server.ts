import { fail, redirect } from "@sveltejs/kit";
import * as Yup from 'yup';

const signInSchema = Yup.object({
    email:Yup.string().email().required('please enter email'),
    password:Yup.string().required('please enter password')
})

export const actions = {
    default: async ({request}:{ request: Request })=>{
         try{
             
                         const data = await request.formData();
                         const email = data.get('Email');
                         const password = data.get('Password');
             
                        try {
                                const isValid =  await signInSchema.validate({ email, password }, {abortEarly:false});
                                // Validation succeeded
                                throw redirect(303, "/portfolios");

                        } catch (validationError) {
                                // Validation failed
                                if(validationError?.inner) {
                                   const validationErrors = validationError?.inner.map((error: { message: string; }) => error.message);
                                   return { formError: validationErrors }; 
                                 }

                         }

         }catch(error){
             console.log('error', error)
         }


    }
}