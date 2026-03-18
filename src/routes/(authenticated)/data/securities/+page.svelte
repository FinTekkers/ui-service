<script lang="ts">
  import DashboardSideBar from "../../../../components/DashboardSideBar.svelte";
  import Security from "../../../../components/widgets/SecurityGrid.svelte";
  import SecuritySelect from "../../../../components/widgets/SecuritySelect.svelte";
  export let data: import("./$types").PageData;
</script>

<div class="w-screen h-full flex">
  <DashboardSideBar {data} />

  <div class="h-full w-full dashboard-container">
    <SecuritySelect />
    <Security
      rows={Array.isArray(data.security) ? data.security : [data.security]}
    />
  </div>
</div>

<style lang="scss">
  @import "../../../../style";

  .dashboard-container {
    background-color: $primary-color;
    overflow: auto;
  }
</style>
