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
import { UUID } from '@fintekkers/ledger-models/node/wrappers/models/utils/uuid';
import { SecurityService } from '@fintekkers/ledger-models/node/wrappers/services/security-service/SecurityService';

const { FieldProto } = pkg;

export interface securityData {
  identifier: string;          // primary identifier value (CUSIP or ISIN)
  identifierType: string;      // "CUSIP" | "ISIN" | "UNKNOWN"
  settlementCurrency: string;  // "USD" | "GBP" | "" if not set
  cusip: string;               // deprecated alias for identifier; kept for compatibility
  uuidHex?: string;
  uuidStr?: string;            // human-readable UUID (hyphenated)
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

// Phase 1 of second-brain#226: support every IdentifierTypeProto entry the
// platform currently models. The names + iteration order live in
// $lib/securityFilterTypes (browser-safe, no grpc deps); we re-export them
// here so existing callers of $lib/security keep working.
import {
  IDENTIFIER_TYPE_NAMES,
  SECURITY_TYPE_NAMES,
  type IdentifierTypeName,
  type SecurityTypeName,
} from './securityFilterTypes';
export {
  IDENTIFIER_TYPE_NAMES,
  SECURITY_TYPE_NAMES,
  type IdentifierTypeName,
  type SecurityTypeName,
};

function identifierTypeNameToProto(name: IdentifierTypeName): IdentifierTypeProto {
  switch (name) {
    case 'ISIN': return IdentifierTypeProto.ISIN;
    case 'EXCH_TICKER': return IdentifierTypeProto.EXCH_TICKER;
    case 'SERIES_ID': return IdentifierTypeProto.SERIES_ID;
    case 'OSI': return IdentifierTypeProto.OSI;
    case 'FIGI': return IdentifierTypeProto.FIGI;
    case 'CASH': return IdentifierTypeProto.CASH;
    case 'CUSIP':
    default: return IdentifierTypeProto.CUSIP;
  }
}

function securityTypeNameToProto(name: SecurityTypeName): number {
  switch (name) {
    case 'BOND_SECURITY': return SecurityTypeProto.BOND_SECURITY;
    case 'EQUITY_SECURITY': return SecurityTypeProto.EQUITY_SECURITY;
    case 'INDEX_SECURITY': return SecurityTypeProto.INDEX_SECURITY;
    case 'CASH_SECURITY': return SecurityTypeProto.CASH_SECURITY;
    case 'TIPS': return SecurityTypeProto.TIPS;
    case 'FRN': return SecurityTypeProto.FRN;
  }
}

export async function FetchSecurity(
  assetClass: string | null,
  issuerName: string | null,
  identifier?: string,
  identifierType?: IdentifierTypeName,
  issueDate?: string,
  issueDateOperator?: 'greater_than' | 'lesser_than',
  apiKey?: string,
  securityType?: SecurityTypeName,
): Promise<securityData[]> {
  const filterSecurity = new PositionFilter();

  if (assetClass) {
    filterSecurity.addEqualsFilter(FieldProto.ASSET_CLASS, assetClass);
  }

  if (issuerName) {
    filterSecurity.addEqualsFilter(FieldProto.SECURITY_ISSUER_NAME, issuerName);
  }

  if (identifier && identifier.trim() !== "") {
    const idType = identifierTypeNameToProto(identifierType ?? 'CUSIP');
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

  // securityType is post-filtered after streaming. The PositionFilter proto
  // has no SECURITY_TYPE field today, so we can't push the filter to the
  // server; instead we filter the streamed results below by
  // security.proto.getSecurityType(). The result set for /data/securities
  // is already capped (universe loop uses ~1000/class), so post-filter cost
  // is bounded.
  const securityTypeProtoValue = securityType
    ? securityTypeNameToProto(securityType)
    : null;

  try {
    const conn = getServiceConnection(apiKey);
    const client = new SecurityClient(conn.url, conn.credentials, { interceptors: conn.interceptors });
    const searchRequest = new QuerySecurityRequestProto();
    searchRequest.setObjectClass('SecurityRequest');
    searchRequest.setVersion('0.0.1');
    searchRequest.setAsOf(ZonedDateTime.now().toProto());
    searchRequest.setSearchSecurityInput(filterSecurity.toProto());

    // Keep partials on mid-stream error. The security service can throw
    // validation errors on individual records during streaming (e.g. a bond
    // missing maturity_date); aborting the whole batch on the first bad
    // record loses all the good ones that already arrived.
    const securities = await new Promise<Security[]>((resolve) => {
      const list: Security[] = [];
      const stream = client.search(searchRequest);
      stream.on('data', (response: any) => {
        response.getSecurityResponseList().forEach((proto: any) => {
          list.push(Security.create(proto));
        });
      });
      stream.on('end', () => resolve(list));
      stream.on('error', (err: any) => {
        console.warn(`Security search stream error after ${list.length} records: ${err.details ?? err.message}`);
        resolve(list);
      });
    });

    return securities.reduce(
      (acc: securityData[], security: Security) => {
       try {
        // Post-filter on securityType (no SECURITY_TYPE FieldProto, so the
        // gRPC search can't narrow this server-side). Bond product variants
        // — TIPS / FRN — are distinct proto values from BOND_SECURITY, so
        // a 'BOND_SECURITY' filter does NOT also match TIPS/FRN. Callers
        // wanting "all bonds" should pass assetClass=Fixed Income instead.
        if (
          securityTypeProtoValue !== null &&
          security.proto.getSecurityType() !== securityTypeProtoValue
        ) {
          return acc;
        }
        const issuanceList = security.proto.getIssuanceInfoList();
        const issuance =
          issuanceList && issuanceList.length > 0 ? issuanceList[0] : null;

        // Equity / index / cash / currency securities have no maturity or issue date —
        // these getters throw. Default to a sentinel and let the per-class checks below
        // skip the bond-specific filtering.
        let maturityDate: Date;
        let issueDate: Date;
        try { maturityDate = security.getMaturityDate().toDate(); } catch { maturityDate = new Date(0); }
        try { issueDate = security.getIssueDate().toDate(); } catch { issueDate = new Date(0); }

        // Determine whether to include this security based on issuance info.
        // US Treasuries carry issuance auction records; non-US bonds (e.g. Gilts) do not.
        // Non-bond securities have no issuance — include unconditionally.
        if (issuance) {
          const qty = issuance.getPostAuctionOutstandingQuantity();
          if (!qty && maturityDate.getFullYear() > 2009) {
            return acc;
          } else if (!qty && maturityDate.getFullYear() <= 2009 && maturityDate.getFullYear() > 1970) {
            return acc;
          }
        }

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
            idTypeNum === IdentifierTypeProto.CUSIP       ? 'CUSIP' :
            idTypeNum === IdentifierTypeProto.ISIN        ? 'ISIN'  :
            idTypeNum === IdentifierTypeProto.EXCH_TICKER ? 'EXCH_TICKER' :
            idTypeNum === IdentifierTypeProto.FIGI        ? 'FIGI' :
            idTypeNum === IdentifierTypeProto.SERIES_ID   ? 'SERIES_ID' :
            idTypeNum === IdentifierTypeProto.OSI         ? 'OSI' :
            idTypeNum === IdentifierTypeProto.CASH        ? 'CASH' : 'UNKNOWN';

          // Resolve settlement currency
          let settlementCurrency = '';
          try {
            const settlementSec = (security.proto as any).getSettlementCurrency?.();
            settlementCurrency = settlementSec?.getCashDetails?.()?.getCashId?.() ?? '';
          } catch { /* optional field */ }

          // Empty string for non-bond securities — sentinel new Date(0) = 1970-01-01
          const issueDateStr = issueDate.getTime() === 0 ? '' : issueDate.toISOString().slice(0, 10).replace(/-/g, '/');
          const maturityDateStr = maturityDate.getTime() === 0 ? '' : maturityDate.toISOString().slice(0, 10).replace(/-/g, '/');
          const asOfStr = security.getAsOf().toString().split(' ')[0]; // Format: "YYYY/MM/DD"

          // Check if it's a bond security to get additional fields
          const isBond = security.proto.getSecurityType() === SecurityTypeProto.BOND_SECURITY || security.proto.getSecurityType() === SecurityTypeProto.TIPS || security.proto.getSecurityType() === SecurityTypeProto.FRN;
          const bondSecurity = isBond ? (security as BondSecurity) : null;

          // Serialize UUID for delete support
          const uuidProto = security.proto.getUuid();
          const uuidHex = uuidProto ? Buffer.from(uuidProto.serializeBinary()).toString('hex') : undefined;
          const uuidStr = security.getID().toString();

          const result: securityData = {
            identifier: id,
            identifierType: identifierTypeStr,
            settlementCurrency,
            cusip: id,           // backward-compat alias
            uuidHex,
            uuidStr,
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
       } catch (perRecordErr: any) {
         // Skip individual records that throw during deserialization rather than
         // dropping the whole batch.
         console.warn(`Skipping security during deserialization: ${perRecordErr?.message ?? perRecordErr}`);
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

function mapSecuritiesToData(securities: Security[]): securityData[] {
  return securities.reduce((acc: securityData[], security: Security) => {
    const maturityDate = security.getMaturityDate().toDate();
    const issueDate = security.getIssueDate().toDate();
    const idProto = security.proto.getIdentifier ? security.proto.getIdentifier() : null;
    const idTypeNum = idProto?.getIdentifierType() ?? 0;
    const identifierTypeStr =
      idTypeNum === IdentifierTypeProto.CUSIP ? 'CUSIP' :
      idTypeNum === IdentifierTypeProto.ISIN  ? 'ISIN'  : 'UNKNOWN';
    const id = security.getSecurityID()
      ? security.getSecurityID().getIdentifierValue()
      : security.getID().toString();
    const uuidProto = security.proto.getUuid();
    const uuidHex = uuidProto ? Buffer.from(uuidProto.serializeBinary()).toString('hex') : undefined;
    const uuidStr = security.getID().toString();
    const isBond = [SecurityTypeProto.BOND_SECURITY, SecurityTypeProto.TIPS, SecurityTypeProto.FRN]
      .includes(security.proto.getSecurityType());
    const bondSecurity = isBond ? (security as BondSecurity) : null;

    const result: securityData = {
      identifier: id,
      identifierType: identifierTypeStr,
      settlementCurrency: '',
      cusip: id,
      uuidHex,
      uuidStr,
      issueDate: issueDate.toISOString().slice(0, 10).replace(/-/g, '/'),
      maturityDate: maturityDate.toISOString().slice(0, 10).replace(/-/g, '/'),
      outstandingAmount: '0',
      issuerName: security.getIssuerName(),
      assetClass: security.getAssetClass(),
      productType: bondSecurity?.getProductType() ?? '',
      asOf: security.getAsOf().toString().split(' ')[0],
      securityType: security.proto.getSecurityType(),
    };

    if (bondSecurity) {
      try { result.couponRate = bondSecurity.getCouponRate()?.getArbitraryPrecisionValue(); } catch {}
      try { result.couponFrequency = bondSecurity.getCouponFrequency()?.toString(); } catch {}
      try { result.faceValue = bondSecurity.getFaceValue()?.getArbitraryPrecisionValue(); } catch {}
      try {
        const dd = bondSecurity.getDatedDate();
        if (dd) result.datedDate = dd.toDate().toISOString().slice(0, 10).replace(/-/g, '/');
      } catch {}
    }

    acc.push(result);
    return acc;
  }, []);
}

export interface UniverseEntry {
  identifier: string;
  identifierType: string;  // "CUSIP" | "ISIN" | "EXCH_TICKER" | "UNKNOWN"
  description: string;
  uuidHex: string;
  assetClass: string;
}

const UNIVERSE_TTL_MS = 5 * 60 * 1000;
const UNIVERSE_CAP_PER_CLASS = 1000;
// Asset classes seeded by data-sourcing pipelines (market-data-inputs, app-soma-analytics).
// The security service rejects an empty position filter, so we fan out one query per class.
// Cap is per class so Fixed Income doesn't crowd out equities. Set generously since
// universe is deduped to one entry per (identifierType, identifier).
const UNIVERSE_ASSET_CLASSES = ['Fixed Income', 'Equity', 'Index', 'Cash', 'Currency'] as const;
const universeCache = new Map<string, { value: UniverseEntry[]; fetchedAt: number }>();

export function clearUniverseCache(): void {
  universeCache.clear();
}

function dedupeLatestPerIdentifier(secs: securityData[]): securityData[] {
  // The security service streams every historical version of each security.
  // For autocomplete we only want one entry per (identifierType, identifier).
  // Pick the latest by asOf when available.
  const byKey = new Map<string, securityData>();
  for (const s of secs) {
    if (!s.uuidHex) continue;
    const key = `${s.identifierType}:${s.identifier}`;
    const existing = byKey.get(key);
    if (!existing || (s.asOf ?? '') > (existing.asOf ?? '')) {
      byKey.set(key, s);
    }
  }
  return [...byKey.values()];
}

export async function FetchSecurityUniverse(apiKey?: string): Promise<UniverseEntry[]> {
  const cacheKey = apiKey ?? '__no_key__';
  const cached = universeCache.get(cacheKey);
  if (cached && Date.now() - cached.fetchedAt < UNIVERSE_TTL_MS) {
    return cached.value;
  }

  const perClass = await Promise.all(
    UNIVERSE_ASSET_CLASSES.map(async (cls) => {
      try {
        const all = await FetchSecurity(cls, null, undefined, undefined, undefined, undefined, apiKey);
        return dedupeLatestPerIdentifier(all).slice(0, UNIVERSE_CAP_PER_CLASS);
      } catch (e: any) {
        console.warn(`Universe fetch failed for asset class ${cls}:`, e?.message ?? e);
        return [];
      }
    }),
  );

  const universe: UniverseEntry[] = [];
  for (const secs of perClass) {
    for (const sec of secs) {
      const couponPart = sec.couponRate ? ` ${sec.couponRate}%` : '';
      const maturityPart = sec.maturityDate && sec.assetClass === 'Fixed Income' ? ` ${sec.maturityDate}` : '';
      const description = `${sec.issuerName}${couponPart}${maturityPart}`.trim();
      universe.push({
        identifier: sec.identifier,
        identifierType: sec.identifierType,
        description,
        uuidHex: sec.uuidHex!,
        assetClass: sec.assetClass,
      });
    }
  }

  universeCache.set(cacheKey, { value: universe, fetchedAt: Date.now() });
  return universe;
}

export async function FetchSecurityByUuid(uuidStr: string, apiKey?: string): Promise<securityData[]> {
  try {
    const service = new SecurityService(apiKey);
    const securities = await service.searchByUuid(uuidStr);
    return mapSecuritiesToData(securities);
  } catch (error: any) {
    console.error('Error fetching security by UUID:', error.message);
    return [];
  }
}
