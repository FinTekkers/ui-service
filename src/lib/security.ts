import { FieldProto } from "@fintekkers/ledger-models/node/fintekkers/models/position/field_pb";
import { PositionFilter } from "@fintekkers/ledger-models/node/wrappers/models/position/positionfilter";
import { SecurityService } from "@fintekkers/ledger-models/node/wrappers/services/security-service/SecurityService";
import { ProtoSerializationUtil } from "@fintekkers/ledger-models/node/wrappers/models/utils/serialization";
import * as dt from "@fintekkers/ledger-models/node/wrappers/models/utils/datetime";

interface securityData {
  cusip: string;
  issueDate: Date;
  outstandingAmount: string;
  maturityDate: Date;
}

/**
 * Fetches security data based on asset class and issuer name.
 * @param {string} assetClass - The asset class of the securities to fetch.
 * @param {string} issuerName - The name of the issuer of the securities to fetch.
 * @returns {Promise<securityData[]>} A promise resolving to an array of security data.
 */

export async function FetchSecurity(
  assetClass: string,
  issuerName: string
): Promise<securityData[]> {
  const now = dt.ZonedDateTime.now();
  const securityService = new SecurityService();

  const filterSecurity = new PositionFilter();
  filterSecurity.addEqualsFilter(FieldProto.ASSET_CLASS, assetClass);
  filterSecurity.addEqualsFilter(FieldProto.SECURITY_ISSUER_NAME, issuerName);

  try {
    const securities = await securityService.searchSecurityAsOfNow(
      filterSecurity
    );
    const securityResults = securities.reduce(
      (acc: securityData[], security) => {
        const issuanceList = security.proto.getIssuanceInfoList();
        const issuance =
          issuanceList && issuanceList.length > 0 ? issuanceList[0] : null;

        if (issuance) {
          if (
            !issuance.getPostAuctionOutstandingQuantity() &&
            security.getMaturityDate().getFullYear() > 2009
          ) {
            // Log if no post-auction outstanding quantity and maturity date is after 2009
            console.log(
              `Security issued with CUSIP ${security
                .getSecurityID()
                .getIdentifierValue()} has no post-auction outstanding quantity.`
            );
          } else if (
            !issuance.getPostAuctionOutstandingQuantity() &&
            security.getMaturityDate().getFullYear() <= 2009
          ) {
            // Ignore if no post-auction outstanding quantity and maturity date is on or before 2009
          } else {
            const postAuctionQuantity = ProtoSerializationUtil.deserialize(
              issuance.getPostAuctionOutstandingQuantity()
            );
            const id = security.getSecurityID()
              ? security.getSecurityID().getIdentifierValue()
              : security.getID().toString();
            const result = {
              cusip: id,
              issueDate: security.getIssueDate(),
              outstandingAmount: postAuctionQuantity,
              maturityDate: security.getMaturityDate(),
            };
            acc.push(result);
          }
        }
        return acc;
      },
      []
    );
    return securityResults;
  } catch (error: any) {
    console.error("Error fetching security data:", error.message);
    return [];
  }
}
