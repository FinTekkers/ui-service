<script lang="ts">
  import { createEventDispatcher, onDestroy, onMount } from "svelte";
  import { Grid, type GridOptions, type ColDef, GridApi } from "ag-grid-community";
  import "ag-grid-community/styles/ag-grid.css";
  import "ag-grid-community/styles/ag-theme-alpine.css";

  const dispatch = createEventDispatcher();

  export let columnDefs: ColDef[] = [];
  export let rowData: any[] = [];
  export let theme: string = "alpine";
  export let loading: boolean = false;

  let options: GridOptions = {
    defaultColDef: {
      sortable: true,
      filter: true,
      resizable: true,
      enablePivot: true,
    },
    suppressFieldDotNotation: true,
    rowSelection: "multiple",
    pivotMode: true,
    onSelectionChanged: onSelectionChanged,
    onCellValueChanged: onCellValueChanged,
    onGridReady: onGridReady,
  };

  let themeUrl: string = `https://unpkg.com/ag-grid-community/styles/ag-theme-${theme}.css`;
  let ref: HTMLDivElement;
  let grid: Grid;
  let api: GridApi;

  function onSelectionChanged(): void {
    const selectedRows = api.getSelectedRows();
    dispatch("select", selectedRows);
  }

  function onCellValueChanged(e: any): void {
    rowData[e.rowIndex] = e.data;
    dispatch("update", { row: e.rowIndex, data: e.data });
  }

  function onGridReady(params: any): void {
    api = params.api;
    if (loading) api.showLoadingOverlay();
    api.setRowData(rowData);
    api.setColumnDefs(columnDefs);
    console.log("Grid Ready", api, rowData, columnDefs);
  }

  function updateData(data: any[]): void {
    if (api) {
      api.setRowData(data);
    }
  }

  onMount(() => {
    grid = new Grid(ref, {
      ...options,
      columnDefs,
      rowData,
    });
    console.log("Grid Mounted", grid, columnDefs, rowData);
  });

  onDestroy(() => {
    if (grid) {
      grid.destroy();
    }
  });

  // Reactively update grid data and columns
  $: {
    if (api) {
      console.log("Updating Grid Data and Column Definitions", columnDefs, rowData);
      api.setColumnDefs(columnDefs);
      api.setRowData(rowData);
    }
  }
</script>

<svelte:head>
  {#if theme !== "alpine" && !Object.values(document.styleSheets).some((styleSheet) => styleSheet.href === themeUrl)}
    <link rel="stylesheet" href={themeUrl} />
    {console.log("Theme Applied", themeUrl)}
  {/if}
</svelte:head>

<div class="container">
  <div
    bind:this={ref}
    class="ag-theme-{theme}"
    style="height: 100%; width: 100%;"
  ></div>
</div>

<style>
  .container {
    width: 100%;
    height: 100%;
    margin: 10px 20px;
  }
</style>
