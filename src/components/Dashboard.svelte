<script lang="ts">
  // internal imports
  import { dashboardMenuList } from "../lib/Util";
  import { selectedDashboardMenu, booleanStore } from "../store/store";
  import ObrLanding from './onboarding/OBRLanding.svelte';
  import PortfolioGrid from "./widgets/PortfolioGrid.svelte";
   export let data:App.PageData;
</script>


<div class="p-5 h-full w-screen dashboard-container">
  
          {#if $booleanStore.IS_OBR_PROMPT_SHOWING}
              <ObrLanding />
          {:else}
              {console.log('waiting for onboarding component')}
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