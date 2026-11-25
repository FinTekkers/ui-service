<!-- /free/spy chart 3: estimated sponsor fee revenue per month, derived on
     the server from stored TOTAL_NET_ASSETS and a stored expense-ratio
     series. No expense-ratio series is stored yet, so the live page shows
     this chart's reason instead; a ratio is never defaulted. A null month
     is a gap, never a zero bar. -->
<script lang="ts">
  import { somaXTicks } from "$lib/free/soma";
  import {
    SPY_FEE_NOTE,
    SPY_FORMULAS,
    compactDollars,
    monthLabel,
    niceTicks,
    type Section,
    type SpyFeeMonth,
  } from "$lib/free/spy";

  export let fees: Section<SpyFeeMonth[]>;

  const W = 720;
  const H = 320;
  const LEFT = 72;
  const RIGHT = 12;
  const TOP = 12;
  const BOTTOM = 88;
  const X_LABEL_Y = H - BOTTOM + 14;
  const PLOT_H = H - TOP - BOTTOM;
  const M = 1e6;
  const FEE = "#5b8def";

  $: chart = fees.ok && fees.data.length ? draw(fees.data) : null;

  function draw(months: SpyFeeMonth[]) {
    const values = months.flatMap((m) =>
      m.fee === null ? [] : [Number(m.fee) / M]
    );
    const ticks = niceTicks(0, values.length ? Math.max(...values) : 1);
    const top = ticks[ticks.length - 1];
    const y = (v: number) => TOP + (1 - v / top) * PLOT_H;
    const band = (W - LEFT - RIGHT) / months.length;
    const w = Math.max(1, band * 0.7);
    const cx = (i: number) => LEFT + band * (i + 0.5);
    const bars = months.flatMap((m, i) =>
      m.fee === null
        ? []
        : [
            {
              x: cx(i) - w / 2,
              y: y(Number(m.fee) / M),
              h: y(0) - y(Number(m.fee) / M),
            },
          ]
    );
    const xTicks = somaXTicks(
      months.map((m) => `${m.month}-01`),
      months.length > 24 ? "All" : "1Y"
    ).map((t) => ({ x: cx(t.index), label: t.label }));
    return {
      w,
      bars,
      yTicks: ticks.map((v) => ({ y: y(v), label: compactDollars(v * M) })),
      xTicks,
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
    <svg
      role="img"
      aria-label="Estimated SPY sponsor fee revenue per month, {monthLabel(
        chart.first
      )} to {monthLabel(chart.last)}"
      viewBox="0 0 {W} {H}"
    >
      {#each chart.yTicks as tick}
        <line class="grid" x1={LEFT} x2={W - RIGHT} y1={tick.y} y2={tick.y} />
        <text class="tick" x={LEFT - 8} y={tick.y + 4} text-anchor="end"
          >{tick.label}</text
        >
      {/each}
      {#each chart.bars as bar}
        <rect x={bar.x} y={bar.y} width={chart.w} height={bar.h} fill={FEE} />
      {/each}
      {#each chart.xTicks as tick}
        <text
          class="tick"
          x={tick.x}
          y={X_LABEL_Y}
          text-anchor="end"
          transform="rotate(-45 {tick.x} {X_LABEL_Y})">{tick.label}</text
        >
      {/each}
      <text
        class="axis-title"
        x={14}
        y={TOP + PLOT_H / 2}
        text-anchor="middle"
        transform="rotate(-90 14 {TOP + PLOT_H / 2})"
        >Fee revenue per month</text
      >
      <text
        class="axis-title"
        x={(LEFT + W - RIGHT) / 2}
        y={H - 6}
        text-anchor="middle">Month</text
      >
    </svg>
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
  svg {
    display: block;
    width: 100%;
    height: auto;
  }
  .grid {
    stroke: #eef0f3;
    stroke-width: 1;
  }
  .tick,
  .axis-title {
    font-family: var(--mono);
    font-size: 12px;
    fill: var(--muted);
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
