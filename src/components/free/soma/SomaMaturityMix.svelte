<!-- US-365: Maturity mix over time, below Holdings over time on /free/soma.
     One 100% bar per quarter (its last H.4.1 week, up to the page's week),
     split by remaining maturity, with the par-weighted average maturity as
     an orange line on a right-hand axis. The server load streams it from
     its own search: `mix` is null while it loads. Only percentages and
     years reach the browser. The 1Y / 5Y / All buttons pick 5, 21 or every
     bar. -->
<script lang="ts">
  import PlotlyChart from "../PlotlyChart.svelte";
  import { somaMixSpec } from "$lib/free/charts";
  import { formatOneDecimal } from "$lib/free/format";
  import {
    SOMA_HISTORY_LABEL,
    SOMA_MIX_AVG_COLOR,
    SOMA_MIX_BUCKETS,
    SOMA_MIX_COLORS,
    SOMA_MIX_RANGES,
    mixWindow,
    weekLabel,
    type Section,
    type SomaMixRange,
    type SomaMixView,
  } from "$lib/free/soma";

  export let mix: Section<SomaMixView> | null;
  export let asOfLabel: string;

  let range: SomaMixRange = SOMA_MIX_RANGES[SOMA_MIX_RANGES.length - 1];

  $: view = mix && mix.ok ? mix.data : null;
  $: points = view ? mixWindow(view, range) : [];
  $: spec = points.length ? somaMixSpec(points) : null;
  $: latest = view
    ? `Latest: ${formatOneDecimal(
        view.latest.under1
      )}% under 1 yr, average maturity ${formatOneDecimal(
        view.latest.avgYears
      )} yrs, on ${weekLabel(view.latest.week)}`
    : "";
  $: label = points.length
    ? `Maturity mix over time, ${
        range.label
      }: share of Treasury par by remaining maturity for each quarter from ${
        points[0].quarter
      } to ${
        points[points.length - 1].quarter
      }, with the average maturity from ${formatOneDecimal(
        points[0].avgYears
      )} to ${formatOneDecimal(points[points.length - 1].avgYears)} years`
    : "";
</script>

<section aria-labelledby="mix-title" class="mix">
  <h2 id="mix-title" class="panel-title">Maturity mix over time</h2>
  {#if !mix}
    <p class="status">Loading maturity mix for {asOfLabel}…</p>
  {:else if !mix.ok}
    <p class="status">{mix.message}</p>
  {:else if view && spec}
    <p class="summary">{latest}</p>
    <div class="group" role="group" aria-label="Range">
      {#each SOMA_MIX_RANGES as r}
        <button
          type="button"
          class="toggle"
          aria-pressed={r === range}
          on:click={() => (range = r)}>{r.label}</button
        >
      {/each}
    </div>
    <PlotlyChart {spec} {label} testid="mix-plot" />
    <ul class="legend">
      {#each SOMA_MIX_BUCKETS as bucket, i}
        <li>
          <span class="swatch" style="background: {SOMA_MIX_COLORS[i]}" />
          {bucket}
        </li>
      {/each}
      <li>
        <span class="line" style="background: {SOMA_MIX_AVG_COLOR}" />
        Average maturity (right axis)
      </li>
    </ul>
    <p class="caption">
      {SOMA_HISTORY_LABEL}. Treasuries only: bills, notes, bonds, TIPS and FRNs.
      Each bar is the last week of its quarter, {view.firstQuarter} to {asOfLabel};
      securities that have matured by that week are excluded. Source: the
      Fintekkers ledger.
    </p>
    <div class="finding-grid">
      {#each view.findings as finding}
        <div class="finding">
          <span class="figure">{finding.figure}</span>
          <h3>{finding.title}</h3>
          <p>{finding.body}</p>
        </div>
      {/each}
    </div>
  {/if}
</section>

<style>
  .mix {
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
    overflow-wrap: anywhere;
  }
  .summary {
    color: var(--ink);
  }
  .group {
    display: inline-flex;
    align-self: flex-start;
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
  .line {
    width: 16px;
    height: 3px;
    border-radius: 2px;
  }
  .finding-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 16px;
  }
  .finding {
    border: 1px solid var(--line);
    border-radius: 10px;
    padding: 18px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-width: 0;
  }
  .figure {
    font-family: var(--mono);
    font-size: 24px;
    font-weight: 500;
    color: var(--accent);
    overflow-wrap: anywhere;
  }
  .finding h3 {
    margin: 0;
    font-weight: 700;
    font-size: 16px;
  }
  .finding p {
    margin: 0;
    font-size: 14px;
    line-height: 1.6;
    color: var(--muted);
  }
</style>
