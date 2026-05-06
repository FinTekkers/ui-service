<script lang="ts">
  import MultiSelect from "svelte-multiselect";

  import pkg from "@fintekkers/ledger-models/node/fintekkers/models/position/field_pb.js";
  import measure_pkg from "@fintekkers/ledger-models/node/fintekkers/models/position/measure_pb.js";
  import position_pkg from "@fintekkers/ledger-models/node/fintekkers/models/position/position_pb.js";
  import { onMount } from "svelte";
  import { buildFilterUrl } from "$lib/filters/urlState";
  import IdentifierFilter from "../filters/IdentifierFilter.svelte";
  // Browser-safe import (security.ts pulls in @grpc/grpc-js).
  import {
    IDENTIFIER_TYPE_NAMES,
    type IdentifierTypeName,
  } from "$lib/securityFilterTypes";

  const { FieldProto } = pkg;

  const { MeasureProto } = measure_pkg;

  const VALUATION_ONLY_MEASURES = new Set([
    'PRESENT_VALUE_CASHFLOWS',
    'PRESENT_VALUE',
    'REAL_YIELD',
    'INFLATION_ADJUSTED_PRINCIPAL',
    'DISCOUNT_MARGIN',
    'SPREAD_DURATION',
  ]);

  const positionMeasureOptions = Object.keys(MeasureProto)
    .filter(k => !VALUATION_ONLY_MEASURES.has(k))
    .map(formatName);

  const { PositionTypeProto, PositionViewProto } = position_pkg;

  let isCheckboxChecked = false;

  let isPositionTypeSelected = false;
  let isPositionViewSelected = false;

  export let selectedFields: string[] = [];
  export let selectedMeasures: string[] = [];
  export let selectedPositionType: string[] = ["Transaction"];
  export let selectedPositionView: string[] = ["Default View"];

  // Phase 3 of second-brain#226 (issue #227): identifier UX uses the shared
  // IdentifierFilter primitive. Was CUSIP-only (cusipInput + ?cusip=...);
  // now matches /data/securities and /data/prices.
  let identifierInput: string = "";
  let identifierType: IdentifierTypeName = "CUSIP";
  let tradeDateInput: string = "";
  let tradeDateOperator:
    | "greater_than"
    | "lesser_than"
    | "lesser_than_or_equals"
    | "" = "";
  let assetClassInput: string = "";
  let hideZeros: boolean = false;

  // Function to format names for display
  function formatName(name: string) {
    return name
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  }

  // Function to unformat names for URL parameters
  function unformatName(name: string) {
    return name.toUpperCase().replace(/\s+/g, "_");
  }

  function fetchPositions() {
    if (typeof window === "undefined") return;

    const trimmedTradeDate = tradeDateInput.trim();
    // tradeDate and its operator are a coupled pair: only emit one if the
    // other is also set, otherwise the page-server filter is half-applied.
    const tradeDateOverride =
      trimmedTradeDate && tradeDateOperator ? trimmedTradeDate : undefined;
    const tradeDateOperatorOverride =
      trimmedTradeDate && tradeDateOperator ? tradeDateOperator : undefined;

    // identifier + identifierType form the same coupled pair as tradeDate +
    // tradeDateOperator: a type without a value is meaningless on the URL.
    const trimmedIdentifier = identifierInput.trim();

    const url = buildFilterUrl(
      "/data/positions",
      new URLSearchParams(window.location.search),
      {
        positionView: selectedPositionView.map(unformatName).join(","),
        positionType: selectedPositionType.map(unformatName).join(","),
        fields: selectedFields.map(unformatName).join(","),
        measures: selectedMeasures.map(unformatName).join(","),
        identifier: trimmedIdentifier || undefined,
        identifierType: trimmedIdentifier ? identifierType : undefined,
        // No legacy ?cusip= override needed: buildFilterUrl only carries
        // forward keys in inheritKeys (just portfolioId), so a stale
        // ?cusip= bookmark naturally disappears on re-submit.
        tradeDate: tradeDateOverride,
        tradeDateOperator: tradeDateOperatorOverride,
        assetClass: assetClassInput.trim() || undefined,
        hideZeros: hideZeros ? "true" : undefined,
      },
      // Inherit portfolioId so re-submitting the form keeps the search
      // scoped to the portfolio the user navigated in from (second-brain#220
      // / PR #123). The list of inheritKeys is the only place this rule
      // lives now — adding more ambient context in future is one-line.
      ["portfolioId"],
    );

    window.location.href = url;
  }

  // Add this function to load selected values from local storage
  function loadSelectedValues() {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const selectedFieldsFromUrl = urlParams.get("fields");
      const selectedMeasuresFromUrl = urlParams.get("measures");
      const selectedPositionTypeFromUrl = urlParams.get("positionType");
      const selectedPositionViewFromUrl = urlParams.get("positionView");
      const identifierFromUrl = urlParams.get("identifier");
      const identifierTypeFromUrl = urlParams.get("identifierType");
      const legacyCusipFromUrl = urlParams.get("cusip");
      const tradeDateFromUrl = urlParams.get("tradeDate");
      const tradeDateOperatorFromUrl = urlParams.get("tradeDateOperator");
      const assetClassFromUrl = urlParams.get("assetClass");

      if (selectedFieldsFromUrl) {
        selectedFields = selectedFieldsFromUrl.split(",").map(formatName);
      }

      if (selectedMeasuresFromUrl) {
        selectedMeasures = selectedMeasuresFromUrl.split(",").map(formatName);
      }

      if (selectedPositionTypeFromUrl) {
        selectedPositionType = selectedPositionTypeFromUrl
          .split(",")
          .map(formatName);
      }

      if (selectedPositionViewFromUrl) {
        selectedPositionView = selectedPositionViewFromUrl
          .split(",")
          .map(formatName);
      }

      // Identifier load order: canonical (?identifier=…&identifierType=…)
      // wins; fall back to the legacy ?cusip=… bookmark and pin the type
      // to CUSIP. The page-server emits a deprecation warning when it
      // sees the legacy shape, so users still get a signal.
      if (identifierFromUrl) {
        identifierInput = identifierFromUrl;
        if (
          identifierTypeFromUrl &&
          (IDENTIFIER_TYPE_NAMES as readonly string[]).includes(identifierTypeFromUrl)
        ) {
          identifierType = identifierTypeFromUrl as IdentifierTypeName;
        }
      } else if (legacyCusipFromUrl) {
        identifierInput = legacyCusipFromUrl;
        identifierType = "CUSIP";
      }

      if (tradeDateFromUrl) {
        tradeDateInput = tradeDateFromUrl;
      }

      if (
        tradeDateOperatorFromUrl &&
        (tradeDateOperatorFromUrl === "greater_than" ||
          tradeDateOperatorFromUrl === "lesser_than" ||
          tradeDateOperatorFromUrl === "lesser_than_or_equals")
      ) {
        tradeDateOperator = tradeDateOperatorFromUrl as
          | "greater_than"
          | "lesser_than"
          | "lesser_than_or_equals";
      }

      if (assetClassInput) {
        assetClassInput = assetClassFromUrl;
      }

      if (urlParams.get("hideZeros") === "true") {
        hideZeros = true;
      }
    }
  }

  // Call loadSelectedValues on component mount
  loadSelectedValues();
