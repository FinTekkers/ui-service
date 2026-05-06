<script lang="ts">
  /**
   * Authenticated app shell — second-brain#223 follow-up recovery.
   *
   * History: PR #127 dropped per-grid overflow. PR #131 then factored
   * this layout using Option 1 (app-shell, pinned to viewport, content-
   * area owns scroll). User report after merge: sidebar shows its own
   * scrollbar (Option 1 by-design but undesired), and the content area
   * shows a phantom scrollbar that doesn't actually scroll (overflow:auto
   * reserves a gutter on macOS "Always show scrollbars"). PR #131's spec
   * used a 1024×500 viewport that fit the sidebar within 100vh, masking
   * both issues.
   *
   * This layout switches to Option 2 — sticky sidebar + body scroll:
   *
   *   document.body         → owns the page-level scrollbar
   *   .auth-shell           → flex; no height:100vh, no overflow:hidden
   *   .dashboard-sidebar    → position: sticky; top: 0; height: 100vh
   *                           (overflow-y:auto only as a small-viewport
   *                           fallback — at typical desktop the menu
   *                           fits within 100vh so the scrollbar never
   *                           appears)
   *   .content-area         → flex:1; min-width:0; NO overflow set —
   *                           content flows naturally, body scrolls
   *
   * Why Option 2 over Option 1: the original user requirement was "a
   * single global scrollbar". Option 2 delivers that literally — body
   * is the only scroll. Option 1 always created a scroll surface on the
   * content area whether content overflowed or not (overflow:auto), and
   * macOS "Always show scrollbars" rendered it as a phantom track.
   *
   * Sticky table headers (`thead { position: sticky; top: 0 }` in grid
   * widgets) and sticky calculator inputs (.calculator-layout in
   * Bond/FRN/TIPS calculators) now pin to the body's scroll viewport
   * instead of the content-area's. Behaviour is identical from the
   * user's POV — they pin to whichever is the nearest scrolling
   * ancestor, which is now `<html>`.
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

  // The root layout (src/routes/+layout.svelte) wraps everything in
  // Skeleton's <AppShell>, which hardcodes overflow:hidden + h-full on
  // its container chain (#appShell, the flex-auto content area, #page).
  // That makes #page its own scroll surface — competing with body. The
  // overrides below disable those constraints. They only take effect
  // while an (authenticated) route is mounted (SvelteKit scopes layout
  // CSS to its route subtree); login/landing pages keep the shell
  // pinned-to-viewport behavior they had before.
  :global(#appShell) {
    height: auto;
    overflow: visible;
  }
  :global(#appShell > div.flex-auto) {
    height: auto;
    overflow: visible;
  }
  :global(#page) {
    overflow: visible;
    flex: 1 1 auto;
  }
  :global(#page > main#page-content) {
    overflow: visible;
  }

  // No height: 100vh, no overflow: hidden — let body own scroll.
  .auth-shell {
    display: flex;
    width: 100%;
  }

  // Sticky sidebar: pins to top of viewport while body scrolls. height:
  // 100vh keeps the sidebar visible against the viewport. overflow-y:auto
  // is a fallback for tiny viewports where menu items genuinely exceed
  // 100vh — at typical desktop sizes (1024px+ tall) the menu fits with
  // headroom so no scrollbar appears.
  :global(.auth-shell .dashboard-sidebar) {
    position: sticky;
    top: 0;
    height: 100vh;
    overflow-y: auto;
    overflow-x: hidden;
    flex-shrink: 0;
  }

  // Content area carries the page background and lets content flow. NO
  // overflow set — body owns scrolling. min-width:0 lets the flex child
  // shrink below content's intrinsic width so wide tables can overflow
  // body horizontally instead of widening the layout.
  .content-area {
    flex: 1 1 auto;
    min-width: 0;
    background-color: $primary-color;
  }
</style>
