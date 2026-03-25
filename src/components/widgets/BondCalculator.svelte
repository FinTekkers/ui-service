<script lang="ts">
  import { onMount } from 'svelte';

  import type { CashflowEntry } from '$lib/valuation';
  export let result: import('$lib/valuation').ValuationResult | null = null;
  export let securities: { cusip: string; issuerName: string; couponRate?: string; maturityDate: string }[] = [];

  type Mode = 'cusip' | 'manual';
  let mode: Mode = 'cusip';

  // Shared
  let price = '';

  // CUSIP mode
  let cusip = '';
  let showSuggestions = false;
  let selectedIndex = -1;

  $: filteredSecurities = cusip.length > 0
    ? securities.filter(s =>
        s.cusip.toUpperCase().startsWith(cusip.toUpperCase())
      ).slice(0, 8)
    : [];

  function selectCusip(value: string) {
    cusip = value;
    showSuggestions = false;
    selectedIndex = -1;
  }

  function handleCusipKeydown(e: KeyboardEvent) {
    if (!showSuggestions || filteredSecurities.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      selectedIndex = Math.min(selectedIndex + 1, filteredSecurities.length - 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      selectedIndex = Math.max(selectedIndex - 1, 0);
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      selectCusip(filteredSecurities[selectedIndex].cusip);
    } else if (e.key === 'Escape') {
      showSuggestions = false;
    }
  }

  function handleCusipBlur() {
    // Delay to allow click on suggestion
    setTimeout(() => { showSuggestions = false; }, 150);
  }

  // Manual mode
  let faceValue = '1000';
  let couponRate = '';
  let couponFrequency = 'SEMIANNUALLY';
  let issueDate = '';
  let maturityDate = '';
  let issuerName = '';

  onMount(() => {
    const params = new URLSearchParams(window.location.search);
    const m = params.get('mode');
    if (m === 'cusip' || m === 'manual') mode = m;

    price = params.get('price') ?? '';
    cusip = params.get('cusip') ?? '';
    faceValue = params.get('faceValue') ?? '1000';
    couponRate = params.get('couponRate') ?? '';
    couponFrequency = params.get('couponFrequency') ?? 'SEMIANNUALLY';
    issueDate = params.get('issueDate') ?? '';
    maturityDate = params.get('maturityDate') ?? '';
    issuerName = params.get('issuerName') ?? '';
  });

  function calculate() {
    const params = new URLSearchParams({ mode, price });

    if (mode === 'cusip') {
      if (cusip) params.set('cusip', cusip);
    } else {
      if (faceValue) params.set('faceValue', faceValue);
      if (couponRate) params.set('couponRate', couponRate);
      if (couponFrequency) params.set('couponFrequency', couponFrequency);
      if (issueDate) params.set('issueDate', issueDate);
      if (maturityDate) params.set('maturityDate', maturityDate);
      if (issuerName) params.set('issuerName', issuerName);
    }

    window.location.href = `/data/calculators?${params.toString()}`;
  }

  function formatPercent(val: string | undefined): string {
    if (!val) return '—';
    const n = parseFloat(val);
    return isNaN(n) ? val : `${(n * 100).toFixed(4)}%`;
  }

  function formatYears(val: string | undefined): string {
    if (!val) return '—';
    const n = parseFloat(val);
    return isNaN(n) ? val : `${n.toFixed(4)} yrs`;
  }

  function formatPrice(val: string | undefined): string {
    if (!val) return '—';
    const n = parseFloat(val);
    return isNaN(n) ? val : `${n.toFixed(4)}`;
  }

  function formatDollar(val: string | undefined): string {
    if (!val) return '—';
    const n = parseFloat(val);
    return isNaN(n) ? val : `$${n.toFixed(4)}`;
  }

  function formatConvexity(val: string | undefined): string {
    if (!val) return '—';
    const n = parseFloat(val);
    return isNaN(n) ? val : n.toFixed(2);
  }
</script>

<div class="portfolio_container px-10 py-7">
  <h2 class="text-3xl font-extrabold my-3">Bond Pricer</h2>

  <!-- Mode toggle -->
  <div class="mode-toggle mb-6">
    <button
      class="mode-btn"
      class:active={mode === 'cusip'}
      on:click={() => (mode = 'cusip')}
    >
      CUSIP Lookup
    </button>
    <button
      class="mode-btn"
      class:active={mode === 'manual'}
      on:click={() => (mode = 'manual')}
    >
      Manual Entry
    </button>
  </div>

  <div class="calculator-layout">
    <!-- Inputs -->
    <div class="inputs-panel">
      {#if mode === 'cusip'}
        <div class="field-group autocomplete-wrapper">
          <label for="cusip">CUSIP</label>
          <input
            id="cusip"
            type="text"
            bind:value={cusip}
            placeholder="Start typing a CUSIP..."
            autocomplete="off"
            on:focus={() => { showSuggestions = true; selectedIndex = -1; }}
            on:blur={handleCusipBlur}
            on:keydown={handleCusipKeydown}
            on:input={() => { showSuggestions = true; selectedIndex = -1; }}
          />
          {#if showSuggestions && filteredSecurities.length > 0}
            <ul class="suggestions">
              {#each filteredSecurities as sec, i}
                <li
                  class:selected={i === selectedIndex}
                  on:mousedown|preventDefault={() => selectCusip(sec.cusip)}
                >
                  <span class="suggestion-cusip">{sec.cusip}</span>
                  <span class="suggestion-detail">
                    {sec.couponRate ? sec.couponRate + '%' : 'Zero'} — matures {sec.maturityDate}
                  </span>
                </li>
              {/each}
            </ul>
          {/if}
        </div>
      {:else}
        <div class="field-group">
          <label for="faceValue">Face Value ($)</label>
          <input id="faceValue" type="number" bind:value={faceValue} placeholder="1000" />
        </div>
        <div class="field-group">
          <label for="couponRate">Coupon Rate (%)</label>
          <input id="couponRate" type="number" step="0.001" bind:value={couponRate} placeholder="e.g. 4.25" />
        </div>
        <div class="field-group">
          <label for="couponFrequency">Coupon Frequency</label>
          <select id="couponFrequency" bind:value={couponFrequency}>
            <option value="ANNUALLY">Annual</option>
            <option value="SEMIANNUALLY">Semi-Annual</option>
            <option value="QUARTERLY">Quarterly</option>
            <option value="MONTHLY">Monthly</option>
          </select>
        </div>
        <div class="field-group">
          <label for="maturityDate">Maturity Date</label>
          <input id="maturityDate" type="text" bind:value={maturityDate} placeholder="YYYY-MM-DD" />
        </div>
      {/if}

      <div class="field-group">
        <label for="price">Price (% of par)</label>
        <input id="price" type="number" step="0.001" bind:value={price} placeholder="e.g. 98.5" />
      </div>

      <button class="calc-button mt-4" on:click={calculate}>
        Calculate
      </button>
    </div>

    <!-- Results -->
    <div class="results-panel">
      <h3 class="text-xl font-bold mb-4">Results</h3>

      {#if result?.error}
        <p class="error-msg">{result.error}</p>
      {:else if result}
        <table class="results-table">
          <tbody>
            <tr class="section-header"><td colspan="2">Price</td></tr>
            <tr>
              <td class="label">Dirty Price (Invoice)</td>
              <td class="value">{formatPrice(result.dirtyPrice)}</td>
            </tr>
            <tr>
              <td class="label">Accrued Interest</td>
              <td class="value">{formatDollar(result.accruedInterest)}</td>
            </tr>

            <tr class="section-header"><td colspan="2">Yield</td></tr>
            <tr>
              <td class="label">Current Yield</td>
              <td class="value">{formatPercent(result.currentYield)}</td>
            </tr>
            <tr>
              <td class="label">Yield to Maturity</td>
              <td class="value">{formatPercent(result.yieldToMaturity)}</td>
            </tr>

            <tr class="section-header"><td colspan="2">Risk</td></tr>
            <tr>
              <td class="label">Macaulay Duration</td>
              <td class="value">{formatYears(result.macaulayDuration)}</td>
            </tr>
            <tr>
              <td class="label">Modified Duration</td>
              <td class="value">{formatYears(result.modifiedDuration)}</td>
            </tr>
            <tr>
              <td class="label">Convexity</td>
              <td class="value">{formatConvexity(result.convexity)}</td>
            </tr>
          </tbody>
        </table>
      {:else}
        <p class="placeholder-msg">Enter inputs and click Calculate to see results.</p>
      {/if}
    </div>
  </div>

  {#if result?.cashflows && result.cashflows.length > 0}
    <div class="cashflow-section mt-6">
      <h3 class="text-xl font-bold mb-4">Cashflow Schedule</h3>
      <table class="cashflow-table">
        <thead>
          <tr>
            <th>Date</th>
            <th class="numeric">Future Value</th>
            <th class="numeric">Present Value</th>
          </tr>
        </thead>
        <tbody>
          {#each result.cashflows as cf}
            <tr>
              <td>{cf.date}</td>
              <td class="numeric">{formatPrice(cf.fvAmount)}</td>
              <td class="numeric">{formatPrice(cf.pvAmount)}</td>
            </tr>
          {/each}
          <tr class="total-row">
            <td>Total</td>
            <td class="numeric">{formatPrice(result.cashflows.reduce((s, cf) => s + parseFloat(cf.fvAmount), 0).toString())}</td>
            <td class="numeric">{formatPrice(result.cashflows.reduce((s, cf) => s + parseFloat(cf.pvAmount), 0).toString())}</td>
          </tr>
        </tbody>
      </table>
    </div>
  {/if}
</div>

<style lang="scss">
  @import "../../styles/grid-table";

  .calculator-layout {
    display: flex;
    gap: 2rem;
    flex-wrap: wrap;
    margin-top: 1.5rem;
  }

  .inputs-panel {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    min-width: 260px;
    flex: 1;
  }

  .results-panel {
    flex: 1;
    min-width: 260px;
    background-color: $bgc-color;
    border-radius: $bd-radius;
    padding: 1.5rem;
    color: $white;
  }

  .mode-toggle {
    display: flex;
    gap: 0;
    border: 1px solid $border-color;
    border-radius: $bd-radius;
    width: fit-content;
    margin-bottom: 1.5rem;
  }

  .mode-btn {
    padding: 6px 20px;
    background: transparent;
    border: none;
    font-size: 0.875rem;
    cursor: pointer;
    color: $white;
    transition: background 0.15s;

    &:first-child { border-radius: $bd-radius 0 0 $bd-radius; }
    &:last-child  { border-radius: 0 $bd-radius $bd-radius 0; }

    &.active {
      background: $success;
      color: $bgc-color;
      font-weight: bold;
    }
    &:not(.active):hover {
      background: rgba(255,255,255,0.1);
    }
  }

  .field-group {
    display: flex;
    flex-direction: column;
    gap: 2px;

    label {
      font-size: 0.8rem;
      font-weight: 600;
      color: $white;
    }

    input, select {
      padding: 4px 10px;
      border: 1px solid $border-color;
      border-radius: 4px;
      font-size: 0.875rem;
      height: 38px;
      box-sizing: border-box;
      background-color: white;
      color: $black;

      &::placeholder { color: $grey; }
    }
  }

  .autocomplete-wrapper {
    position: relative;
  }

  .suggestions {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    z-index: 10;
    background: white;
    border: 1px solid $border-color;
    border-radius: 0 0 4px 4px;
    max-height: 220px;
    overflow-y: auto;
    margin: 0;
    padding: 0;
    list-style: none;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);

    li {
      padding: 6px 10px;
      cursor: pointer;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.8rem;
      color: $black;

      &:hover, &.selected {
        background-color: lighten($primary-color, 40%);
      }
    }

    .suggestion-cusip {
      font-weight: 600;
    }

    .suggestion-detail {
      color: $grey;
      font-size: 0.75rem;
    }
  }

  .calc-button {
    background-color: $success;
    color: $bgc-color;
    font-weight: bold;
    padding: 8px 24px;
    border: none;
    border-radius: 4px;
    font-size: 0.875rem;
    cursor: pointer;
    width: fit-content;
    white-space: nowrap;
    transition: all 0.2s ease;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

    &:hover {
      background-color: lighten($success, 5%);
      transform: translateY(-1px);
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.15);
    }
    &:active {
      transform: translateY(0);
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    }
  }

  .results-table {
    width: 100%;
    border-collapse: collapse;

    tr {
      border-bottom: 1px solid $border-color;
    }

    td {
      padding: 10px 8px;
      font-size: 0.9rem;
    }

    .section-header td {
      padding: 12px 8px 4px;
      font-size: 0.7rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: $ltgrey;
      opacity: 0.6;
      border-bottom: none;
    }

    .label {
      color: $ltgrey;
      width: 55%;
    }

    .value {
      font-weight: 600;
      text-align: right;
      color: $tealwhite;
    }
  }

  .error-msg {
    color: $error;
    font-size: 0.9rem;
  }

  .placeholder-msg {
    color: $ltgrey;
    font-size: 0.875rem;
  }

  .cashflow-section {
    background-color: $bgc-color;
    border-radius: $bd-radius;
    padding: 1.5rem;
    color: $white;
  }

  .cashflow-table {
    width: 100%;
    border-collapse: collapse;

    th, td {
      padding: 8px 10px;
      font-size: 0.85rem;
    }

    th {
      color: $ltgrey;
      font-weight: 600;
      border-bottom: 2px solid $border-color;
      text-align: left;

      &.numeric { text-align: right; }
    }

    td {
      border-bottom: 1px solid $border-color;
      color: $tealwhite;

      &.numeric {
        text-align: right;
        font-variant-numeric: tabular-nums;
      }
    }

    .total-row {
      td {
        font-weight: 700;
        border-top: 2px solid $border-color;
        border-bottom: none;
        padding-top: 10px;
      }
    }
  }
</style>
