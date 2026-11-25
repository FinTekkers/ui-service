<!-- /free/tech-vs-sp500 (US-339): one panel of the XLK ÷ SPY drawdown,
     drawn by Plotly (PlotlyChart, US-337) as an area filled down from 0,
     with the latest value and each trough deeper than 10% annotated. The
     same figures are text on the page, so they show before Plotly loads. -->
<script lang="ts">
  import PlotlyChart from "../PlotlyChart.svelte";
  import { drawdownSpec } from "$lib/free/charts";
  import { dateLabel } from "$lib/free/spy";
  import {
    percentLabel,
    type DrawdownPoint,
    type TechVsSp500PageData,
  } from "$lib/free/techVsSp500";

  export let id: string;
  export let title: string;
  export let data: TechVsSp500PageData;
  /** Only sessions on or after this ISO date; null for the full history. */
  export let from: string | null = null;
  /** The y-axis step, in percentage points. */
  export let dtick: number;

  $: chart = data.ok ? draw(data.data.series, data.data.troughs) : null;

  function draw(all: [string, number][], troughs: DrawdownPoint[]) {
    const start = from;
    const series = start ? all.filter(([d]) => d >= start) : all;
    if (!series.length || !data.ok) return null;
    const first = series[0][0];
    const latest = data.data.latest;
    const shown = troughs.filter((t) => t.date >= first);
    return {
      first,
      spec: drawdownSpec(series, { latest, troughs: shown }, dtick),
      label: `${title}: XLK ÷ SPY drawdown from its 52-week high, ${dateLabel(
        first
      )} to ${dateLabel(latest.date)}, latest ${percentLabel(latest.dd)}`,
    };
  }
</script>

<section aria-labelledby="{id}-title" class="panel">
  <h2 id="{id}-title" class="panel-title">{title}</h2>
  {#if !data.ok}
    <p class="status">{data.message}</p>
  {:else if !chart}
    <p class="status">Unavailable: no sessions are stored from {from}.</p>
  {:else}
    <PlotlyChart spec={chart.spec} label={chart.label} testid="{id}-plot" />
    <p class="caption">
      Daily, {dateLabel(chart.first)} to {dateLabel(data.data.latest.date)}. 0%
      is a new 52-week high of the XLK ÷ SPY ratio.
    </p>
  {/if}
</section>

<style>
  .panel {
    background: #ffffff;
    border: 1px solid var(--line);
    border-radius: 12px;
    padding: 22px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    min-width: 0;
  }
  .panel-title {
    margin: 0;
    font-weight: 700;
    font-size: 18px;
  }
  .status,
  .caption {
    margin: 0;
    font-size: 14px;
    line-height: 1.5;
    color: var(--muted);
  }
  .status {
    font-family: var(--mono);
  }
</style>
