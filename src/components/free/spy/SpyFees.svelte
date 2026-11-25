<!-- /free/spy chart 3: estimated sponsor fee revenue per month, derived on
     the server from stored TOTAL_NET_ASSETS and the stored EXPENSE_RATIO
     series (US-336). A month before the first stored ratio has no
     estimate, and a note says so; a ratio is never defaulted. A null month
     is a gap, never a zero bar. US-337: drawn by Plotly, zero-based. -->
<script lang="ts">
  import PlotlyChart from "../PlotlyChart.svelte";
  import { feesSpec } from "$lib/free/charts";
  import {
    SPY_FEE_NOTE,
    SPY_FORMULAS,
    monthLabel,
    spyFeeGapNote,
    type Section,
    type SpyFeeMonth,
    type SpyFees,
  } from "$lib/free/spy";

  export let fees: Section<SpyFees>;

  const FEE = "#5b8def";

  $: chart = fees.ok && fees.data.months.length ? draw(fees.data.months) : null;
  $: gapNote = fees.ok ? spyFeeGapNote(fees.data) : null;

  function draw(months: SpyFeeMonth[]) {
    return {
      spec: feesSpec(months),
      first: months[0].month,
      last: months[months.length - 1].month,
    };
  }
</script>

<section aria-labelledby="spy-fees-title" class="panel">
  <h2 id="spy-fees-title" class="panel-title">Sponsor fee revenue over time</h2>
  <p class="estimate">{SPY_FEE_NOTE}</p>
  {#if !fees.ok}
    <p class="status">{fees.message}</p>
  {:else if !chart}
    <p class="status">Unavailable: no months of SPY data are stored.</p>
  {:else}
    <PlotlyChart
      spec={chart.spec}
      label="Estimated SPY sponsor fee revenue per month, {monthLabel(
        chart.first
      )} to {monthLabel(chart.last)}"
      testid="spy-fees-plot"
    />
    <ul class="legend">
      <li>
        <span class="swatch" style="background: {FEE}" />Estimated gross fee
        revenue
      </li>
    </ul>
    <p class="caption">
      Monthly, {monthLabel(chart.first)} to {monthLabel(chart.last)}; the latest
      month is month to date. A month with a missing day is left blank.
    </p>
    {#if gapNote}
      <p class="caption" data-testid="spy-fee-gap-note">{gapNote}</p>
    {/if}
  {/if}
  <ul class="formulas" aria-label="How this estimate is worked out">
    <li>{SPY_FORMULAS.fee}</li>
  </ul>
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
  .estimate {
    margin: 0;
    font-size: 15px;
    line-height: 1.6;
    color: #33404f;
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
  .legend,
  .formulas {
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
  .formulas {
    font-family: var(--mono);
    font-size: 13px;
    color: var(--ink);
    overflow-wrap: anywhere;
  }
  .swatch {
    width: 12px;
    height: 12px;
    border-radius: 3px;
    flex: none;
  }
</style>
