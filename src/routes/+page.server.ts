import * as Yup from 'yup';

import pkg from '@fintekkers/ledger-models/node/fintekkers/models/position/field_pb.js';
const { FieldProto } = pkg;
import { SecurityService } from "@fintekkers/ledger-models/node/wrappers/services/security-service/SecurityService";
import { PositionFilter } from "@fintekkers/ledger-models/node/wrappers/models/position/positionfilter";
import type Security from "@fintekkers/ledger-models/node/wrappers/models/security/security";
import type BondSecurity from "@fintekkers/ledger-models/node/wrappers/models/security/BondSecurity";
import { identifierString } from "$lib/security";

/** @type {import('./$types').PageServerLoad} */

const signInSchema = Yup.object({
  searchQuery: Yup.string().min(3, 'please enter a word').required('please enter text'),
})

export const actions = {
  search: async ({ request }: { request: Request }) => {

    try {
      const data = await request.formData();
      const searchQuery = data.get('search');
      console.log('search query', searchQuery);
    } catch (error) {
      console.log('something went wrong', error)
    }
  }
}


export async function load({ locals }: { locals: App.Locals }) {
  const securityService = new SecurityService(locals.user?.apiKey);
  let results = [];

  const positionFilter = new PositionFilter();
  positionFilter.addEqualsFilter(FieldProto.ASSET_CLASS, "Fixed Income");
  positionFilter.addEqualsFilter(
    FieldProto.SECURITY_ISSUER_NAME,
    "US Government"
  );

  try {
    var securities = await securityService.searchSecurityAsOfNow(positionFilter);

    //Map results into list of maps -> Date, Amount
    for (let index in securities) {
      const security: Security = securities[index];
      if (!security.isBond()) continue;
      const bond = security as BondSecurity;

      const issuances = bond.getIssuances();
      const issuance = issuances.length > 0 ? issuances[0] : null;

      if (issuance) {
        const qty = issuance.getPostAuctionOutstandingQuantity();
        if (!qty && security.getMaturityDate().toDate().getFullYear() > 2009) {
          // skip rows without outstanding quantity
        } else if (!qty && security.getMaturityDate().toDate().getFullYear() <= 2009) {
          // Swallow this data gap. It's old and we don't mind
        } else {
          let postAuctionQuantity = qty ? Number(qty.toString()) : 0;
          let id = identifierString(security);

          let result = {
            cusip: id,
            issueDate: security.getIssueDate().toDate(),
            outstandingAmount: postAuctionQuantity,
            maturityDate: security.getMaturityDate().toDate(),
          };
          results.push(result);
        }
      }
    }
  } catch (error) {
    console.log('Could not fetch security data', error)
  }

  return { results };
}
