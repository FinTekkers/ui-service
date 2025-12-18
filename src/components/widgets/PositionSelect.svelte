<script lang="ts">
  import MultiSelect from "svelte-multiselect";

  import pkg from "@fintekkers/ledger-models/node/fintekkers/models/position/field_pb.js";
  import measure_pkg from "@fintekkers/ledger-models/node/fintekkers/models/position/measure_pb.js";
  import position_pkg from "@fintekkers/ledger-models/node/fintekkers/models/position/position_pb.js";
  import { onMount } from "svelte";

  const { FieldProto } = pkg;

  const { MeasureProto } = measure_pkg;

  const { PositionTypeProto, PositionViewProto } = position_pkg;

  let isCheckboxChecked = false;

  let isPositionTypeSelected = false;
  let isPositionViewSelected = false;

  export let selectedFields: string[] = [];
  export let selectedMeasures: string[] = [];
  export let selectedPositionType: string[] = ["Transaction"];
  export let selectedPositionView: string[] = ["Default View"];

  let cusipInput: string = "";
  let tradeDateInput: string = "";
  let tradeDateOperator: "greater_than" | "lesser_than" | "" = "";
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
    const selectedFieldsString = selectedFields.map(unformatName).join(",");
    const selectedMeasuresString = selectedMeasures.map(unformatName).join(",");

    // Unformat selected position view and type
    const unformattedPositionView = selectedPositionView.map(unformatName);
    const unformattedPositionType = selectedPositionType.map(unformatName);

    let url = `/data/positions?positionView=${unformattedPositionView}&positionType=${unformattedPositionType}&fields=${selectedFieldsString}&measures=${selectedMeasuresString}`;

    // Add CUSIP to URL if provided
    if (cusipInput && cusipInput.trim() !== "") {
      url += `&cusip=${encodeURIComponent(cusipInput.trim())}`;
    }

    // Add TRADE_DATE filter to URL if provided
    if (tradeDateInput && tradeDateInput.trim() !== "" && tradeDateOperator) {
      url += `&tradeDate=${encodeURIComponent(tradeDateInput.trim())}`;
      url += `&tradeDateOperator=${encodeURIComponent(tradeDateOperator)}`;
    }

    // Add ASSET_CLASS filter to URL if provided
    if (assetClassInput && assetClassInput.trim() !== "") {
      url += `&assetClass=${encodeURIComponent(assetClassInput.trim())}`;
    }

    // Add hideZeros filter to URL
    if (hideZeros) {
      url += `&hideZeros=true`;
    }

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
      const cusipFromUrl = urlParams.get("cusip");
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

      if (cusipFromUrl) {
        cusipInput = cusipFromUrl;
      }

      if (tradeDateFromUrl) {
        tradeDateInput = tradeDateFromUrl;
      }

      if (
        tradeDateOperatorFromUrl &&
        (tradeDateOperatorFromUrl === "greater_than" ||
          tradeDateOperatorFromUrl === "lesser_than")
      ) {
        tradeDateOperator = tradeDateOperatorFromUrl as
          | "greater_than"
          | "lesser_than";
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
          options={Object.keys(MeasureProto).map(formatName)}
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
    <div class="text-white">
      <h4>CUSIP:</h4>
      <input
        type="text"
        id="cusip-input"
        placeholder="Enter CUSIP..."
        bind:value={cusipInput}
        class="cusip-input text-black"
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
  @import "../../style.scss";

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

  .cusip-input,
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
