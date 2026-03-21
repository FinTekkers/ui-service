<script lang="ts">
  import DashboardSideBar from '../../components/DashboardSideBar.svelte';

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
      window.location.href = `/treasury_curve?date=${dateInput}`;
    }
  }

  // SVG chart dimensions
  const chartWidth = 700;
  const chartHeight = 320;
  const pad = { top: 30, right: 30, bottom: 50, left: 55 };
  const plotW = chartWidth - pad.left - pad.right;
  const plotH = chartHeight - pad.top - pad.bottom;

  $: yMin = 0;
  $: yMax = Math.ceil(Math.max(...curveData.map(d => d.couponRate), 5) + 0.5);
  $: yRange = yMax - yMin;

  $: points = curveData.map((d, i) => ({
    ...d,
    x: pad.left + (i / Math.max(curveData.length - 1, 1)) * plotW,
    y: pad.top + plotH - ((d.couponRate - yMin) / yRange) * plotH,
  }));

  $: polyline = points.map(p => `${p.x},${p.y}`).join(' ');
  $: yTicks = Array.from({ length: yMax - yMin + 1 }, (_, i) => yMin + i);

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
    <svg viewBox="0 0 {chartWidth} {chartHeight}" class="curve-chart">
      <!-- Grid lines -->
      {#each yTicks as tick}
        {@const y = pad.top + plotH - ((tick - yMin) / yRange) * plotH}
        <line x1={pad.left} y1={y} x2={pad.left + plotW} y2={y} stroke="#164e63" stroke-width="1" />
        <text x={pad.left - 8} y={y + 4} text-anchor="end" fill="#a0adb7" font-size="11">{tick}%</text>
      {/each}

      <!-- X-axis -->
      <line x1={pad.left} y1={pad.top + plotH} x2={pad.left + plotW} y2={pad.top + plotH} stroke="#164e63" stroke-width="1" />

      <!-- X-axis labels -->
      {#each points as p}
        <text x={p.x} y={pad.top + plotH + 20} text-anchor="middle" fill="#a0adb7" font-size="11">
          {p.tenor}
        </text>
      {/each}

      <!-- Line -->
      {#if points.length > 1}
        <polyline points={polyline} fill="none" stroke="#7cd2ba" stroke-width="2.5" stroke-linejoin="round" />
      {/if}

      <!-- Data dots -->
      {#each points as p, i}
        <circle
          cx={p.x} cy={p.y} r={hoveredIndex === i ? 6 : 4}
          fill={hoveredIndex === i ? '#7cd2ba' : '#0c3a46'}
          stroke="#7cd2ba" stroke-width="2"
          on:mouseenter={() => hoveredIndex = i}
          on:mouseleave={() => hoveredIndex = null}
          role="img" aria-label="{p.tenor}: {p.couponRate.toFixed(2)}%"
        />
        {#if hoveredIndex === i}
          <rect x={p.x - 36} y={p.y - 30} width="72" height="22" rx="4"
                fill="#0c3a46" stroke="#7cd2ba" stroke-width="1" />
          <text x={p.x} y={p.y - 15} text-anchor="middle" fill="#7cd2ba" font-size="12" font-weight="bold">
            {p.couponRate.toFixed(2)}%
          </text>
        {/if}
      {/each}

      <!-- Y-axis label -->
      <text x={14} y={pad.top + plotH / 2} text-anchor="middle" fill="#a0adb7" font-size="12"
            transform="rotate(-90 14 {pad.top + plotH / 2})">
        Yield (%)
      </text>
    </svg>
  </div>
    </div>
  </div>
</div>

<style lang="scss">
  @import "../../styles/variables";

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
    max-width: 700px;
    height: auto;

    circle { cursor: pointer; transition: r 0.1s; }
  }
</style>
