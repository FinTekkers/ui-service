import { redirect } from "@sveltejs/kit";
import { getTreasuryTransactions } from "$lib/treasury_positions";

/** @type {import('./$types').PageServerLoad} */
export async function load({ locals, url }) {
  // These pages read positions through the broker, which needs the login's
  // API key; without one, send the visitor to log in instead of a 500.
  if (!locals.user?.apiKey) {
    const redirectTo = encodeURIComponent(url.pathname + url.search);
    throw redirect(302, `/login?redirectTo=${redirectTo}`);
  }
  // Thread apiKey through so the underlying PositionService.search goes via
  // the broker's authenticated route. Without it the call fails with
  // `16 UNAUTHENTICATED: API key required`. Same fix as 5d8f052 for /treasuries3.
  // #301 slice A (split from the larger MBS-overlay PR per PM): the
  // hardcoded asOf was a debugging anchor that left every transaction
  // past 2026-01-01 invisible — including the 2,366 SOMA Agency MBS
  // BUYs loaded today via #274. `new Date()` reloads the full SOMA
  // history through today; downstream graphs already accept arbitrary
  // date ranges. Larger overlay + tie-out work continues on
  // feature/301-treasuries2-mbs-overlay.
  const transactions = await getTreasuryTransactions(
    new Date(),
    locals.user?.apiKey
  );

  return {
    transactions: transactions || [],
    user: locals.user,
  };
}
