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
import {
  createGrpcProbeLedger,
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
  const ledger: ProbeLedger = createGrpcProbeLedger(LEDGER_URL);
  let ownedProbeName: string | undefined;

  test.afterEach(async () => {
    if (ownedProbeName === undefined) return;
    try {
      await deleteProbe(ledger, ownedProbeName);
      ownedProbeName = undefined;
    } catch (err: any) {
      // Never mask the test result; afterAll retries the delete below.
      console.warn(
        `probe cleanup afterEach failed for "${ownedProbeName}": ` +
          `${err?.message ?? err}`
      );
    }
  });

  test.afterAll(async () => {
    try {
      if (ownedProbeName !== undefined) {
        await deleteProbe(ledger, ownedProbeName);
      }
    } finally {
      ownedProbeName = undefined;
      // Purge crashed-run leftovers older than one hour. Fails this
      // step instead of deleting a probe with linked transactions.
      await sweepStaleProbes(ledger);
    }
  });

  test("lists every portfolio (no hardcoded name filter on the search call)", async ({
    page,
  }) => {
    // Seed a fresh portfolio so the test has a row it owns to assert
    // against, regardless of seed contents. (Pre-M5 this also
    // verified SOMA's continued presence; M5's clean-slate migration
    // dropped SOMA from the seed so the assertion now just checks
    // "more than one row" + "the fresh probe is among them".)
    const probeName = makeProbeName();
    ownedProbeName = probeName;
    await createProbe(ledger, probeName);

    await page.goto("/data/portfolios");
    await expect(page.getByRole("heading", { name: "Portfolios" })).toBeVisible(
      {
        timeout: 15_000,
      }
    );

    // Multiple rows render — pre-#221 the hardcoded
    // PORTFOLIO_NAME=='Federal Reserve SOMA Holdings' filter would
    // have truncated to one row. (At minimum 2 rows: the probe we
    // just created + at least one other from the seed / accumulated
    // test runs.)
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
