<!-- /free/sigma-moves (US-341): how unusual each day's move is, the daily
     return in standard deviations of the previous 100 daily returns, for
     each fund in SIGMA_TICKERS, inside the Free data explorer shell
     (../+layout.svelte). The server load (./+page.server.ts) reads the
     closes through the broker and computes each fund's [date, σ] series;
     the fund and range buttons only pick from it. -->
<script lang="ts">
  import SigmaPanel from "../../../components/free/sigma/SigmaPanel.svelte";
  import { dateLabel } from "$lib/free/etf";
  import {
    DEFAULT_RANGE,
    SIGMA_BAND,
    SIGMA_BASIS,
    SIGMA_FORMULA,
    SIGMA_NOT_PROBABILITY,
    SIGMA_RANGES,
    SIGMA_RETURNS,
    SIGMA_WINDOW,
    countOutside,
    daysLabel,
    inRange,
    sigmaLabel,
    topOutliers,
    type SigmaPageData,
    type SigmaPoint,
    type SigmaRange,
  } from "$lib/free/sigma";

  export let data: SigmaPageData;

  let ticker = data.funds[0]?.ticker ?? "";
  let range: SigmaRange = DEFAULT_RANGE;

  $: fund = data.funds.find((f) => f.ticker === ticker) ?? data.funds[0];
  $: all = fund?.series.ok
    ? fund.series.data.map(([date, sigma]): SigmaPoint => ({ date, sigma }))
    : [];
  $: points = inRange(all, range);
  $: outliers = topOutliers(points);
  $: latest = points.length ? points[points.length - 1] : null;
  $: outside = countOutside(points);
</script>

<svelte:head>
  <title>Sigma moves · Free data explorer · Fintekkers</title>
</svelte:head>

<!-- 1. Narrative, the controls and the summary line -->
<article class="card narrative" aria-labelledby="sigma-title">
  <h2 id="sigma-title" class="section-title">Sigma moves</h2>
  <p>
    How unusual was a fund's move today? Each day's return is divided by the
    standard deviation of its previous {SIGMA_WINDOW} daily returns. A 2% day is
    ordinary for a leveraged fund and rare for a broad index fund: in standard deviations,
    both are measured against their own recent past. Days beyond ±{SIGMA_BAND}σ
    are unusual.
  </p>

  <div class="controls">
    <div class="group" role="group" aria-label="Fund">
      {#each data.funds as f (f.ticker)}
        <button
          type="button"
          class="toggle"
          aria-pressed={f.ticker === fund?.ticker}
          on:click={() => (ticker = f.ticker)}>{f.ticker}</button
        >
      {/each}
    </div>
    <div class="group" role="group" aria-label="Range">
      {#each SIGMA_RANGES as r}
        <button
          type="button"
          class="toggle"
          aria-pressed={r === range}
          on:click={() => (range = r)}>{r}</button
        >
      {/each}
    </div>
  </div>

  {#if fund && !fund.series.ok}
    <p class="status">{fund.series.message}</p>
  {:else if latest}
    <p class="summary" data-testid="sigma-summary">
      Latest: {sigmaLabel(latest.sigma)} on {dateLabel(latest.date)}. {daysLabel(
        outside
      )} in this range fell outside ±{SIGMA_BAND}σ.
    </p>
  {/if}
</article>

<!-- 2. The selected fund's chart and its largest moves -->
{#if fund}
  <SigmaPanel {fund} {range} {points} {outliers} />
{/if}

<!-- 3. Method note -->
<section aria-labelledby="sigma-note-title" class="card block">
  <h2 id="sigma-note-title" class="panel-title">Method</h2>
  <div class="note" data-testid="sigma-note">
    <p>{SIGMA_FORMULA}</p>
    <p>{SIGMA_RETURNS}</p>
    <p>{SIGMA_BASIS}</p>
    <p>{SIGMA_NOT_PROBABILITY}</p>
  </div>
</section>

<style>
  .card {
    background: #ffffff;
    border: 1px solid var(--line);
    border-radius: 12px;
  }
  .section-title {
    margin: 0;
    font-weight: 700;
    font-size: clamp(24px, 2.6vw, 30px);
    line-height: 1.15;
    letter-spacing: -0.02em;
  }
  .panel-title {
    margin: 0;
    font-weight: 700;
    font-size: 18px;
  }
  .narrative {
    padding: clamp(24px, 4vw, 40px);
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .narrative p {
    margin: 0;
    max-width: 72ch;
    font-size: 17px;
    line-height: 1.65;
    color: #33404f;
  }
  .controls {
    display: flex;
    flex-wrap: wrap;
    gap: 12px 24px;
  }
  .group {
    display: inline-flex;
    flex-wrap: wrap;
    border: 1px solid var(--line);
    border-radius: 8px;
    overflow: hidden;
  }
  .toggle {
    min-width: 56px;
    padding: 8px 14px;
    border: 0;
    border-right: 1px solid var(--line);
    background: #f0f2f5;
    font-family: var(--mono);
    font-size: 14px;
    color: var(--ink);
    cursor: pointer;
  }
  .toggle:last-child {
    border-right: 0;
  }
  .toggle[aria-pressed="true"] {
    background: #ffffff;
    font-weight: 600;
    box-shadow: inset 0 -2px 0 var(--accent);
  }
  .toggle:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: -2px;
  }
  .narrative .summary {
    font-family: var(--mono);
    font-size: clamp(16px, 3vw, 20px);
    font-weight: 500;
    color: var(--ink);
    overflow-wrap: anywhere;
  }
  .narrative .status,
  .status {
    margin: 0;
    font-family: var(--mono);
    font-size: 14px;
    line-height: 1.5;
    color: var(--muted);
    overflow-wrap: anywhere;
  }
  .block {
    padding: 22px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    min-width: 0;
  }
  .note {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .note p {
    margin: 0;
    font-size: 14px;
    line-height: 1.6;
    color: var(--muted);
    overflow-wrap: anywhere;
  }
</style>
