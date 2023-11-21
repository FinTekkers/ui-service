<script lang="ts">
  import { Tile } from "carbon-components-svelte";
  import { onMount } from "svelte";
  import PortfolioGrid from "../../components/PortfolioGrid.svelte";
  import { portfolioStoreUpdate, portfolioStore } from "../../store/store";
  import Main from "../../components/Main.svelte";
  import SideMenu from "../../components/SideMenu.svelte";
  export let data: import("./$types").PageData;
</script>

{@debug}

<div class="w-screen h-full flex">
  <SideMenu />
  <Main />

  <PortfolioGrid rows={data.portfolioData} />
</div>
