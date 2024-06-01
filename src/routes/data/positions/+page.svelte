<script lang="ts">
  import DashboardSideBar from "../../../components/DashboardSideBar.svelte";
  import PositionSelect from "../../../components/widgets/PositionSelect.svelte";
  import PositionTable from "../../../components/widgets/PositionTable.svelte";
  export let data: import("./$types").PageData;

  const hasRequestedData = data && data.requestData;

  let columnDefs: { headerName: string; field: string }[] = [];
  let filteredRowData: any[] = [];
  let includeZeroValues = true;

  if (hasRequestedData) {
    const { rows, columns, measures } = data.fieldMeasure;
    const { fields, measures: measureKeys } = data.requestData;

    // Create a combined array of fields and measures with their respective labels
    const combinedFields = [
      ...fields.map((field: { toString: () => any }, index: number) => ({
        headerName:
          index < rows.split(",").length
            ? rows.split(",")[index]
            : columns.split(",")[index - rows.split(",").length],
        field: field.toString(),
        enablePivot: true,
        rowGroup: index < rows.split(",").length, // Group rows
        pivot: index >= rows.split(",").length // Pivot columns
      })),
      ...measureKeys.map(
        (measure: { toString: () => any }, index: string | number) => ({
          headerName: measures.split(",")[index],
          field: measure.toString(),
          enablePivot: true,
          aggFunc: "sum",
        })
      ),
    ];

    columnDefs = combinedFields;

    // Initial filtering of row data
    filteredRowData = data.positions;
    if (!includeZeroValues) {
      filteredRowData = filteredRowData.filter(
        (position) => position["1"] !== 0 // Adjust field name
      );
    }
  }

  function toggleZeroValues() {
    includeZeroValues = !includeZeroValues;
    if (includeZeroValues) {
      filteredRowData = data.positions;
    } else {
      filteredRowData = data.positions.filter(
        (position: { [x: string]: number }) => position["1"] !== 0 // Adjust field name
      );
    }
  }
</script>

{@debug}

<div class="w-screen h-full flex">
  <DashboardSideBar {data} />
  <div class="h-full w-screen dashboard-container">
    <PositionSelect />
    <div class="zero-checkbox">
      <input type="checkbox" id="zeroValues" on:change={toggleZeroValues} />
      <label for="zeroValues" class="text-black">Ignore Zero Values</label>
    </div>

    {#if hasRequestedData}
      <PositionTable rowData={filteredRowData} {columnDefs} loading={false} />
      <div>
        <h3>Debug Info</h3>
        <pre>{JSON.stringify(columnDefs, null, 2)}</pre>
        <pre>{JSON.stringify(filteredRowData, null, 2)}</pre>
      </div>
    {/if}
  </div>
</div>

<style lang="scss">
  @import "../../../style.scss";

  .dashboard-container {
    background-color: white;

    .dashboard-menu {
      width: 98%;
      height: 98%;
      padding: 2em;
      border-radius: 5px;
      background-color: $tealblack;
      color: $primary-color;
    }
  }

  .zero-checkbox {
    display: flex;
    align-items: center;
    justify-content: start;
    gap: 10px;
    margin: 0 30px;
    padding: 10px 0;
  }
</style>
