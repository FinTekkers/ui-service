<script lang="ts">
  import Dashboard from "../../components/Dashboard.svelte";
  import DashboardSideBar from "../../components/DashboardSideBar.svelte";
  export let data: import("./$types").PageData;
</script>

{@debug}

<div class="w-screen h-full flex">
  <DashboardSideBar />
  <Dashboard data={data} />
</div>
