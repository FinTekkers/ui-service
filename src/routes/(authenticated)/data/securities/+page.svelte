<script lang="ts">
  import DashboardSideBar from "../../../../components/DashboardSideBar.svelte";
  import Security from "../../../../components/widgets/SecurityGrid.svelte";
  import SecuritySelect from "../../../../components/widgets/SecuritySelect.svelte";
  export let data: import("./$types").PageData;
</script>

<div class="w-screen h-full flex">
  <DashboardSideBar {data} />

  <div class="flex flex-col w-full">
    <SecuritySelect />
    <Security
      rows={Array.isArray(data.security) ? data.security : [data.security]}
    />
  </div>
</div>
