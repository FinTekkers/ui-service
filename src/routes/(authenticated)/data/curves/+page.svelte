<script lang="ts">
  import { onMount } from 'svelte';
  import DashboardSideBar from '../../../../components/DashboardSideBar.svelte';
  export let data: import('./$types').PageData;

  type CurvePoint = { tenor: string; years: number; yield: number };

  $: par = (data.par ?? []) as CurvePoint[];
  $: spot = (data.spot ?? []) as CurvePoint[];
  $: forward = (data.forward ?? []) as CurvePoint[];
  $: curveDate = (data.curveDate ?? '') as string;

  let asofInput: string = data.curveDate ?? new Date().toISOString().slice(0, 10);

  function handleAsofChange() {
    if (asofInput) {
      window.location.href = `/data/curves?asof=${asofInput}`;
    }
  }

  let chartEl: HTMLDivElement;

  onMount(async () => {
    if (!chartEl || par.length === 0) return;
    const Plotly: any = (await import('plotly.js-dist') as any).default ?? (await import('plotly.js-dist'));
    const traces = [
      {
        x: par.map((p) => p.years),
        y: par.map((p) => p.yield),
        mode: 'lines+markers',
        line: { color: '#60a5fa', width: 2.5 },
        marker: { color: '#60a5fa', size: 6 },
        hovertemplate: '%{customdata}<br>Par: %{y:.3f}%<extra></extra>',
        customdata: par.map((p) => p.tenor),
        name: 'Par',
      },
      {
        x: spot.map((p) => p.years),
        y: spot.map((p) => p.yield),
        mode: 'lines+markers',
        line: { color: '#7cd2ba', width: 2.5, dash: 'dash' },
        marker: { color: '#7cd2ba', size: 6 },
        hovertemplate: 'Spot: %{y:.3f}%<extra></extra>',
        name: 'Spot',
      },
      {
        x: forward.map((p) => p.years),
        y: forward.map((p) => p.yield),
        mode: 'lines+markers',
        line: { color: '#f59e0b', width: 2.5, dash: 'dot' },
        marker: { color: '#f59e0b', size: 6 },
        hovertemplate: 'Fwd: %{y:.3f}%<extra></extra>',
        name: 'Forward',
      },
    ];
    const layout = {
      paper_bgcolor: '#0c3a46',
      plot_bgcolor: '#0c3a46',
      font: { color: '#a0adb7', size: 11 },
      margin: { t: 40, r: 30, b: 50, l: 60 },
      hovermode: 'x unified',
      legend: {
        orientation: 'h',
        x: 0,
        y: 1.12,
        font: { color: '#a0adb7' },
        bgcolor: 'rgba(0,0,0,0)',
      },
      xaxis: {
        gridcolor: '#164e63',
        title: { text: 'Tenor (years)', font: { color: '#a0adb7' } },
      },
      yaxis: {
        gridcolor: '#164e63',
        title: { text: 'Yield (%)', font: { color: '#a0adb7' } },
        ticksuffix: '%',
      },
    };
    Plotly.newPlot(chartEl, traces, layout, { responsive: true, displayModeBar: false });
  });

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
      <p class="page-subtitle">Live par / spot / forward curves fitted from on-the-run US Treasuries as of {curveDate}.</p>

      <div class="date-picker-row">
        <label for="asofDate">As of:</label>
        <input
          id="asofDate"
          type="date"
          bind:value={asofInput}
          on:change={handleAsofChange}
          max={new Date().toISOString().slice(0, 10)}
        />
      </div>

      {#if data.error}
        <div class="error-banner">{data.error}</div>
      {/if}
      {#if (data.warnings ?? []).length > 0}
        <details class="warnings">
          <summary>{(data.warnings ?? []).length} warning(s)</summary>
          <ul>
            {#each data.warnings ?? [] as w}
              <li>{w}</li>
            {/each}
          </ul>
        </details>
      {/if}

      <!-- Multi-line chart -->
      <div class="chart-box">
        <div bind:this={chartEl} class="curves-chart" />
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
              <tr class="table-row border-b border-slate-400">
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

  .page-subtitle {
    font-size: 0.9rem;
    color: #a0adb7;
    margin-bottom: 16px;
  }

  .date-picker-row {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 16px;

    label {
      font-size: 0.85rem;
      font-weight: 600;
    }

    input[type="date"] {
      padding: 6px 12px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 0.85rem;
      background-color: white;
      color: #05192a;
      height: 36px;
    }
  }

  .error-banner {
    background-color: #7f1d1d;
    color: #fecaca;
    padding: 8px 16px;
    border-radius: 4px;
    font-size: 0.85rem;
    margin-bottom: 12px;
  }

  .warnings {
    background-color: #1e3a4d;
    border-radius: 4px;
    padding: 8px 16px;
    font-size: 0.8rem;
    color: #fbbf24;
    margin-bottom: 16px;

    summary { cursor: pointer; font-weight: 600; }
    ul { margin-top: 6px; padding-left: 20px; }
    li { margin: 2px 0; }
  }

  .chart-box {
    background-color: $bgc-color;
    border-radius: 6px;
    padding: 20px;
    margin-bottom: 20px;
  }

  .curves-chart {
    width: 100%;
    min-height: 400px;
  }

  // No overflow-x here: page-level wrapper owns scrolling (second-brain#223).
  .table-wrapper {
    width: 100%;
  }

  .par-col { color: #60a5fa; font-weight: 600; font-variant-numeric: tabular-nums; }
  .spot-col { color: #7cd2ba; font-weight: 600; font-variant-numeric: tabular-nums; }
  .fwd-col { color: #f59e0b; font-weight: 600; font-variant-numeric: tabular-nums; }
</style>
