import { FetchTransaction } from "$lib/transactions";
import { deleteEntity } from '$lib/entity-delete';

/** @type {import('../../../../../.svelte-kit/types/src/routes').PageServerLoad} */
export async function load({locals}) {
  const transactions = await FetchTransaction(locals.user?.apiKey);
  return {
    transactions: transactions,
    user: locals.user
  };
}

export const actions = {
  dryRun: async ({ request, locals }) => {
    const formData = await request.formData();
    const uuidHex = formData.get('uuidHex') as string;
    if (!uuidHex) return { deleteResult: { success: false, totalCount: 0, affectedEntities: [], warnings: [], error: 'Missing UUID' } };
    return { deleteResult: await deleteEntity('TRANSACTION', uuidHex, true, false, false, locals.user?.apiKey), uuidHex };
  },
  confirmDelete: async ({ request, locals }) => {
    const formData = await request.formData();
    const uuidHex = formData.get('uuidHex') as string;
    const force = formData.get('force') === 'true';
    if (!uuidHex) return { deleteResult: { success: false, totalCount: 0, affectedEntities: [], warnings: [], error: 'Missing UUID' } };
    return { deleteResult: await deleteEntity('TRANSACTION', uuidHex, false, force, false, locals.user?.apiKey) };
  },
};