<script lang="ts">
  import PortfolioGrid from "../../components/PortfolioGrid.svelte";
  import Main from "../../components/Main.svelte";
  import SideMenu from "../../components/SideMenu.svelte";
  export let data: import("./$types").PageData;
</script>

{@debug}

<div class="w-screen h-full flex">
  <SideMenu />

  <PortfolioGrid rows={data.portfolioData} />
</div>
