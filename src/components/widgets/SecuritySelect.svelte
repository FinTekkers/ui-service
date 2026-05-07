<script lang="ts">
  import { onMount } from "svelte";
  import { buildFilterUrl } from "$lib/filters/urlState";
  // Browser-safe import (security.ts pulls in @grpc/grpc-js which crashes
  // in the client bundle).
  import {
    SECURITY_TYPE_NAMES,
    ASSET_CLASS_NAMES,
    type IdentifierTypeName,
    type SecurityTypeName,
    type AssetClassName,
  } from "$lib/securityFilterTypes";
  import IdentifierFilter from "../filters/IdentifierFilter.svelte";
  import SecurityTypeFilter from "../filters/SecurityTypeFilter.svelte";
  import AssetClassFilter from "../filters/AssetClassFilter.svelte";
  import DateFilter from "../filters/DateFilter.svelte";
  import {
    type DateOperator,
    normalizeDateOperator,
  } from "$lib/filters/dateOperator";

  // Phase 2/3 of second-brain#226: filter primitives now own their controls.
  // - Phase 2 (PR #130): identifier-type dropdown + value → IdentifierFilter.
  // - Phase 3 (this PR): assetClass <input> → AssetClassFilter; securityType
  //   <select> → SecurityTypeFilter. Both emit proto-enum names via URL
  //   (FIXED_INCOME / BOND_SECURITY / …); page-server still treats the
  //   value as a free-form string so legacy URLs like ?assetClass=Equity
  //   continue to filter correctly server-side.

  // Legacy free-form → proto-enum normalization for assetClass URL load.
  // Pre-Phase-3 URLs (e.g. tests using ?assetClass=Equity) carried free-
  // form labels; this lets the dropdown round-trip them onto the
  // canonical enum value so the user sees their filter selected and a
  // subsequent Fetch re-emits the canonical shape.
  const ASSET_CLASS_FREEFORM_TO_ENUM: Record<string, AssetClassName> = {
    'fixed income': 'FIXED_INCOME',
    'equity': 'EQUITY',
    'cash': 'CASH_ASSET_CLASS',
    'index': 'INDEX',
  };

  let identifierInput: string = "";
  let identifierType: IdentifierTypeName = "CUSIP";
  // Phase 3 PR-B of #226: issueDate UX uses the shared DateFilter
  // primitive. Operators restricted to MORE_THAN / LESS_THAN —
  // FetchSecurity in $lib/security only supports those two; widening
  // the dropdown without backend support would surface a silent no-op.
  let issueDateInput: string = "";
  let issueDateOperator: Extract<DateOperator, "MORE_THAN" | "LESS_THAN"> | "" = "";
  const ISSUE_DATE_OPERATORS = ["MORE_THAN", "LESS_THAN"] as const satisfies readonly DateOperator[];
  let assetClassInput: AssetClassName | "" = "";
  let issuerNameInput: string = "";
  let securityTypeInput: SecurityTypeName | "" = "";

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
        assetClass: assetClassInput || undefined,
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

    // IdentifierFilter validates the type itself via supportedTypes, but we
    // still guard against a typo'd URL setting an invalid value here so the
    // bound prop never becomes a string outside the union.
    const idTypeFromUrl = urlParams.get("identifierType");
    if (
      idTypeFromUrl === "CUSIP" ||
      idTypeFromUrl === "ISIN" ||
      idTypeFromUrl === "EXCH_TICKER" ||
      idTypeFromUrl === "SERIES_ID" ||
      idTypeFromUrl === "OSI" ||
      idTypeFromUrl === "FIGI" ||
      idTypeFromUrl === "CASH"
    ) {
      identifierType = idTypeFromUrl;
    }

    const issueDateFromUrl = urlParams.get("issueDate");
    if (issueDateFromUrl) issueDateInput = issueDateFromUrl;

    // Accepts canonical proto names + the deprecated snake_case shape.
    // The dropdown only renders MORE_THAN / LESS_THAN, so a normalized
    // 'LESS_THAN_OR_EQUALS' (e.g. from a stale bookmark) is dropped to
    // empty rather than appearing as an unselectable value.
    const normalizedOperator = normalizeDateOperator(
      urlParams.get("issueDateOperator"),
      "issueDateOperator",
    );
    if (normalizedOperator === "MORE_THAN" || normalizedOperator === "LESS_THAN") {
      issueDateOperator = normalizedOperator;
    }

    const assetClassFromUrl = urlParams.get("assetClass");
    if (assetClassFromUrl !== null && assetClassFromUrl !== "") {
      // Canonical: a proto-enum name (FIXED_INCOME, EQUITY, …).
      if ((ASSET_CLASS_NAMES as readonly string[]).includes(assetClassFromUrl)) {
        assetClassInput = assetClassFromUrl as AssetClassName;
      } else {
        // Legacy free-form (Equity, Fixed Income, …) — map to enum so
        // the dropdown round-trips on the next Fetch. Falls through to
        // empty if the value isn't recognized; the page-server still
        // sees the original URL param and applies it as a string filter.
        const normalized = ASSET_CLASS_FREEFORM_TO_ENUM[assetClassFromUrl.toLowerCase()];
        if (normalized) assetClassInput = normalized;
      }
    }

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
    <div class="text-white identifier-filter-cell">
      <h4>Identifier:</h4>
      <IdentifierFilter
        bind:identifierType
        bind:identifier={identifierInput}
        selectClass="filter-select text-black"
        inputClass="filter-input text-black"
        inputId="identifier-input"
      />
    </div>
    <div class="text-white">
      <h4>Asset Class:</h4>
      <AssetClassFilter
        bind:value={assetClassInput}
        selectClass="filter-select text-black"
        selectId="asset-class-input"
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
      <SecurityTypeFilter
        bind:value={securityTypeInput}
        selectClass="filter-select text-black"
        selectId="security-type-select"
      />
    </div>
  </div>
  <div class="security-select-container flex flex-col sm:flex-row gap-2 mt-2">
    <div class="text-white issue-date-filter-cell">
      <h4>Issue Date Filter:</h4>
      <DateFilter
        bind:date={issueDateInput}
        bind:operator={issueDateOperator}
        operators={ISSUE_DATE_OPERATORS}
        inputClass="filter-input text-black"
        selectClass="filter-select text-black"
        inputId="issue-date-input"
      />
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

  // .filter-input / .filter-select are used both directly in this template
  // and passed through into IdentifierFilter (Phase 2 of #226). The
  // IdentifierFilter-rendered nodes live in a child component scope, so
  // Svelte would scope-strip the unprefixed selector. The :global rules
  // below match either case while the parent selector keeps blast radius
  // confined to /data/securities's filter UI (catalog also uses the same
  // class names with its own scoped styles).
  :global(.security-select-container .filter-input),
  :global(.security-select-container .filter-select) {
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

  :global(.security-select-container .filter-select:disabled) {
    background-color: #f0f0f0;
    color: $grey;
    cursor: not-allowed;
  }
</style>
