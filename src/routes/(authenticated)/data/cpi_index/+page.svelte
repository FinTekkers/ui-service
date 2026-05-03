<script lang="ts">
  import { onMount } from 'svelte';
  import DashboardSideBar from '../../../../components/DashboardSideBar.svelte';

  type CpiSeries = { identifier: string; description: string; indexType: string; uuidHex: string; uuidStr: string };
  type CpiPoint = { date: string; value: number; mom: number | null };

  export let data: {
    allSeries: CpiSeries[];
    selectedSeries: CpiSeries | null;
    cpiData: Array<{ date: string; value: number }>;
    error: string | null;
    user?: any;
  };

  $: selectedId = data.selectedSeries?.identifier ?? '';

  function onSeriesChange(e: Event) {
    const id = (e.currentTarget as HTMLSelectElement).value;
    if (!id) return;
    const u = new URL('/data/cpi_index', window.location.origin);
    u.searchParams.set('series', id);
    window.location.href = u.pathname + u.search;
  }

  // Month-over-month change for the table.
  $: cpiPoints = data.cpiData.map((d, i): CpiPoint => {
    const prev = i > 0 ? data.cpiData[i - 1].value : null;
    const mom = prev ? ((d.value - prev) / prev) * 100 : null;
    return { ...d, mom };
  });

  $: reversedPoints = [...cpiPoints].reverse();

  // Title / subtitle / Y-axis label derived from selected series
  $: pageTitle = data.selectedSeries
    ? `${data.selectedSeries.indexType.replace('_', '-')} — ${data.selectedSeries.identifier}`
    : 'CPI Index';
  $: pageSubtitle = data.selectedSeries?.description ?? 'Select a CPI series to display.';
  $: yAxisLabel = data.selectedSeries
    ? `${data.selectedSeries.indexType.replace('_', '-')} Level`
    : 'Index Level';

  let chartEl: HTMLDivElement;

  // Identifier changes navigate the page (window.location.href in onSeriesChange),
  // so onMount fires fresh per visit. No reactive re-render needed.
  onMount(async () => {
    if (data.cpiData.length === 0 || !chartEl) return;
    const Plotly: any = (await import('plotly.js-dist') as any).default ?? (await import('plotly.js-dist'));
    const trace = {
      x: data.cpiData.map((d) => d.date),
      y: data.cpiData.map((d) => d.value),
      mode: 'lines',
      line: { color: '#7cd2ba', width: 1.5 },
      hovertemplate: '%{x}<br>%{y:.3f}<extra></extra>',
      name: data.selectedSeries?.identifier ?? '',
    };
    const layout = {
      paper_bgcolor: '#0c3a46',
      plot_bgcolor: '#0c3a46',
      font: { color: '#a0adb7', size: 11 },
      margin: { t: 30, r: 20, b: 50, l: 60 },
      hovermode: 'x unified',
      xaxis: {
        gridcolor: '#164e63',
        rangeslider: { visible: true, bgcolor: '#0a2e38', thickness: 0.05 },
        rangeselector: {
          buttons: [
            { count: 1, label: '1Y', step: 'year', stepmode: 'backward' },
            { count: 5, label: '5Y', step: 'year', stepmode: 'backward' },
            { count: 10, label: '10Y', step: 'year', stepmode: 'backward' },
            { count: 25, label: '25Y', step: 'year', stepmode: 'backward' },
            { step: 'all', label: 'All' },
          ],
          bgcolor: '#0c3a46',
          activecolor: '#7cd2ba',
          font: { color: '#a0adb7' },
          x: 0,
          y: 1.15,
        },
      },
      yaxis: {
        gridcolor: '#164e63',
        title: { text: yAxisLabel, font: { color: '#a0adb7' } },
      },
    };
    Plotly.newPlot(chartEl, [trace], layout, { responsive: true, displayModeBar: false });
  });
</script>

