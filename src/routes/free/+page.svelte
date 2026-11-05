<!-- US-254: /free renders /free/soma's page with the same live data
     (US-307: both server loads call fetchFreeSoma), so the two URLs can't
     drift. /free/soma is the canonical copy. -->
<script lang="ts">
  import SomaPage from "./soma/+page.svelte";
  import type { PageData } from "./$types";

  export let data: PageData;
</script>

<svelte:head>
  <link rel="canonical" href="https://www.fintekkers.org/free/soma" />
</svelte:head>

<SomaPage {data} />
