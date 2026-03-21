import { FetchSecurity } from "$lib/security";
import { deleteSecurity } from "$lib/security-delete";

/** @type {import('../../../../../.svelte-kit/types/src/routes').PageServerLoad} */
export async function load({ locals, request }) {
  const searchParams = new URLSearchParams(request.url.split("?")[1]);
  const cusip = searchParams.get('cusip');
  const issueDate = searchParams.get('issueDate');
  const issueDateOperator = searchParams.get('issueDateOperator');

  const security = await FetchSecurity(
    "Fixed Income",
    "US Government",
    cusip || undefined,
    issueDate || undefined,
    issueDateOperator === 'greater_than' ? 'greater_than' : issueDateOperator === 'lesser_than' ? 'lesser_than' : undefined
  );

  return {
    security: security,
    user: locals.user
  };
}

export const actions = {
  dryRun: async ({ request }) => {
    const formData = await request.formData();
    const uuidHex = formData.get('uuidHex') as string;
    if (!uuidHex) return { deleteResult: { success: false, totalCount: 0, affectedEntities: [], warnings: [], error: 'Missing UUID' } };
    const result = await deleteSecurity(uuidHex, true);
    return { deleteResult: result, uuidHex };
  },

  confirmDelete: async ({ request }) => {
    const formData = await request.formData();
    const uuidHex = formData.get('uuidHex') as string;
    const force = formData.get('force') === 'true';
    if (!uuidHex) return { deleteResult: { success: false, totalCount: 0, affectedEntities: [], warnings: [], error: 'Missing UUID' } };
    const result = await deleteSecurity(uuidHex, false, force);
    return { deleteResult: result };
  },
};
