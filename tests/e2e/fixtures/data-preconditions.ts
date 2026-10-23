/**
 * Ledger data preconditions for e2e specs (US-225).
 *
 * A test whose assertions need data the host ledger may not hold calls one
 * of these first, before any page.goto, and `test.skip`s with the reason
 * when it returns false. The answer comes from the ledger over the broker,
 * never from the page under test, so an empty grid caused by a UI bug still
 * fails the test. A broker error throws, which fails the test too. Call from
 * a test body or hook: the API key comes from the storageState that
 * scripts/checks/e2e.sh and auth.setup.ts write before the specs run.
 */
import { STORAGE_STATE_PATH } from "./auth";
import {
  BROKER_URL,
  apiKeyFromStorageState,
  ledgerHasTransactions as grpcLedgerHasTransactions,
  priceServiceHasCloses,
} from "../../../src/tests/probe-cleanup";
import type { TransactionPrecondition } from "../../../src/tests/probe-cleanup";

export function ledgerHasTransactions(
  options: TransactionPrecondition = {},
  brokerUrl: string = BROKER_URL
): Promise<boolean> {
  return grpcLedgerHasTransactions(
    brokerUrl,
    apiKeyFromStorageState(STORAGE_STATE_PATH),
    options
  );
}

/**
 * Does the price service hold any AAPL close (US-250)? Ask with the key the
 * server under test draws the homepage chart with (FT_HOMEPAGE_API_KEY,
 * which scripts/checks/e2e.sh exports to both), never the session's.
 */
export function priceServiceHasAaplCloses(
  apiKey: string,
  brokerUrl: string = BROKER_URL
): Promise<boolean> {
  return priceServiceHasCloses("AAPL", brokerUrl, apiKey);
}
