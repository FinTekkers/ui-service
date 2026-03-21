<script lang="ts">
  import DashboardSideBar from '../../../../components/DashboardSideBar.svelte';
  export let data: import('./$types').PageData;

  type CurvePoint = { tenor: string; years: number; yield: number };

  $: par = (data.par ?? []) as CurvePoint[];
  $: spot = (data.spot ?? []) as CurvePoint[];
  $: forward = (data.forward ?? []) as CurvePoint[];
  $: curveDate = (data.curveDate ?? '') as string;
  $: note = (data.note ?? '') as string;

  // Chart config
  const W = 720;
  const H = 380;
  const pad = { top: 35, right: 30, bottom: 55, left: 55 };
  const plotW = W - pad.left - pad.right;
  const plotH = H - pad.top - pad.bottom;

  // Use par curve years for X-axis (all 3 curves align on years)
  $: xPoints = par.map(p => p.years);
  $: xMin = Math.min(...xPoints, 0.5);
  $: xMax = Math.max(...xPoints, 30);
  $: xRange = xMax - xMin;

  // Y-axis: find global min/max across all curves
  $: allYields = [...par.map(p => p.yield), ...spot.map(p => p.yield), ...forward.map(p => p.yield)];
  $: yMin = Math.floor(Math.min(...allYields) * 2) / 2;  // round down to 0.5
  $: yMax = Math.ceil(Math.max(...allYields) * 2) / 2 + 0.5;  // round up + headroom
  $: yRange = yMax - yMin;

  function xScale(years: number): number {
    return pad.left + ((years - xMin) / xRange) * plotW;
  }
  function yScale(y: number): number {
    return pad.top + plotH - ((y - yMin) / yRange) * plotH;
  }

  function toPolyline(points: CurvePoint[]): string {
    return points.map(p => `${xScale(p.years)},${yScale(p.yield)}`).join(' ');
  }

  $: parLine = toPolyline(par);
  $: spotLine = toPolyline(spot);
  $: forwardLine = toPolyline(forward);

  // Y ticks at 0.5% intervals
  $: yTicks = (() => {
    const ticks = [];
    for (let t = yMin; t <= yMax; t += 0.5) ticks.push(Math.round(t * 100) / 100);
    return ticks;
  })();

  // X labels from par tenors
  $: xLabels = par.map(p => ({ years: p.years, label: p.tenor }));

  // Hover: find nearest X position across all tenors
  let hoveredYears: number | null = null;

  function findAt(curve: CurvePoint[], years: number): CurvePoint | undefined {
    return curve.find(p => Math.abs(p.years - years) < 0.01);
  }

  $: hoveredPar = hoveredYears !== null ? findAt(par, hoveredYears) : null;
  $: hoveredSpot = hoveredYears !== null ? findAt(spot, hoveredYears) : null;
  $: hoveredFwd = hoveredYears !== null ? findAt(forward, hoveredYears) : null;

  // Build merged table data from par (primary) with spot and forward joined on years
  $: tableData = par.map(p => {
    const s = spot.find(sp => sp.years === p.years);
    const f = forward.find(fp => fp.years === p.years);
    return {
      tenor: p.tenor,
      years: p.years,
      parYield: p.yield,
      spotRate: s?.yield,
      forwardRate: f?.yield,
      forwardTenor: f?.tenor,
    };
  });
</script>

