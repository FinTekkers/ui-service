<script lang="ts">
  import { onMount } from 'svelte';
  import IdentifierFilter from '../../../../components/filters/IdentifierFilter.svelte';
  import type { IdentifierTypeName } from '$lib/securityFilterTypes';
  export let data: import('./$types').PageData;

  type PriceEntry = { date: string; price: number };
  type UniverseEntry = { identifier: string; identifierType: string; description: string; uuidHex: string; assetClass: string };

  $: prices = (data.prices ?? []) as PriceEntry[];
  $: selectedIdentifier = (data.selectedIdentifier ?? '') as string;
  $: securityDescription = (data.securityDescription ?? '') as string;
  $: priceError = (data.priceError ?? '') as string;

  // Phase 2 of second-brain#226: identifier UX moved to <IdentifierFilter>.
  // Internal state is the proto name (IdentifierTypeName) — the page-server
  // still expects/emits short URL keys (?type=cusip|ticker|isin|series),
  // so we translate at the URL boundary in `navigateTo` and on initial
  // load below. Keeping the URL convention preserves existing bookmarks.
  const PROTO_TO_URL: Record<IdentifierTypeName, string> = {
    CUSIP: 'cusip',
    EXCH_TICKER: 'ticker',
    ISIN: 'isin',
    SERIES_ID: 'series',
    // Not currently surfaced on /data/prices but defined for completeness;
    // supportedTypes prop below restricts the dropdown to the four above.
    OSI: 'osi',
    FIGI: 'figi',
    INDEX_NAME: 'index',
    CASH: 'cash',
  };
  function urlKeyToProto(urlKey: string | undefined | null): IdentifierTypeName {
    switch ((urlKey ?? '').toLowerCase()) {
      case 'ticker': return 'EXCH_TICKER';
      case 'isin': return 'ISIN';
      case 'series': return 'SERIES_ID';
      default: return 'CUSIP';
    }
  }

  // UI state — initialized from the URL on every load
  let identifierType: IdentifierTypeName = urlKeyToProto(data.selectedIdentifierType);
  let identifierInput: string = data.selectedIdentifier ?? '';
  let showSuggestions = false;
  let selectedSuggestionIndex = -1;

  // Order matters in the dropdown — keep CUSIP first so legacy users on
  // the default "no params" landing don't get a surprise type change.
  const PRICES_SUPPORTED_TYPES: readonly IdentifierTypeName[] = [
    'CUSIP',
    'EXCH_TICKER',
    'ISIN',
    'SERIES_ID',
  ] as const;

  function filterUniverse(universe: UniverseEntry[], type: IdentifierTypeName, input: string): UniverseEntry[] {
    const q = input.toUpperCase();
    return universe
      .filter((s) => s.identifierType === type)
      .filter((s) => q === '' || s.identifier.toUpperCase().startsWith(q) || s.description.toUpperCase().includes(q))
      .slice(0, 10);
  }

  function navigateTo(type: IdentifierTypeName, id: string) {
    const u = new URL('/data/prices', window.location.origin);
    u.searchParams.set('type', PROTO_TO_URL[type]);
    u.searchParams.set('id', id);
    window.location.href = u.pathname + u.search;
  }

  function selectSuggestion(entry: UniverseEntry) {
    identifierInput = entry.identifier;
    showSuggestions = false;
    navigateTo(identifierType, entry.identifier);
  }

  function handleSearch() {
    const v = identifierInput.trim();
    if (v) navigateTo(identifierType, v);
  }

  function handleTypeChange() {
    // IdentifierFilter has already cleared identifierInput via clearOnTypeChange.
    // We just need to dismiss any in-flight autocomplete UI.
    selectedSuggestionIndex = -1;
    showSuggestions = false;
  }

  function handleKeydown(e: KeyboardEvent, filtered: UniverseEntry[]) {
    if (e.key === 'Enter') { e.preventDefault(); handleSearch(); return; }
    if (!showSuggestions || filtered.length === 0) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); selectedSuggestionIndex = Math.min(selectedSuggestionIndex + 1, filtered.length - 1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); selectedSuggestionIndex = Math.max(selectedSuggestionIndex - 1, 0); }
    else if (e.key === 'Escape') { showSuggestions = false; }
  }

  function handleBlur() { setTimeout(() => { showSuggestions = false; }, 150); }

  // ---- Plotly chart ----
  // Ascending date order — plotly treats x as a time axis.
  $: chartPrices = [...prices].reverse();

  let chartEl: HTMLDivElement;

  // Loaded dynamically in onMount because plotly.js-dist is ~1MB and SSR-hostile.
  // Identifier changes trigger a full page navigation (window.location.href in
  // navigateTo), so onMount fires fresh on every visit — no need to react to
  // chartPrices changes after initial render.
  onMount(async () => {
    if (chartPrices.length === 0 || !chartEl) return;
    const Plotly: any = (await import('plotly.js-dist') as any).default ?? (await import('plotly.js-dist'));
    const trace = {
      x: chartPrices.map((p) => p.date),
      y: chartPrices.map((p) => p.price),
      mode: 'lines',
      line: { color: '#7cd2ba', width: 1.5 },
      hovertemplate: '%{x}<br>%{y:.4f}<extra></extra>',
      name: selectedIdentifier,
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
            { count: 1, label: '1M', step: 'month', stepmode: 'backward' },
            { count: 3, label: '3M', step: 'month', stepmode: 'backward' },
            { count: 6, label: '6M', step: 'month', stepmode: 'backward' },
            { count: 1, label: '1Y', step: 'year', stepmode: 'backward' },
            { count: 5, label: '5Y', step: 'year', stepmode: 'backward' },
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
        title: { text: 'Price', font: { color: '#a0adb7' } },
      },
    };
    Plotly.newPlot(chartEl, [trace], layout, { responsive: true, displayModeBar: false });
  });
