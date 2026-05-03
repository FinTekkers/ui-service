<script lang="ts">
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

  // Compute month-over-month change
  $: cpiPoints = data.cpiData.map((d, i): CpiPoint => {
    const prev = i > 0 ? data.cpiData[i - 1].value : null;
    const mom = prev ? ((d.value - prev) / prev) * 100 : null;
    return { ...d, mom };
  });

  $: reversedPoints = [...cpiPoints].reverse();

  // Chart dimensions
  const chartWidth = 740;
  const chartHeight = 340;
  const pad = { top: 30, right: 20, bottom: 60, left: 60 };
  const plotW = chartWidth - pad.left - pad.right;
  const plotH = chartHeight - pad.top - pad.bottom;

  $: values = cpiPoints.map((p) => p.value);
  $: yMin = values.length > 0 ? Math.floor(Math.min(...values) - 2) : 0;
  $: yMax = values.length > 0 ? Math.ceil(Math.max(...values) + 2) : 100;
  $: yRange = Math.max(yMax - yMin, 1);

  $: svgPoints = cpiPoints.map((p, i) => ({
    ...p,
    x: pad.left + (i / Math.max(cpiPoints.length - 1, 1)) * plotW,
    y: pad.top + plotH - ((p.value - yMin) / yRange) * plotH,
  }));

  $: polyline = svgPoints.map((p) => `${p.x},${p.y}`).join(' ');

  $: yTickStep = yRange > 200 ? 50 : yRange > 80 ? 20 : yRange > 40 ? 10 : yRange > 20 ? 5 : 2;
  $: yTickStart = Math.ceil(yMin / yTickStep) * yTickStep;
  $: yTicks = Array.from(
    { length: Math.floor((yMax - yTickStart) / yTickStep) + 1 },
    (_, i) => yTickStart + i * yTickStep,
  );

  $: labelInterval = Math.max(1, Math.floor(cpiPoints.length / 8));

  // Title / subtitle / Y-axis label derived from selected series
  $: pageTitle = data.selectedSeries
    ? `${data.selectedSeries.indexType.replace('_', '-')} — ${data.selectedSeries.identifier}`
    : 'CPI Index';
  $: pageSubtitle = data.selectedSeries?.description ?? 'Select a CPI series to display.';
  $: yAxisLabel = data.selectedSeries
    ? `${data.selectedSeries.indexType.replace('_', '-')} Level`
    : 'Index Level';

  let hoveredIndex: number | null = null;

  function handleChartMousemove(e: MouseEvent) {
    if (svgPoints.length === 0) return;
    const svgEl = e.currentTarget as SVGSVGElement;
    const rect = svgEl.getBoundingClientRect();
    const scaleX = chartWidth / rect.width;
    const mouseX = (e.clientX - rect.left) * scaleX;
    const idx = Math.max(
      0,
      Math.min(
        svgPoints.length - 1,
        Math.round(((mouseX - pad.left) / plotW) * (svgPoints.length - 1)),
      ),
    );
    hoveredIndex = idx;
  }

  function handleChartMouseleave() {
    hoveredIndex = null;
  }
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
          <svg
            viewBox="0 0 {chartWidth} {chartHeight}"
            class="cpi-chart"
            on:mousemove={handleChartMousemove}
            on:mouseleave={handleChartMouseleave}
            role="img"
            aria-label="{pageTitle} chart"
          >
            {#each yTicks as tick}
              {@const y = pad.top + plotH - ((tick - yMin) / yRange) * plotH}
              <line x1={pad.left} y1={y} x2={pad.left + plotW} y2={y} stroke="#164e63" stroke-width="1" />
              <text x={pad.left - 8} y={y + 4} text-anchor="end" fill="#a0adb7" font-size="11">{tick}</text>
            {/each}

            <line x1={pad.left} y1={pad.top + plotH} x2={pad.left + plotW} y2={pad.top + plotH} stroke="#164e63" stroke-width="1" />

            {#each svgPoints as p, i}
              {#if i % labelInterval === 0 || i === svgPoints.length - 1}
                <text
                  x={p.x} y={pad.top + plotH + 18}
                  text-anchor="middle" fill="#a0adb7" font-size="10"
                  transform="rotate(-35 {p.x} {pad.top + plotH + 18})"
                >
                  {p.date}
                </text>
              {/if}
            {/each}

            {#if svgPoints.length > 1}
              <polygon
                points="{pad.left},{pad.top + plotH} {polyline} {svgPoints[svgPoints.length - 1].x},{pad.top + plotH}"
                fill="rgba(124, 210, 186, 0.15)"
              />
              <polyline
                points={polyline}
                fill="none" stroke="#7cd2ba" stroke-width="2.5" stroke-linejoin="round"
              />
            {/if}

            {#each svgPoints as p, i}
              <circle
                cx={p.x} cy={p.y} r={hoveredIndex === i ? 5 : 3}
                fill={hoveredIndex === i ? '#7cd2ba' : '#0c3a46'}
                stroke="#7cd2ba" stroke-width="1.5"
                pointer-events="none"
                aria-label="{p.date}: {p.value}"
              />
            {/each}

            {#if hoveredIndex !== null && svgPoints[hoveredIndex]}
              {@const hp = svgPoints[hoveredIndex]}
              <rect x={hp.x - 46} y={hp.y - 32} width="92" height="24" rx="4"
                    fill="#0c3a46" stroke="#7cd2ba" stroke-width="1" pointer-events="none" />
              <text x={hp.x} y={hp.y - 16} text-anchor="middle" fill="#7cd2ba" font-size="11" font-weight="bold"
                    pointer-events="none">
                {hp.date}: {hp.value.toFixed(3)}
              </text>
            {/if}

            <text x={14} y={pad.top + plotH / 2} text-anchor="middle" fill="#a0adb7" font-size="12"
                  transform="rotate(-90 14 {pad.top + plotH / 2})">
              {yAxisLabel}
            </text>
          </svg>
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
                {#each reversedPoints as point, i}
                  <tr
                    class:highlight={hoveredIndex === cpiPoints.length - 1 - i}
                    on:mouseenter={() => hoveredIndex = cpiPoints.length - 1 - i}
                    on:mouseleave={() => hoveredIndex = null}
                  >
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
    height: auto;
    cursor: crosshair;
  }

  .section-title {
    font-size: 1.1rem;
    font-weight: 700;
    margin-bottom: 12px;
  }

  .table-scroll {
    overflow-x: auto;
    max-height: 500px;
    overflow-y: auto;
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

  tr:hover, .highlight {
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
