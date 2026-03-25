import pkg from '@fintekkers/ledger-models/node/fintekkers/models/position/field_pb.js';
import { PositionFilter } from "@fintekkers/ledger-models/node/wrappers/models/position/positionfilter";
import { SecurityClient } from "@fintekkers/ledger-models/node/fintekkers/services/security-service/security_service_grpc_pb.js";
import { QuerySecurityRequestProto } from "@fintekkers/ledger-models/node/fintekkers/requests/security/query_security_request_pb.js";
import { ProtoSerializationUtil } from "@fintekkers/ledger-models/node/wrappers/models/utils/serialization";
import Security from "@fintekkers/ledger-models/node/wrappers/models/security/security";
import type BondSecurity from "@fintekkers/ledger-models/node/wrappers/models/security/BondSecurity";
import { ZonedDateTime } from "@fintekkers/ledger-models/node/wrappers/models/utils/datetime";
import { getServiceConnection } from "$lib/grpc-auth";
import { SecurityTypeProto } from "@fintekkers/ledger-models/node/fintekkers/models/security/security_type_pb";
import { Tenor } from '@fintekkers/ledger-models/node/wrappers/models/security/term';
import { Identifier } from '@fintekkers/ledger-models/node/wrappers/models/security/identifier';
import { IdentifierTypeProto } from '@fintekkers/ledger-models/node/fintekkers/models/security/identifier/identifier_type_pb';
import { IdentifierProto } from '@fintekkers/ledger-models/node/fintekkers/models/security/identifier/identifier_pb';
import { PositionFilterOperator } from '@fintekkers/ledger-models/node/fintekkers/models/position/position_util_pb.js';

const { FieldProto } = pkg;

export interface securityData {
  identifier: string;          // primary identifier value (CUSIP or ISIN)
  identifierType: string;      // "CUSIP" | "ISIN" | "UNKNOWN"
  settlementCurrency: string;  // "USD" | "GBP" | "" if not set
  cusip: string;               // deprecated alias for identifier; kept for compatibility
  uuidHex?: string;
  issueDate: string;
  maturityDate: string;
  outstandingAmount: string;
  issuerName: string;
  assetClass: string;
  productType: string;
  productClass?: string;
  tenor?: string;
  couponRate?: string;
  couponType?: string;
  couponFrequency?: string;
  faceValue?: string;
  datedDate?: string;
  asOf: string;
  securityType?: number;
}

/**
 * Fetches security data based on asset class and issuer name.
 * @param {string} assetClass - The asset class of the securities to fetch.
 * @param {string} issuerName - The name of the issuer of the securities to fetch.
 * @returns {Promise<securityData[]>} A promise resolving to an array of security data.
 */

