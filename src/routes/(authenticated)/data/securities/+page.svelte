<script lang="ts">
  import Dashboard from "../../../../components/Dashboard.svelte";
  import DashboardSideBar from "../../../../components/DashboardSideBar.svelte";
  import Security from "../../../../components/widgets/SecurityGrid.svelte";
  export let data: import("../../../../../.svelte-kit/types/src/routes").PageData;
</script>

{@debug}

<div class="w-screen h-full flex">
  <DashboardSideBar data={data} />
  
  <Security
        rows={Array.isArray(data.security) ? data.security : [data.security]}
      />
</div>
