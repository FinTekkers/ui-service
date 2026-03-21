<script lang="ts">
  import DashboardSideBar from '../../../../components/DashboardSideBar.svelte';
  import BondCalculator from '../../../../components/widgets/BondCalculator.svelte';
  import TipsCalculator from '../../../../components/widgets/TipsCalculator.svelte';
  import FrnCalculator from '../../../../components/widgets/FrnCalculator.svelte';
  export let data: import('./$types').PageData;

  const tabs = ['Bond Pricer', 'TIPS Pricer', 'FRN Pricer'];
  const tabMap: Record<string, string> = { tips: 'TIPS Pricer', frn: 'FRN Pricer', bond: 'Bond Pricer' };
  let activeTab = tabMap[data.activeTab] ?? 'Bond Pricer';
</script>

<div class="w-screen h-full flex">
  <DashboardSideBar {data} />

  <div class="h-full w-full dashboard-container">
    <!-- Tab bar -->
    <div class="tab-bar px-10 pt-6">
      {#each tabs as tab}
        <button
          class="tab-btn"
          class:active={activeTab === tab}
          on:click={() => (activeTab = tab)}
        >
          {tab}
        </button>
      {/each}
    </div>

    {#if activeTab === 'Bond Pricer'}
      <BondCalculator result={data.result} securities={data.bondSecurities} />
    {:else if activeTab === 'TIPS Pricer'}
      <TipsCalculator result={data.tipsResult} securities={data.tipsSecurities} />
    {:else if activeTab === 'FRN Pricer'}
      <FrnCalculator result={data.frnResult} securities={data.frnSecurities} />
    {/if}
  </div>
</div>

<style lang="scss">
  @import "../../../../style";

  .dashboard-container {
    background-color: $primary-color;
    overflow: auto;
  }

  .tab-bar {
    display: flex;
    gap: 0.25rem;
    border-bottom: 2px solid $border-color;
  }

  .tab-btn {
    padding: 8px 20px;
    background: none;
    border: none;
    border-bottom: 3px solid transparent;
    margin-bottom: -2px;
    font-size: 0.9rem;
    font-weight: 500;
    color: $tealwhite;
    cursor: pointer;
    transition: all 0.15s;
    opacity: 0.7;

    &:hover {
      opacity: 1;
    }

    &.active {
      color: $success;
      border-bottom-color: $success;
      font-weight: 700;
      opacity: 1;
    }
  }
</style>
