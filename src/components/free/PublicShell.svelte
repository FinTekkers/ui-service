<!-- The public-site shell (US-356): IBM Plex, the ft-theme tokens under a
     .ft-free root, FreeNav, main and FreeFooter. Used by the Free data
     explorer layout (src/routes/free/+layout.svelte) and /contactus.
     Slots: "header" above main, the default inside it, "after" between
     main and the footer. `current` marks the nav link for this section. -->
<script lang="ts">
  import FreeFooter from "./FreeFooter.svelte";
  import FreeNav from "./FreeNav.svelte";
  import "$lib/styles/ft-theme.css";

  export let current: "free" | "contact" = "free";
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
  <FreeNav {current} />
  <slot name="header" />
  <main class="container content">
    <slot />
  </main>
  <slot name="after" />
  <FreeFooter />
</div>

<style>
  .ft-free {
    min-height: 100%;
    font-family: var(--sans);
    color: var(--ink);
    background: var(--bg);
  }

  /* The public site has its own nav (FreeNav). Hide the app shell's Navbar
     (.navigation_bar, src/components/Navbar.svelte) and SidebarNav
     (.mobile-nav, src/components/SidebarNav.svelte) under this shell only,
     since src/routes/+layout.svelte renders them on every route. */
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
