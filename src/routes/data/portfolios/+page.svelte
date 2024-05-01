<script lang="ts">
  import DashboardSideBar from "../../../components/DashboardSideBar.svelte";
  import Portfolio from "../../../components/widgets/PortfolioGrid.svelte";
  export let data: import("./$types").PageData;
  console.log({ data });
</script>

{@debug}

<div class="h-full flex w-screen">
  <DashboardSideBar {data} />

  <Portfolio
    rows={Array.isArray(data.portfolios) ? data.portfolios : [data.portfolios]}
  />
</div>
