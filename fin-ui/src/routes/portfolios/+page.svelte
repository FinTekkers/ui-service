<script lang="ts">
  import { Tile } from "carbon-components-svelte";
  import { onMount } from "svelte";
  import PortfolioGrid from "../../components/PortfolioGrid.svelte";
  import { portfolioStoreUpdate, portfolioStore } from "../../store/store";
  import Container from "../../components/Container.svelte";
  import SideMenu from "../../components/SideMenu.svelte";

  // export let data: import("./$types").PageData;

  // onMount(() => {
  //   if (data) {
  //     portfolioStoreUpdate(data);
  //     console.log($portfolioStore, "stored");
  //   }
  // });
</script>

{@debug}

<div class="background_col w-screen h-full flex">
  <SideMenu />
  <Container />

  <!-- <Tile> -->
  <!-- <PortfolioGrid rows={data.portfolioData} /> -->
  <!-- </Tile> -->
</div>

<style>
  :global(:root) {
    --grid-height: 75vh;
  }
</style>
