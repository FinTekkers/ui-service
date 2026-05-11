import {
  FetchSecurity,
  FetchSecurityByUuid,
  IDENTIFIER_TYPE_NAMES,
  PRODUCT_TYPE_NAMES,
  type IdentifierTypeName,
  type ProductTypeName,
  type InstrumentTypeName,
} from "$lib/security";
import { INSTRUMENT_TYPE_NAMES, ASSET_CLASS_NAMES } from '$lib/securityFilterTypes';
import { deleteSecurity } from "$lib/security-delete";

// Backward-compat default for issuerName only — the legacy hard-coded
// 'Fixed Income' asset class default is dropped post-M5 (#260): the
// tree-aware AssetClassFilter requires that selecting nothing means
// "all asset classes", consistent with all other dropdowns. The
// hierarchy.json asset_class names are 'RATES', 'EQUITY', etc., not
// 'Fixed Income' — applying a legacy default would only confuse
// post-cutover users.
const DEFAULT_ISSUER_NAME = 'US Government';

/** @type {import('../../../../../.svelte-kit/types/src/routes').PageServerLoad} */
export async function load({ locals, request }) {
  const searchParams = new URLSearchParams(request.url.split("?")[1]);
  // Accept both 'identifier' (new) and 'cusip' (old) param names during migration
  const uuid = searchParams.get('uuid');
  const identifier = searchParams.get('identifier') ?? searchParams.get('cusip');
  const rawIdType = searchParams.get('identifierType');
  // Phase 1 of second-brain#226: accept the full IdentifierTypeProto set
  // (was 'ISIN'|'CUSIP' only). Anything not in the allowlist falls back to
  // undefined → FetchSecurity defaults to CUSIP, preserving prior behavior
  // for malformed / legacy URLs.
  const identifierType: IdentifierTypeName | undefined =
    rawIdType && (IDENTIFIER_TYPE_NAMES as readonly string[]).includes(rawIdType)
      ? (rawIdType as IdentifierTypeName)
      : undefined;
  const issueDate = searchParams.get('issueDate');
  // FetchSecurity accepts the full PositionFilterOperator set; the
  // wrapper's fromName (in $lib/security) is the only validator
  // (#229 review: no UI-side normalization).
  const issueDateOperator = searchParams.get('issueDateOperator') ?? undefined;
  // assetClass / issuerName are URL-driven. M5 / #260: asset class is
  // tree-aware — selecting an internal node (FIXED_INCOME) widens
  // server-side. The allowlist validates against the hierarchy tree
  // set (allAssetClasses()).
  const rawAssetClass = searchParams.get('assetClass');
  const assetClass: string | null =
    rawAssetClass && (ASSET_CLASS_NAMES as readonly string[]).includes(rawAssetClass)
      ? rawAssetClass
      : null;
  const rawIssuerName = searchParams.get('issuerName');
  const issuerName = rawIssuerName === null ? DEFAULT_ISSUER_NAME : rawIssuerName;

  // productType (M5 / #260: replaces ?securityType=). Post-filtered in
  // FetchSecurity since PositionFilter has no PRODUCT_TYPE today.
  // Allowlist sourced from product_hierarchy.activeProductTypes().
  const rawProductType = searchParams.get('productType');
  const productType: ProductTypeName | undefined =
    rawProductType && (PRODUCT_TYPE_NAMES as readonly string[]).includes(rawProductType)
      ? (rawProductType as ProductTypeName)
      : undefined;

  // instrumentType (NEW in M5 / #260) — CASH / DERIVATIVE /
  // REFERENCE_INDEX, sourced from product_hierarchy.allInstrumentTypes().
  // Post-filtered via hierarchy.json's per-leaf instrument_type mapping.
  const rawInstrumentType = searchParams.get('instrumentType');
  const instrumentType: InstrumentTypeName | undefined =
    rawInstrumentType && (INSTRUMENT_TYPE_NAMES as readonly string[]).includes(rawInstrumentType)
      ? (rawInstrumentType as InstrumentTypeName)
      : undefined;

  const security = uuid
    ? await FetchSecurityByUuid(uuid, locals.user?.apiKey)
    : await FetchSecurity(
        assetClass,
        issuerName || null,
        identifier || undefined,
        identifierType,
        issueDate || undefined,
        issueDateOperator,
        locals.user?.apiKey,
        productType,
        instrumentType,
      );

  return {
    security: security,
    user: locals.user
  };
}

export const actions = {
  dryRun: async ({ request, locals }) => {
    const formData = await request.formData();
    const uuidHex = formData.get('uuidHex') as string;
    if (!uuidHex) return { deleteResult: { success: false, totalCount: 0, affectedEntities: [], warnings: [], error: 'Missing UUID' } };
    const result = await deleteSecurity(uuidHex, true);
    return { deleteResult: result, uuidHex };
  },

  confirmDelete: async ({ request, locals }) => {
    const formData = await request.formData();
    const uuidHex = formData.get('uuidHex') as string;
    const force = formData.get('force') === 'true';
    if (!uuidHex) return { deleteResult: { success: false, totalCount: 0, affectedEntities: [], warnings: [], error: 'Missing UUID' } };
    const result = await deleteSecurity(uuidHex, false, force, locals.user?.apiKey);
    return { deleteResult: result };
  },
};
