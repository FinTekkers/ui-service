<script lang="ts">
  /**
   * Filter bar for /data/transactions.
   *
   * Phase 3 PR-B of second-brain#226: introduces tradeDate filtering on
   * the transactions page (no equivalent UX existed previously). Mirrors
   * the URL conventions on /data/positions exactly:
   *   ?tradeDate=YYYY-MM-DD
   *   &tradeDateOperator=MORE_THAN|LESS_THAN|LESS_THAN_OR_EQUALS
   * (proto enum names, post-#229) so users moving between the two pages
   * don't have to relearn the filter shape.
   *
   * portfolioId is preserved across re-submits via buildFilterUrl's
   * inheritKeys (matches the #220-class guard in PositionSelect): when
   * the user lands here from /data/portfolios with ?portfolioId=…, that
   * scope survives the Filter button click.
   *
   * The filter is a coupled (date, operator) pair — emit both or neither
   * so the page-server doesn't apply a half-formed filter (matches the
   * pattern in PositionSelect.fetchPositions).
   */
  import { onMount } from "svelte";
  import { buildFilterUrl } from "$lib/filters/urlState";
  import DateFilter from "../filters/DateFilter.svelte";
  import {
    type DateOperator,
    normalizeDateOperator,
  } from "$lib/filters/dateOperator";

  let tradeDateInput: string = "";
  let tradeDateOperator: DateOperator | "" = "";

  function fetchTransactions() {
    if (typeof window === "undefined") return;

    const trimmedTradeDate = tradeDateInput.trim();
    const tradeDateOverride =
      trimmedTradeDate && tradeDateOperator ? trimmedTradeDate : undefined;
    const tradeDateOperatorOverride =
      trimmedTradeDate && tradeDateOperator ? tradeDateOperator : undefined;

    const url = buildFilterUrl(
      "/data/transactions",
      new URLSearchParams(window.location.search),
      {
        tradeDate: tradeDateOverride,
        tradeDateOperator: tradeDateOperatorOverride,
      },
      // Carry through the inbound portfolio scope so the Filter button
      // doesn't silently widen a portfolio-scoped view back to the
      // global transaction list (#220-class guard).
      ["portfolioId"],
    );

    window.location.href = url;
  }

  onMount(() => {
    const params = new URLSearchParams(window.location.search);
    const tradeDateFromUrl = params.get("tradeDate");
    if (tradeDateFromUrl) tradeDateInput = tradeDateFromUrl;

    // Accepts canonical proto names + the deprecated snake_case shape
    // (one-release shim post-#229).
    const normalizedOperator = normalizeDateOperator(
      params.get("tradeDateOperator"),
      "tradeDateOperator",
    );
    if (normalizedOperator) {
      tradeDateOperator = normalizedOperator;
    }
  });
</script>

<div class="transaction-select-container mt-6 mx-10 flex flex-col sm:flex-row gap-2">
  <div class="text-white date-filter-cell">
    <h4>Trade Date Filter:</h4>
    <DateFilter
      bind:date={tradeDateInput}
      bind:operator={tradeDateOperator}
      inputClass="transaction-select-input text-black"
      selectClass="transaction-select-input text-black"
      inputId="trade-date-input"
    />
  </div>
  <div class="text-white flex items-end">
    <button class="transaction-button" on:click={fetchTransactions}>
      Filter
    </button>
  </div>
</div>

<style lang="scss">
  @import "../../styles/_shared.scss";

  h4 {
    margin: 4px 0;
    font-size: 0.875rem;
  }

  .transaction-button {
    background-color: $success;
    color: $bgc-color;
    font-weight: bold;
    padding: 8px 24px;
    border: none;
    border-radius: 4px;
    font-size: 0.875rem;
    white-space: nowrap;
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

    &:hover {
      background-color: lighten($success, 5%);
      transform: translateY(-1px);
    }

    &:active {
      transform: translateY(0);
    }
  }

  // .transaction-select-input is passed via inputClass / selectClass
  // into DateFilter (Phase 3 PR-B of #226). The component renders those
  // classes onto its <select>/<input>, which live in a child component
  // scope, so Svelte's scoped CSS would drop the rule as unused. :global
  // keeps it applying; the .transaction-select-container ancestor
  // confines blast radius to TransactionSelect's tree.
  :global(.transaction-select-container .transaction-select-input) {
    padding: 4px 10px;
    border: 1px solid #ccc;
    border-radius: 4px;
    width: 100%;
    font-size: 0.875rem;
    height: 38px;
    box-sizing: border-box;
    background-color: white;
  }

  :global(.transaction-select-container .transaction-select-input:disabled) {
    background-color: #f0f0f0;
    cursor: not-allowed;
  }
</style>
