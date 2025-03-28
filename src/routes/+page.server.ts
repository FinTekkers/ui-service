import * as Yup from 'yup';

import pkg from '@fintekkers/ledger-models/node/fintekkers/models/position/field_pb.js';
const { FieldProto } = pkg;
import { SecurityService } from "@fintekkers/ledger-models/node/wrappers/services/security-service/SecurityService";
import { PositionFilter } from "@fintekkers/ledger-models/node/wrappers/models/position/positionfilter";
import type Security from "@fintekkers/ledger-models/node/wrappers/models/security/security";
import { ProtoSerializationUtil } from "@fintekkers/ledger-models/node/wrappers/models/utils/serialization";

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


export async function load() {
  const securityService = new SecurityService();

  const positionFilter = new PositionFilter();
  positionFilter.addEqualsFilter(FieldProto.ASSET_CLASS, "Fixed Income");
  positionFilter.addEqualsFilter(
    FieldProto.SECURITY_ISSUER_NAME,
    "US Government"
  );

  var securities = await securityService.searchSecurityAsOfNow(positionFilter);
  let results = [];

  //Map results into list of maps -> Date, Amount
  for (let index in securities) {
    let security: Security = securities[index];

    let issuanceList = security.proto.getIssuanceInfoList();
    let issuance =
      issuanceList && issuanceList.length > 0 ? issuanceList[0] : null;

    if (issuance) {
      if (
        !issuance.getPostAuctionOutstandingQuantity() &&
        security.getMaturityDate().getFullYear() > 2009
      ) {
        // console.log(
        //   "Issued with %s, issuance: %s",
        //   security.getSecurityID().getIdentifierValue(),
        //   issuance
        // );
      } else if (
        !issuance.getPostAuctionOutstandingQuantity() &&
        security.getMaturityDate().getFullYear() <= 2009
      ) {
        //Swallow this data gap. It's old and we don't mind
      } else {
        let postAuctionQuantity: number = <number>ProtoSerializationUtil.deserialize(
            issuance.getPostAuctionOutstandingQuantity()
        );
        let id: string = security.getSecurityID()
          ? security.getSecurityID().getIdentifierValue()
          : security.getID().toString();

        let result = {
          cusip: id,
          issueDate: security.getIssueDate(),
          outstandingAmount: postAuctionQuantity,
          maturityDate: security.getMaturityDate(),
        };
        results.push(result);
      }
    }
  }

  return { results };
}