export async function FetchSecurity(
  assetClass: string,
  issuerName: string | null,
  identifier?: string,
  identifierType?: 'CUSIP' | 'ISIN',
  issueDate?: string,
  issueDateOperator?: 'greater_than' | 'lesser_than',
  apiKey?: string,
): Promise<securityData[]> {
  const filterSecurity = new PositionFilter();
  filterSecurity.addEqualsFilter(FieldProto.ASSET_CLASS, assetClass);

  if (issuerName) {
    filterSecurity.addEqualsFilter(FieldProto.SECURITY_ISSUER_NAME, issuerName);
  }

  if (identifier && identifier.trim() !== "") {
    const idType = identifierType === 'ISIN' ? IdentifierTypeProto.ISIN : IdentifierTypeProto.CUSIP;
    const identifierProto = new IdentifierProto().setIdentifierType(idType).setIdentifierValue(identifier.trim());
    filterSecurity.addObjectFilter(FieldProto.IDENTIFIER, new Identifier(identifierProto));
  }

  if (issueDate && issueDate.trim() !== "" && issueDateOperator) {
    const issueDateObj = new Date(issueDate);
    const operator = issueDateOperator === 'greater_than'
      ? PositionFilterOperator.MORE_THAN
      : PositionFilterOperator.LESS_THAN;
    filterSecurity.addFilter(FieldProto.ISSUE_DATE, operator, issueDateObj);
  }

  try {
    const conn = getServiceConnection(apiKey);
    const client = new SecurityClient(conn.url, conn.credentials, { interceptors: conn.interceptors });
    const searchRequest = new QuerySecurityRequestProto();
    searchRequest.setObjectClass('SecurityRequest');
    searchRequest.setVersion('0.0.1');
    searchRequest.setAsOf(ZonedDateTime.now().toProto());
    searchRequest.setSearchSecurityInput(filterSecurity.toProto());

    const securities = await new Promise<Security[]>((resolve, reject) => {
      const list: Security[] = [];
      const stream = client.search(searchRequest);
      stream.on('data', (response: any) => {
        response.getSecurityResponseList().forEach((proto: any) => {
          list.push(Security.create(proto));
        });
      });
      stream.on('end', () => resolve(list));
      stream.on('error', (err: any) => {
        console.error('Security search stream error:', err);
        reject(err);
      });
    });

    return securities.reduce(
      (acc: securityData[], security: Security) => {
        const issuanceList = security.proto.getIssuanceInfoList();
        const issuance =
          issuanceList && issuanceList.length > 0 ? issuanceList[0] : null;

        const maturityDate = security.getMaturityDate().toDate();
        const issueDate = security.getIssueDate().toDate();

        // Determine whether to include this security based on issuance info.
        // US Treasuries carry issuance auction records; non-US bonds (e.g. Gilts) do not.
        // If no issuance record exists at all, include the security unconditionally.
        if (issuance) {
          const qty = issuance.getPostAuctionOutstandingQuantity();
          if (!qty && maturityDate.getFullYear() > 2009) {
            // US-style: skip if no auction quantity (treats as not yet auctioned / bad data)
            return acc;
          } else if (!qty && maturityDate.getFullYear() <= 2009) {
            // Matured US security without quantity — skip
            return acc;
          }
        }
        // Either has valid issuance qty, or has no issuance record (non-US bond) — include it.

        {
          const outstandingAmount = issuance
            ? ProtoSerializationUtil.deserialize(issuance.getPostAuctionOutstandingQuantity()).toString()
            : '0';
          const id = security.getSecurityID()
            ? security.getSecurityID().getIdentifierValue()
            : security.getID().toString();

          // Resolve identifier type
          const idProto = security.proto.getIdentifier ? security.proto.getIdentifier() : null;
          const idTypeNum = idProto?.getIdentifierType() ?? 0;
          const identifierTypeStr =
            idTypeNum === IdentifierTypeProto.CUSIP ? 'CUSIP' :
            idTypeNum === IdentifierTypeProto.ISIN  ? 'ISIN'  : 'UNKNOWN';

          // Resolve settlement currency
          let settlementCurrency = '';
          try {
            const settlementSec = (security.proto as any).getSettlementCurrency?.();
            settlementCurrency = settlementSec?.getCashDetails?.()?.getCashId?.() ?? '';
          } catch { /* optional field */ }

          const issueDateStr = issueDate.toISOString().slice(0, 10).replace(/-/g, '/');
          const maturityDateStr = maturityDate.toISOString().slice(0, 10).replace(/-/g, '/');
          const asOfStr = security.getAsOf().toString().split(' ')[0]; // Format: "YYYY/MM/DD"

          // Check if it's a bond security to get additional fields
          const isBond = security.proto.getSecurityType() === SecurityTypeProto.BOND_SECURITY || security.proto.getSecurityType() === SecurityTypeProto.TIPS || security.proto.getSecurityType() === SecurityTypeProto.FRN;
          const bondSecurity = isBond ? (security as BondSecurity) : null;

          // Serialize UUID for delete support
          const uuidProto = security.proto.getUuid();
          const uuidHex = uuidProto ? Buffer.from(uuidProto.serializeBinary()).toString('hex') : undefined;

          const result: securityData = {
            identifier: id,
            identifierType: identifierTypeStr,
            settlementCurrency,
            cusip: id,           // backward-compat alias
            uuidHex,
            issueDate: issueDateStr,
            maturityDate: maturityDateStr,
            outstandingAmount,
            issuerName: security.getIssuerName(),
            assetClass: security.getAssetClass(),
            productType: bondSecurity?.getProductType() ?? '',
            asOf: asOfStr,
            securityType: security.proto.getSecurityType(),
          };

          try {
            result.productClass = security.getProductClass();
          } catch (e) {
            // Product class might not be available
          }

          // Add bond-specific fields if available
          if (bondSecurity) {
            try {
              const tenor = bondSecurity.getTenor();
              result.tenor = tenor?.getTenorDescription() ?? undefined;
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
        return acc;
      },
      []
    );
  } catch (error: any) {
    console.error("Error fetching security data:", error.message);
    return [];
  }
}
