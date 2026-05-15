<script lang="ts">
  import { onMount } from 'svelte';

  export let data: { curveData: Array<{
    tenor: string; cusip: string; description: string;
    issueDate: string; maturityDate: string; couponRate: number;
    cleanPrice: number | null;
    // #305 part B: par yield from RunCurve, joined by tenor.
    parYield: number | null;
  }>; selectedDate: string; latestBuildableDate: string | null;
    asofWasDefaulted: boolean; user?: any };

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
    // #305 part B: plot real par yields from RunCurve, not the bond
    // coupon rate (which is fixed at issuance and diverges from yield
    // when bonds trade away from par). Skip rows whose parYield is
    // null — typically Bills and any constituent that the fitter
    // couldn't price (insufficient curve inputs).
    const plotted = curveData.filter((d) => d.parYield !== null);
    const trace = {
      x: plotted.map((d) => d.tenor),
      y: plotted.map((d) => d.parYield as number),
      mode: 'lines+markers',
      line: { color: '#7cd2ba', width: 2.5, shape: 'linear' },
      marker: { color: '#7cd2ba', size: 8 },
      hovertemplate: '%{x}: %{y:.3f}%<extra></extra>',
      name: 'Par yield',
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
    {#if data.latestBuildableDate && data.latestBuildableDate !== selectedDate}
      <span class="latest-hint" data-testid="latest-hint">
        Latest fully-priced: <a href="/data/treasury_curve?date={data.latestBuildableDate}">{data.latestBuildableDate}</a>
      </span>
    {:else if data.latestBuildableDate}
      <span class="latest-hint" data-testid="latest-hint">Latest fully-priced: {data.latestBuildableDate}</span>
    {/if}
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
          <th>Par Yield (%)</th>
          <th>Clean Price</th>
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
            <td class="par-yield-cell">{point.parYield !== null && point.parYield !== undefined ? `${point.parYield.toFixed(3)}%` : '—'}</td>
            <td class="price-cell">{point.cleanPrice !== null && point.cleanPrice !== undefined ? point.cleanPrice.toFixed(4) : '—'}</td>
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

  .latest-hint {
    font-size: 0.78rem;
    color: $ltgrey;

    a {
      color: #7cd2ba;
      text-decoration: underline;
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

  // No overflow-x here: page-level wrapper owns scrolling (second-brain#223).
  .table-scroll {
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

  .price-cell {
    font-variant-numeric: tabular-nums;
    font-weight: 600;
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
