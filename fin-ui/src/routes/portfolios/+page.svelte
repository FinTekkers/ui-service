<script lang="ts">
  import { Tile } from "carbon-components-svelte";
  import { onMount } from "svelte";
  import PortfolioGrid from "../../components/PortfolioGrid.svelte";
  import { portfolioStoreUpdate, portfolioStore } from "../../store/store";

  export let data: import("./$types").PageData;

  onMount(() => {
    if (data) {
      portfolioStoreUpdate(data);
      console.log($portfolioStore, "stored");
    }
  });
</script>

{@debug}

<div class="background_col w-screen h-full flex">
  <!-- <Tile> -->
  <!-- <PortfolioGrid rows={data.portfolioData} /> -->
  <!-- </Tile> -->
</div>

<style>
  :global(:root) {
    --grid-height: 75vh;
  }
</style>
