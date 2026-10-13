/**
 * Probe-portfolio ledger for e2e specs (US-211).
 *
 * Every spec that writes to the ledger goes through the broker at
 * BROKER_URL with the test user's API key (the broker rejects calls
 * without one). Call from a hook or fixture, not at collection time: the
 * key comes from the storageState that scripts/checks/e2e.sh and
 * auth.setup.ts write before the specs run.
 */
import { test as base } from "@playwright/test";
import { STORAGE_STATE_PATH } from "./auth";
import {
  BROKER_URL,
  apiKeyFromStorageState,
  createGrpcProbeLedger,
  createProbe,
  deleteProbe,
  makeProbeName,
} from "../../../src/tests/probe-cleanup";
import type { ProbeLedger } from "../../../src/tests/probe-cleanup";

export function probeLedger(brokerUrl: string = BROKER_URL): ProbeLedger {
  return createGrpcProbeLedger(
    brokerUrl,
    apiKeyFromStorageState(STORAGE_STATE_PATH)
  );
}

/**
 * `test` with one probe portfolio per worker, for specs that need any
 * portfolio to exist (the ledger has no seed portfolios). Deleted in the
 * fixture's teardown, which also runs when a test fails; a refused delete
 * fails the run. The portfolios index primes the shared universe cache on
 * load, so the probe is visible to the transactions/positions filters as
 * soon as the spec visits /data/portfolios — no cache wait here.
 */
export const test = base.extend<
  Record<string, never>,
  { probePortfolio: string }
>({
  probePortfolio: [
    // eslint-disable-next-line no-empty-pattern
    async ({}, use) => {
      const ledger = probeLedger();
      const name = makeProbeName();
      try {
        await createProbe(ledger, name);
        await use(name);
      } finally {
        await deleteProbe(ledger, name);
      }
    },
    { scope: "worker", auto: true },
  ],
});
