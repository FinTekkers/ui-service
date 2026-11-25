<!-- /free/spy chart 1: SPY's daily shares outstanding, as stored in
     SecurityMetricService (State Street figures, loaded by MDI-154). 1Y, 5Y
     and All slice the one series, as Holdings over time does on /free/soma;
     a range the series can't fill is disabled, with a note. -->
<script lang="ts">
  import { somaXTicks } from "$lib/free/soma";
  import {
    SPY_RANGES,
    dateLabel,
    groupDigits,
    niceTicks,
    spyRangeWindow,
    type Section,
    type SpyPoint,
    type SpyRangeLabel,
  } from "$lib/free/spy";

  export let shares: Section<SpyPoint[]>;
  /** The page's date (ISO): every range ends here. */
  export let asOf: string;

  const W = 720;
  const H = 320;
  const LEFT = 72;
  const RIGHT = 12;
  const TOP = 12;
  // Room under the plot for the slanted tick labels and the axis title.
  const BOTTOM = 88;
  const X_LABEL_Y = H - BOTTOM + 14;
  const B = 1e9;
  // At most this many points are drawn: about one per viewBox unit.
  const MAX_DRAWN = W - LEFT - RIGHT;

  let selected: SpyRangeLabel = "All";

  $: windows = shares.ok
    ? SPY_RANGES.map((range) => ({
        range,
        ...spyRangeWindow(shares.ok ? shares.data : [], range, asOf),
      }))
    : [];
  $: active =
    windows.find((w) => w.range.label === selected && w.enabled) ??
    windows.find((w) => w.range.years === null);
  $: chart =
    active && active.points.length
      ? draw(active.points, active.range.label)
      : null;

  /** Every k-th point plus the last, so a 20-year path stays small. */
  function thin(points: SpyPoint[]): SpyPoint[] {
    if (points.length <= MAX_DRAWN) return points;
    const k = Math.ceil(points.length / MAX_DRAWN);
    const kept = points.filter((_, i) => i % k === 0);
    if (kept[kept.length - 1] !== points[points.length - 1]) {
      kept.push(points[points.length - 1]);
    }
    return kept;
  }

  function draw(points: SpyPoint[], range: SpyRangeLabel) {
    const shown = thin(points);
    const series = shown.length === 1 ? [shown[0], shown[0]] : shown;
    const values = points.map(([, v]) => Number(v) / B);
    const yTicks = niceTicks(Math.min(...values), Math.max(...values));
    const lo = yTicks[0];
    const hi = yTicks[yTicks.length - 1];
    const x = (i: number) =>
      LEFT + (i * (W - LEFT - RIGHT)) / (series.length - 1);
    const y = (b: number) =>
      TOP + (1 - (b - lo) / (hi - lo)) * (H - TOP - BOTTOM);
    const d = series
      .map(
        ([, v], i) =>
          `${i ? "L" : "M"}${x(i).toFixed(1)},${y(Number(v) / B).toFixed(1)}`
      )
      .join("");
    const ticks = somaXTicks(
      series.map(([date]) => date),
      range
    );
    // All's first label is a part-year (the series starts May 2006); drop
    // it when it would run into the next one.
    if (
      ticks.length > 1 &&
      (ticks[1].index - ticks[0].index) / series.length < 0.03
    ) {
      ticks.shift();
    }
    const xTicks = ticks.map((t, i) => ({
      x: x(t.index),
      label: t.label,
      alt: i % 2 === 1,
    }));
    const first = points[0];
    const last = points[points.length - 1];
    return {
      range,
      d,
      yTicks: yTicks.map((b) => ({
        y: y(b),
        label: `${Number(b.toFixed(2))}B`,
      })),
      xTicks,
      first,
      last,
      label: `Shares outstanding, ${range}: from ${groupDigits(
        first[1]
      )} on ${dateLabel(first[0])} to ${groupDigits(last[1])} on ${dateLabel(
        last[0]
      )}`,
    };
  }
</script>

<section aria-labelledby="spy-shares-title" class="panel">
  <div class="panel-top">
    <h2 id="spy-shares-title" class="panel-title">
      Shares outstanding over time
    </h2>
    <div role="group" aria-label="Time range" class="ranges">
      {#if windows.length}
        {#each windows as w}
          <button
            type="button"
            disabled={!w.enabled}
            aria-pressed={w === active ? "true" : "false"}
            aria-describedby={w.note
              ? `spy-shares-note-${w.range.label}`
              : undefined}
            on:click={() => (selected = w.range.label)}>{w.range.label}</button
          >
        {/each}
      {:else}
        {#each SPY_RANGES as range}
          <button
            type="button"
            disabled
            aria-pressed={range.years === null ? "true" : "false"}
            >{range.label}</button
          >
        {/each}
      {/if}
    </div>
  </div>
  {#if !shares.ok}
    <p class="status">{shares.message}</p>
  {:else if chart}
    <svg
      role="img"
      aria-label={chart.label}
      viewBox="0 0 {W} {H}"
      class:thin={chart.range !== "1Y"}
    >
      {#each chart.yTicks as tick}
        <line class="grid" x1={LEFT} x2={W - RIGHT} y1={tick.y} y2={tick.y} />
        <text class="tick" x={LEFT - 8} y={tick.y + 4} text-anchor="end"
          >{tick.label}</text
        >
      {/each}
      <path class="line" d={chart.d} data-testid="spy-shares-line" />
      {#each chart.xTicks as tick}
        <text
          class="tick"
          class:alt={tick.alt}
          x={tick.x}
          y={X_LABEL_Y}
          text-anchor="end"
          transform="rotate(-45 {tick.x} {X_LABEL_Y})">{tick.label}</text
        >
      {/each}
      <text
        class="axis-title"
        x={14}
        y={TOP + (H - TOP - BOTTOM) / 2}
        text-anchor="middle"
        transform="rotate(-90 14 {TOP + (H - TOP - BOTTOM) / 2})"
        >Shares outstanding (billions)</text
      >
      <text
        class="axis-title"
        x={(LEFT + W - RIGHT) / 2}
        y={H - 6}
        text-anchor="middle">Date</text
      >
    </svg>
    <ul class="legend">
      <li><span class="swatch line-swatch" />Shares outstanding, daily</li>
    </ul>
    <p class="caption">
      Daily, {dateLabel(chart.first[0])} to {dateLabel(chart.last[0])}. Source:
      State Street, via the Fintekkers SecurityMetric service.
    </p>
  {/if}
  {#each windows.filter((w) => w.note) as w}
    <p id="spy-shares-note-{w.range.label}" class="note">{w.note}</p>
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
  .ranges button:focus-visible {
    outline: 2px solid var(--ink);
    outline-offset: 2px;
  }
  .ranges button[aria-pressed="true"] {
    background: #ffffff;
    color: var(--ink);
    font-weight: 500;
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
  svg {
    display: block;
    width: 100%;
    height: auto;
  }
  .grid {
    stroke: #eef0f3;
    stroke-width: 1;
  }
  .line {
    fill: none;
    stroke: #2f5bb7;
    stroke-width: 2;
    stroke-linejoin: round;
  }
  .tick,
  .axis-title {
    font-family: var(--mono);
    font-size: 12px;
    fill: var(--muted);
  }
  /* At phone widths 5Y and All keep every other label. */
  @media (max-width: 479px) {
    svg.thin .alt {
      display: none;
    }
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
