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
  export let selectedPositionType: string[] = [];
  export let selectedPositionView: string[] = [];

  let isButtonDisabled = false; // Define isButtonDisabled variable

  // Function to update the disabled state of the button based on validation conditions
  function updateButtonState() {
    isCheckboxChecked =
      selectedFields.length > 0 && selectedMeasures.length > 0;
    isPositionTypeSelected = selectedPositionType.length > 0;
    isPositionViewSelected = selectedPositionView.length > 0;

    // Disable button if any of the multiselects are empty or have less than one selected item
    isButtonDisabled =
      !isCheckboxChecked || !isPositionTypeSelected || !isPositionViewSelected;
  }

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

    window.location.href = `/data/positions?positionView=${unformattedPositionView}&positionType=${unformattedPositionType}&fields=${selectedFieldsString}&measures=${selectedMeasuresString}`;
  }

  // Add this function to load selected values from local storage
  function loadSelectedValues() {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const selectedFieldsFromUrl = urlParams.get("fields");
      const selectedMeasuresFromUrl = urlParams.get("measures");
      const selectedPositionTypeFromUrl = urlParams.get("positionType");
      const selectedPositionViewFromUrl = urlParams.get("positionView");

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
    }
  }

  // Call loadSelectedValues on component mount
  loadSelectedValues();

  // Call updateButtonState on component mount and whenever any relevant data changes
  onMount(updateButtonState);
  $: updateButtonState();

  // Reactive declaration to update button state whenever relevant data changes
  $: isButtonDisabled;
</script>

<div class="my-2.5 mx-10 w-full gap-4">
  <div class="position-select-container flex flex-col sm:flex-row gap-3">
    <div class="text-black">
      <h4>Fields:</h4>
      <MultiSelect
        id="fields-multiselect"
        options={Object.keys(FieldProto).map(formatName)}
        placeholder="Select fields..."
        bind:selected={selectedFields}
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
  class="text-white border border-gray-500 position-button"
  on:click={fetchPositions}
>
  Fetch position
</button>

<style lang="scss">
  @import "../../style.scss";

  h4 {
    margin: 10px 0;
  }

  .position-button {
    background: $primary-color;
    padding: 10px 20px;
    margin: 0 40px;
    border-radius: 10px;
  }
</style>
