<!-- components/widgets/PositionSelect.svelte -->
<script lang="ts">
  import { MeasureProto } from "@fintekkers/ledger-models/node/fintekkers/models/position/measure_pb";
  import { FieldProto } from "@fintekkers/ledger-models/node/fintekkers/models/position/field_pb";
  import { goto } from "$lib/helper";

  export let selectedFields: any[] = [];
  export let selectedMeasures: any[] = [];

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
      `/data/positions?fields=${selectedFieldsString}&measures=${selectedMeasuresString}`
    );
  }

  // Add this function to load selected values from local storage
  function loadSelectedValues() {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const selectedFieldsFromUrl = urlParams.get("fields");
      const selectedMeasuresFromUrl = urlParams.get("measures");

      if (selectedFieldsFromUrl) {
        selectedFields = selectedFieldsFromUrl.split(",");
      }

      if (selectedMeasuresFromUrl) {
        selectedMeasures = selectedMeasuresFromUrl.split(",");
      }
    }
  }
  // Call loadSelectedValues on component mount
  loadSelectedValues();
</script>

<div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
  <div class="position-select-container flex flex-col sm:flex-row gap-3">
    <div class="text-black">
      <h4>Fields:</h4>
      <div class="h-48 overflow-auto w-[300px]">
        {#each Object.entries(FieldProto) as [key, value]}
          <label>
            <input
              type="checkbox"
              checked={selectedFields.includes(key)}
              on:change={() => toggleSelectedField(key)}
            />
            {key}
          </label>
        {/each}
      </div>
    </div>
    <div class="text-black">
      <h4>Measures:</h4>
      {#each Object.entries(MeasureProto) as [key, value]}
        <label>
          <input
            type="checkbox"
            checked={selectedMeasures.includes(key)}
            on:change={() => toggleSelectedMeasure(key)}
          />
          {key}
        </label>
      {/each}
    </div>
  </div>
</div>

<button
  class="py-2 px-6 text-white border border-gray-500 position-button"
  on:click={fetchPositions}>Fetch position</button
>

<style lang="scss">
  @import "../../style.scss";
  .position-select-container {
    margin: 10px;
    // gap: 1rem;
    // width: 1000px;
    // margin: 20px auto;
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
    margin: 0 10px;
    border-radius: 10px;
  }

  .selections {
    // padding: 0 40px;
    margin: 10px;
  }

  .cancel {
    padding: 2px 10px;
  }
</style>
