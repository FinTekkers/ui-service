<script lang="ts">
  import Dashboard from "../../../components/Dashboard.svelte";
  import DashboardSideBar from "../../../components/DashboardSideBar.svelte";
  import Security from "../../../components/widgets/SecurityGrid.svelte";
  export let data: import("./$types").PageData;
</script>

{@debug}

<div class="w-screen h-full flex">
  <DashboardSideBar />
  
  <Security
        rows={Array.isArray(data.security) ? data.security : [data.security]}
      />
</div>
