<!-- /free/sigma-moves (US-341): one fund's σ moves in the selected range,
     drawn by Plotly (PlotlyChart, US-337) as a line over the shaded ±3σ
     band, with the latest value and the largest moves outside the band
     annotated. The same outliers are listed as text below the chart, so
     they show before Plotly loads. -->
<script lang="ts">
  import PlotlyChart from "../PlotlyChart.svelte";
  import { sigmaSpec } from "$lib/free/charts";
  import { dateLabel } from "$lib/free/etf";
  import {
    SIGMA_BAND,
    sigmaLabel,
    type SigmaFund,
    type SigmaPoint,
    type SigmaRange,
  } from "$lib/free/sigma";

  export let fund: SigmaFund;
  export let range: SigmaRange;
  /** The points in `range`, oldest first. */
  export let points: SigmaPoint[];
  /** The largest moves outside the band in `range`. */
  export let outliers: SigmaPoint[];

  $: id = `sigma-${fund.ticker.toLowerCase()}`;
  $: latest = points.length ? points[points.length - 1] : null;
  $: spec = latest ? sigmaSpec(points, { latest, outliers }, SIGMA_BAND) : null;
  $: label = latest
    ? `${fund.ticker} daily σ moves, ${range}: ${dateLabel(
        points[0].date
      )} to ${dateLabel(latest.date)}, latest ${sigmaLabel(latest.sigma)}`
    : "";
</script>

<section aria-labelledby="{id}-title" class="panel">
  <h2 id="{id}-title" class="panel-title">
    {fund.name} ({fund.ticker})
  </h2>
  {#if !fund.series.ok}
    <p class="status">{fund.series.message}</p>
  {:else if spec && latest}
    <PlotlyChart {spec} {label} testid="{id}-plot" />
    <p class="caption">
      Daily, {dateLabel(points[0].date)} to {dateLabel(latest.date)}. The shaded
      band is ±{SIGMA_BAND}σ.
    </p>
    <h3 class="list-title">Largest moves outside ±{SIGMA_BAND}σ</h3>
    {#if outliers.length}
      <ol class="outliers" data-testid="{id}-outliers">
        {#each outliers as o (o.date)}
          <li>
            <span>{dateLabel(o.date)}</span>
            <span class="value">{sigmaLabel(o.sigma)}</span>
          </li>
        {/each}
      </ol>
    {:else}
      <p class="status">No day in this range fell outside ±{SIGMA_BAND}σ.</p>
    {/if}
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
    overflow-wrap: anywhere;
  }
  .list-title {
    margin: 0;
    font-weight: 600;
    font-size: 15px;
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
    overflow-wrap: anywhere;
  }
  .outliers {
    margin: 0;
    padding: 0;
    list-style: none;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 8px 24px;
    font-size: 15px;
  }
  .outliers li {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    padding: 6px 0;
    border-bottom: 1px solid var(--line);
  }
  .value {
    font-family: var(--mono);
  }
</style>
