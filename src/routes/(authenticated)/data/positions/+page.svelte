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
</script>

{@debug}

<div class="w-screen h-full flex">
  <DashboardSideBar {data} />

  <div class="h-full w-screen dashboard-container">
    <PositionSelect />

    {#if hasRequestedData}
      <Position
        positions={Array.isArray(data.positions)
          ? data.positions
          : [data.positions]}
        requestData={data.requestData}
        metadata={data.metadata}
      />
    {/if}
  </div>
</div>

<style lang="scss">
  @import "../../../../style";

  .dashboard-container {
    background-color: white;
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
