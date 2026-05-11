<script lang="ts">
  import { onMount } from "svelte";
  import { buildFilterUrl } from "$lib/filters/urlState";
  // Browser-safe import (security.ts pulls in @grpc/grpc-js which crashes
  // in the client bundle).
  import {
    PRODUCT_TYPE_NAMES,
    ASSET_CLASS_NAMES,
    INSTRUMENT_TYPE_NAMES,
    type IdentifierTypeName,
    type ProductTypeName,
    type AssetClassName,
    type InstrumentTypeName,
  } from "$lib/securityFilterTypes";
  import IdentifierFilter from "../filters/IdentifierFilter.svelte";
  import ProductTypeFilter from "../filters/ProductTypeFilter.svelte";
  import AssetClassFilter from "../filters/AssetClassFilter.svelte";
  import InstrumentTypeFilter from "../filters/InstrumentTypeFilter.svelte";
  import DateFilter from "../filters/DateFilter.svelte";

  // M5 / #260: SecurityType → ProductType rename. The pre-M5
  // ?securityType= URL key is gone; new key is ?productType=.
  // AssetClassFilter is now tree-aware (selecting FIXED_INCOME matches
  // descendants RATES + CREDIT via the page-server). New
  // InstrumentTypeFilter primitive surfaces the CASH / DERIVATIVE /
  // REFERENCE_INDEX dimension. No legacy URL shim — clean-slate
  // migration per #256 (Postgres data already wiped in M2).

  let identifierInput: string = "";
  let identifierType: IdentifierTypeName = "CUSIP";
  // Phase 3 PR-B of #226: issueDate UX uses the shared DateFilter
  // primitive. Dropdown shows the full PositionFilterOperator set
  // (post-#229 review): the security search backend supports every
  // operator, so the UI exposes every operator.
  let issueDateInput: string = "";
  let issueDateOperator: string = "";
  let assetClassInput: AssetClassName | "" = "";
  let issuerNameInput: string = "";
  let productTypeInput: ProductTypeName | "" = "";
  let instrumentTypeInput: InstrumentTypeName | "" = "";

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
        productType: productTypeInput || undefined,
        instrumentType: instrumentTypeInput || undefined,
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

    // Operator passes through untransformed — the wrapper validates
    // at filter-application time (#229 review: no UI-side normalization).
    const opFromUrl = urlParams.get("issueDateOperator");
    if (opFromUrl) {
      issueDateOperator = opFromUrl;
    }

    const assetClassFromUrl = urlParams.get("assetClass");
    if (assetClassFromUrl !== null && assetClassFromUrl !== "") {
      // M5 / #260: hierarchy-tree names sourced from
      // product_hierarchy.allAssetClasses(). Unknown values drop to
      // empty (clean-slate migration; no legacy free-form shim).
      if ((ASSET_CLASS_NAMES as readonly string[]).includes(assetClassFromUrl)) {
        assetClassInput = assetClassFromUrl as AssetClassName;
      }
    }

    const issuerNameFromUrl = urlParams.get("issuerName");
    if (issuerNameFromUrl !== null) issuerNameInput = issuerNameFromUrl;

    const productTypeFromUrl = urlParams.get("productType");
    if (productTypeFromUrl && (PRODUCT_TYPE_NAMES as readonly string[]).includes(productTypeFromUrl)) {
      productTypeInput = productTypeFromUrl as ProductTypeName;
    }

    const instrumentTypeFromUrl = urlParams.get("instrumentType");
    if (instrumentTypeFromUrl && (INSTRUMENT_TYPE_NAMES as readonly string[]).includes(instrumentTypeFromUrl)) {
      instrumentTypeInput = instrumentTypeFromUrl as InstrumentTypeName;
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
      <h4>Product Type:</h4>
      <ProductTypeFilter
        bind:value={productTypeInput}
        selectClass="filter-select text-black"
        selectId="product-type-select"
      />
    </div>
  </div>
  <div class="security-select-container flex flex-col sm:flex-row gap-2 mt-2">
    <div class="text-white">
      <h4>Instrument Type:</h4>
      <InstrumentTypeFilter
        bind:value={instrumentTypeInput}
        selectClass="filter-select text-black"
        selectId="instrument-type-select"
      />
    </div>
    <div class="text-white issue-date-filter-cell">
      <h4>Issue Date Filter:</h4>
      <DateFilter
        bind:date={issueDateInput}
        bind:operator={issueDateOperator}
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
