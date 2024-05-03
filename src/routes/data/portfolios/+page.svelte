<script lang="ts">
  import DashboardSideBar from "../../../components/DashboardSideBar.svelte";
  import Portfolio from "../../../components/widgets/PortfolioGrid.svelte";
  export let data: import("./$types").PageData;
import { redirect } from '@sveltejs/kit';

  


</script>

{@debug}

<div class="w-screen h-full flex">
  <DashboardSideBar />
  
  <Portfolio
        rows={Array.isArray(data.portfolios)
          ? data.portfolios
          : [data.portfolios]}
      />
</div>
