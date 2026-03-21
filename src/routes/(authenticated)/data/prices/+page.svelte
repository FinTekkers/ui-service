<script lang="ts">
  import DashboardSideBar from '../../../../components/DashboardSideBar.svelte';
  export let data: import('./$types').PageData;

  type PriceEntry = { date: string; price: number };

  $: securities = (data.securities ?? []) as Array<{ cusip: string; description: string }>;
  $: prices = (data.prices ?? []) as PriceEntry[];
  $: selectedCusip = (data.selectedCusip ?? '') as string;
  $: securityDescription = (data.securityDescription ?? '') as string;
  $: priceError = (data.priceError ?? '') as string;

  // Autocomplete state
  let cusipInput = data.selectedCusip ?? '';
  let showSuggestions = false;
  let selectedIndex = -1;

  $: filtered = cusipInput.length > 0
    ? securities.filter(s => s.cusip.toUpperCase().startsWith(cusipInput.toUpperCase())).slice(0, 10)
    : [];

  function selectCusip(cusip: string) {
    cusipInput = cusip;
    showSuggestions = false;
    window.location.href = `/data/prices?cusip=${encodeURIComponent(cusip)}`;
  }

  function handleKeydown(e: KeyboardEvent) {
    if (!showSuggestions || filtered.length === 0) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); selectedIndex = Math.min(selectedIndex + 1, filtered.length - 1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); selectedIndex = Math.max(selectedIndex - 1, 0); }
    else if (e.key === 'Enter' && selectedIndex >= 0) { e.preventDefault(); selectCusip(filtered[selectedIndex].cusip); }
    else if (e.key === 'Escape') { showSuggestions = false; }
  }

  function handleBlur() { setTimeout(() => { showSuggestions = false; }, 150); }

  function handleSearch() {
    if (cusipInput.trim()) {
      window.location.href = `/data/prices?cusip=${encodeURIComponent(cusipInput.trim())}`;
    }
  }

  // Chart — ascending order for line
  $: chartPrices = [...prices].reverse();

  const chartWidth = 700;
  const chartHeight = 320;
  const pad = { top: 30, right: 20, bottom: 60, left: 60 };
  const plotW = chartWidth - pad.left - pad.right;
  const plotH = chartHeight - pad.top - pad.bottom;

  $: vals = chartPrices.map(p => p.price);
  $: yMin = vals.length > 0 ? Math.floor(Math.min(...vals) - 1) : 0;
  $: yMax = vals.length > 0 ? Math.ceil(Math.max(...vals) + 1) : 100;
  $: yRange = Math.max(yMax - yMin, 1);

  $: svgPoints = chartPrices.map((p, i) => ({
    ...p,
    x: pad.left + (i / Math.max(chartPrices.length - 1, 1)) * plotW,
    y: pad.top + plotH - ((p.price - yMin) / yRange) * plotH,
  }));

  $: polyline = svgPoints.map(p => `${p.x},${p.y}`).join(' ');
  $: yTicks = (() => {
    const step = Math.max(1, Math.ceil(yRange / 6));
    const ticks = [];
    for (let t = yMin; t <= yMax; t += step) ticks.push(t);
    return ticks;
  })();
  $: labelInterval = Math.max(1, Math.floor(chartPrices.length / 8));

  let hoveredIndex: number | null = null;
</script>

