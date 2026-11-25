<!-- /free/etf/[ticker] chart 1: the fund's daily shares outstanding, as
     stored in SecurityMetricService (the sponsor's figures; SPY's loaded by
     MDI-154).
     US-337: drawn by Plotly, with 1Y, 5Y and All range buttons; the y-axis
     fits the dates in view, so a 7% move over a year doesn't look flat. A
     range the series can't fill keeps its note. -->
<script lang="ts">
  import PlotlyChart from "../PlotlyChart.svelte";
  import { sharesSpec } from "$lib/free/charts";
  import type { EtfFund } from "$lib/free/etf/funds";
  import {
    ETF_RANGES,
    dateLabel,
    groupDigits,
    etfRangeWindow,
    type Section,
    type EtfPoint,
  } from "$lib/free/etf";

  export let fund: EtfFund;
  export let shares: Section<EtfPoint[]>;
  /** The page's date (ISO): every range ends here. */
  export let asOf: string;

  $: windows = shares.ok
    ? ETF_RANGES.map((range) => ({
        range,
        ...etfRangeWindow(shares.ok ? shares.data : [], range, asOf),
      }))
    : [];
  $: points = windows.find((w) => w.range.years === null)?.points ?? [];
  $: chart = points.length ? draw(points) : null;

  function draw(points: EtfPoint[]) {
    const first = points[0];
    const last = points[points.length - 1];
    return {
      spec: sharesSpec(points),
      first,
      last,
      label: `Shares outstanding: from ${groupDigits(first[1])} on ${dateLabel(
        first[0]
      )} to ${groupDigits(last[1])} on ${dateLabel(last[0])}`,
    };
  }
</script>

<section aria-labelledby="etf-shares-title" class="panel">
  <h2 id="etf-shares-title" class="panel-title">
    Shares outstanding over time
  </h2>
  {#if !shares.ok}
    <p class="status">{shares.message}</p>
  {:else if chart}
    <PlotlyChart
      spec={chart.spec}
      label={chart.label}
      testid="etf-shares-plot"
    />
    <ul class="legend">
      <li><span class="swatch line-swatch" />Shares outstanding, daily</li>
    </ul>
    <p class="caption">
      Daily, {dateLabel(chart.first[0])} to {dateLabel(chart.last[0])}. Source:
      {fund.sponsor}, via the Fintekkers SecurityMetric service.
    </p>
  {/if}
  {#each windows.filter((w) => w.note) as w}
    <p id="etf-shares-note-{w.range.label}" class="note">{w.note}</p>
  {/each}
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
  .caption,
  .note {
    margin: 0;
    font-size: 14px;
    line-height: 1.5;
    color: var(--muted);
  }
  .status {
    font-family: var(--mono);
  }
  .legend {
    margin: 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-wrap: wrap;
    gap: 8px 20px;
    font-size: 14px;
  }
  .legend li {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .swatch {
    width: 12px;
    height: 12px;
    border-radius: 3px;
  }
  .line-swatch {
    height: 3px;
    background: #2f5bb7;
  }
</style>
