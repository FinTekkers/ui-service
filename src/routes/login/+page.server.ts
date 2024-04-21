import {redirect } from "@sveltejs/kit";
import * as Yup from 'yup';
import { eq } from 'drizzle-orm';
import { Argon2id } from 'oslo/password';
import { superValidate } from 'sveltekit-superforms/server';
import { createAndSetSession } from '$lib/database/authUtils.server';
import { database } from '$lib/database/database.server';
import { lucia } from '$lib/database/luciaAuth.server';
import { usersTable } from '$lib/database/schema';
import {yup} from 'sveltekit-superforms/adapters'
import { deleteSessionCookie } from '$lib/database/authUtils.server';



const signInSchema = Yup.object({
    email:Yup.string().email().required('email'),
    password:Yup.string().required('password')
})


const DASHBOARD_ROUTE = "/portfolios"
const LOGIN_ROUTE = "/login"

type fieldInput = FormDataEntryValue | null;


let email:fieldInput, password:fieldInput;

export const actions = {

   login: async ({ request,locals, url, cookies }:{ request: Request, url:URL,locals:any, cookies:any }) => {
		const form = await superValidate(request, yup(signInSchema))
        let formError = null;
        let message = null;

    
		if (form.valid === false) {
            message = 'form is invalid'
            formError = {message, error:form.errors}
            return { formError, message };
		}

        try{

             email = form.data.email;
             password = form.data.password;
             await signInSchema.validate({ email, password }, { abortEarly: false });

            const [existingUser] = await database
			.select({
				id: usersTable.id,
				password: usersTable.password
			})
			.from(usersTable)
			.where(eq(usersTable.email, form.data.email));

		if (existingUser === undefined) {
            console.log('email not registered')
            return
		}

		const validPassword = await new Argon2id().verify(
			existingUser.password,
			form.data.password
		);

		if (!validPassword) {
            console.log('invalid password')
            return
		}

		await createAndSetSession(lucia, existingUser.id, cookies);


        }catch(err){
            console.log(err)
        }

	

        throw redirect(303, DASHBOARD_ROUTE);

	},



    logout: async ({ cookies, locals }) => {
		if (!locals.session?.id) return;

		await lucia.invalidateSession(locals.session.id);

		await deleteSessionCookie(lucia, cookies);

		throw redirect(303, LOGIN_ROUTE);
	},
    

};