<div class="w-screen h-full flex">
  <DashboardSideBar {data} />

  <div class="h-full w-full dashboard-container">
    <div class="portfolio_container px-10 py-7">
      <h2 class="text-3xl font-extrabold my-3">Price History</h2>

      <!-- CUSIP selector -->
      <div class="selector-row">
        <div class="autocomplete-wrapper">
          <input
            type="text"
            class="cusip-input"
            placeholder="Enter CUSIP..."
            bind:value={cusipInput}
            autocomplete="off"
            on:focus={() => { showSuggestions = true; selectedIndex = -1; }}
            on:blur={handleBlur}
            on:keydown={handleKeydown}
            on:input={() => { showSuggestions = true; selectedIndex = -1; }}
          />
          {#if showSuggestions && filtered.length > 0}
            <ul class="suggestions">
              {#each filtered as sec, i}
                <li class:selected={i === selectedIndex} on:mousedown|preventDefault={() => selectCusip(sec.cusip)}>
                  <span class="suggestion-cusip">{sec.cusip}</span>
                  <span class="suggestion-desc">{sec.description}</span>
                </li>
              {/each}
            </ul>
          {/if}
        </div>
        <button class="search-btn" on:click={handleSearch}>View Prices</button>
      </div>

      {#if priceError}
        <div class="error-banner">{priceError}</div>
      {/if}

      {#if selectedCusip && securityDescription}
        <p class="security-desc">{securityDescription}</p>
      {/if}

      {#if prices.length > 0}
        <!-- Chart -->
        <div class="chart-box">
          <h3 class="chart-title">Price Chart — {selectedCusip}</h3>
          <svg viewBox="0 0 {chartWidth} {chartHeight}" class="price-chart">
            {#each yTicks as tick}
              {@const y = pad.top + plotH - ((tick - yMin) / yRange) * plotH}
              <line x1={pad.left} y1={y} x2={pad.left + plotW} y2={y} stroke="#164e63" stroke-width="1" />
              <text x={pad.left - 8} y={y + 4} text-anchor="end" fill="#a0adb7" font-size="11">{tick}</text>
            {/each}
            <line x1={pad.left} y1={pad.top + plotH} x2={pad.left + plotW} y2={pad.top + plotH} stroke="#164e63" stroke-width="1" />
            {#each svgPoints as p, i}
              {#if i % labelInterval === 0 || i === svgPoints.length - 1}
                <text x={p.x} y={pad.top + plotH + 18} text-anchor="middle" fill="#a0adb7" font-size="10"
                      transform="rotate(-35 {p.x} {pad.top + plotH + 18})">{p.date}</text>
              {/if}
            {/each}
            {#if svgPoints.length > 1}
              <polygon points="{pad.left},{pad.top + plotH} {polyline} {svgPoints[svgPoints.length - 1].x},{pad.top + plotH}"
                       fill="rgba(124, 210, 186, 0.12)" />
              <polyline points={polyline} fill="none" stroke="#7cd2ba" stroke-width="2.5" stroke-linejoin="round" />
            {/if}
            {#each svgPoints as p, i}
              <circle cx={p.x} cy={p.y} r={hoveredIndex === i ? 5 : 3}
                      fill={hoveredIndex === i ? '#7cd2ba' : '#0c3a46'} stroke="#7cd2ba" stroke-width="1.5"
                      on:mouseenter={() => hoveredIndex = i} on:mouseleave={() => hoveredIndex = null}
                      role="img" aria-label="{p.date}: {p.price}" />
              {#if hoveredIndex === i}
                <rect x={p.x - 50} y={p.y - 32} width="100" height="24" rx="4"
                      fill="#0c3a46" stroke="#7cd2ba" stroke-width="1" />
                <text x={p.x} y={p.y - 16} text-anchor="middle" fill="#7cd2ba" font-size="11" font-weight="bold">
                  {p.date}: {p.price.toFixed(3)}
                </text>
              {/if}
            {/each}
            <text x={14} y={pad.top + plotH / 2} text-anchor="middle" fill="#a0adb7" font-size="12"
                  transform="rotate(-90 14 {pad.top + plotH / 2})">Price</text>
          </svg>
        </div>

        <!-- Table -->
        <div class="table-wrapper">
          <table class="text-left">
            <thead class="border-b border-slate-400">
              <tr>
                <th class="text-semibold px-4 py-2">Date</th>
                <th class="text-semibold px-4 py-2">Price</th>
              </tr>
            </thead>
            <tbody>
              {#each prices as p, i}
                <tr class="table-row border-b border-slate-400"
                    class:highlight-row={hoveredIndex === prices.length - 1 - i}
                    on:mouseenter={() => hoveredIndex = prices.length - 1 - i}
                    on:mouseleave={() => hoveredIndex = null}>
                  <td class="table-cell px-4 py-2">{p.date}</td>
                  <td class="table-cell px-4 py-2 price-val">{p.price.toFixed(6)}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {:else if selectedCusip && !priceError}
        <p class="empty-msg">No price history found for {selectedCusip}.</p>
      {:else if !selectedCusip}
        <p class="empty-msg">Select a CUSIP above to view its price history.</p>
      {/if}
    </div>
  </div>
</div>

<style lang="scss">
  @import "../../../../styles/grid-table";

  .dashboard-container {
    background-color: $primary-color;
    overflow: auto;
  }

  .selector-row {
    display: flex;
    gap: 12px;
    margin-bottom: 16px;
    align-items: flex-start;
  }

  .autocomplete-wrapper {
    position: relative;
    flex: 1;
    max-width: 400px;
  }

  .cusip-input {
    width: 100%;
    padding: 6px 12px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 0.85rem;
    background-color: white;
    color: #05192a;
    height: 38px;
    box-sizing: border-box;

    &::placeholder { color: #86929c; }
  }

  .suggestions {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    z-index: 10;
    background: white;
    border: 1px solid #ddd;
    border-radius: 0 0 4px 4px;
    max-height: 240px;
    overflow-y: auto;
    margin: 0;
    padding: 0;
    list-style: none;
    box-shadow: 0 4px 8px rgba(0,0,0,0.2);

    li {
      padding: 6px 10px;
      cursor: pointer;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.8rem;
      color: #05192a;

      &:hover, &.selected { background-color: #e0f2fe; }
    }

    .suggestion-cusip { font-weight: 600; }
    .suggestion-desc { color: #86929c; font-size: 0.75rem; max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  }

  .search-btn {
    padding: 8px 20px;
    background-color: #7cd2ba;
    color: #0c3a46;
    border: none;
    border-radius: 4px;
    font-size: 0.85rem;
    font-weight: 700;
    cursor: pointer;
    height: 38px;
    white-space: nowrap;

    &:hover { background-color: #6bc0a8; }
  }

  .error-banner {
    background-color: #7f1d1d;
    color: #fecaca;
    padding: 8px 16px;
    border-radius: 4px;
    font-size: 0.8rem;
    margin-bottom: 12px;
  }

  .security-desc {
    font-size: 0.85rem;
    color: #a0adb7;
    margin-bottom: 16px;
  }

  .chart-box {
    background-color: #0c3a46;
    border-radius: 6px;
    padding: 20px;
    margin-bottom: 16px;
  }

  .chart-title {
    font-size: 1rem;
    font-weight: 700;
    color: whitesmoke;
    margin-bottom: 12px;
  }

  .price-chart {
    width: 100%;
    max-width: 700px;
    height: auto;
    circle { cursor: pointer; transition: r 0.1s; }
  }

  .table-wrapper {
    overflow-x: auto;
    max-height: 500px;
    overflow-y: auto;
  }

  .highlight-row { background-color: #0c3a46 !important; }

  .price-val {
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    color: #7cd2ba;
  }

  .empty-msg {
    color: #a0adb7;
    font-size: 0.875rem;
    padding: 2rem 0;
    text-align: center;
  }
</style>
