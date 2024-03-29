<!-- components/widgets/PositionSelect.svelte -->
<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { MeasureProto } from "@fintekkers/ledger-models/node/fintekkers/models/position/measure_pb";
  import { FieldProto } from "@fintekkers/ledger-models/node/fintekkers/models/position/field_pb";
  import { FetchPosition } from "$lib/positions";

  let positions: any[];

  let selectedFields: any[] = [];
  let selectedMeasures: any[] = [];

  // Function to handle fetching position data
  const fetchPositionData = async () => {
    // Check if both fields and measures are selected
    if (selectedFields.length > 0 && selectedMeasures.length > 0) {
      try {
        // Call the FetchPosition function and pass selectedFields and selectedMeasures
        const positionsData = await FetchPosition(selectedFields, selectedMeasures);
        console.log('Position data:', positionsData);
        // Further processing...
      } catch (error) {
        console.error('Error fetching position data:', error);
        // Handle error...
      }
    } else {
      console.error('Please select both fields and measures.');
      // Handle error or provide feedback to the user...
    }
  };

  // Function to toggle selection of a field
  function toggleSelectedField(key: string) {
    if (selectedFields.includes(key)) {
      selectedFields = selectedFields.filter((field) => field !== key);
    } else {
      selectedFields = [...selectedFields, key];
    }
  }

  // Function to toggle selection of a measure
  function toggleSelectedMeasure(key: string) {
    if (selectedMeasures.includes(key)) {
      selectedMeasures = selectedMeasures.filter((measure) => measure !== key);
    } else {
      selectedMeasures = [...selectedMeasures, key];
    }
  }
</script>

<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
  on:click={fetchPositionData}
  class="py-2 px-6 text-white border border-gray-500 position-button"
  >Fetch position</button
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
