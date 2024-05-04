import { redirect } from "@sveltejs/kit";

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

import { FetchSecurity } from "$lib/security";

/** @type {import('./$types').PageServerLoad} */
export async function load({locals:{user}}) {

  const userData = await loadUserSession(user);
  

  // session

  const security = await FetchSecurity("Fixed Income", "US Government");
  return { security, userData };
}