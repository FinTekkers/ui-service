<!-- US-337: one free-page time-series chart, drawn by Plotly. Plotly loads
     in the browser only, on mount, so a page without one of these charts
     never fetches it and the server render is the empty box. A range
     button, drag-zoom or double-click moves x; the y-axes are then refitted
     to the dates in view (see $lib/free/charts). -->
<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import { refit, relayoutWindow, type PlotSpec } from "$lib/free/charts";

  export let spec: PlotSpec;
  /** The chart's accessible name: what it shows, in words. */
  export let label: string;
  export let testid: string;

  let el: HTMLDivElement | undefined;
  let Plotly: any = null;
  let failed = false;
  let listening = false;

  onMount(async () => {
    try {
      const mod: any = await import("plotly.js-dist");
      Plotly = mod.default ?? mod;
    } catch {
      failed = true;
    }
  });

  // A new spec (e.g. another SOMA week) redraws from its own layout, so the
  // zoom goes back to All.
  $: if (Plotly && el) draw(spec);

  async function draw(s: PlotSpec) {
    // On a touch screen a drag would zoom instead of scrolling the page:
    // there the range buttons and taps are the controls.
    const touch = window.matchMedia?.("(pointer: coarse)").matches;
    const layout = touch ? { ...s.layout, dragmode: false } : s.layout;
    await Plotly.react(el, s.data, layout, s.config);
    if (el && !listening) {
      (el as any).on("plotly_relayout", onRelayout);
      listening = true;
    }
  }

  function onRelayout(event: Record<string, unknown>) {
    const visible = relayoutWindow(event);
    if (!visible || !el) return;
    const update = refit(spec, visible[0], visible[1]);
    if (Object.keys(update).length) Plotly.relayout(el, update);
  }

  onDestroy(() => {
    if (Plotly && el) Plotly.purge(el);
  });
</script>

{#if failed}
  <p class="status">Unavailable: the chart could not be loaded.</p>
{:else}
  <div class="chart">
    <div
      bind:this={el}
      role="img"
      aria-label={label}
      data-testid={testid}
      class="plot"
    />
    {#if !Plotly}
      <p class="loading" aria-hidden="true">Loading chart…</p>
    {/if}
  </div>
{/if}

<style>
  .chart {
    position: relative;
    min-width: 0;
  }
  .plot {
    width: 100%;
    height: 320px;
  }
  .loading {
    position: absolute;
    inset: 0;
    margin: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: var(--mono);
    font-size: 14px;
    color: var(--muted);
  }
  .status {
    margin: 0;
    font-family: var(--mono);
    font-size: 14px;
    line-height: 1.5;
    color: var(--muted);
  }
</style>
