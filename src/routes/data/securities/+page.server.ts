import { redirect } from "@sveltejs/kit";
import { FetchSecurity } from "$lib/security";
//**session info */
import { deleteSessionCookie } from '$lib/database/authUtils.server';
import { lucia } from '$lib/database/luciaAuth.server';


//Requests & Services

/** @type {import('./$types').PageServerLoad} */
const loadUserSession = async(user:any)=>{
// **********session data handling function
         if(!user){
            console.log('you must be logged in')
            throw redirect(303,"/login")     
         }
        return {
          user
        };
}


export const actions = {

  logout: async({ cookies, locals })=>{
          if (!locals.session?.id) return;

              await lucia.invalidateSession(locals.session.id);

              await deleteSessionCookie(lucia, cookies);

              throw redirect(303, "/login");
  }

}

/** @type {import('./$types').PageServerLoad} */
export async function load({locals:{user}}) {

  const userData = await loadUserSession(user);
  

  // session

  const security = await FetchSecurity("Fixed Income", "US Government");
  return { security, userData };
}