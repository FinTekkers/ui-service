<!-- components/widgets/PositionSelect.svelte -->
<script lang="ts">
  import { createEventDispatcher } from "svelte";

  export let positions: any[]; // Define a prop to receive positions data

  const dispatch = createEventDispatcher();

  let selectedField: any;
  let selectedMeasure: any;

  // Function to handle fetching position data
  const fetchPositionData = () => {
    // Check if both field and measure are selected
    if (selectedField && selectedMeasure) {
      // Dispatch an event with selected field and measure
      dispatch("fetch", { field: selectedField, measure: selectedMeasure });
    } else {
      console.error("Please select both field and measure.");
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
</script>

<div class="position-select-container">
  <select class="text-black px-4" bind:value={selectedField}>
    {#each positions as position}
      <option>{formatDate(position.fields["30"])}</option>
    {/each}
  </select>
  <select class="text-black w-36" bind:value={selectedMeasure}>
    {#each positions as position}
      <option>{formatDollar(position.measures["1"])}</option>
    {/each}
  </select>
  <button on:click={fetchPositionData} class="py-2 px-6 text-white border border-gray-500 position-button"
    >Fetch position</button
  >
</div>

<style lang="scss">
  @import "../../style.scss";
  .position-select-container {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    width: 400px;
    margin: 0 auto;
  }

  select {
    width: 100%;
    padding: 0.5rem;
    font-size: 1rem;
    border: 1px solid #ccc;
    border-radius: 4px;
    background-color: #f9f9f9;
    transition: border-color 0.3s ease;
  }

  select:focus {
    outline: none;
    border-color: #007bff;
  }

  option {
    padding: 0.5rem;
  }

  .position-button {
    background: $primary-color;
  }
</style>
