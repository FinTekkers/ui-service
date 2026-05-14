import pkg from '@fintekkers/ledger-models/node/fintekkers/models/position/field_pb.js';
import { PositionFilter } from "@fintekkers/ledger-models/node/wrappers/models/position/positionfilter";
import { SecurityClient } from "@fintekkers/ledger-models/node/fintekkers/services/security-service/security_service_grpc_pb.js";
import { QuerySecurityRequestProto } from "@fintekkers/ledger-models/node/fintekkers/requests/security/query_security_request_pb.js";
import Security from "@fintekkers/ledger-models/node/wrappers/models/security/security";
import TIPSBond from "@fintekkers/ledger-models/node/wrappers/models/security/TIPSBond";
import { ZonedDateTime } from "@fintekkers/ledger-models/node/wrappers/models/utils/datetime";
import { getServiceConnection } from "$lib/grpc-auth";
// M5 / #260: ProductTypeProto + product_hierarchy registry. SecurityType
// wrapper retired in 0.2.1; consumer-side filtering is by productType
// (name string) via the wrapper.
import { ProductTypeProto } from "@fintekkers/ledger-models/node/fintekkers/models/security/product_type_pb";
import {
  assetClassDescendantsOf,
  instrumentTypeOf,
} from "@fintekkers/ledger-models/node/wrappers/models/security/product_hierarchy";
import { Tenor } from '@fintekkers/ledger-models/node/wrappers/models/security/term';
import { Identifier } from '@fintekkers/ledger-models/node/wrappers/models/security/identifier';
import { IdentifierTypeProto } from '@fintekkers/ledger-models/node/fintekkers/models/security/identifier/identifier_type_pb';
import { IdentifierProto } from '@fintekkers/ledger-models/node/fintekkers/models/security/identifier/identifier_pb';
// PositionFilterOperator wrapper (ledger-models 0.1.135+); see positions.ts
// for the migration rationale (#229).
import { PositionFilterOperator } from '@fintekkers/ledger-models/node/wrappers/models/position/position_filter_operator';
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
  // #266: TIPS-only field. Populated for TREASURY_TIPS securities whose
  // tips_details.base_cpi (or legacy flat base_cpi) is set on the wire.
  // The TIPS calculator auto-fills its Reference CPI input from this
  // value when the user picks a CUSIP — manual override (PR #164) stays
  // as the fallback when the field is absent.
  baseCpi?: string;
  asOf: string;
  // M5 / #260: numeric ProductTypeProto value, for code paths that need
  // to dispatch on enum equality (e.g. /data/calculators picking TIPS
  // vs TREASURY_FRN buckets). `productType: string` above carries the
  // name form for display + URL serialization.
  productTypeEnum?: number;
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
// M5 / #260: SecurityTypeName retired; ProductTypeName is the new
// per-leaf vocabulary.
import {
  IDENTIFIER_TYPE_NAMES,
  PRODUCT_TYPE_NAMES,
  type IdentifierTypeName,
  type ProductTypeName,
  type InstrumentTypeName,
} from './securityFilterTypes';
export {
  IDENTIFIER_TYPE_NAMES,
  PRODUCT_TYPE_NAMES,
  type IdentifierTypeName,
  type ProductTypeName,
  type InstrumentTypeName,
};

// M6 #263 bug 3: BondSecurity.getProductType() in ledger-models 0.2.1
// overrides the base Security wrapper and returns a tenor-derived
// coarse string ('BILL' / 'NOTE' / 'BOND'), instead of the proto's
// canonical leaf name. Because Security.create() returns BondSecurity
// for TREASURY_NOTE / TIPS / TREASURY_FRN, calling getProductType() on
// any of those instances loses the leaf identity — a 30Y TIPS shows up
// as 'BOND', a 10Y note as 'NOTE', etc. That mis-display also breaks
// downstream lookups in product_hierarchy (instrumentTypeOf,
// ON_THE_RUN_PRODUCT_TYPES set membership) that key on leaf names.
//
// Sidestep the override by resolving the numeric proto enum to its
// canonical name directly. Exported for treasuryCurveSelection + the
// transaction grid which both need leaf-accurate product types.
export function productTypeNameOf(security: Security): string {
  const value = security.proto.getProductType();
  const entries = Object.entries(ProductTypeProto) as Array<[string, number]>;
  const found = entries.find(([, v]) => v === value);
  return found?.[0] ?? 'UNKNOWN_PRODUCT_TYPE';
}

// Identifier lookup helpers. The wrapper's typed lookup
// `Security.getIdentifierByType(type)` returns `Identifier | undefined`,
// which lets callers express the canonical "CUSIP, else ISIN, else
// fall back to UUID" chain inline. These helpers package that chain so
// the call sites stay short.
export function primaryIdentifier(security: Security): Identifier | undefined {
  return (
    security.getIdentifierByType(IdentifierTypeProto.CUSIP) ??
    security.getIdentifierByType(IdentifierTypeProto.ISIN)
  );
}

export function identifierString(security: Security): string {
  return primaryIdentifier(security)?.getIdentifierValue() ?? security.getID().toString();
}

