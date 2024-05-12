<!-- components/widgets/PositionSelect.svelte -->
<script lang="ts">
  import MultiSelect from 'svelte-multiselect';
  import { MeasureProto } from "@fintekkers/ledger-models/node/fintekkers/models/position/measure_pb";
  import { FieldProto } from "@fintekkers/ledger-models/node/fintekkers/models/position/field_pb";
  import {
    PositionTypeProto,
    PositionViewProto,
  } from "@fintekkers/ledger-models/node/fintekkers/models/position/position_pb";

  import { goto } from "$lib/helper";
  import { onMount } from "svelte";

  let isCheckboxChecked = false;

  let isPositionTypeSelected = false;
  let isPositionViewSelected = false;

  export let selectedFields: any[] = [];
  export let selectedMeasures: any[] = [];
  export let selectedPositionType = "";
  export let selectedPositionView = "";

  // Function to update the disabled state of the button based on validation conditions
  function updateButtonState() {
    const isAnyCheckboxChecked =
      selectedFields.length > 0 && selectedMeasures.length > 0;
    isCheckboxChecked = isAnyCheckboxChecked;
    isPositionTypeSelected = selectedPositionType !== "";
    isPositionViewSelected = selectedPositionView !== "";
  }

  function toggleSelectedPositionType(e: Event) {
    const target = e.target;
    if (target instanceof HTMLSelectElement) {
      selectedPositionType = target.value;
    }
  }

  function toggleSelectedPositionView(e: Event) {
    const target = e.target;
    if (target instanceof HTMLSelectElement) {
      selectedPositionView = target.value;
    }
  }

  function toggleSelectedField(key: string) {
    if (selectedFields.includes(key)) {
      selectedFields = selectedFields.filter((field) => field !== key);
    } else {
      selectedFields = [...selectedFields, key];
    }
  }

  function toggleSelectedMeasure(key: string) {
    if (selectedMeasures.includes(key)) {
      selectedMeasures = selectedMeasures.filter((measure) => measure !== key);
    } else {
      selectedMeasures = [...selectedMeasures, key];
    }
  }

  function fetchPositions() {
    const selectedFieldsString = selectedFields.join(",");
    const selectedMeasuresString = selectedMeasures.join(",");

    goto(
      `/data/positions?positionView=${selectedPositionView}&positionType=${selectedPositionType}&fields=${selectedFieldsString}&measures=${selectedMeasuresString}`
    );
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
        selectedFields = selectedFieldsFromUrl.split(",");
      }

      if (selectedMeasuresFromUrl) {
        selectedMeasures = selectedMeasuresFromUrl.split(",");
      }

      if (selectedPositionTypeFromUrl) {
        selectedPositionType = selectedPositionTypeFromUrl;
      }

      if (selectedPositionViewFromUrl) {
        selectedPositionView = selectedPositionViewFromUrl;
      }
    }
  }
  // Call loadSelectedValues on component mount
  loadSelectedValues();

  function formatName(fieldName: string) {
    return fieldName
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  }

  // Call updateButtonState on component mount and whenever any relevant data changes
  onMount(updateButtonState);
  $: updateButtonState();

  // Reactive declaration to update button state whenever relevant data changes
  $: {
    isCheckboxChecked =
      selectedFields.length > 0 && selectedMeasures.length > 0;
    isPositionTypeSelected = selectedPositionType !== "";
    isPositionViewSelected = selectedPositionView !== "";
  }
</script>

<div class="position-grid gap-4 mb-4 ml-6">
  <div class="position-select-container flex flex-col sm:flex-row gap-3">
    <div class="text-black">
      <h4>Fields:</h4>
      <MultiSelect
        id="fields-multiselect"
        options={Object.keys(FieldProto)}
        placeholder="Select fields..."
        bind:selected={selectedFields}
      />
    </div>
    <div class="text-black">
      <h4>Measures:</h4>
      <MultiSelect
        id="measures-multiselect"
        options={Object.keys(MeasureProto)}
        placeholder="Select measures..."
        bind:selected={selectedMeasures}
      />
    </div>
    <div class="text-black">
      <h4>Position Type:</h4>
      <select
        class=""
        on:change={(e) => toggleSelectedPositionType(e)}
        value={selectedPositionType}
      >
        <option selected disabled value="">Select position type</option>
        {#each Object.entries(PositionTypeProto) as [key, value]}
          {#if key !== "UNKNOWN_POSITION_TYPE"}
            <option value={key}>{formatName(key)}</option>
          {/if}
        {/each}
      </select>
    </div>

    <div class="text-black">
      <h4>Position View:</h4>
      <select
        class=""
        on:change={(e) => toggleSelectedPositionView(e)}
        value={selectedPositionView}
      >
        <option selected disabled value="">Select position view</option>
        {#each Object.entries(PositionViewProto) as [key, value]}
          {#if key !== "UNKNOWN_POSITION_VIEW"}
            <option value={key}>{formatName(key)}</option>
          {/if}
        {/each}
      </select>
    </div>
  </div>
</div>

<button
  class="py-2 px-6 text-white border border-gray-500 position-button"
  on:click={fetchPositions}
  disabled={!isCheckboxChecked ||
    !isPositionTypeSelected ||
    !isPositionViewSelected}>Fetch position</button
>

<style lang="scss">
  @import "../../style.scss";
  .position-grid {
    margin: 10px 40px;
    width: 100%;
  }

  select {
    padding: 5px;
    width: 200px;
    // border: 1px solid gray;
    cursor: pointer;
    border-radius: 10px;
  }
  .position-select-container {
    // margin: 10px 40px;
    // gap: 1rem;
    // width: 1000px;
    // margin: 20px auto;
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
