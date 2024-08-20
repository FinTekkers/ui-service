<script lang="ts">
  import DashboardSideBar from "../../../components/DashboardSideBar.svelte";
  import Portfolio from "../../../components/widgets/PortfolioGrid.svelte";
  export let data: import("./$types").PageData;


  console.log('here is the data', data)

  


</script>

{@debug}

<div class="w-screen h-full flex">
  <DashboardSideBar data={data} />
  <Portfolio
        rows={Array.isArray(data.portfolioData)
          ? data.portfolioData
          : [data.portfolioData]}
      />
</div>