</script>

<div class="portfolio_container px-10 py-7">
      <h2 class="text-3xl font-extrabold my-3">Price History</h2>

      <!-- Identifier type + value selector. Universe-driven autocomplete
           lives in the default slot below the input — IdentifierFilter
           positions it relative to the value input via a `position:
           relative` wrapper. The {#await} branches each render a different
           hint inside the slot; the input itself is rendered by
           IdentifierFilter so layout stays consistent. -->
      <div class="selector-row">
        {#await data.universe}
          <IdentifierFilter
            bind:identifierType
            bind:identifier={identifierInput}
            supportedTypes={PRICES_SUPPORTED_TYPES}
            selectClass="type-select"
            inputClass="cusip-input"
            on:typeChange={handleTypeChange}
            on:keydown={(e) => handleKeydown(e, [])}
          >
            <span class="loading-hint">Loading suggestions…</span>
          </IdentifierFilter>
        {:then universe}
          {@const filtered = filterUniverse(universe, identifierType, identifierInput)}
          <IdentifierFilter
            bind:identifierType
            bind:identifier={identifierInput}
            supportedTypes={PRICES_SUPPORTED_TYPES}
            selectClass="type-select"
            inputClass="cusip-input"
            on:typeChange={handleTypeChange}
            on:focus={() => { showSuggestions = true; selectedSuggestionIndex = -1; }}
            on:blur={handleBlur}
            on:keydown={(e) => handleKeydown(e, filtered)}
            on:input={() => { showSuggestions = true; selectedSuggestionIndex = -1; }}
          >
            {#if showSuggestions && filtered.length > 0}
              <ul class="suggestions">
                {#each filtered as entry, i}
                  <li class:selected={i === selectedSuggestionIndex} on:mousedown|preventDefault={() => selectSuggestion(entry)}>
                    <span class="suggestion-cusip">{entry.identifier}</span>
                    <span class="suggestion-desc">{entry.description}</span>
                  </li>
                {/each}
              </ul>
            {/if}
          </IdentifierFilter>
        {:catch}
          <IdentifierFilter
            bind:identifierType
            bind:identifier={identifierInput}
            supportedTypes={PRICES_SUPPORTED_TYPES}
            selectClass="type-select"
            inputClass="cusip-input"
            on:typeChange={handleTypeChange}
            on:keydown={(e) => handleKeydown(e, [])}
          >
            <span class="loading-hint error">Suggestions unavailable</span>
          </IdentifierFilter>
        {/await}

        <button class="search-btn" on:click={handleSearch}>View Prices</button>
      </div>

      {#if priceError}
        <div class="error-banner">{priceError}</div>
      {/if}

      {#if selectedIdentifier && securityDescription}
        <p class="security-desc">{securityDescription}</p>
      {/if}

      {#if prices.length > 0 && selectedIdentifier}
        <!-- Chart -->
        <div class="chart-box">
          <h3 class="chart-title">Price Chart — {selectedIdentifier}</h3>
          <div bind:this={chartEl} class="price-chart" />
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
              {#each prices as p}
                <tr class="table-row border-b border-slate-400">
                  <td class="table-cell px-4 py-2">{p.date}</td>
                  <td class="table-cell px-4 py-2 price-val">{p.price.toFixed(6)}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
  {:else if selectedIdentifier && !priceError}
    <p class="empty-msg">No price history found for {selectedIdentifier}.</p>
  {/if}
</div>

<style lang="scss">
  @import "../../../../styles/grid-table";

  .selector-row {
    display: flex;
    gap: 12px;
    margin-bottom: 16px;
    align-items: flex-start;
  }

  // .type-select and .cusip-input are passed as `selectClass` / `inputClass`
  // props down into IdentifierFilter, so they end up on nodes in a child
  // component's scope. Svelte's scoped CSS would otherwise drop them as
  // unused; :global keeps them applying. Limited blast radius: these are
  // page-local class names not used elsewhere.
  :global(.type-select) {
    padding: 6px 10px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 0.85rem;
    background-color: white;
    color: #05192a;
    height: 38px;
    box-sizing: border-box;
    cursor: pointer;
  }

  :global(.cusip-input) {
    width: 100%;
    padding: 6px 12px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 0.85rem;
    background-color: white;
    color: #05192a;
    height: 38px;
    box-sizing: border-box;
  }
  :global(.cusip-input::placeholder) { color: #86929c; }
  :global(.cusip-input:disabled) { background-color: #f3f4f6; color: #86929c; cursor: not-allowed; }

  .loading-hint {
    position: absolute;
    top: 100%;
    left: 0;
    margin-top: 4px;
    font-size: 0.7rem;
    color: #a0adb7;
    font-style: italic;

    &.error { color: #fecaca; }
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
    min-height: 420px;  // chart + range slider + range selector
  }

  // No overflow-x here: page-level wrapper owns scrolling (second-brain#223).
  .table-wrapper {
    width: 100%;
  }


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
