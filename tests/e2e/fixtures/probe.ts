/**
 * Probe-portfolio ledger for e2e specs (US-211).
 *
 * Every spec that writes to the ledger goes through the broker at
 * BROKER_URL with the test user's API key (the broker rejects calls
 * without one). Call from a hook or fixture, not at collection time: the
 * key comes from the storageState that scripts/checks/e2e.sh and
 * auth.setup.ts write before the specs run.
 */
import { test as base, expect, type Page } from "@playwright/test";
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
 * portfolio to exist (the ledger has no seed portfolios). It is shared
 * across spec files so the filter specs wait for the portfolio cache
 * (see `waitForPortfolioInUniverse`) once per run, not once per spec.
 * Deleted in the fixture's teardown, which also runs when a test fails;
 * a refused delete fails the run.
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

/** The app's portfolio-list cache TTL (`FetchPortfolioUniverse`). */
const PORTFOLIO_UNIVERSE_TTL_MS = 5 * 60 * 1000;

/**
 * Wait until the app's cached portfolio list (5 minutes per API key,
 * shared by the transactions and positions filters) includes the given
 * portfolio. An earlier e2e run in the same check can warm that cache
 * before the probe exists; the app itself is not changed for the test,
 * so wait out the TTL instead. Returns at once when the cache is fresh.
 */
export async function waitForPortfolioInUniverse(
  page: Page,
  portfolioId: string,
  portfolioName: string
): Promise<void> {
  const waitMs = PORTFOLIO_UNIVERSE_TTL_MS + 60_000;
  test.info().setTimeout(test.info().timeout + waitMs);
  await expect
    .poll(
      async () => {
        await page.goto(`/data/transactions?portfolioId=${portfolioId}`);
        const input = page.locator("#transaction-portfolio-input");
        await input.waitFor({ timeout: 15_000 });
        return input.inputValue();
      },
      {
        message: `portfolio ${portfolioName} reaches the app's portfolio cache`,
        timeout: waitMs,
        intervals: [15_000],
      }
    )
    .toBe(portfolioName);
}
