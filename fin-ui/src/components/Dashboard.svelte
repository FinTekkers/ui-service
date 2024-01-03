<script lang="ts">

  // internal imports
  import { dashboardMenuList } from "../lib/Util";
  import { obrPromptBoolean, selectedDashboardMenu } from "../store/store";
  import ObrLanding from './onboarding/OBRLanding.svelte';
  import PortfolioGrid from "./widgets/PortfolioGrid.svelte";
  export let data: any;
  
</script>

<!-- conditional render components -->
<!-- decide what type of OBR to load based on selection -->

<div class="p-5 h-full w-screen dashboard-container">
          {#if $obrPromptBoolean}
              <ObrLanding />
          {:else}
              <!-- <OBRPrompt obrStepNumber={1} obrCardPosition='obr_stepone' /> -->
          {/if}
          {#if $selectedDashboardMenu == dashboardMenuList.Home}
              <div class="dashboard-menu">Home
                  <a href="/security/1" >→✅</a>
              </div>
          {:else if $selectedDashboardMenu == dashboardMenuList.Dashboard}
              <div class="dashboard-menu">Dashboard
                 <a href="/security/2" >→✅</a>
              </div>
          {:else if $selectedDashboardMenu == dashboardMenuList.Portfolio}
              <PortfolioGrid rows={data.portfolioData} />
          {:else if $selectedDashboardMenu == dashboardMenuList.Account}
              <div class="dashboard-menu">Account 
                 <a href="/security/2" >→✅</a>
              </div>
          {:else if $selectedDashboardMenu == dashboardMenuList.Logout}
              <div class="dashboard-menu">Goodbye</div>
          {/if}
</div>

<style lang="scss">
  @import "../style.scss";
  
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
