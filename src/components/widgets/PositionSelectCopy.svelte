<!-- components/widgets/PositionSelect.svelte -->
<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import { MeasureProto } from "@fintekkers/ledger-models/node/fintekkers/models/position/measure_pb";
    import { FieldProto } from "@fintekkers/ledger-models/node/fintekkers/models/position/field_pb";
  
    export let positions: any[]; // Define a prop to receive positions data
  
    const dispatch = createEventDispatcher();
  
    let selectedFields: any[] = [];
    let selectedMeasures: any[] = [];
  
    // Function to handle fetching position data
    const fetchPositionData = () => {
      // Check if both fields and measures are selected
      if (selectedFields.length > 0 && selectedMeasures.length > 0) {
        // Dispatch an event with selected fields and measures
        dispatch("fetch", { fields: selectedFields, measures: selectedMeasures });
      } else {
        console.error("Please select both fields and measures.");
        // You can handle the error or provide feedback to the user here
      }
    };
  
    function formatDollar(number: number) {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(number);
    }
  
    function formatDate(dateString: string) {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US");
    }
  
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
    <!-- <div class="selections w-full h-[250px] overflow-auto flex flex-col gap-2 sm:gap-8">
      <div class="">
        {#if selectedFields.length > 0}
          <div class="selected-items text-black">
            <h4>Selected Fields:</h4>
            <div class="flex gap-4 w-[100px]">
              {#each selectedFields as field}
                <div
                  class="selected-item text-black bg-gray-300 flex items-center justify-center gap-3"
                >
                  <span class="text-sm">{field}</span>
                  <button on:click={() => toggleSelectedField(field)} class="cancel bg-gray-700 rounded-full text-white">x</button>
                </div>
              {/each}
            </div>
          </div>
        {/if}
      </div>
      <div class="">
        {#if selectedMeasures.length > 0}
          <div class="selected-items text-black">
            <h4 class="">Selected Measures:</h4>
            <div class="flex gap-4 w-full">
              {#each selectedMeasures as measure}
                <div
                  class="selected-item text-black bg-gray-300 flex items-center justify-center gap-3"
                >
                  <span class="text-sm">{measure}</span>
                  <button on:click={() => toggleSelectedMeasure(measure)} class="cancel bg-gray-700 rounded-full text-white">x</button>
                </div>
              {/each}
            </div>
          </div>
        {/if}
      </div>
    </div> -->
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
  