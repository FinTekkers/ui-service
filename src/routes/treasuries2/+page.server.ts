import { getTreasuryTransactions } from '$lib/treasury_positions';

/** @type {import('./$types').PageServerLoad} */
export async function load({ locals }) {
  // Fetch treasury transactions with current date as asOfDate
  const transactions = await getTreasuryTransactions(new Date('2025-12-31T23:59:59'));

  return {
    transactions: transactions || [],
    user: locals.user
  };
}

