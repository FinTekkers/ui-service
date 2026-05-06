<script lang="ts">
  import { onMount } from "svelte";
  import { buildFilterUrl } from "$lib/filters/urlState";
  // Browser-safe import (security.ts pulls in @grpc/grpc-js which crashes
  // in the client bundle).
  import {
    IDENTIFIER_TYPE_NAMES,
    SECURITY_TYPE_NAMES,
    type IdentifierTypeName,
    type SecurityTypeName,
  } from "$lib/securityFilterTypes";

  // Phase 1 of second-brain#226: extend filter form to the full identifier
  // set + assetClass / issuerName / securityType. The CUSIP/ISIN button
  // toggle was a hardcoded 2-option form; replaced with a dropdown of all
  // 7 IdentifierTypeProto values. No new component yet — Phase 2 introduces
  // an IdentifierFilter primitive.

  let identifierInput: string = "";
  let identifierType: IdentifierTypeName = "CUSIP";
  let issueDateInput: string = "";
  let issueDateOperator: "greater_than" | "lesser_than" | "" = "";
  let assetClassInput: string = "";
  let issuerNameInput: string = "";
  let securityTypeInput: SecurityTypeName | "" = "";

  // Tailored placeholders so the user gets a hint of what each identifier
  // type looks like. Falls back to a generic example for the rarer types.
  const IDENTIFIER_PLACEHOLDERS: Record<IdentifierTypeName, string> = {
    CUSIP: "e.g. 912828ZT0",
    ISIN: "e.g. GB0002404557",
    EXCH_TICKER: "e.g. AAPL",
    SERIES_ID: "e.g. CPIAUCSL",
    OSI: "e.g. AAPL  240119C00150000",
    FIGI: "e.g. BBG000B9XRY4",
    CASH: "e.g. USD",
  };

  $: identifierPlaceholder = IDENTIFIER_PLACEHOLDERS[identifierType];

  function fetchSecurities() {
    if (typeof window === "undefined") return;

    const trimmedIdentifier = identifierInput.trim();
    const trimmedIssueDate = issueDateInput.trim();
    // Issue-date filter is a coupled (date, operator) pair: emit both or
    // neither so the page-server doesn't apply a half-formed filter.
    const issueDateOverride =
      trimmedIssueDate && issueDateOperator ? trimmedIssueDate : undefined;
    const issueDateOperatorOverride =
      trimmedIssueDate && issueDateOperator ? issueDateOperator : undefined;

    const url = buildFilterUrl(
      "/data/securities",
      new URLSearchParams(window.location.search),
      {
        identifier: trimmedIdentifier || undefined,
        // Only emit identifierType alongside an identifier; otherwise it's
        // dead weight in the URL.
        identifierType: trimmedIdentifier ? identifierType : undefined,
        issueDate: issueDateOverride,
        issueDateOperator: issueDateOperatorOverride,
        assetClass: assetClassInput.trim() || undefined,
        issuerName: issuerNameInput.trim() || undefined,
        securityType: securityTypeInput || undefined,
      },
    );

    window.location.href = url;
  }

  onMount(() => {
    const urlParams = new URLSearchParams(window.location.search);

    const identifierFromUrl = urlParams.get("identifier") ?? urlParams.get("cusip");
    if (identifierFromUrl) identifierInput = identifierFromUrl;

    const idTypeFromUrl = urlParams.get("identifierType");
    if (idTypeFromUrl && (IDENTIFIER_TYPE_NAMES as readonly string[]).includes(idTypeFromUrl)) {
      identifierType = idTypeFromUrl as IdentifierTypeName;
    }

    const issueDateFromUrl = urlParams.get("issueDate");
    if (issueDateFromUrl) issueDateInput = issueDateFromUrl;

    const issueDateOperatorFromUrl = urlParams.get("issueDateOperator");
    if (
      issueDateOperatorFromUrl === "greater_than" ||
      issueDateOperatorFromUrl === "lesser_than"
    ) {
      issueDateOperator = issueDateOperatorFromUrl;
    }

    const assetClassFromUrl = urlParams.get("assetClass");
    if (assetClassFromUrl !== null) assetClassInput = assetClassFromUrl;

    const issuerNameFromUrl = urlParams.get("issuerName");
    if (issuerNameFromUrl !== null) issuerNameInput = issuerNameFromUrl;

    const securityTypeFromUrl = urlParams.get("securityType");
    if (securityTypeFromUrl && (SECURITY_TYPE_NAMES as readonly string[]).includes(securityTypeFromUrl)) {
      securityTypeInput = securityTypeFromUrl as SecurityTypeName;
    }
  });
</script>

<div class="mt-14 mx-10 w-full gap-2">
  <div class="security-select-container flex flex-col sm:flex-row gap-2">
    <div class="text-white">
      <h4>Identifier Type:</h4>
      <select
        id="identifier-type-select"
        bind:value={identifierType}
        class="filter-select text-black"
      >
        {#each IDENTIFIER_TYPE_NAMES as name}
          <option value={name}>{name}</option>
        {/each}
      </select>
    </div>
    <div class="text-white">
      <h4>{identifierType}:</h4>
      <input
        type="text"
        id="identifier-input"
        placeholder={identifierPlaceholder}
        bind:value={identifierInput}
        class="filter-input text-black"
      />
    </div>
    <div class="text-white">
      <h4>Asset Class:</h4>
      <input
        type="text"
        id="asset-class-input"
        placeholder="e.g. Fixed Income (blank = all)"
        bind:value={assetClassInput}
        class="filter-input text-black"
      />
    </div>
    <div class="text-white">
      <h4>Issuer Name:</h4>
      <input
        type="text"
        id="issuer-name-input"
        placeholder="e.g. US Government (blank = all)"
        bind:value={issuerNameInput}
        class="filter-input text-black"
      />
    </div>
    <div class="text-white">
      <h4>Security Type:</h4>
      <select
        id="security-type-select"
        bind:value={securityTypeInput}
        class="filter-select text-black"
      >
        <option value="">All</option>
        {#each SECURITY_TYPE_NAMES as name}
          <option value={name}>{name}</option>
        {/each}
      </select>
    </div>
  </div>
  <div class="security-select-container flex flex-col sm:flex-row gap-2 mt-2">
    <div class="text-white">
      <h4>Issue Date Filter:</h4>
      <input
        type="date"
        id="issue-date-input"
        bind:value={issueDateInput}
        class="filter-input text-black"
      />
    </div>
    <div class="text-white">
      <h4>Operator:</h4>
      <select
        id="issue-date-operator"
        bind:value={issueDateOperator}
        class="filter-select text-black"
        disabled={!issueDateInput}
      >
        <option value="">Select operator...</option>
        <option value="greater_than">Greater Than</option>
        <option value="lesser_than">Lesser Than</option>
      </select>
    </div>
    <div class="text-white flex items-end">
      <button class="security-button" on:click={fetchSecurities}>
        Fetch Securities
      </button>
    </div>
  </div>
</div>

<style lang="scss">
  @import "../../styles/_shared.scss";

  h4 {
    margin: 4px 0;
    font-size: 0.875rem;
  }

  .security-button {
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
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.15);
    }

    &:active {
      transform: translateY(0);
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    }
  }

  .filter-input,
  .filter-select {
    padding: 4px 10px;
    border: 1px solid #ccc;
    border-radius: 4px;
    width: 100%;
    font-size: 0.875rem;
    height: 38px;
    box-sizing: border-box;
    background-color: white;
    color: $black;
  }

  .filter-select:disabled {
    background-color: #f0f0f0;
    color: $grey;
    cursor: not-allowed;
  }
</style>
