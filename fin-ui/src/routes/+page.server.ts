import { fail, redirect } from "@sveltejs/kit";

export const actions = {
    default: async ({request, cookies})=>{
       const data = await request.formData();
       const email = data.get('Email');
       const password = data.get('Password');


       if(!email|| !password){
           return fail(400, {error:"enter email or password"})
       }
      
       cookies.set('session', JSON.stringify({userId:123}))

       throw redirect(303, "/portfolios")


    }
}