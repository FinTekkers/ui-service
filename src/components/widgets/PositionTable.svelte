<script lang="ts">
  import AgGridSvelte from "ag-grid-svelte";
  import "ag-grid-community/styles/ag-grid.css";
  import "ag-grid-community/styles/ag-theme-alpine.css";

  export let rowData: any[] = [];
  export let columnDefs: any[] = [];

  console.log({rowData, columnDefs});
  
  let defaultColDef = {
    sortable: true,
    filter: true,
    resizable: true,
  };
</script>

<div class="ag-theme-alpine" style="height: 100%; width: 100%;">
  <AgGridSvelte {rowData} {columnDefs} {defaultColDef} />
</div>

<style>
  .ag-theme-alpine {
    margin: 10px 20px;
    height: 100%;
    width: 100%;
  }
</style>
