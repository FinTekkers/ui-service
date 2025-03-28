import { FetchTransaction } from "$lib/transactions";

/** @type {import('../../../../../.svelte-kit/types/src/routes').PageServerLoad} */
export async function load({locals}) {
  const transactions = await FetchTransaction();
  return {
    transactions: transactions,
    user: locals.user
  };
}