import pkg from '@fintekkers/ledger-models/node/fintekkers/models/position/field_pb.js';
import { PositionFilter } from "@fintekkers/ledger-models/node/wrappers/models/position/positionfilter";
import { SecurityService } from "@fintekkers/ledger-models/node/wrappers/services/security-service/SecurityService";
import { ProtoSerializationUtil } from "@fintekkers/ledger-models/node/wrappers/models/utils/serialization";
import type Security from "@fintekkers/ledger-models/node/wrappers/models/security/security";
import type BondSecurity from "@fintekkers/ledger-models/node/wrappers/models/security/BondSecurity";
import { SecurityTypeProto } from "@fintekkers/ledger-models/node/fintekkers/models/security/security_type_pb";
import { Tenor } from '@fintekkers/ledger-models/node/wrappers/models/security/term';

const { FieldProto } = pkg;

interface securityData {
  cusip: string;
  issueDate: string;
  maturityDate: string;
  outstandingAmount: string;
  issuerName: string;
  assetClass: string;
  productType: string;
  productClass?: string;
  tenor?: Tenor;
  couponRate?: string;
  couponType?: string;
  couponFrequency?: string;
  faceValue?: string;
  datedDate?: string;
  asOf: string;
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
  const securityService = new SecurityService();

  const filterSecurity = new PositionFilter();
  filterSecurity.addEqualsFilter(FieldProto.ASSET_CLASS, assetClass);
  filterSecurity.addEqualsFilter(FieldProto.SECURITY_ISSUER_NAME, issuerName);

  try {
    const securities = await securityService.searchSecurityAsOfNow(
      filterSecurity
    );
    return securities.reduce(
      (acc: securityData[], security: Security) => {
        const issuanceList = security.proto.getIssuanceInfoList();
        const issuance =
          issuanceList && issuanceList.length > 0 ? issuanceList[0] : null;

        if (issuance) {
          const maturityDate = security.getMaturityDate().toDate();
          const issueDate = security.getIssueDate().toDate();

          if (
            !issuance.getPostAuctionOutstandingQuantity() && maturityDate.getFullYear() > 2009
          ) {
          } else if (
            !issuance.getPostAuctionOutstandingQuantity() && maturityDate.getFullYear() <= 2009
          ) {
            // Ignore if no post-auction outstanding quantity and maturity date is on or before 2009
          } else {
            const postAuctionQuantity = ProtoSerializationUtil.deserialize(
              issuance.getPostAuctionOutstandingQuantity()
            );
            const id = security.getSecurityID()
              ? security.getSecurityID().getIdentifierValue()
              : security.getID().toString();

            const issueDateStr = issueDate.toISOString().slice(0, 10).replace(/-/g, '/');
            const maturityDateStr = maturityDate.toISOString().slice(0, 10).replace(/-/g, '/');
            const asOfStr = security.getAsOf().toString().split(' ')[0]; // Format: "YYYY/MM/DD"

            // Check if it's a bond security to get additional fields
            const isBond = security.proto.getSecurityType() === SecurityTypeProto.BOND_SECURITY;
            const bondSecurity = isBond ? (security as BondSecurity) : null;

            const result: securityData = {
              cusip: id,
              issueDate: issueDateStr,
              maturityDate: maturityDateStr,
              outstandingAmount: postAuctionQuantity.toString(),
              issuerName: security.getIssuerName(),
              assetClass: security.getAssetClass(),
              productType: bondSecurity?.getProductType() ?? '',
              asOf: asOfStr,
            };

            try {
              result.productClass = security.getProductClass();
            } catch (e) {
              // Product class might not be available
            }

            // Add bond-specific fields if available
            if (bondSecurity) {
              try {
                result.tenor = bondSecurity.getTenor();
              } catch (e) {
                // Tenor might not be available
              }

              try {
                const couponRate = bondSecurity.getCouponRate();
                result.couponRate = couponRate?.getArbitraryPrecisionValue() ?? undefined;
              } catch (e) {
                // Coupon rate might not be available
              }

              try {
                result.couponType = bondSecurity.getCouponType().name();
              } catch (e) {
                // Coupon type might not be available
              }

              try {
                result.couponFrequency = bondSecurity.getCouponFrequency()?.toString();
              } catch (e) {
                // Coupon frequency might not be available
              }

              try {
                const faceValue = bondSecurity.getFaceValue();
                result.faceValue = faceValue?.getArbitraryPrecisionValue() ?? undefined;
              } catch (e) {
                // Face value might not be available
              }

              try {
                const datedDate = bondSecurity.getDatedDate();
                if (datedDate) {
                  result.datedDate = datedDate.toDate().toISOString().slice(0, 10).replace(/-/g, '/');
                }
              } catch (e) {
                // Dated date might not be available
              }
            }

            acc.push(result);
          }
        }
        return acc;
      },
      []
    );
  } catch (error: any) {
    console.error("Error fetching security data:", error.message);
    return [];
  }
}
