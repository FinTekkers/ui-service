<script lang="ts">
  import { onMount } from 'svelte';
  export let data: import('./$types').PageData;

  type CurvePoint = { tenor: string; years: number; yield: number };

  const ALLOWED_TERMS = [1, 2, 5, 10] as const;
  type TermYears = typeof ALLOWED_TERMS[number];

  $: par = (data.par ?? []) as CurvePoint[];
  $: spot = (data.spot ?? []) as CurvePoint[];
  // For the term-forward trace each point's `years` is the *starting* year t
  // and `yield` is f(t, t+T). Server populated this via
  // CurveRequestProto.forward_term_years = data.termYears.
  $: forward = (data.forward ?? []) as CurvePoint[];
  $: curveDate = (data.curveDate ?? '') as string;
  $: termYears = ((data as any).termYears ?? 10) as TermYears;

  let asofInput: string = data.curveDate ?? new Date().toISOString().slice(0, 10);

  function buildQuery(asof: string, term: TermYears): string {
    return `/data/curves?asof=${asof}&term=${term}`;
  }

  function handleAsofChange() {
    if (asofInput) {
      window.location.href = buildQuery(asofInput, termYears);
    }
  }

  function handleTermChange(event: Event) {
    const next = Number((event.target as HTMLSelectElement).value);
    if ((ALLOWED_TERMS as readonly number[]).includes(next)) {
      window.location.href = buildQuery(asofInput, next as TermYears);
    }
  }

  let chartEl: HTMLDivElement;

  $: forwardTraceName = `${termYears}Y Fwd`;

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
        hovertemplate: '%{x:.2f}Y<br>Par: %{y:.3f}%<extra></extra>',
        name: 'Par',
      },
      {
        x: spot.map((p) => p.years),
        y: spot.map((p) => p.yield),
        mode: 'lines+markers',
        line: { color: '#7cd2ba', width: 2.5, dash: 'dash' },
        marker: { color: '#7cd2ba', size: 6 },
        hovertemplate: '%{x:.2f}Y<br>Spot: %{y:.3f}%<extra></extra>',
        name: 'Spot',
      },
      {
        x: forward.map((p) => p.years),
        y: forward.map((p) => p.yield),
        mode: 'lines+markers',
        line: { color: '#f59e0b', width: 2.5, dash: 'dot' },
        marker: { color: '#f59e0b', size: 6 },
        // x is the *starting* year t for the term-forward; y is f(t, t+T).
        hovertemplate: `Starts %{x:.2f}Y<br>${termYears}Y Fwd: %{y:.3f}%<extra></extra>`,
        name: forwardTraceName,
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
        title: { text: 'Years', font: { color: '#a0adb7' } },
      },
      yaxis: {
        gridcolor: '#164e63',
        title: { text: 'Yield (%)', font: { color: '#a0adb7' } },
        ticksuffix: '%',
      },
    };
    Plotly.newPlot(chartEl, traces, layout, { responsive: true, displayModeBar: false });
  });

  // Build merged par/spot table by tenor (years). Forward gets its own
  // table below since its x-axis means starting year, not maturity tenor.
  $: parSpotTable = par.map((p) => {
    const s = spot.find((sp) => sp.years === p.years);
    return {
      tenor: p.tenor,
      years: p.years,
      parYield: p.yield,
      spotRate: s?.yield,
    };
  });

  $: forwardTable = forward.map((f) => ({
    startYear: f.tenor,        // decimal-year label of t
    years: f.years,
    forwardRate: f.yield,
  }));
</script>

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
        <label for="forwardTerm">Forward term:</label>
        <select
          id="forwardTerm"
          aria-label="Forward term"
          value={termYears}
          on:change={handleTermChange}
        >
          {#each ALLOWED_TERMS as t}
            <option value={t}>{t}Y</option>
          {/each}
        </select>
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

      <!-- Par/Spot table -->
      <div class="table-wrapper">
        <h3 class="table-heading">Par & Spot Curves</h3>
        <table class="text-left">
          <thead class="border-b border-slate-400">
            <tr>
              <th class="text-semibold px-4 py-2">Tenor</th>
              <th class="text-semibold px-4 py-2 par-col">Par Yield (%)</th>
              <th class="text-semibold px-4 py-2 spot-col">Spot Rate (%)</th>
            </tr>
          </thead>
          <tbody>
            {#each parSpotTable as row}
              <tr class="table-row border-b border-slate-400">
                <td class="table-cell px-4 py-2"><strong>{row.tenor}</strong></td>
                <td class="table-cell px-4 py-2 par-col">{row.parYield.toFixed(3)}</td>
                <td class="table-cell px-4 py-2 spot-col">{row.spotRate?.toFixed(3) ?? '—'}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>

      <!-- Term-forward table -->
      <div class="table-wrapper">
        <h3 class="table-heading">{termYears}Y Forward Rate by Start Year</h3>
        <p class="table-subhead">
          Market-implied {termYears}-year rate starting at each future year — i.e. f(t, t+{termYears}).
        </p>
        <table class="text-left">
          <thead class="border-b border-slate-400">
            <tr>
              <th class="text-semibold px-4 py-2">Starting Year</th>
              <th class="text-semibold px-4 py-2 fwd-col">{termYears}Y Fwd Rate (%)</th>
            </tr>
          </thead>
          <tbody>
            {#each forwardTable as row}
              <tr class="table-row border-b border-slate-400">
                <td class="table-cell px-4 py-2"><strong>{row.startYear}</strong></td>
                <td class="table-cell px-4 py-2 fwd-col">{row.forwardRate.toFixed(3)}</td>
              </tr>
            {/each}
            {#if forwardTable.length === 0}
              <tr class="table-row">
                <td class="table-cell px-4 py-2" colspan="2">No forward points returned for {termYears}Y term.</td>
              </tr>
            {/if}
          </tbody>
        </table>
      </div>
</div>

<style lang="scss">
  @import "../../../../styles/grid-table";

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

    input[type="date"],
    select {
      padding: 6px 12px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 0.85rem;
      background-color: white;
      color: #05192a;
      height: 36px;
    }
  }

  .table-heading {
    font-size: 1.05rem;
    font-weight: 700;
    margin: 18px 0 6px;
    color: #d8e0e6;
  }

  .table-subhead {
    font-size: 0.8rem;
    color: #a0adb7;
    margin: 0 0 10px;
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
