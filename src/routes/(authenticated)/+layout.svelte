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

  // BRUTE-FORCE: body is the ONLY scroll container. No sticky, no inner
  // overflow rules anywhere in this subtree. The sidebar scrolls with the
  // page (loses always-visible nav — accepted trade-off for engine-
  // resilient single-scrollbar UX).
  :global(html) {
    overflow-y: scroll; // force always-visible track so layout doesn't
                        // shift when content grows past one viewport
    overflow-x: auto;
  }
  :global(body) {
    overflow: visible;
  }

  .auth-shell {
    display: flex;
    width: 100%;
  }

  :global(.auth-shell .dashboard-sidebar) {
    // No sticky, no internal scroll. Just sits in the flex layout.
    flex-shrink: 0;
  }

  .content-area {
    flex: 1 1 auto;
    min-width: 0;
    background-color: $primary-color;
  }
</style>
