import {
  FetchSecurity,
  FetchSecurityByUuid,
  IDENTIFIER_TYPE_NAMES,
  SECURITY_TYPE_NAMES,
  type IdentifierTypeName,
  type SecurityTypeName,
} from "$lib/security";
import { deleteSecurity } from "$lib/security-delete";
import { normalizeDateOperator } from "$lib/filters/dateOperator";

// Backward-compat defaults: pre-#226 the page-server hardcoded these. New
// /data/securities URLs can override either one to broaden the search.
// Existing bookmarks (?identifier=...&identifierType=CUSIP) keep working
// because both params default to today's behavior.
const DEFAULT_ASSET_CLASS = 'Fixed Income';
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
  // FetchSecurity supports MORE_THAN / LESS_THAN on issueDate only.
  // normalizeDateOperator handles the one-release shim from snake_case;
  // anything resolving to LESS_THAN_OR_EQUALS (e.g. a stale bookmark)
  // drops to undefined here so the backend doesn't see an unsupported
  // operator.
  const normalizedIssueOp = normalizeDateOperator(
    searchParams.get('issueDateOperator'),
    'issueDateOperator',
  );
  const issueDateOperator = normalizedIssueOp === 'MORE_THAN' || normalizedIssueOp === 'LESS_THAN'
    ? normalizedIssueOp
    : undefined;
  // assetClass / issuerName are now URL-driven. Empty string in the URL
  // (e.g. ?assetClass=) clears the filter so the user can broaden the
  // search across asset classes; absence of the param keeps the default.
  const rawAssetClass = searchParams.get('assetClass');
  const assetClass = rawAssetClass === null ? DEFAULT_ASSET_CLASS : rawAssetClass;
  const rawIssuerName = searchParams.get('issuerName');
  const issuerName = rawIssuerName === null ? DEFAULT_ISSUER_NAME : rawIssuerName;
  // securityType (post-filtered in FetchSecurity since FieldProto has no
  // SECURITY_TYPE today). Allowlist guards against typo'd URLs.
  const rawSecurityType = searchParams.get('securityType');
  const securityType: SecurityTypeName | undefined =
    rawSecurityType && (SECURITY_TYPE_NAMES as readonly string[]).includes(rawSecurityType)
      ? (rawSecurityType as SecurityTypeName)
      : undefined;

  const security = uuid
    ? await FetchSecurityByUuid(uuid, locals.user?.apiKey)
    : await FetchSecurity(
        assetClass || null,
        issuerName || null,
        identifier || undefined,
        identifierType,
        issueDate || undefined,
        issueDateOperator,
        locals.user?.apiKey,
        securityType
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
