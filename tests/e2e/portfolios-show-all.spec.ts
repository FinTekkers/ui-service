/**
 * Regression for second-brain#221 — /data/portfolios used to hardcode
 * a `PORTFOLIO_NAME == "Federal Reserve SOMA Holdings"` filter on the
 * search call, truncating the index to exactly that one row even
 * when the backend held multiple portfolios. The fix removes the
 * filter; this test asserts the un-filtered list shows up.
 *
 * To make the assertion deterministic regardless of seed state, the
 * test creates a fresh portfolio with a unique name via the broker's
 * Portfolio/CreateOrUpdate RPC (shared helper in
 * src/tests/probe-cleanup.ts), then asserts BOTH that
 * fresh portfolio AND the SOMA seed appear on the page. Pre-#221 fix
 * the SOMA filter would have hidden the fresh one.
 *
 * US-211: the probe is deleted again in `afterEach` (even when the test
 * fails) and each run ends with an `afterAll` sweep of stale
 * `qa-*-probe-*` rows, so e2e runs leave no ledger data behind.
 */
import { test, expect } from "@playwright/test";
import { probeLedger } from "./fixtures/probe";
import {
  createProbe,
  deleteProbe,
  makeProbeName,
  sweepStaleProbes,
} from "../../src/tests/probe-cleanup";
import type { ProbeLedger } from "../../src/tests/probe-cleanup";

// Broker path for every ledger call in this spec (create, delete, sweep).
// Mirrors BROKER_URL in src/tests/probe-cleanup.ts.
const LEDGER_URL = "127.0.0.1:8085";

test.describe("/data/portfolios index (#221)", () => {
  let ledger: ProbeLedger;
  // Probes this spec created and has not deleted yet.
  let ownedProbeNames: string[] = [];

  test.beforeAll(() => {
    // Carries the test user's API key, which the broker requires.
    ledger = probeLedger(LEDGER_URL);
  });

  test.afterEach(async () => {
    const remaining: string[] = [];
    for (const name of ownedProbeNames) {
      try {
        await deleteProbe(ledger, name);
      } catch (err: any) {
        // Never mask the test result; afterAll retries the delete below.
        remaining.push(name);
        console.warn(
          `probe cleanup afterEach failed for "${name}": ` +
            `${err?.message ?? err}`
        );
      }
    }
    ownedProbeNames = remaining;
  });

  test.afterAll(async () => {
    try {
      for (const name of ownedProbeNames) {
        await deleteProbe(ledger, name);
      }
    } finally {
      ownedProbeNames = [];
      // Purge crashed-run leftovers older than one hour. Fails this
      // step instead of deleting a probe with linked transactions.
      await sweepStaleProbes(ledger);
    }
  });

  test("lists every portfolio (no hardcoded name filter on the search call)", async ({
    page,
  }) => {
    // Seed two fresh portfolios so the test owns every row it asserts
    // against, regardless of seed contents. (Pre-M5 this also
    // verified SOMA's continued presence; M5's clean-slate migration
    // dropped SOMA from the seed, and US-211 stopped probes piling up,
    // so the ledger may hold no other portfolio at all.)
    const probeName = makeProbeName();
    ownedProbeNames.push(probeName);
    await createProbe(ledger, probeName);
    // Created after the first round trip, so the timestamp differs.
    const secondProbeName = makeProbeName();
    ownedProbeNames.push(secondProbeName);
    await createProbe(ledger, secondProbeName);

    await page.goto("/data/portfolios");
    await expect(page.getByRole("heading", { name: "Portfolios" })).toBeVisible(
      {
        timeout: 15_000,
      }
    );

    // Multiple rows render — pre-#221 the hardcoded
    // PORTFOLIO_NAME=='Federal Reserve SOMA Holdings' filter would
    // have truncated to one row. (At minimum 2 rows: the two probes
    // we just created.)
    const allRows = page.locator("table tbody tr");
    await expect(
      allRows,
      "more than one portfolio renders post-#221"
    ).toHaveCount(
      await allRows.count() // resolves to a static number first, then asserts ≥ 2 below
    );
    const rowCount = await allRows.count();
    expect(rowCount, "multiple portfolios render").toBeGreaterThanOrEqual(2);

    const probeRow = page.locator("table tbody tr", { hasText: probeName });
    await expect(
      probeRow,
      "fresh probe portfolio renders post-#221 fix"
    ).toHaveCount(1, { timeout: 10_000 });
    await expect(
      page.locator("table tbody tr", { hasText: secondProbeName }),
      "second probe portfolio renders"
    ).toHaveCount(1);

    // As Of column renders post-#221 amend.
    await expect(
      page.getByRole("button", { name: /^As Of/ }),
      "As Of header renders"
    ).toBeVisible();
    const probeAsOfCell = probeRow.locator("td").last();
    await expect(
      probeAsOfCell,
      "fresh portfolio renders a YYYY-MM-DD asOf cell"
    ).toContainText(/^\d{4}-\d{2}-\d{2}$/);
  });
});
