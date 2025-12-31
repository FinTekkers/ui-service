import { getTreasuryTransactions } from '$lib/treasury_positions';
import type { TreasuryTransaction } from '$lib/treasury_positions';

/** @type {import('./$types').PageServerLoad} */
export async function load({ locals }) {
  // Filter for December 2025: get all transactions up to December 31, 2025
  // Then filter client-side for December 2025 only
  const endDate = new Date('2025-12-31T23:59:59');
  const transactions = await getTreasuryTransactions(endDate);

  // Filter for December 2025 transactions, excluding bills
  const december2025NonBills: TreasuryTransaction[] = (transactions || []).filter((txn) => {
    // Filter by date: December 2025
    if (!txn.TRADE_DATE) return false;

    const tradeDate = new Date(txn.TRADE_DATE);
    const isDecember2025 = (
      tradeDate.getFullYear() === 2025 &&
      tradeDate.getMonth() === 11 // December is month 11 (0-indexed)
    );

    if (!isDecember2025) return false;

    // Filter by product type: Exclude bills
    const productType = (txn.PRODUCT_TYPE || '').toLowerCase();
    return productType.includes('bill');
  });

  return {
    transactions: december2025NonBills,
    user: locals.user
  };
}