</script>

<div class="mt-14 mx-10 w-full gap-2">
  <div class="position-select-container flex flex-col sm:flex-row gap-2">
    <div class="text-white">
      <h4>Fields:</h4>
      <div class="multiselect-wrapper text-black">
        <MultiSelect
          id="fields-multiselect"
          options={Object.keys(FieldProto).map(formatName)}
          placeholder="Select fields..."
          bind:selected={selectedFields}
        />
      </div>
    </div>
    <div class="text-white">
      <h4>Measures:</h4>
      <div class="multiselect-wrapper text-black">
        <MultiSelect
          id="measures-multiselect"
          options={positionMeasureOptions}
          placeholder="Select measures..."
          bind:selected={selectedMeasures}
        />
      </div>
    </div>
    <div class="text-white">
      <h4>Position Type:</h4>
      <div class="multiselect-wrapper text-black">
        <MultiSelect
          id="position-type-multiselect"
          options={Object.keys(PositionTypeProto)
            .filter((key) => key !== "UNKNOWN_POSITION_TYPE")
            .map(formatName)}
          placeholder="Select position type..."
          bind:selected={selectedPositionType}
          maxSelect={1}
        />
      </div>
    </div>

    <div class="text-white">
      <h4>Position View:</h4>
      <div class="multiselect-wrapper text-black">
        <MultiSelect
          id="position-view-multiselect"
          options={Object.keys(PositionViewProto)
            .filter((key) => key !== "UNKNOWN_POSITION_VIEW")
            .map(formatName)}
          placeholder="Select position view..."
          bind:selected={selectedPositionView}
          maxSelect={1}
        />
      </div>
    </div>
  </div>
  <div class="position-select-container flex flex-col sm:flex-row gap-2 mt-2">
    <div class="text-white identifier-filter-cell">
      <h4>Identifier:</h4>
      <IdentifierFilter
        bind:identifierType
        bind:identifier={identifierInput}
        selectClass="position-select-input text-black"
        inputClass="position-select-input text-black"
        inputId="position-identifier-input"
      />
    </div>
    <div class="text-white">
      <h4>Trade Date Filter:</h4>
      <input
        type="date"
        id="trade-date-input"
        bind:value={tradeDateInput}
        class="trade-date-input text-black"
      />
    </div>
    <div class="text-white">
      <h4>Operator:</h4>
      <select
        id="trade-date-operator"
        bind:value={tradeDateOperator}
        class="trade-date-operator text-black"
        disabled={!tradeDateInput}
      >
        <option value="">Select operator...</option>
        <option value="greater_than">Greater Than</option>
        <option value="lesser_than">Lesser Than</option>
        <option value="lesser_than_or_equals">Lesser Than or Equal</option>
      </select>
    </div>
    <div class="text-white">
      <h4>Asset Class:</h4>
      <input
        type="text"
        id="asset-class-input"
        placeholder="Enter Asset Class..."
        bind:value={assetClassInput}
        class="asset-class-input text-black"
      />
    </div>
    <div class="text-white flex items-end">
      <button class="position-button" on:click={fetchPositions} disabled={null}>
        Fetch position
      </button>
    </div>
  </div>
  <div class="px-10 mt-2">
    <label class="inline-flex items-center cursor-pointer">
      <input
        type="checkbox"
        bind:checked={hideZeros}
        class="form-checkbox h-4 w-4 text-green-600"
      />
      <span class="ml-2 text-white">Hide zeros</span>
    </label>
  </div>
