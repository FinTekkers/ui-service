<script lang="ts">
  import { onMount } from 'svelte';
  import DashboardSideBar from '../../../../components/DashboardSideBar.svelte';

  export let data: { curveData: Array<{
    tenor: string; cusip: string; description: string;
    issueDate: string; maturityDate: string; couponRate: number;
  }>; selectedDate: string; user?: any };

  $: curveData = data.curveData ?? [];
  $: selectedDate = data.selectedDate ?? new Date().toISOString().slice(0, 10);
  $: hasData = curveData.some(d => d.cusip !== '');

  // Format date for display: "March 20, 2026"
  $: displayDate = new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  });

  let dateInput = data.selectedDate ?? new Date().toISOString().slice(0, 10);

  function handleDateChange() {
    if (dateInput) {
      window.location.href = `/data/treasury_curve?date=${dateInput}`;
    }
  }

  let chartEl: HTMLDivElement;

  onMount(async () => {
    if (!chartEl || curveData.length === 0) return;
    const Plotly: any = (await import('plotly.js-dist') as any).default ?? (await import('plotly.js-dist'));
    const trace = {
      x: curveData.map((d) => d.tenor),
      y: curveData.map((d) => d.couponRate),
      mode: 'lines+markers',
      line: { color: '#7cd2ba', width: 2.5, shape: 'linear' },
      marker: { color: '#7cd2ba', size: 8 },
      hovertemplate: '%{x}: %{y:.3f}%<extra></extra>',
      name: 'On-the-run',
    };
    const layout = {
      paper_bgcolor: '#0c3a46',
      plot_bgcolor: '#0c3a46',
      font: { color: '#a0adb7', size: 11 },
      margin: { t: 30, r: 30, b: 50, l: 60 },
      xaxis: {
        type: 'category',
        gridcolor: '#164e63',
        title: { text: 'Tenor', font: { color: '#a0adb7' } },
      },
      yaxis: {
        gridcolor: '#164e63',
        title: { text: 'Yield (%)', font: { color: '#a0adb7' } },
        ticksuffix: '%',
      },
    };
    Plotly.newPlot(chartEl, [trace], layout, { responsive: true, displayModeBar: false });
  });

  let hoveredIndex: number | null = null;
</script>

<div class="w-screen h-full flex">
  <DashboardSideBar {data} />

  <div class="h-full w-full dashboard-container" style="overflow-y: auto;">
    <div class="portfolio_container px-10 py-7">
  <h1 class="page-title">On-the-Run Treasury Yield Curve</h1>
  <p class="date-subtitle">as of {displayDate}</p>

  <!-- Date picker -->
  <div class="date-picker-row">
    <label for="curveDate">Curve Date:</label>
    <input
      id="curveDate"
      type="date"
      bind:value={dateInput}
      on:change={handleDateChange}
      max={new Date().toISOString().slice(0, 10)}
    />
  </div>

  {#if !hasData}
    <div class="no-data-msg">No curve data available for {displayDate}.</div>
  {/if}

  <!-- Data Table -->
  <div class="table-scroll">
    <table>
      <thead>
        <tr>
          <th>Tenor</th>
          <th>CUSIP</th>
          <th>Description</th>
          <th>Issue Date</th>
          <th>Maturity Date</th>
          <th>Coupon Rate (%)</th>
        </tr>
      </thead>
      <tbody>
        {#each curveData as point, i}
          <tr
            class:highlight={hoveredIndex === i}
            on:mouseenter={() => hoveredIndex = i}
            on:mouseleave={() => hoveredIndex = null}
          >
            <td><strong>{point.tenor}</strong></td>
            <td>{point.cusip || '—'}</td>
            <td>{point.description}</td>
            <td>{point.issueDate || '—'}</td>
            <td>{point.maturityDate || '—'}</td>
            <td class="yield-cell">{point.couponRate.toFixed(3)}%</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>

  <!-- Yield Curve Chart -->
  <div class="chart-box">
    <h2 class="chart-title">Yield Curve</h2>
    <div bind:this={chartEl} class="curve-chart" />
  </div>
    </div>
  </div>
</div>

<style lang="scss">
  @import "../../../../styles/variables";

  .page-container {
    background-color: $primary-color;
    min-height: 100vh;
    padding: 28px 40px;
    color: $white;
  }

  .page-title {
    font-size: 2rem;
    font-weight: 800;
    margin-bottom: 2px;
  }

  .date-subtitle {
    font-size: 1rem;
    color: $ltgrey;
    margin-bottom: 16px;
  }

  .date-picker-row {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 20px;

    label {
      font-size: 0.85rem;
      font-weight: 600;
      color: $white;
    }

    input[type="date"] {
      padding: 6px 12px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 0.85rem;
      background-color: white;
      color: #05192a;
      height: 36px;
      box-sizing: border-box;
    }
  }

  .no-data-msg {
    background-color: #1b4d63;
    border-radius: 4px;
    padding: 12px 16px;
    font-size: 0.85rem;
    color: #fbbf24;
    margin-bottom: 16px;
  }

  .table-scroll {
    overflow-x: auto;
    margin-bottom: 24px;
  }

  table {
    width: 100%;
    border-collapse: collapse;
  }

  th {
    background-color: $bgc-color;
    color: $white;
    font-weight: bold;
    padding: 10px 16px;
    text-align: left;
    border: 1px solid #ddd;
  }

  td {
    padding: 8px 16px;
    border: 1px solid #ddd;
    font-size: 0.85rem;
    color: $white;
  }

  tr:hover, .highlight {
    background-color: $bgc-color;
    cursor: default;
  }

  .yield-cell {
    font-weight: 700;
    color: #7cd2ba;
  }

  .chart-box {
    background-color: $bgc-color;
    border-radius: 6px;
    padding: 20px;
  }

  .chart-title {
    font-size: 1rem;
    font-weight: 700;
    color: $white;
    margin-bottom: 12px;
  }

  .curve-chart {
    width: 100%;
    min-height: 360px;
  }
</style>
