<script lang="ts">
  import MultiSelect from "svelte-multiselect";
  import { MeasureProto } from "@fintekkers/ledger-models/node/fintekkers/models/position/measure_pb";
  import { FieldProto } from "@fintekkers/ledger-models/node/fintekkers/models/position/field_pb";
  import { PositionTypeProto, PositionViewProto } from "@fintekkers/ledger-models/node/fintekkers/models/position/position_pb";

  import { goto } from "$lib/helper";
  import { onMount } from "svelte";

  let isCheckboxChecked = false;
  let isPositionTypeSelected = false;
  let isPositionViewSelected = false;

  export let selectedRows: string[] = [];
  export let selectedColumns: string[] = [];
  export let selectedMeasures: string[] = [];
  export let selectedPositionType: string[] = [];
  export let selectedPositionView: string[] = [];
  let isButtonDisabled = false;

  function updateButtonState() {
    isCheckboxChecked = selectedRows.length > 0 && selectedColumns.length > 0;
    isPositionTypeSelected = selectedPositionType.length > 0;
    isPositionViewSelected = selectedPositionView.length > 0;
    isButtonDisabled = !isCheckboxChecked || !isPositionTypeSelected || !isPositionViewSelected;
  }

  function formatName(name: string) {
    return name
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  }

  function unformatName(name: string) {
    return name.toUpperCase().replace(/\s+/g, "_");
  }

  function fetchPositions() {
    const selectedRowsString = selectedRows.map(unformatName).join(",");
    const selectedColumnsString = selectedColumns.map(unformatName).join(",");
    const selectedMeasuresString = selectedMeasures.map(unformatName).join(",");

    const unformattedPositionView = selectedPositionView.map(unformatName);
    const unformattedPositionType = selectedPositionType.map(unformatName);

    goto(
      `/data/positions?positionView=${unformattedPositionView}&positionType=${unformattedPositionType}&rows=${selectedRowsString}&columns=${selectedColumnsString}&measures=${selectedMeasuresString}`
    );
  }

  function loadSelectedValues() {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const selectedRowsFromUrl = urlParams.get("rows");
      const selectedColumnsFromUrl = urlParams.get("columns");
      const selectedMeasuresFromUrl = urlParams.get("measures");
      const selectedPositionTypeFromUrl = urlParams.get("positionType");
      const selectedPositionViewFromUrl = urlParams.get("positionView");

      if (selectedRowsFromUrl) {
        selectedRows = selectedRowsFromUrl.split(",").map(formatName);
      }

      if (selectedColumnsFromUrl) {
        selectedColumns = selectedColumnsFromUrl.split(",").map(formatName);
      }

      if (selectedMeasuresFromUrl) {
        selectedMeasures = selectedMeasuresFromUrl.split(",").map(formatName);
      }

      if (selectedPositionTypeFromUrl) {
        selectedPositionType = selectedPositionTypeFromUrl.split(",").map(formatName);
      }

      if (selectedPositionViewFromUrl) {
        selectedPositionView = selectedPositionViewFromUrl.split(",").map(formatName);
      }
    }
  }

  loadSelectedValues();

  onMount(updateButtonState);
  $: updateButtonState();

  $: isButtonDisabled;
</script>

<div class="position-grid gap-4 mb-4 ml-6">
  <div class="position-select-container flex flex-col sm:flex-row gap-3">
    <div class="text-black">
      <h4>Rows: </h4>
      <MultiSelect
        id="rows-multiselect"
        options={Object.keys(FieldProto).map(formatName)}
        placeholder="Select rows..."
        bind:selected={selectedRows}
      />
    </div>
    <div class="text-black">
      <h4>Columns:</h4>
      <MultiSelect
        id="columns-multiselect"
        options={Object.keys(FieldProto).map(formatName)}
        placeholder="Select columns..."
        bind:selected={selectedColumns}
      />
    </div>
    <div class="text-black">
      <h4>Measures:</h4>
      <MultiSelect
        id="measures-multiselect"
        options={Object.keys(MeasureProto).map(formatName)}
        placeholder="Select measures..."
        bind:selected={selectedMeasures}
      />
    </div>
    <div class="text-black">
      <h4>Position Type:</h4>
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

    <div class="text-black">
      <h4>Position View:</h4>
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

<button
  class="py-2 px-6 text-white border border-gray-500 position-button"
  on:click={fetchPositions}
>
  Fetch position
</button>

<style lang="scss">
  @import "../../style.scss";
  .position-grid {
    margin: 10px 40px;
    width: 100%;
  }

  select {
    padding: 5px;
    width: 200px;
    cursor: pointer;
    border-radius: 10px;
  }
  .position-select-container {
  }

  label {
    font-size: 20px;
    font-weight: 300;
  }

  h4 {
    margin: 10px 0;
  }

  input[type="checkbox"] {
    margin-right: 0.5rem;
  }

  .selected-item {
    padding: 0.5rem;
    border-radius: 4px;
  }

  .position-button {
    background: $primary-color;
    padding: 10px 20px;
    margin: 0 40px;
    border-radius: 10px;
  }
</style>
