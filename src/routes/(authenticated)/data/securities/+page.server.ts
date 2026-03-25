import { FetchSecurity } from "$lib/security";
import { deleteSecurity } from "$lib/security-delete";

/** @type {import('../../../../../.svelte-kit/types/src/routes').PageServerLoad} */
export async function load({ locals, request }) {
  const searchParams = new URLSearchParams(request.url.split("?")[1]);
  // Accept both 'identifier' (new) and 'cusip' (old) param names during migration
  const identifier = searchParams.get('identifier') ?? searchParams.get('cusip');
  const rawIdType = searchParams.get('identifierType');
  const identifierType = rawIdType === 'ISIN' ? 'ISIN' as const : rawIdType === 'CUSIP' ? 'CUSIP' as const : undefined;
  const issueDate = searchParams.get('issueDate');
  const issueDateOperator = searchParams.get('issueDateOperator');

  const security = await FetchSecurity(
    "Fixed Income",
    "US Government",
    identifier || undefined,
    identifierType,
    issueDate || undefined,
    issueDateOperator === 'greater_than' ? 'greater_than' : issueDateOperator === 'lesser_than' ? 'lesser_than' : undefined,
    locals.user?.apiKey
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
