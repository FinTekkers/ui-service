<!-- Section 5 of /free/soma: Holdings over time (US-317). SOMA's Treasury
     par at every H.4.1 Wednesday the ledger holds, up to the page's week,
     stacked by type. The server load streams it after the rest of the page:
     `history` is null while it loads. US-337: drawn by Plotly, with 1Y, 5Y
     and All range buttons and a hover showing the week's values; the stack
     stays zero-based. A range the ledger can't fill keeps its note. -->
<script lang="ts">
  import PlotlyChart from "../PlotlyChart.svelte";
  import { somaHistorySpec } from "$lib/free/charts";
  import {
    SOMA_HISTORY_LABEL,
    SOMA_RANGES,
    SOMA_STACKS,
    SOMA_STACK_COLORS,
    SOMA_STACK_LABELS,
    rangeWindow,
    weekLabel,
    type Section,
    type SomaHistoryPoint,
    type SomaHistoryView,
  } from "$lib/free/soma";

  export let history: Section<SomaHistoryView> | null;
  /** The page's week (ISO): every range ends here. */
  export let asOf: string;
  export let asOfLabel: string;

  const T = 1e12;

  $: windows =
    history && history.ok
      ? SOMA_RANGES.map((range) => ({
          range,
          ...rangeWindow(history.data, range, asOf),
        }))
      : [];
  $: points = windows.find((w) => w.range.weeks === null)?.points ?? [];
  $: chart = points.length ? draw(points) : null;

  /** $ trillions, e.g. "$4.472T". */
  function trillions(dollars: string): string {
    return `$${(Number(dollars) / T).toFixed(3)}T`;
  }

  function draw(points: SomaHistoryPoint[]) {
    const first = points[0];
    const last = points[points.length - 1];
    return {
      spec: somaHistorySpec(points),
      first,
      last,
      label: `Holdings over time: Treasury par from ${trillions(
        first.total
      )} on ${weekLabel(first.week)} to ${trillions(last.total)} on ${weekLabel(
        last.week
      )}, stacked by bills, notes and bonds, TIPS and FRNs`,
    };
  }
</script>

<section aria-labelledby="hist-title" class="history">
  <h2 id="hist-title" class="panel-title">Holdings over time</h2>
  {#if history === null}
    <p class="status">Loading holdings over time for {asOfLabel}…</p>
  {:else if !history.ok}
    <p class="status">{history.message}</p>
  {:else if chart}
    <p class="summary">
      Latest: {trillions(chart.last.total)} on {asOfLabel}
    </p>
    <PlotlyChart spec={chart.spec} label={chart.label} testid="hist-plot" />
    <ul class="legend">
      {#each SOMA_STACKS as stack}
        <li>
          <span class="swatch" style="background: {SOMA_STACK_COLORS[stack]}" />
          {SOMA_STACK_LABELS[stack]}
        </li>
      {/each}
    </ul>
    <p class="caption">
      {SOMA_HISTORY_LABEL}, weekly, {weekLabel(chart.first.week)} to {asOfLabel}.
      Source: the Fintekkers ledger.
    </p>
  {/if}
  {#each windows.filter((w) => w.note) as w}
    <p id="hist-note-{w.range.label}" class="note">{w.note}</p>
  {/each}
</section>

<style>
  .history {
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
  .caption,
  .note {
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
</style>
