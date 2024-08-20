import {  redirect } from "@sveltejs/kit";
import * as Yup from 'yup'; 
import { superValidate } from 'sveltekit-superforms/server';
import { lucia } from '$lib/database/luciaAuth.server';
import { generateId } from 'lucia';
import { Argon2id } from 'oslo/password';
import { createAndSetSession } from '$lib/database/authUtils.server';
import { checkIfEmailExists, insertNewUser } from '$lib/database/databaseUtils.server';
import {yup} from 'sveltekit-superforms/adapters'


const  DASHBOARD_ROUTE  = "/data/portfolios"


const signUpSchema = Yup.object({
    email:Yup.string().email().required('email'),
    password:Yup.string().required('password'),
    confirmpassword:Yup.string(),
    firstname: Yup.string(),
    lastname: Yup.string()
})

type fieldInput = FormDataEntryValue | null;


export const actions = {
       
     register: async ({request, cookies}:{request:Request}) => {

        const form = await superValidate(request, yup(signUpSchema))
        let formError = null;
        let message = null;
        
        if (form.valid === false) {
             message = 'form is invalid'
            formError = {message, error:form.errors}
            return { formError, message };
		}

        try{
            const isEmailAlreadyRegistered = await checkIfEmailExists(form.data.email);

            if (isEmailAlreadyRegistered === true) {
                console.log('email already exist')
                return
			}

            const userId = generateId(15);
			const hashedPassword = await new Argon2id().hash(form.data.password);

            await insertNewUser({
                id: userId,
                firstname: form.data.firstname,
                lastname: form.data.lastname,
                confirmpassword: form.data.confirmpassword,
                email: form.data.email,
                password: hashedPassword,
                authMethods: []
            });

            await createAndSetSession(lucia, userId, cookies);


        }catch(err){
           console.log('something went wrong when registering')
           console.log(err)
        }

        throw redirect(303, DASHBOARD_ROUTE);

	}
};


