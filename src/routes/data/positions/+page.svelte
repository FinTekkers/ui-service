<script lang="ts">
  import DashboardSideBar from "../../../components/DashboardSideBar.svelte";
  import Position from "../../../components/widgets/PositionGrid.svelte";
  import PositionSelect from "../../../components/widgets/PositionSelect.svelte";
  import PositionTable from "../../../components/widgets/PositionTable.svelte";
  export let data: import("./$types").PageData;
  // console.log({data});
  

  // Split fields and measures into arrays
  const fieldMeasure = data.fieldMeasure;
  const rows = fieldMeasure?.rows.split(",") ?? [];
  const columns = fieldMeasure?.columns.split(",") ?? [];
  const measures = fieldMeasure?.measures.split(",") ?? [];

  const hasRequestedData = data && data.requestData;

  // if (hasRequestedData) {
  //   console.log(data.requestData);
  // }

  let columnDefs = [];

  if (hasRequestedData) {
    columnDefs = [
      ...rows.map((row) => ({ headerName: row, field: row })),
      ...columns.map((column) => ({ headerName: column, field: column })),
      ...measures.map((measure) => ({ headerName: measure, field: measure })),
    ];
  }
</script>

{@debug}

<div class="w-screen h-full flex">
  <DashboardSideBar {data} />
  <div class="h-full w-screen dashboard-container">
    <PositionSelect />

    {#if hasRequestedData}
      <PositionTable rowData={data.positions} {columnDefs} />
    {/if}
  </div>
</div>

<style lang="scss">
  @import "../../../style.scss";

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
