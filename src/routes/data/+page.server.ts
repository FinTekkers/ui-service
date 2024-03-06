import { FetchTransaction } from "../../lib/transactions"
import { FetchPortfolio } from "../../lib/portfolios"
import { FetchSecurity} from "../../lib/security"


/** @type {import('./$types').PageServerLoad} */
export async function load() {
  const transactions = await FetchTransaction();
  const portfolios = await FetchPortfolio("Federal Reserve SOMA Holdings");
  const security = await FetchSecurity("Fixed Income", "US Government");

  return { security, portfolios, transactions };
}