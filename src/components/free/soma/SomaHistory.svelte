<!-- Section 5 of /free/soma: Holdings over time (US-317). SOMA's Treasury
     par at every H.4.1 Wednesday the ledger holds, up to the page's week,
     stacked by type. The server load streams it after the rest of the page:
     `history` is null while it loads. 1Y, 5Y and All slice the one series
     here; a range the ledger can't fill is disabled, with a note. -->
<script lang="ts">
  import {
    SOMA_HISTORY_LABEL,
    SOMA_RANGES,
    SOMA_STACKS,
    SOMA_STACK_LABELS,
    rangeWindow,
    weekLabel,
    type Section,
    type SomaHistoryPoint,
    type SomaHistoryView,
    type SomaStack,
  } from "$lib/free/soma";

  export let history: Section<SomaHistoryView> | null;
  /** The page's week (ISO): every range ends here. */
  export let asOf: string;
  export let asOfLabel: string;

  const COLORS: Record<SomaStack, string> = {
    bills: "#B9D0FA",
    notesBonds: "#5B8DEF",
    tips: "#2F5BB7",
    frns: "#E8A33D",
  };
  const W = 720;
  const H = 280;
  const LEFT = 56;
  const RIGHT = 12;
  const TOP = 12;
  const BOTTOM = 28;
  const T = 1e12;

  let selected = "All";

  $: windows =
    history && history.ok
      ? SOMA_RANGES.map((range) => ({
          range,
          ...rangeWindow(history.data, range, asOf),
        }))
      : [];
  // A range disabled for this week falls back to All.
  $: active =
    windows.find((w) => w.range.label === selected && w.enabled) ??
    windows.find((w) => w.range.weeks === null);
  $: chart =
    active && active.points.length
      ? draw(active.points, active.range.label)
      : null;

  /** $ trillions, e.g. "$4.472T". */
  function trillions(dollars: string): string {
    return `$${(Number(dollars) / T).toFixed(3)}T`;
  }

  function draw(points: SomaHistoryPoint[], range: string) {
    // One week still draws across the plot.
    const series = points.length === 1 ? [points[0], points[0]] : points;
    const max = Math.max(...points.map((p) => Number(p.total) / T));
    const step = [0.25, 0.5, 1, 2, 5].find((s) => max / s <= 5) ?? 10;
    const top = Math.max(step, Math.ceil(max / step) * step);
    const x = (i: number) =>
      LEFT + (i * (W - LEFT - RIGHT)) / (series.length - 1);
    const y = (t: number) => TOP + (1 - t / top) * (H - TOP - BOTTOM);
    const xy = (i: number, t: number) =>
      `${x(i).toFixed(1)},${y(t).toFixed(1)}`;

    const lower = series.map(() => 0);
    const areas = SOMA_STACKS.map((stack) => {
      const upper = series.map((p, i) => lower[i] + Number(p.par[stack]) / T);
      const top = upper.map((t, i) => xy(i, t));
      const bottom = lower.map((t, i) => xy(i, t)).reverse();
      upper.forEach((t, i) => (lower[i] = t));
      return { stack, d: `M${top.join("L")}L${bottom.join("L")}Z` };
    });
    const yTicks = [];
    for (let t = 0; t <= top + 1e-9; t += step) {
      yTicks.push({ y: y(t), label: `$${Number(t.toFixed(2))}T` });
    }
    const xTicks = series.flatMap((p, i) =>
      i > 0 && p.week.slice(0, 4) !== series[i - 1].week.slice(0, 4)
        ? [{ x: x(i), label: p.week.slice(0, 4) }]
        : []
    );
    const first = points[0];
    const last = points[points.length - 1];
    return {
      areas,
      yTicks,
      xTicks,
      first,
      last,
      label: `Holdings over time, ${range}: Treasury par from ${trillions(
        first.total
      )} on ${weekLabel(first.week)} to ${trillions(last.total)} on ${weekLabel(
        last.week
      )}, stacked by bills, notes and bonds, TIPS and FRNs`,
    };
  }
</script>

<section aria-labelledby="hist-title" class="history">
  <div class="panel-top">
    <h2 id="hist-title" class="panel-title">Holdings over time</h2>
    <div role="group" aria-label="Time range" class="ranges">
      {#if windows.length}
        {#each windows as w}
          <button
            type="button"
            disabled={!w.enabled}
            aria-pressed={w === active ? "true" : "false"}
            aria-describedby={w.note ? `hist-note-${w.range.label}` : undefined}
            on:click={() => (selected = w.range.label)}>{w.range.label}</button
          >
        {/each}
      {:else}
        {#each SOMA_RANGES as range}
          <button
            type="button"
            disabled
            aria-pressed={range.weeks === null ? "true" : "false"}
            >{range.label}</button
          >
        {/each}
      {/if}
    </div>
  </div>
  {#if history === null}
    <p class="status">Loading holdings over time for {asOfLabel}…</p>
  {:else if !history.ok}
    <p class="status">{history.message}</p>
  {:else if chart}
    <p class="summary">
      Latest: {trillions(chart.last.total)} on {asOfLabel}
    </p>
    <svg role="img" aria-label={chart.label} viewBox="0 0 {W} {H}">
      {#each chart.yTicks as tick}
        <line class="grid" x1={LEFT} x2={W - RIGHT} y1={tick.y} y2={tick.y} />
        <text class="tick" x={LEFT - 8} y={tick.y + 4} text-anchor="end"
          >{tick.label}</text
        >
      {/each}
      {#each chart.areas as area}
        <path d={area.d} fill={COLORS[area.stack]} data-stack={area.stack} />
      {/each}
      {#each chart.xTicks as tick}
        <text class="tick" x={tick.x} y={H - 8} text-anchor="middle"
          >{tick.label}</text
        >
      {/each}
    </svg>
    <ul class="legend">
      {#each SOMA_STACKS as stack}
        <li>
          <span class="swatch" style="background: {COLORS[stack]}" />
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
  }
  .panel-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 12px;
  }
  .panel-title {
    margin: 0;
    font-weight: 700;
    font-size: 18px;
  }
  .ranges {
    display: flex;
    gap: 4px;
    background: #f0f2f5;
    padding: 4px;
    border-radius: 8px;
  }
  .ranges button {
    min-height: 36px;
    padding: 0 12px;
    border: 0;
    border-radius: 6px;
    background: transparent;
    font-family: var(--mono);
    font-size: 13px;
    color: var(--muted);
  }
  .ranges button:not(:disabled) {
    cursor: pointer;
  }
  .ranges button[aria-pressed="true"] {
    background: #ffffff;
    color: var(--ink);
    font-weight: 500;
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
  svg {
    display: block;
    width: 100%;
    height: auto;
  }
  .grid {
    stroke: #eef0f3;
    stroke-width: 1;
  }
  .tick {
    font-family: var(--mono);
    font-size: 12px;
    fill: var(--muted);
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
