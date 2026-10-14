/**
 * Regression for second-brain#300: /data/transactions silently
 * rendered zero rows after the v0.4.4 ledger-models bump because
 * Transaction.getTradeDate() switched from LocalDate (with .toDate())
 * to Date | null. The pre-#300 sort at src/lib/transactions.ts:81
 * called .toDate() on the now-Date result, threw TypeError, and the
 * outer try/catch in FetchTransactionWithFilter caught it and
 * returned []. The grid rendered empty with no user-visible error.
 *
 * Plus a stale-copy-paste title bug: +layout.svelte:6 said
 * "Dashboard Securities" instead of "Dashboard Transactions".
 *
 * This is the UI-page-render equivalent of the per-loader smoke rule
 * in #297: pages that silently empty are P1 user-visible regressions
 * and need a smoke that fails loudly when the page disagrees with
 * what the DB has.
 *
 * Asserts:
 *   1. <title> reads "Dashboard Transactions" (catches the
 *      copy-paste regression).
 *   2. /data/transactions returns 200 (catches FetchTransaction
 *      throwing through the page-server load).
 *   3. The grid renders at least one transaction row when the seed
 *      DB has transactions (catches the silent-empty regression).
 *      US-225: we ask the ledger over the broker whether any
 *      transaction matches the page's filter, and skip when none does
 *      (a fresh env, or the e2e host, may have no transactions). The
 *      answer never comes from the page, so a silently empty grid
 *      still fails.
 */
import { test, expect } from "@playwright/test";
import { ledgerHasTransactions } from "./fixtures/data-preconditions";

const TRADE_DATE = "2026-05-15";
const TXN_URL = `/data/transactions?tradeDate=${TRADE_DATE}&tradeDateOperator=LESS_THAN_OR_EQUALS`;

test.describe("/data/transactions page renders correctly (#300)", () => {
  test('title is "Dashboard Transactions" (not "Dashboard Securities")', async ({
    page,
  }) => {
    const response = await page.goto(TXN_URL);
    expect(
      response,
      "GET /data/transactions returns a response"
    ).not.toBeNull();
    expect(
      response!.status(),
      "no 500/5xx on the transactions route"
    ).toBeLessThan(500);

    await expect(page).toHaveTitle("Dashboard Transactions", {
      timeout: 10_000,
    });
  });

  test("grid renders at least one row when the DB has transactions", async ({
    page,
  }) => {
    test.skip(
      !(await ledgerHasTransactions({ tradeDateOnOrBefore: TRADE_DATE })),
      `no transactions in the ledger on or before ${TRADE_DATE}: #300 row check not applicable`
    );

    const response = await page.goto(TXN_URL);
    expect(
      response,
      "GET /data/transactions returns a response"
    ).not.toBeNull();
    expect(
      response!.status(),
      "no 500/5xx on the transactions route"
    ).toBeLessThan(500);

    // The grid is the tbody under the transactions table. Pre-#300
    // this would render with 0 <tr> children because the load() call
    // returned [] from the swallowed TypeError. Post-fix we expect
    // at least one row when the DB has transactions.
    const rows = page.locator("table tbody tr");
    await expect
      .poll(async () => rows.count(), {
        message: "/data/transactions silently empty — would have caught #300",
        timeout: 15_000,
      })
      .toBeGreaterThan(0);
  });
});
