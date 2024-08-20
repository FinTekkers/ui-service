//Requests & Services
import { PortfolioService } from "@fintekkers/ledger-models/node/wrappers/services/portfolio-service/PortfolioService";

import * as dt from "@fintekkers/ledger-models/node/wrappers/models/utils/datetime";
import { PositionFilter } from "@fintekkers/ledger-models/node/wrappers/models/position/positionfilter";
import type Portfolio from "@fintekkers/ledger-models/node/wrappers/models/portfolio/portfolio";
import pkg from '@fintekkers/ledger-models/node/fintekkers/models/position/field_pb.js';
import { FetchPortfolio } from "$lib/portfolios";
import { FetchTransaction } from "$lib/transactions";
import { redirect } from "@sveltejs/kit";
//**session info */
import { deleteSessionCookie } from '$lib/database/authUtils.server';
import { lucia } from '$lib/database/luciaAuth.server';
const { FieldProto } = pkg;

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
  const transactions = await FetchTransaction();
  const userData = await loadUserSession(user);
  

  return { transactions, userData };
}