function identifierTypeNameToProto(name: IdentifierTypeName): IdentifierTypeProto {
  switch (name) {
    case 'ISIN': return IdentifierTypeProto.ISIN;
    case 'EXCH_TICKER': return IdentifierTypeProto.EXCH_TICKER;
    case 'SERIES_ID': return IdentifierTypeProto.SERIES_ID;
    case 'OSI': return IdentifierTypeProto.OSI;
    case 'FIGI': return IdentifierTypeProto.FIGI;
    case 'INDEX_NAME': return IdentifierTypeProto.INDEX_NAME;
    case 'CASH': return IdentifierTypeProto.CASH;
    case 'CUSIP':
    default: return IdentifierTypeProto.CUSIP;
  }
}

export async function FetchSecurity(
  assetClass: string | null,
  issuerName: string | null,
  identifier?: string,
  identifierType?: IdentifierTypeName,
  issueDate?: string,
  // Accepts the full PositionFilterOperator name set — the backend's
  // security search supports every operator (EQUALS, NOT_EQUALS,
  // LESS_THAN, LESS_THAN_OR_EQUALS, MORE_THAN, MORE_THAN_OR_EQUALS).
  // Mirrors the operator handling in positions.ts and transactions.ts
  // post-#229; consumers that want a narrower UX (e.g. SecuritySelect's
  // 2-option dropdown) restrict via the DateFilter `operators` prop,
  // not by trimming the type here.
  issueDateOperator?: string,
  apiKey?: string,
  productType?: ProductTypeName,
  instrumentType?: InstrumentTypeName,
): Promise<securityData[]> {
  const filterSecurity = new PositionFilter();

  if (assetClass) {
    // M5 / #260: assetClass is tree-aware. Selecting an internal
    // node (FIXED_INCOME) matches its descendant set
    // (RATES, CREDIT). Selecting a leaf (RATES) matches just that
    // leaf. The PositionFilter today only supports addEqualsFilter
    // (single value); we walk the descendants set and rely on the
    // post-filter below to cover the multi-match case, since the
    // gRPC filter currently can't express IN.
    //
    // For a leaf input, descendants is [], so the eq-filter alone
    // is correct. For an internal node, we pass the node itself to
    // the eq-filter (best-effort server-side narrowing) and the
    // post-filter widens to the descendant set.
    filterSecurity.addEqualsFilter(FieldProto.ASSET_CLASS, assetClass);
  }

  // Compute the asset-class match set up front. Empty array means
  // "no asset-class post-filter applied". Includes the input itself
  // PLUS descendants when the input is an internal node.
  const assetClassMatchSet: ReadonlySet<string> =
    assetClass
      ? new Set([assetClass, ...assetClassDescendantsOf(assetClass)])
      : new Set<string>();

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
    const operator = PositionFilterOperator.fromName(issueDateOperator);
    filterSecurity.addFilter(FieldProto.ISSUE_DATE, operator, issueDateObj);
  }

  // productType + instrumentType are post-filtered after streaming.
  // The PositionFilter proto has no PRODUCT_TYPE / INSTRUMENT_TYPE
  // field today, so we can't push these filters server-side; instead
  // we filter the streamed results below by
  // security.proto.getProductType() / instrumentTypeOf(productType).
  // The result set for /data/securities is already capped (universe
  // loop uses ~1000/class), so post-filter cost is bounded.
  const productTypeProtoValue: number | null =
    productType !== undefined && productType !== null
      ? ((ProductTypeProto as unknown as Record<string, number>)[productType] ?? null)
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
        // Post-filter on productType (M5 / #260: no PRODUCT_TYPE
        // FieldProto, so the gRPC search can't narrow server-side).
        if (
          productTypeProtoValue !== null &&
          security.proto.getProductType() !== productTypeProtoValue
        ) {
          return acc;
        }

        // Post-filter on instrumentType — wrapper resolves the leaf
        // productType to its instrument_type via hierarchy.json.
        // M6 #263 bug 3: must use productTypeNameOf, not
        // security.getProductType(), because the latter is overridden
        // on BondSecurity to return tenor-derived 'BILL'/'NOTE'/'BOND'
        // which aren't keys in product_hierarchy → would always return
        // null and silently drop bond rows.
        const productTypeName = productTypeNameOf(security);
        if (
          instrumentType &&
          instrumentTypeOf(productTypeName) !== instrumentType
        ) {
          return acc;
        }

        // Tree-aware asset-class post-filter. If the user picked an
        // internal node like FIXED_INCOME, the eq-filter sent to the
        // server narrowed to that exact value; widen the match here to
        // include descendants too (RATES, CREDIT) so server-side
        // results that came back as 'RATES' (for instance) still pass.
        if (assetClassMatchSet.size > 0) {
          const rowAssetClass = security.getAssetClass();
          if (rowAssetClass && !assetClassMatchSet.has(rowAssetClass)) {
            return acc;
          }
        }
        const bondSec = security.isBond() ? security : null;
        const issuances = bondSec?.getIssuances() ?? [];
        const issuance = issuances.length > 0 ? issuances[0] : null;

        // Equity / index / cash / currency securities have no maturity or issue date —
        // these getters throw. Default to a sentinel and let the per-class checks below
        // skip the bond-specific filtering.
        let maturityDate: Date;
        let issueDate: Date;
        try { maturityDate = security.getMaturityDate().toDate(); } catch { maturityDate = new Date(0); }
        try { issueDate = security.getIssueDate()?.toDate() ?? new Date(0); } catch { issueDate = new Date(0); }

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
          const outstandingAmount = issuance?.getPostAuctionOutstandingQuantity()?.toString() ?? '0';
          const ident = primaryIdentifier(security);
          const id = ident?.getIdentifierValue() ?? security.getID().toString();
          const idTypeNum = ident?.getIdentifierType() ?? 0;
          const identifierTypeStr =
            idTypeNum === IdentifierTypeProto.CUSIP       ? 'CUSIP' :
            idTypeNum === IdentifierTypeProto.ISIN        ? 'ISIN'  :
            idTypeNum === IdentifierTypeProto.EXCH_TICKER ? 'EXCH_TICKER' :
            idTypeNum === IdentifierTypeProto.FIGI        ? 'FIGI' :
            idTypeNum === IdentifierTypeProto.SERIES_ID   ? 'SERIES_ID' :
            idTypeNum === IdentifierTypeProto.OSI         ? 'OSI' :
            idTypeNum === IdentifierTypeProto.INDEX_NAME  ? 'INDEX_NAME' :
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

          // M5 / #260: bond detection now goes through the wrapper's
          // type-guard helper, which checks against ProductTypeProto.
          // TREASURY_NOTE / TIPS / TREASURY_FRN. TBILL and STRIPS have
          // different pricing mechanics and are intentionally excluded
          // from the bond-shape getters; surfacing their bond-like
          // fields here would silently drag the calculator-side
          // assumptions onto incompatible products.
          const bondSecurity = bondSec;

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
            // M6 #263 bug 3: resolve from the proto enum directly.
            // BondSecurity overrides getProductType() to return a
            // tenor-derived 'BILL' / 'NOTE' / 'BOND' string, which
            // hides the actual leaf (TREASURY_NOTE, TIPS, TREASURY_FRN)
            // for ~all bond-shape rows and produces phantom 'BOND'
            // entries that don't exist on the wire.
            productType: productTypeNameOf(security),
            asOf: asOfStr,
            productTypeEnum: security.proto.getProductType(),
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
              result.couponRate = bondSecurity.getCouponRate()?.toString() ?? undefined;
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
              result.faceValue = bondSecurity.getFaceValue()?.toString() ?? undefined;
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

            // #266: TIPS-only base CPI for the calculator auto-populate.
            // TIPSBond.getBaseCpi() returns a Decimal | null read from
            // tips_extension.base_cpi (v0.4.1). Other bond subclasses
            // don't carry it; the `instanceof` guard makes the narrowing
            // explicit so TS picks the TIPSBond overload.
            if (bondSecurity instanceof TIPSBond) {
              const baseCpi = bondSecurity.getBaseCpi();
              if (baseCpi) result.baseCpi = baseCpi.toString();
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
    const issueDate = security.getIssueDate()?.toDate() ?? new Date(0);
    const ident = primaryIdentifier(security);
    const idTypeNum = ident?.getIdentifierType() ?? 0;
    const identifierTypeStr =
      idTypeNum === IdentifierTypeProto.CUSIP ? 'CUSIP' :
      idTypeNum === IdentifierTypeProto.ISIN  ? 'ISIN'  : 'UNKNOWN';
    const id = ident?.getIdentifierValue() ?? security.getID().toString();
    const uuidProto = security.proto.getUuid();
    const uuidHex = uuidProto ? Buffer.from(uuidProto.serializeBinary()).toString('hex') : undefined;
    const uuidStr = security.getID().toString();
    // M5 / #260: same wrapper-driven bond narrowing as above.
    const bondSecurity = security.isBond() ? security : null;

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
      // M6 #263 bug 3: see productTypeNameOf docs — bypasses the
      // BondSecurity tenor-derived override.
      productType: productTypeNameOf(security),
      asOf: security.getAsOf().toString().split(' ')[0],
      productTypeEnum: security.proto.getProductType(),
    };

    if (bondSecurity) {
      try { result.couponRate = bondSecurity.getCouponRate()?.toString(); } catch {}
      try { result.couponFrequency = bondSecurity.getCouponFrequency()?.toString(); } catch {}
      try { result.faceValue = bondSecurity.getFaceValue()?.toString(); } catch {}
      try {
        const dd = bondSecurity.getDatedDate();
        if (dd) result.datedDate = dd.toDate().toISOString().slice(0, 10).replace(/-/g, '/');
      } catch {}
      if (bondSecurity instanceof TIPSBond) {
        const baseCpi = bondSecurity.getBaseCpi();
        if (baseCpi) result.baseCpi = baseCpi.toString();
      }
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
