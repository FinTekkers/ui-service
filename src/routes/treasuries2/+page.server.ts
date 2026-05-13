import { getTreasuryTransactions } from '$lib/treasury_positions';

/** @type {import('./$types').PageServerLoad} */
export async function load({ locals }) {
  // Thread apiKey through so the underlying PositionService.search goes via
  // the broker's authenticated route. Without it the call fails with
  // `16 UNAUTHENTICATED: API key required`. Same fix as 5d8f052 for /treasuries3.
  const transactions = await getTreasuryTransactions(
    new Date('2026-01-01T00:59:59'),
    locals.user?.apiKey,
  );

  return {
    transactions: transactions || [],
    user: locals.user
  };
}

