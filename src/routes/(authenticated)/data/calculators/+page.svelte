<script lang="ts">
  import { goto } from "$app/navigation";
  import BondCalculator from "../../../../components/widgets/BondCalculator.svelte";
  import TipsCalculator from "../../../../components/widgets/TipsCalculator.svelte";
  import FrnCalculator from "../../../../components/widgets/FrnCalculator.svelte";
  export let data: import("./$types").PageData;

  const tabs = ["Bond Pricer", "TIPS Pricer", "FRN Pricer"];
  const tabMap: Record<string, string> = {
    tips: "TIPS Pricer",
    frn: "FRN Pricer",
    bond: "Bond Pricer",
  };
  let activeTab = tabMap[data.activeTab] ?? "Bond Pricer";

  // The securities list is streamed; the TIPS Pricer needs it for the
  // CUSIP suggestions and the coupon/maturity note (US-229). US-237: the
  // Bond and FRN Pricers' suggestions come from the same stream.
  type Streamed = Awaited<typeof data.streamed.securities>;
  let bondSecurities: Streamed["bondSecurities"] = [];
  let tipsSecurities: Streamed["tipsSecurities"] = [];
  let frnSecurities: Streamed["frnSecurities"] = [];
  $: Promise.resolve(data.streamed?.securities).then((s) => {
    if (!s) return;
    bondSecurities = s.bondSecurities;
    tipsSecurities = s.tipsSecurities;
    frnSecurities = s.frnSecurities;
  });

  // US-229: rerun `load` for the Current CPI lookup. Widget state survives
  // because the page stays mounted. `load` reads request.url, which Kit
  // does not track, so a new query alone would not rerun it.
  function lookupCpi(e: CustomEvent<URLSearchParams>) {
    goto(`/data/calculators?${e.detail.toString()}`, {
      replaceState: true,
      keepFocus: true,
      noScroll: true,
      invalidateAll: true,
    });
  }
</script>

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

{#if activeTab === "Bond Pricer"}
  <BondCalculator result={data.result} securities={bondSecurities} />
{:else if activeTab === "TIPS Pricer"}
  <TipsCalculator
    result={data.tipsResult}
    cpi={data.tipsCpi}
    securities={tipsSecurities}
    on:cpilookup={lookupCpi}
  />
{:else if activeTab === "FRN Pricer"}
  <FrnCalculator result={data.frnResult} securities={frnSecurities} />
{/if}

<style lang="scss">
  @import "../../../../style";

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
