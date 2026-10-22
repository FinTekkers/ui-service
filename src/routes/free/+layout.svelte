<!-- Shell for every Free data explorer page (/free/*), from the owner's
     DataExplorer.dc.html artboard. These pages read mock data only
     (src/lib/free/mock/); src/tests/free-mock-guard.test.ts enforces it. -->
<script lang="ts">
  import { page } from "$app/stores";
  import DatasetPicker from "../../components/free/DatasetPicker.svelte";
  import FreeFooter from "../../components/free/FreeFooter.svelte";
  import FreeHeader from "../../components/free/FreeHeader.svelte";
  import FreeNav from "../../components/free/FreeNav.svelte";
  import "$lib/styles/ft-theme.css";
</script>

<svelte:head>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="" />
  <link
    rel="stylesheet"
    href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap"
  />
</svelte:head>

<div class="ft-free">
  <FreeNav />
  <FreeHeader>
    <DatasetPicker currentPath={$page.url.pathname} />
  </FreeHeader>
  <div class="container content">
    <slot />
  </div>
  <FreeFooter />
</div>

<style>
  .ft-free {
    min-height: 100%;
    font-family: var(--sans);
    color: var(--ink);
    background: var(--bg);
  }

  /* The explorer has its own nav (FreeNav). Hide the app shell's Navbar
     (.navigation_bar, src/components/Navbar.svelte) and SidebarNav
     (.mobile-nav, src/components/SidebarNav.svelte) on /free/* only, since
     src/routes/+layout.svelte renders them on every route. */
  :global(body:has(.ft-free) .navigation_bar),
  :global(body:has(.ft-free) .mobile-nav) {
    display: none;
  }

  /* Shared by the components in src/components/free/. */
  .ft-free :global(.container) {
    box-sizing: border-box;
    max-width: 1200px;
    margin: 0 auto;
    padding-left: clamp(16px, 4vw, 40px);
    padding-right: clamp(16px, 4vw, 40px);
  }

  .content {
    padding-bottom: 64px;
    display: flex;
    flex-direction: column;
    gap: 24px;
  }
</style>