<div class="w-screen h-full flex">
  <DashboardSideBar {data} />

  <div class="h-full w-full dashboard-container" style="overflow-y: auto;">
    <div class="portfolio_container px-10 py-7">
      <h1 class="page-title">{pageTitle}</h1>
      <p class="page-subtitle">{pageSubtitle}</p>

      <div class="series-selector-row">
        <label for="series-select">Series</label>
        <select id="series-select" class="series-select" value={selectedId} on:change={onSeriesChange} disabled={data.allSeries.length === 0}>
          {#if data.allSeries.length === 0}
            <option value="">No CPI series available</option>
          {:else}
            {#each data.allSeries as series}
              <option value={series.identifier}>
                {series.identifier} — {series.description} ({series.indexType.replace('_', '-')})
              </option>
            {/each}
          {/if}
        </select>
      </div>

      {#if data.error}
        <div class="notice">{data.error}</div>
      {/if}

      {#if cpiPoints.length === 0}
        <div class="empty-state">No CPI data available for the selected series.</div>
      {:else}
        <div class="chart-box">
          <div bind:this={chartEl} class="cpi-chart" />
        </div>

        <div class="table-section">
          <h2 class="section-title">Monthly Data</h2>
          <div class="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>{yAxisLabel}</th>
                  <th>Month-over-Month (%)</th>
                </tr>
              </thead>
              <tbody>
                {#each reversedPoints as point}
                  <tr>
                    <td>{point.date}</td>
                    <td class="value-cell">{point.value.toFixed(3)}</td>
                    <td class="change-cell" class:positive={point.mom !== null && point.mom > 0} class:negative={point.mom !== null && point.mom < 0}>
                      {#if point.mom !== null}
                        {point.mom > 0 ? '+' : ''}{point.mom.toFixed(3)}%
                      {:else}
                        —
                      {/if}
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        </div>
      {/if}
    </div>
  </div>
</div>

<style lang="scss">
  @import "../../../../styles/variables";

  .page-title {
    font-size: 2rem;
    font-weight: 800;
    margin-bottom: 4px;
  }

  .page-subtitle {
    font-size: 0.85rem;
    color: $ltgrey;
    margin-bottom: 20px;
  }

  .series-selector-row {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 16px;

    label {
      font-size: 0.85rem;
      color: $ltgrey;
    }
  }

  .series-select {
    flex: 1;
    max-width: 600px;
    height: 38px;
    padding: 6px 10px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 0.85rem;
    background-color: white;
    color: #05192a;
    cursor: pointer;

    &:disabled {
      cursor: not-allowed;
      opacity: 0.5;
    }
  }

  .notice {
    background-color: #1b4d63;
    border-radius: 4px;
    padding: 8px 16px;
    font-size: 0.8rem;
    color: #fbbf24;
    margin-bottom: 16px;
  }

  .empty-state {
    color: $ltgrey;
    padding: 40px 0;
    font-size: 1rem;
  }

  .chart-box {
    background-color: $bgc-color;
    border-radius: 6px;
    padding: 20px;
    margin-bottom: 24px;
  }

  .cpi-chart {
    width: 100%;
    min-height: 420px;  // chart + range slider + range selector
  }

  .section-title {
    font-size: 1.1rem;
    font-weight: 700;
    margin-bottom: 12px;
  }

  .table-scroll {
    overflow-x: auto;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    min-width: 400px;
  }

  th {
    background-color: $bgc-color;
    color: $white;
    font-weight: bold;
    padding: 10px 16px;
    text-align: left;
    border: 1px solid #ddd;
    position: sticky;
    top: 0;
    z-index: 1;
  }

  td {
    padding: 8px 16px;
    border: 1px solid #ddd;
    font-size: 0.85rem;
    color: $white;
  }

  tr:hover {
    background-color: $bgc-color;
    cursor: default;
  }

  .value-cell {
    font-weight: 600;
    font-variant-numeric: tabular-nums;
  }

  .change-cell {
    font-variant-numeric: tabular-nums;

    &.positive { color: #7cd2ba; }
    &.negative { color: #c43d5a; }
  }
</style>
