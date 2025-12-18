<script lang="ts">
  import DashboardSideBar from "../../../../components/DashboardSideBar.svelte";
  import Position from "../../../../components/widgets/PositionGrid.svelte";
  import PositionSelect from "../../../../components/widgets/PositionSelect.svelte";
  export let data: import("./$types").PageData;

  // Split fields and measures into arrays
  const fieldMeasure = data.fieldMeasure;
  // Split fields and measures into arrays if fieldMeasure is defined
  const fields = fieldMeasure?.fields.split(",") ?? [];
  const measures = fieldMeasure?.measures.split(",") ?? [];

  console.log("here is the data", data);

  console.log({ fields, measures });

  // Check if requestData is available
  const hasRequestedData = data && data.requestData;

  // Log requestData if available
  if (hasRequestedData) {
    console.log(data.requestData);
  }

  // Function to handle sort changes and update URL
  function handleSortChange(sortBy: string, sortDirection: "asc" | "desc") {
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("sortBy", sortBy);
      url.searchParams.set("sortDirection", sortDirection);
      // Update URL without page reload (client-side sorting)
      window.history.pushState({}, "", url.toString());
    }
  }
  // Check if hideZeros is active
  let hideZeros = false;
  $: {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      hideZeros = urlParams.get("hideZeros") === "true";
    }
  }

  $: filteredPositions = (
    Array.isArray(data.positions) ? data.positions : [data.positions]
  ).filter((pos) => {
    if (!hideZeros) return true;
    if (!hasRequestedData) return true;

    // Check if all measures are zero
    const measures = data.requestData.measures || [];
    if (measures.length === 0) return true; // No measures to check

    // Check if every measure is zero (or effectively zero)
    const allZeros = measures.every((m: string) => {
      const val = pos[m];
      return val === 0 || val === "0" || val === 0.0;
    });

    return !allZeros;
  });
</script>

{@debug}

<div class="w-screen h-full flex">
  <DashboardSideBar {data} />

  <div class="h-full w-full dashboard-container">
    <PositionSelect />

    {#if hasRequestedData}
      <Position
        positions={filteredPositions}
        requestData={data.requestData}
        metadata={data.metadata}
        onSortChange={handleSortChange}
      />
    {/if}
  </div>
</div>

<style lang="scss">
  @import "../../../../style";

  .dashboard-container {
    background-color: $primary-color;
    overflow: auto;
    // @include flex(column, center, center, 0);

    .dashboard-menu {
      width: 98%;
      height: 98%;
      padding: 2em;
      border-radius: 5px;
      background-color: $tealblack;
      color: $primary-color;
    }
  }
</style>
