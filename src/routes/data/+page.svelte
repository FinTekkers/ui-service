<!-- routes/Data.svelte -->
<script lang="ts">
  import Portfolio from "../../components/widgets/PortfolioGrid.svelte";
  import Security from "../../components/widgets/SecurityGrid.svelte";
  import Transaction from "../../components/widgets/TransactionGrid.svelte";
  import PositionSelect from "../../components/widgets/PositionSelect.svelte";
  import DashboardSidebar from "../../components/DashboardSideBar.svelte";
  import { dashboardMenuList } from "$lib/Util";
  import { selectedDashboardMenu } from "../../store/store";
  export let data: import("./$types").PageData;

  console.log(data.positions)
  selectedDashboardMenu.set(dashboardMenuList.PORTFOLIO);

  // Function to handle menu selection
  const handleMenuSelection = (event: CustomEvent<any>) => {
    const menu: string = event.detail;
    selectedDashboardMenu.set(menu);
  };
</script>

<div class="w-screen h-full flex">
  <DashboardSidebar on:menuSelect={handleMenuSelection} />
  <div class="h-full w-screen dashboard-container">
    {#if $selectedDashboardMenu === dashboardMenuList.PORTFOLIO}
      <Portfolio
        rows={Array.isArray(data.portfolios)
          ? data.portfolios
          : [data.portfolios]}
      />
    {:else if $selectedDashboardMenu === dashboardMenuList.SECURITY}
      <Security
        rows={Array.isArray(data.security) ? data.security : [data.security]}
      />
    {:else if $selectedDashboardMenu === dashboardMenuList.TRANSACTION}
      <Transaction
        rows={Array.isArray(data.transactions)
          ? data.transactions
          : [data.transactions]}
      />
    {:else if $selectedDashboardMenu === dashboardMenuList.POSITION}
      <PositionSelect positions={data.positions} />
    {/if}
  </div>
</div>

<style lang="scss">
  @import "../../style.scss";

  .dashboard-container {
    background-color: white;
    @include flex(column, center, center, 0);

    .dashboard-menu {
      width: 98%;
      height: 98%;
      padding: 2em;
      border-radius: 5px;
      background-color: $tealblack;
      color: $primary-color;
    }
  }
</style>