<div class="w-screen h-full flex">
  <DashboardSideBar {data} />

  <div class="h-full w-full dashboard-container">
    <div class="portfolio_container px-10 py-7">
      <h2 class="text-3xl font-extrabold my-3">Treasury Yield Curves</h2>

      <div class="mock-banner">
        &#x26A0; MOCK DATA — values from {curveDate}, not live
      </div>

      <!-- Multi-line chart -->
      <div class="chart-box">
        <svg viewBox="0 0 {W} {H}" class="curves-chart">
          <!-- Grid -->
          {#each yTicks as tick}
            {@const y = yScale(tick)}
            <line x1={pad.left} y1={y} x2={pad.left + plotW} y2={y} stroke="#164e63" stroke-width="0.5" />
            <text x={pad.left - 8} y={y + 4} text-anchor="end" fill="#a0adb7" font-size="11">{tick.toFixed(1)}%</text>
          {/each}

          <!-- X-axis -->
          <line x1={pad.left} y1={pad.top + plotH} x2={pad.left + plotW} y2={pad.top + plotH} stroke="#164e63" stroke-width="1" />
          {#each xLabels as xl}
            <text x={xScale(xl.years)} y={pad.top + plotH + 18} text-anchor="middle" fill="#a0adb7" font-size="11">{xl.label}</text>
          {/each}

          <!-- Par curve (blue, solid) -->
          <polyline points={parLine} fill="none" stroke="#60a5fa" stroke-width="2.5" stroke-linejoin="round" />
          <!-- Spot curve (green, dashed) -->
          <polyline points={spotLine} fill="none" stroke="#7cd2ba" stroke-width="2.5" stroke-dasharray="8,4" stroke-linejoin="round" />
          <!-- Forward curve (orange, dotted) -->
          <polyline points={forwardLine} fill="none" stroke="#f59e0b" stroke-width="2.5" stroke-dasharray="3,3" stroke-linejoin="round" />

          <!-- Hover hit zones on par X points -->
          {#each par as p}
            <rect
              x={xScale(p.years) - 15} y={pad.top} width="30" height={plotH}
              fill="transparent"
              on:mouseenter={() => hoveredYears = p.years}
              on:mouseleave={() => hoveredYears = null}
            />
          {/each}

          <!-- Hover dots + tooltip -->
          {#if hoveredYears !== null}
            {@const hx = xScale(hoveredYears)}
            <line x1={hx} y1={pad.top} x2={hx} y2={pad.top + plotH} stroke="#ffffff33" stroke-width="1" />

            {#if hoveredPar}
              <circle cx={hx} cy={yScale(hoveredPar.yield)} r="5" fill="#60a5fa" stroke="white" stroke-width="1.5" />
            {/if}
            {#if hoveredSpot}
              <circle cx={hx} cy={yScale(hoveredSpot.yield)} r="5" fill="#7cd2ba" stroke="white" stroke-width="1.5" />
            {/if}
            {#if hoveredFwd}
              <circle cx={hx} cy={yScale(hoveredFwd.yield)} r="5" fill="#f59e0b" stroke="white" stroke-width="1.5" />
            {/if}

            <!-- Tooltip box -->
            {@const tooltipX = hx < W / 2 ? hx + 12 : hx - 132}
            <rect x={tooltipX} y={pad.top + 4} width="120" height="62" rx="4" fill="#0c3a46ee" stroke="#164e63" />
            <text x={tooltipX + 8} y={pad.top + 20} fill="#a0adb7" font-size="10" font-weight="bold">
              {hoveredPar?.tenor ?? hoveredYears + 'Y'}
            </text>
            <text x={tooltipX + 8} y={pad.top + 35} fill="#60a5fa" font-size="11">Par: {hoveredPar?.yield.toFixed(3) ?? '—'}%</text>
            <text x={tooltipX + 8} y={pad.top + 49} fill="#7cd2ba" font-size="11">Spot: {hoveredSpot?.yield.toFixed(3) ?? '—'}%</text>
            <text x={tooltipX + 8} y={pad.top + 63} fill="#f59e0b" font-size="11">Fwd: {hoveredFwd?.yield.toFixed(3) ?? '—'}%</text>
          {/if}

          <!-- Legend -->
          <rect x={pad.left + 10} y={pad.top + 6} width="130" height="50" rx="4" fill="#0c3a46cc" />
          <line x1={pad.left + 18} y1={pad.top + 20} x2={pad.left + 38} y2={pad.top + 20} stroke="#60a5fa" stroke-width="2.5" />
          <text x={pad.left + 42} y={pad.top + 24} fill="#60a5fa" font-size="11">Par Curve</text>
          <line x1={pad.left + 18} y1={pad.top + 34} x2={pad.left + 38} y2={pad.top + 34} stroke="#7cd2ba" stroke-width="2.5" stroke-dasharray="8,4" />
          <text x={pad.left + 42} y={pad.top + 38} fill="#7cd2ba" font-size="11">Spot Curve</text>
          <line x1={pad.left + 18} y1={pad.top + 48} x2={pad.left + 38} y2={pad.top + 48} stroke="#f59e0b" stroke-width="2.5" stroke-dasharray="3,3" />
          <text x={pad.left + 42} y={pad.top + 52} fill="#f59e0b" font-size="11">Forward Curve</text>

          <!-- Y-axis label -->
          <text x={14} y={pad.top + plotH / 2} text-anchor="middle" fill="#a0adb7" font-size="12"
                transform="rotate(-90 14 {pad.top + plotH / 2})">Yield (%)</text>
        </svg>
      </div>

      <!-- Data table -->
      <div class="table-wrapper">
        <table class="text-left">
          <thead class="border-b border-slate-400">
            <tr>
              <th class="text-semibold px-4 py-2">Tenor</th>
              <th class="text-semibold px-4 py-2 par-col">Par Yield (%)</th>
              <th class="text-semibold px-4 py-2 spot-col">Spot Rate (%)</th>
              <th class="text-semibold px-4 py-2 fwd-col">Forward Rate (%)</th>
              <th class="text-semibold px-4 py-2">Forward Period</th>
            </tr>
          </thead>
          <tbody>
            {#each tableData as row}
              <tr
                class="table-row border-b border-slate-400"
                class:highlight-row={hoveredYears === row.years}
                on:mouseenter={() => hoveredYears = row.years}
                on:mouseleave={() => hoveredYears = null}
              >
                <td class="table-cell px-4 py-2"><strong>{row.tenor}</strong></td>
                <td class="table-cell px-4 py-2 par-col">{row.parYield.toFixed(3)}</td>
                <td class="table-cell px-4 py-2 spot-col">{row.spotRate?.toFixed(3) ?? '—'}</td>
                <td class="table-cell px-4 py-2 fwd-col">{row.forwardRate?.toFixed(3) ?? '—'}</td>
                <td class="table-cell px-4 py-2">{row.forwardTenor ?? '—'}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>
  </div>
</div>

<style lang="scss">
  @import "../../../../styles/grid-table";

  .dashboard-container {
    background-color: $primary-color;
    overflow: auto;
  }

  .mock-banner {
    background-color: #78350f;
    color: #fef3c7;
    padding: 10px 16px;
    border-radius: 4px;
    font-size: 0.85rem;
    font-weight: 600;
    margin-bottom: 16px;
  }

  .chart-box {
    background-color: $bgc-color;
    border-radius: 6px;
    padding: 20px;
    margin-bottom: 20px;
  }

  .curves-chart {
    width: 100%;
    max-width: 720px;
    height: auto;

    rect[fill="transparent"] { cursor: crosshair; }
  }

  .table-wrapper {
    overflow-x: auto;
  }

  .par-col { color: #60a5fa; font-weight: 600; font-variant-numeric: tabular-nums; }
  .spot-col { color: #7cd2ba; font-weight: 600; font-variant-numeric: tabular-nums; }
  .fwd-col { color: #f59e0b; font-weight: 600; font-variant-numeric: tabular-nums; }

  .highlight-row { background-color: $bgc-color !important; }
</style>
