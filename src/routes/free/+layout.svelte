<!-- Shell for every Free data explorer page (/free/*), from the owner's
     DataExplorer.dc.html artboard. These pages never call the backend
     themselves: live figures come only from the allowed server loads (/free,
     /free/soma, /free/tips, /free/etf/[ticker], /free/tech-vs-sp500,
     /free/sigma-moves and /free/corporate-bond/crwv-2030);
     src/tests/free-mock-guard.test.ts enforces it. /free/spy only
     redirects. /free/request's action (US-352) only emails a request.
     The nav, footer, fonts and theme come from PublicShell (US-356). -->
<script lang="ts">
  import { page } from "$app/stores";
  import DatasetPicker from "../../components/free/DatasetPicker.svelte";
  import FreeHeader from "../../components/free/FreeHeader.svelte";
  import FreeRequestBand from "../../components/free/FreeRequestBand.svelte";
  import PublicShell from "../../components/free/PublicShell.svelte";
  import { FREE_REQUEST_PATH } from "$lib/free/request";
  import type { FreeDataset } from "$lib/free/datasets";

  // A page that isn't at its dataset's own URL names the dataset it shows
  // in its load data (/free returns dataset: "soma").
  $: selectedId = ($page.data as { dataset?: FreeDataset["id"] } | undefined)
    ?.dataset;
</script>

<PublicShell>
  <FreeHeader slot="header">
    <DatasetPicker currentPath={$page.url.pathname} {selectedId} />
  </FreeHeader>
  <slot />
  <svelte:fragment slot="after">
    {#if $page.url.pathname !== FREE_REQUEST_PATH}
      <FreeRequestBand />
    {/if}
  </svelte:fragment>
</PublicShell>

<style>
  /* The shell (PublicShell) hides the app's Navbar and SidebarNav; this
     copy of its rule stays because src/tests/free-shell.test.ts reads it
     from this file. */
  :global(body:has(.ft-free) .navigation_bar),
  :global(body:has(.ft-free) .mobile-nav) {
    display: none;
  }
</style>
