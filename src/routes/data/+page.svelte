<!-- routes/Data.svelte -->
<script lang="ts">
    import Portfolio from "../../components/widgets/PortfolioGrid.svelte";
    import Security from "../../components/widgets/SecurityGrid.svelte";
    import DashboardSidebar from "../../components/DashboardSideBar.svelte";
    import { dashboardMenuList } from "$lib/Util";
    import { selectedDashboardMenu } from "../../store/store";
    export let data: import("./$types").PageData;
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
      <Portfolio rows={Array.isArray(data.portfolioData) ? data.portfolioData : [data.portfolioData]} />
  
      {:else if $selectedDashboardMenu === dashboardMenuList.SECURITY}
        <Security rows={Array.isArray(data.securityData) ? data.securityData : [data.securityData]} />
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