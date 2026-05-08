<script lang="ts">
  /**
   * Filter bar for /data/transactions.
   *
   * Phase 3 PR-B of second-brain#226: introduces tradeDate filtering on
   * the transactions page (no equivalent UX existed previously). Mirrors
   * the URL conventions on /data/positions exactly:
   *   ?tradeDate=YYYY-MM-DD
   *   &tradeDateOperator=<proto enum name>
   * (PositionFilterOperator names, post-#229) so users moving between
   * the two pages don't have to relearn the filter shape.
   *
   * portfolio scope flows through PortfolioFilter (Phase 3 PR-B of
   * #226). The form is authoritative — portfolioId is no longer in
   * buildFilterUrl's inheritKeys; the page-server hydrates the form's
   * initial state from the inbound URL so re-submits preserve scope,
   * matching PositionSelect's PR #146 wiring.
   *
   * The filter is a coupled (date, operator) pair — emit both or neither
   * so the page-server doesn't apply a half-formed filter (matches the
   * pattern in PositionSelect.fetchPositions).
   */
  import { onMount } from "svelte";
  import { buildFilterUrl } from "$lib/filters/urlState";
  import DateFilter from "../filters/DateFilter.svelte";
  import PortfolioFilter from "../filters/PortfolioFilter.svelte";
  import type { PortfolioOption } from "../filters/PortfolioFilter.svelte";

  // Phase 3 of #226 PR-B: PortfolioFilter primitive. Page-server
  // provides the (id, name) universe + the resolved name for the
  // inbound URL portfolioId. Both flow through here as defaults so
  // the form starts populated when the user lands via /data/portfolios
  // (Txns link) or any other portfolioId-bearing URL.
  export let portfolioUniverse: readonly PortfolioOption[] = [];
  export let initialPortfolioId: string = "";
  export let initialPortfolioName: string = "";

  let tradeDateInput: string = "";
  let tradeDateOperator: string = "";
  let portfolioIdInput: string = initialPortfolioId;
  let portfolioNameInput: string = initialPortfolioName;

  function fetchTransactions() {
    if (typeof window === "undefined") return;

    const trimmedTradeDate = tradeDateInput.trim();
    const tradeDateOverride =
      trimmedTradeDate && tradeDateOperator ? trimmedTradeDate : undefined;
    const tradeDateOperatorOverride =
      trimmedTradeDate && tradeDateOperator ? tradeDateOperator : undefined;

    // Portfolio scope is now form-driven via PortfolioFilter (#226 PR-B).
    // Trimmed-empty input emits null (explicit removal — the user
    // cleared the autocomplete) so a stale bookmark doesn't ride
    // through. portfolioId is no longer in inheritKeys for the same
    // reason: the form owns it now, so inherit + override would be
    // redundant. Mirrors PositionSelect's PR #146 wiring.
    const trimmedPortfolioId = portfolioIdInput.trim();
    const portfolioIdOverride = trimmedPortfolioId === '' ? null : trimmedPortfolioId;

    const url = buildFilterUrl(
      "/data/transactions",
      new URLSearchParams(window.location.search),
      {
        tradeDate: tradeDateOverride,
        tradeDateOperator: tradeDateOperatorOverride,
        portfolioId: portfolioIdOverride,
      },
      // No more inheritKeys — every form field is form-driven now,
      // including portfolioId. The original #220-class concern is
      // addressed by initial-state hydration from the page-server,
      // not URL passthrough.
      [],
    );

    window.location.href = url;
  }

  onMount(() => {
    const params = new URLSearchParams(window.location.search);
    const tradeDateFromUrl = params.get("tradeDate");
    if (tradeDateFromUrl) tradeDateInput = tradeDateFromUrl;

    // Operator passes through untransformed — the wrapper validates at
    // filter-application time (#229 review: no UI-side normalization).
    const opFromUrl = params.get("tradeDateOperator");
    if (opFromUrl) {
      tradeDateOperator = opFromUrl;
    }
  });
</script>

<div class="transaction-select-container mt-6 mx-10 flex flex-col sm:flex-row gap-2">
  <div class="text-white portfolio-filter-cell">
    <h4>Portfolio:</h4>
    <PortfolioFilter
      bind:portfolioId={portfolioIdInput}
      bind:portfolioName={portfolioNameInput}
      universe={portfolioUniverse}
      inputClass="transaction-select-input text-black"
      inputId="transaction-portfolio-input"
    />
  </div>
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
