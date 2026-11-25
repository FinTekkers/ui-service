<!-- /free/etf/[ticker] chart 2: each month's change in the fund's AUM,
     stacked as net flows and market move (positive up, negative down), with
     month-end AUM as a line on the right axis. Every figure is derived on the server
     (src/lib/server/free-etf.ts) from the stored SHARES_OUTSTANDING,
     NAV_PER_SHARE and TOTAL_NET_ASSETS series; a null month is a gap,
     never a zero bar. US-337: drawn by Plotly; the AUM axis fits the
     months in view, the bars stay zero-based. -->
<script lang="ts">
  import PlotlyChart from "../PlotlyChart.svelte";
  import { flowsSpec } from "$lib/free/charts";
  import type { EtfFund } from "$lib/free/etf/funds";
  import {
    ETF_FORMULAS,
    compactDollars,
    monthLabel,
    type Section,
    type EtfMonth,
  } from "$lib/free/etf";

  export let fund: EtfFund;
  export let flows: Section<EtfMonth[]>;

  const NET = "#2f5bb7";
  const MARKET = "#e8a33d";

  $: chart = flows.ok && flows.data.length ? draw(flows.data) : null;
  // The latest month with every figure, as display strings.
  $: latest = flows.ok ? latestComplete(flows.data) : null;

  function latestComplete(months: EtfMonth[]) {
    for (let i = months.length - 1; i >= 0; i--) {
      const { month, aumEnd, deltaAum, netFlows, marketMove } = months[i];
      if (aumEnd && deltaAum && netFlows && marketMove) {
        return {
          month: monthLabel(month),
          aumEnd: compactDollars(aumEnd),
          deltaAum: compactDollars(deltaAum),
          netFlows: compactDollars(netFlows),
          marketMove: compactDollars(marketMove),
        };
      }
    }
    return null;
  }

  function draw(months: EtfMonth[]) {
    return {
      spec: flowsSpec(months),
      first: months[0].month,
      last: months[months.length - 1].month,
    };
  }
</script>

<section aria-labelledby="etf-flows-title" class="panel">
  <h2 id="etf-flows-title" class="panel-title">
    Monthly AUM change: net flows vs market move
  </h2>
  {#if !flows.ok}
    <p class="status">{flows.message}</p>
  {:else if !chart}
    <p class="status">
      Unavailable: no months of {fund.ticker} data are stored.
    </p>
  {:else}
    {#if latest}
      <p class="summary">
        {latest.month}: ΔAUM {latest.deltaAum} = net flows {latest.netFlows} + market
        move {latest.marketMove}; month-end AUM {latest.aumEnd}
      </p>
    {/if}
    <PlotlyChart
      spec={chart.spec}
      label="Monthly change in {fund.ticker}'s assets under management, {monthLabel(
        chart.first
      )} to {monthLabel(
        chart.last
      )}, stacked as net flows and market move, with month-end AUM as a line"
      testid="etf-flows-plot"
    />
    <ul class="legend">
      <li><span class="swatch" style="background: {NET}" />Net flows</li>
      <li><span class="swatch" style="background: {MARKET}" />Market move</li>
      <li><span class="swatch line-swatch" />Month-end AUM (right axis)</li>
    </ul>
    <p class="caption">
      Monthly, {monthLabel(chart.first)} to {monthLabel(chart.last)}. A month
      with a missing day in any series is left blank.
    </p>
  {/if}
  <ul class="formulas" aria-label="How these figures are worked out">
    <li>{ETF_FORMULAS.aum}</li>
    <li>{ETF_FORMULAS.flows}</li>
    <li>{ETF_FORMULAS.market}</li>
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
  .status,
  .summary,
  .caption {
    margin: 0;
    font-size: 14px;
    line-height: 1.5;
    color: var(--muted);
  }
  .status,
  .summary {
    font-family: var(--mono);
  }
  .summary {
    color: var(--ink);
    overflow-wrap: anywhere;
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
    flex-direction: column;
    gap: 4px;
    font-family: var(--mono);
    font-size: 13px;
    color: var(--ink);
    overflow-wrap: anywhere;
  }
  .swatch {
    width: 12px;
    height: 12px;
    border-radius: 3px;
  }
  .line-swatch {
    height: 2px;
    background: var(--ink);
  }
</style>
