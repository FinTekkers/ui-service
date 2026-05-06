<script lang="ts">
  /**
   * Authenticated app shell. Factored from the wrapper that every
   * /data/* +page.svelte was duplicating:
   *
   *   <div class="w-screen h-full flex">
   *     <DashboardSideBar {data} />
   *     <div class="h-full w-full dashboard-container">…</div>
   *   </div>
   *
   * Why a layout (second-brain#223 follow-up): PR #127 dropped the
   * inner-table overflow but two scrollbars were still visible. Cause: the
   * outer `<div class="w-screen h-full flex">` allowed body scroll when
   * the sidebar (~11 menu items + logo + logout) overflowed viewport
   * height, while .dashboard-container (overflow:auto) had its own scroll.
   * Two scroll containers, both visible.
   *
   * Fix shape (Option 1 — app-shell): pin the shell to viewport, give the
   * sidebar its own internal scroll if its menu grows, let the content
   * area be the single visible scroll surface.
   *
   *   .auth-shell      → height: 100vh; display: flex; overflow: hidden
   *   .dashboard-sidebar (via :global) → height: 100vh; overflow-y: auto
   *   .content-area    → flex: 1; overflow: auto
   *
   * The sidebar's internal scrollbar only appears when menu items + logo
   * + logout exceed viewport; on a normal desktop it's invisible.
   */
  import DashboardSideBar from '../../components/DashboardSideBar.svelte';
  export let data;
</script>

<div class="auth-shell">
  <DashboardSideBar {data} />
  <main class="content-area">
    <slot />
  </main>
</div>

<style lang="scss">
  @import "../../styles/_shared.scss";

  .auth-shell {
    display: flex;
    height: 100vh;
    width: 100vw;
    overflow: hidden;
  }

  // The sidebar component lives in src/components/DashboardSideBar.svelte
  // and renders <div class="dashboard-sidebar">. From this layout's scope
  // the selector wouldn't reach it without :global. Limited blast radius:
  // .dashboard-sidebar is a single-component class.
  :global(.auth-shell .dashboard-sidebar) {
    height: 100vh;
    overflow-y: auto;
    overflow-x: hidden;
    flex-shrink: 0;
  }

  // Single scroll surface for page content. Wide tables now produce a
  // horizontal scrollbar at this layer (per #223), and tall content
  // produces the page's only vertical scrollbar.
  .content-area {
    flex: 1 1 auto;
    height: 100vh;
    overflow: auto;
    background-color: $primary-color;
    min-width: 0; // allow flex child to shrink below content's intrinsic width
  }
</style>
