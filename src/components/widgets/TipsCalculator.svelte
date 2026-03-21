<script lang="ts">
  import { onMount } from 'svelte';
  import type { CashflowEntry } from '$lib/valuation';

  export let result: import('$lib/valuation').TipsValuationResult | null = null;
  export let securities: { cusip: string; issuerName: string; couponRate?: string; maturityDate: string }[] = [];

  type Mode = 'cusip' | 'manual';
  let mode: Mode = 'cusip';

  // Shared
  let price = '';
  let currentCpi = '';
  let settlementDate = '';

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
    setTimeout(() => { showSuggestions = false; }, 150);
  }

  // Manual mode
  let faceValue = '1000';
  let realCouponRate = '';
  let couponFrequency = 'SEMIANNUALLY';
  let referenceCpi = '';
  let maturityDate = '';
  let issueDate = '';

  onMount(() => {
    const params = new URLSearchParams(window.location.search);
    const m = params.get('tipsMode');
    if (m === 'cusip' || m === 'manual') mode = m;

    price = params.get('tipsPrice') ?? '';
    currentCpi = params.get('currentCpi') ?? '';
    settlementDate = params.get('settlementDate') ?? '';
    cusip = params.get('tipsCusip') ?? '';
    faceValue = params.get('tipsFaceValue') ?? '1000';
    realCouponRate = params.get('realCouponRate') ?? '';
    couponFrequency = params.get('tipsCouponFrequency') ?? 'SEMIANNUALLY';
    referenceCpi = params.get('referenceCpi') ?? '';
    maturityDate = params.get('tipsMaturityDate') ?? '';
    issueDate = params.get('tipsIssueDate') ?? '';
  });

  function calculate() {
    const params = new URLSearchParams({
      tab: 'tips',
      tipsMode: mode,
      tipsPrice: price,
    });

    if (currentCpi) params.set('currentCpi', currentCpi);
    if (settlementDate) params.set('settlementDate', settlementDate);

    if (mode === 'cusip') {
      if (cusip) params.set('tipsCusip', cusip);
    } else {
      if (faceValue) params.set('tipsFaceValue', faceValue);
      if (realCouponRate) params.set('realCouponRate', realCouponRate);
      if (couponFrequency) params.set('tipsCouponFrequency', couponFrequency);
      if (referenceCpi) params.set('referenceCpi', referenceCpi);
      if (maturityDate) params.set('tipsMaturityDate', maturityDate);
      if (issueDate) params.set('tipsIssueDate', issueDate);
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

  function formatCpi(val: string | undefined): string {
    if (!val) return '—';
    const n = parseFloat(val);
    return isNaN(n) ? val : `${n.toFixed(3)}`;
  }
</script>

<div class="portfolio_container px-10 py-7">
  <h2 class="text-3xl font-extrabold my-3">TIPS Pricer</h2>

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
          <label for="tipsCusip">CUSIP</label>
          <input
            id="tipsCusip"
            type="text"
            bind:value={cusip}
            placeholder="Start typing a TIPS CUSIP..."
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
          <label for="tipsFaceValue">Face Value ($)</label>
          <input id="tipsFaceValue" type="number" bind:value={faceValue} placeholder="1000" />
        </div>
        <div class="field-group">
          <label for="realCouponRate">Real Coupon Rate (%)</label>
          <input id="realCouponRate" type="number" step="0.001" bind:value={realCouponRate} placeholder="e.g. 0.625" />
        </div>
        <div class="field-group">
          <label for="tipsCouponFrequency">Coupon Frequency</label>
          <select id="tipsCouponFrequency" bind:value={couponFrequency}>
            <option value="ANNUALLY">Annual</option>
            <option value="SEMIANNUALLY">Semi-Annual</option>
            <option value="QUARTERLY">Quarterly</option>
            <option value="MONTHLY">Monthly</option>
          </select>
        </div>
        <div class="field-group">
          <label for="tipsIssueDate">Issue Date</label>
          <input id="tipsIssueDate" type="text" bind:value={issueDate} placeholder="YYYY-MM-DD" />
        </div>
        <div class="field-group">
          <label for="tipsMaturityDate">Maturity Date</label>
          <input id="tipsMaturityDate" type="text" bind:value={maturityDate} placeholder="YYYY-MM-DD" />
        </div>
      {/if}

      <div class="field-group">
        <label for="referenceCpi">Reference CPI (at issuance)</label>
        <input id="referenceCpi" type="number" step="0.001" bind:value={referenceCpi} placeholder="e.g. 258.446" />
      </div>
      <div class="field-group">
        <label for="currentCpi">Current CPI</label>
        <input id="currentCpi" type="number" step="0.001" bind:value={currentCpi} placeholder="e.g. 312.230" />
      </div>
      <div class="field-group">
        <label for="settlementDate">Settlement Date</label>
        <input id="settlementDate" type="text" bind:value={settlementDate} placeholder="YYYY-MM-DD" />
      </div>
      <div class="field-group">
        <label for="tipsPrice">Price (% of par)</label>
        <input id="tipsPrice" type="number" step="0.001" bind:value={price} placeholder="e.g. 98.5" />
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
            <tr>
              <td class="label">Inflation-Adjusted Principal</td>
              <td class="value">{formatPrice(result.inflationAdjustedPrincipal)}</td>
            </tr>
            <tr>
              <td class="label">Present Value</td>
              <td class="value">{formatPrice(result.presentValue)}</td>
            </tr>
            <tr>
              <td class="label">Current Yield</td>
              <td class="value">{formatPercent(result.currentYield)}</td>
            </tr>
            <tr>
              <td class="label">Real Yield</td>
              <td class="value">{formatPercent(result.realYield)}</td>
            </tr>
            <tr>
              <td class="label">Yield to Maturity</td>
              <td class="value">{formatPercent(result.yieldToMaturity)}</td>
            </tr>
            <tr>
              <td class="label">Macaulay Duration</td>
              <td class="value">{formatYears(result.macaulayDuration)}</td>
            </tr>
            <tr>
              <td class="label">Index Ratio (CPI)</td>
              <td class="value">{formatCpi(result.indexRatio)}</td>
            </tr>
          </tbody>
        </table>
      {:else}
        <p class="placeholder-msg">Enter inputs and click Calculate to see inflation-adjusted valuation results.</p>
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