</div>

<style lang="scss">
  @import "../../styles/_shared.scss";

  h4 {
    margin: 4px 0;
    font-size: 0.875rem; /* 14px - smaller size */
  }

  .position-button {
    background-color: $success;
    color: $bgc-color; /* Dark text for contrast against light green */
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

    &:disabled {
      background-color: #ccc;
      color: #666;
      cursor: not-allowed;
      transform: none;
      box-shadow: none;
    }
  }

  .trade-date-input,
  .trade-date-operator,
  .asset-class-input {
    padding: 4px 10px;
    border: 1px solid #ccc;
    border-radius: 4px;
    width: 100%;
    font-size: 0.875rem; /* 14px - smaller size to match */
    height: 38px; /* Matched to typical multiselect height if possible, or adequate size */
    box-sizing: border-box;
    background-color: white; /* Ensure white background */
  }

  // .position-select-input is passed via selectClass / inputClass into
  // IdentifierFilter (Phase 3 of #226). The component renders those
  // classes onto its <select> and <input>, but those nodes live in a
  // child component scope, so Svelte's scoped CSS would drop the rule
  // as unused. :global keeps it applying; the .position-select-container
  // ancestor confines blast radius to PositionSelect's tree.
  :global(.position-select-container .position-select-input) {
    padding: 4px 10px;
    border: 1px solid #ccc;
    border-radius: 4px;
    width: 100%;
    font-size: 0.875rem;
    height: 38px;
    box-sizing: border-box;
    background-color: white;
  }

  .trade-date-operator {
    font-size: 0.875rem !important; /* Ensure select text matches input size */
  }

  .trade-date-operator:disabled {
    background-color: #f0f0f0;
    cursor: not-allowed;
  }

  /* Override styles for MultiSelect to ensure readability */
  :global(.multiselect-wrapper .multiselect) {
    background-color: white !important;
    color: black !important;
    border: 1px solid #ccc;
    border-radius: 4px;
  }
</style>
