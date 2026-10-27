<script lang="ts">
  /**
   * Filter bar for /data/transactions.
   *
   * US-291: the Business date control comes first, as on
   * /data/positions, with the same URL shape:
   *   ?businessDate=YYYY-MM-DD  (trades on or before that date)
   *   ?businessDate=all         (no trade-date filter)
   * No businessDate means today (fixed by the page-server). Writing it
   * drops the old ?tradeDate=…&tradeDateOperator=… params, which the
   * page-server still reads for old links.
   *
   * portfolio scope flows through PortfolioFilter (Phase 3 PR-B of
   * #226). The form is authoritative — portfolioId is no longer in
   * buildFilterUrl's inheritKeys; the page-server hydrates the form's
   * initial state from the inbound URL so re-submits preserve scope,
   * matching PositionSelect's PR #146 wiring.
   */
  import { buildFilterUrl } from "$lib/filters/urlState";
  import {
    businessDateUrlOverrides,
    type BusinessDateMode,
    type BusinessDateState,
  } from "$lib/filters/businessDate";
  import BusinessDateFilter from "../filters/BusinessDateFilter.svelte";
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
  // US-291: the page-server's resolved Business date (today fixed there).
  export let businessDate: BusinessDateState;

  let businessDateMode: BusinessDateMode;
  let businessDateValue: string | null;
  $: businessDateMode = businessDate.mode;
  $: businessDateValue = businessDate.date;
  let portfolioIdInput: string = initialPortfolioId;
  let portfolioNameInput: string = initialPortfolioName;

  function fetchTransactions() {
    if (typeof window === "undefined") return;

    // Portfolio scope is now form-driven via PortfolioFilter (#226 PR-B).
    // Trimmed-empty input emits null (explicit removal — the user
    // cleared the autocomplete) so a stale bookmark doesn't ride
    // through. portfolioId is no longer in inheritKeys for the same
    // reason: the form owns it now, so inherit + override would be
    // redundant. Mirrors PositionSelect's PR #146 wiring.
    const trimmedPortfolioId = portfolioIdInput.trim();
    const portfolioIdOverride =
      trimmedPortfolioId === "" ? null : trimmedPortfolioId;

    const url = buildFilterUrl(
      "/data/transactions",
      new URLSearchParams(window.location.search),
      {
        ...businessDateUrlOverrides(businessDateMode, businessDateValue),
        portfolioId: portfolioIdOverride,
      },
      // No more inheritKeys — every form field is form-driven now,
      // including portfolioId. The original #220-class concern is
      // addressed by initial-state hydration from the page-server,
      // not URL passthrough.
      []
    );

    window.location.href = url;
  }

  // The control's choice applies straight away.
  function onBusinessDateChange(
    event: CustomEvent<{ mode: BusinessDateMode; date: string | null }>
  ) {
    businessDateMode = event.detail.mode;
    businessDateValue = event.detail.date;
    fetchTransactions();
  }
</script>

<div
  class="transaction-select-container mt-6 mx-10 flex flex-col sm:flex-row gap-2"
>
  <div class="text-white business-date-cell">
    <BusinessDateFilter
      state={businessDate}
      inputClass="transaction-select-input text-black"
      inputId="business-date-input"
      on:change={onBusinessDateChange}
    />
  </div>
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

  // .transaction-select-input is passed via inputClass into
  // BusinessDateFilter (US-291). The component renders those
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
