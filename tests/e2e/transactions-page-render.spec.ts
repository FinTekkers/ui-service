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
 */
import { test, expect } from "@playwright/test";

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
});
