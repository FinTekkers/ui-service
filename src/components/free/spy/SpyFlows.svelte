<!-- /free/spy chart 2: each month's change in SPY's AUM, stacked as net
     flows and market move (positive up, negative down), with month-end AUM
     as a line on the right axis. Every figure is derived on the server
     (src/lib/server/free-spy.ts) from the stored SHARES_OUTSTANDING,
     NAV_PER_SHARE and TOTAL_NET_ASSETS series; a null month is a gap,
     never a zero bar. -->
<script lang="ts">
  import { somaXTicks } from "$lib/free/soma";
  import {
    SPY_FORMULAS,
    compactDollars,
    monthLabel,
    niceTicks,
    type Section,
    type SpyMonth,
  } from "$lib/free/spy";

  export let flows: Section<SpyMonth[]>;

  const W = 720;
  const H = 336;
  const LEFT = 72;
  const RIGHT = 72;
  const TOP = 12;
  const BOTTOM = 88;
  const X_LABEL_Y = H - BOTTOM + 14;
  const PLOT_H = H - TOP - BOTTOM;
  const B = 1e9;
  const NET = "#2f5bb7";
  const MARKET = "#e8a33d";

  $: chart = flows.ok && flows.data.length ? draw(flows.data) : null;
  // The latest month with every figure, as display strings.
  $: latest = flows.ok ? latestComplete(flows.data) : null;

  function latestComplete(months: SpyMonth[]) {
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

  const num = (v: string | null) => (v === null ? null : Number(v) / B);

  function draw(months: SpyMonth[]) {
    const rows = months.map((m) => ({
      month: m.month,
      net: num(m.netFlows),
      market: num(m.marketMove),
      aum: num(m.aumEnd),
    }));
    let lo = 0;
    let hi = 0;
    for (const r of rows) {
      const parts = [r.net ?? 0, r.market ?? 0];
      hi = Math.max(
        hi,
        parts.filter((v) => v > 0).reduce((a, b) => a + b, 0)
      );
      lo = Math.min(
        lo,
        parts.filter((v) => v < 0).reduce((a, b) => a + b, 0)
      );
    }
    const left = niceTicks(lo, hi);
    const l0 = left[0];
    const l1 = left[left.length - 1];
    const y = (b: number) => TOP + (1 - (b - l0) / (l1 - l0)) * PLOT_H;
    const aums = rows.flatMap((r) => (r.aum === null ? [] : [r.aum]));
    const right = niceTicks(0, aums.length ? Math.max(...aums) : 1);
    const r1 = right[right.length - 1];
    const yRight = (b: number) => TOP + (1 - b / r1) * PLOT_H;

    const band = (W - LEFT - RIGHT) / rows.length;
    const barW = Math.max(1, band * 0.7);
    const cx = (i: number) => LEFT + band * (i + 0.5);

    const bars: {
      x: number;
      y: number;
      w: number;
      h: number;
      fill: string;
      kind: string;
    }[] = [];
    rows.forEach((r, i) => {
      let up = 0;
      let down = 0;
      for (const [kind, v, fill] of [
        ["net", r.net, NET],
        ["market", r.market, MARKET],
      ] as const) {
        if (v === null || v === 0) continue;
        const from = v > 0 ? up : down;
        const to = from + v;
        if (v > 0) up = to;
        else down = to;
        bars.push({
          x: cx(i) - barW / 2,
          y: Math.min(y(from), y(to)),
          w: barW,
          h: Math.abs(y(from) - y(to)),
          fill,
          kind,
        });
      }
    });

    // The AUM line breaks at a null month instead of joining across it.
    let aumPath = "";
    let pen = false;
    rows.forEach((r, i) => {
      if (r.aum === null) {
        pen = false;
        return;
      }
      aumPath += `${pen ? "L" : "M"}${cx(i).toFixed(1)},${yRight(r.aum).toFixed(
        1
      )}`;
      pen = true;
    });

    const xTicks = somaXTicks(
      rows.map((r) => `${r.month}-01`),
      rows.length > 24 ? "All" : "1Y"
    ).map((t) => ({ x: cx(t.index), label: t.label }));

    return {
      bars,
      aumPath,
      zeroY: y(0),
      leftTicks: left.map((b) => ({ y: y(b), label: compactDollars(b * B) })),
      rightTicks: right.map((b) => ({
        y: yRight(b),
        label: compactDollars(b * B),
      })),
      xTicks,
      first: rows[0].month,
      last: rows[rows.length - 1].month,
    };
  }
</script>

<section aria-labelledby="spy-flows-title" class="panel">
  <h2 id="spy-flows-title" class="panel-title">
    Monthly AUM change: net flows vs market move
  </h2>
  {#if !flows.ok}
    <p class="status">{flows.message}</p>
  {:else if !chart}
    <p class="status">Unavailable: no months of SPY data are stored.</p>
  {:else}
    {#if latest}
      <p class="summary">
        {latest.month}: ΔAUM {latest.deltaAum} = net flows {latest.netFlows} + market
        move {latest.marketMove}; month-end AUM {latest.aumEnd}
      </p>
    {/if}
    <svg
      role="img"
      aria-label="Monthly change in SPY's assets under management, {monthLabel(
        chart.first
      )} to {monthLabel(
        chart.last
      )}, stacked as net flows and market move, with month-end AUM as a line"
      viewBox="0 0 {W} {H}"
    >
      {#each chart.leftTicks as tick}
        <line class="grid" x1={LEFT} x2={W - RIGHT} y1={tick.y} y2={tick.y} />
        <text class="tick" x={LEFT - 8} y={tick.y + 4} text-anchor="end"
          >{tick.label}</text
        >
      {/each}
      {#each chart.rightTicks as tick}
        <text class="tick" x={W - RIGHT + 8} y={tick.y + 4}>{tick.label}</text>
      {/each}
      {#each chart.bars as bar}
        <rect
          x={bar.x}
          y={bar.y}
          width={bar.w}
          height={bar.h}
          fill={bar.fill}
          data-kind={bar.kind}
        />
      {/each}
      <line
        class="zero"
        x1={LEFT}
        x2={W - RIGHT}
        y1={chart.zeroY}
        y2={chart.zeroY}
      />
      <path class="aum" d={chart.aumPath} data-testid="spy-aum-line" />
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
        >Monthly change in AUM</text
      >
      <text
        class="axis-title"
        x={W - 10}
        y={TOP + PLOT_H / 2}
        text-anchor="middle"
        transform="rotate(90 {W - 10} {TOP + PLOT_H / 2})">Month-end AUM</text
      >
      <text
        class="axis-title"
        x={(LEFT + W - RIGHT) / 2}
        y={H - 6}
        text-anchor="middle">Month</text
      >
    </svg>
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
    <li>{SPY_FORMULAS.aum}</li>
    <li>{SPY_FORMULAS.flows}</li>
    <li>{SPY_FORMULAS.market}</li>
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
  svg {
    display: block;
    width: 100%;
    height: auto;
  }
  .grid {
    stroke: #eef0f3;
    stroke-width: 1;
  }
  .zero {
    stroke: var(--muted);
    stroke-width: 1;
  }
  .aum {
    fill: none;
    stroke: var(--ink);
    stroke-width: 1.5;
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
