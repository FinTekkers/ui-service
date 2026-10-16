<script lang="ts">
  import { createEventDispatcher, onMount } from "svelte";
  import type { CashflowEntry } from "$lib/valuation";
  import type { CpiReading, CurrentCpiState } from "$lib/cpi";

  export let result: import("$lib/valuation").TipsValuationResult | null = null;
  // US-229: the page's Current CPI lookup for the CUSIP and settlement date
  // (null when there was none). The widget asks for one with `cpilookup`.
  export let cpi: CurrentCpiState | null = null;
  // #266: `baseCpi` carries the canonical TIPS reference CPI from the
  // Security record (data-sourcing-dev's market-data-inputs PR #17
  // populates it from TreasuryDirect's RefCPIDatedDate). When the user
  // picks a CUSIP whose item has `baseCpi`, the Reference CPI input
  // auto-fills from this value. Manual override (PR #164) stays as the
  // fallback for records where baseCpi is undefined.
  export let securities: {
    cusip: string;
    issuerName: string;
    couponRate?: string;
    maturityDate: string;
    baseCpi?: string;
  }[] = [];

  type Mode = "cusip" | "manual";
  let mode: Mode = "cusip";

  // Shared
  let price = "";
  let currentCpi = "";
  let settlementDate = "";

  // CUSIP mode
  let cusip = "";
  let showSuggestions = false;
  let selectedIndex = -1;

  // #266: indicator state for Reference CPI.
  //   'auto'   — populated from the picked Security's TipsDetailsProto.base_cpi
  //   'manual' — user typed a value (override, or no Security match available)
  //   'empty'  — nothing entered yet
  type ReferenceCpiSource = "auto" | "manual" | "empty";
  let referenceCpiSource: ReferenceCpiSource = "empty";

  // US-229: indicator state for Current CPI (CUSIP mode).
  //   'price-service' — valuation-service's REFERENCE_CPI from the price
  //                     service's CPI-U readings for the settlement date
  //   'manual'        — typed by the user, or no reading to use
  //   'empty'         — no lookup yet
  // A typed value is never overwritten by a lookup until the CUSIP or
  // Settlement Date changes. It is sent as reference_cpi and never saved.
  type CurrentCpiSource = "price-service" | "manual" | "empty";
  let currentCpiSource: CurrentCpiSource = "empty";
  let currentCpiTyped = false;
  let currentCpiNote: string | null = null;
  let cpiReadings: CpiReading[] = [];

  const dispatch = createEventDispatcher<{ cpilookup: URLSearchParams }>();

  $: applyCpiLookup(cpi);

  function applyCpiLookup(lookup: CurrentCpiState | null): void {
    if (!lookup || currentCpiTyped) return;
    currentCpi = lookup.value;
    currentCpiSource = lookup.source;
    currentCpiNote = lookup.note;
    cpiReadings = lookup.readings;
  }

  function isSettlementDate(value: string): boolean {
    return /^\d{4}-\d{2}-\d{2}$/.test(value.trim());
  }

  // Ask the page to look up Current CPI. With a Price, valuation-service
  // can also return the REFERENCE_CPI (it requires clean_price).
  function requestCpiLookup(): void {
    if (mode !== "cusip" || currentCpiTyped) return;
    if (!cusip.trim() || !isSettlementDate(settlementDate)) return;
    const params = new URLSearchParams({
      tab: "tips",
      tipsMode: "cusip",
      tipsCusip: cusip.trim(),
      settlementDate: settlementDate.trim(),
    });
    const p = String(price ?? "").trim();
    if (p) {
      params.set("tipsPrice", p);
      params.set("cpiPreview", "1");
    }
    if (referenceCpi) params.set("referenceCpi", String(referenceCpi));
    dispatch("cpilookup", params);
  }

  // A new CUSIP or Settlement Date needs a new CPI: drop the old one, typed
  // or not, and look it up again.
  function handleCusipOrDateChange(): void {
    if (mode !== "cusip") return;
    if (!cusip.trim() || !isSettlementDate(settlementDate)) return;
    currentCpiTyped = false;
    currentCpi = "";
    currentCpiSource = "empty";
    currentCpiNote = null;
    cpiReadings = [];
    requestCpiLookup();
  }

  function handlePriceChange(): void {
    if (currentCpiSource === "price-service" && !currentCpi) requestCpiLookup();
  }

  function handleCurrentCpiInput(): void {
    currentCpiTyped = true;
    currentCpiSource = "manual";
  }

  $: filteredSecurities =
    cusip.length > 0
      ? securities
          .filter((s) => s.cusip.toUpperCase().startsWith(cusip.toUpperCase()))
          .slice(0, 8)
      : [];

  function autofillReferenceCpiFor(pickedCusip: string): void {
    // Skip when the user has manually overridden — the PR #164 fallback
    // escape hatch must survive a subsequent CUSIP pick. Only fire when
    // the input is in 'empty' or 'auto' state.
    if (referenceCpiSource === "manual") return;
    // Match exactly on cusip — autocomplete only ever passes a value from
    // the suggestion list, but defensive equality keeps the auto path
    // from firing on a partial typed string that happens to match a
    // CUSIP prefix.
    const sec = securities.find((s) => s.cusip === pickedCusip);
    if (sec?.baseCpi && sec.baseCpi.trim() !== "") {
      referenceCpi = sec.baseCpi;
      referenceCpiSource = "auto";
    }
  }

  function selectCusip(value: string) {
    cusip = value;
    showSuggestions = false;
    selectedIndex = -1;
    autofillReferenceCpiFor(value);
    handleCusipOrDateChange();
  }

  $: pickedSecurity = securities.find(
    (s) => s.cusip === cusip.trim().toUpperCase()
  );

  // Manual edits to Reference CPI flip the indicator to 'manual' so a
  // subsequent CUSIP pick doesn't silently clobber the override. Empty
  // input resets to 'empty' so picking a CUSIP can auto-fill again.
  // Coerce to string first — `bind:value` on a `type="number"` input
  // surfaces the bound variable as `number` once the user types, so
  // calling `.trim()` directly would throw on that path.
  function handleReferenceCpiInput(): void {
    const v = String(referenceCpi ?? "");
    referenceCpiSource = v.trim() === "" ? "empty" : "manual";
  }

  function handleCusipKeydown(e: KeyboardEvent) {
    if (!showSuggestions || filteredSecurities.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      selectedIndex = Math.min(
        selectedIndex + 1,
        filteredSecurities.length - 1
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      selectedIndex = Math.max(selectedIndex - 1, 0);
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      e.preventDefault();
      selectCusip(filteredSecurities[selectedIndex].cusip);
    } else if (e.key === "Escape") {
      showSuggestions = false;
    }
  }

  function handleCusipBlur() {
    setTimeout(() => {
      showSuggestions = false;
    }, 150);
  }

  // Manual mode
  let faceValue = "1000";
  let realCouponRate = "";
  let couponFrequency = "SEMIANNUALLY";
  let referenceCpi = "";
  let maturityDate = "";
  let issueDate = "";

  onMount(() => {
    const params = new URLSearchParams(window.location.search);
    const m = params.get("tipsMode");
    if (m === "cusip" || m === "manual") mode = m;

    price = params.get("tipsPrice") ?? "";
    // US-229: a looked-up value (from `cpi`) wins over the URL unless the
    // user typed one, which the URL marks with currentCpiSource=manual.
    currentCpiTyped =
      mode === "cusip" && params.get("currentCpiSource") === "manual";
    if (!cpi || currentCpiTyped) {
      currentCpi = params.get("currentCpi") ?? "";
      if (currentCpiTyped) currentCpiSource = "manual";
    }
    settlementDate = params.get("settlementDate") ?? "";
    cusip = params.get("tipsCusip") ?? "";
    faceValue = params.get("tipsFaceValue") ?? "1000";
    realCouponRate = params.get("realCouponRate") ?? "";
    couponFrequency = params.get("tipsCouponFrequency") ?? "SEMIANNUALLY";
    referenceCpi = params.get("referenceCpi") ?? "";
    // #266: if the URL supplied an explicit referenceCpi (= the user
    // manually overrode it on the prior page render), that wins —
    // mark it 'manual' so the auto-fill reactive below doesn't clobber
    // it. If empty, leave 'empty'; the reactive will auto-fill when
    // `securities` resolves.
    referenceCpiSource =
      String(referenceCpi ?? "").trim() === "" ? "empty" : "manual";
    maturityDate = params.get("tipsMaturityDate") ?? "";
    issueDate = params.get("tipsIssueDate") ?? "";
  });

  // #266: auto-fill when `securities` arrives (it's streamed) and the
  // current `cusip` matches a record carrying `baseCpi`. Guarded on
  // referenceCpiSource === 'empty' so a manual override or an already-
  // auto-populated value is never silently overwritten.
  $: if (
    mode === "cusip" &&
    cusip &&
    referenceCpiSource === "empty" &&
    securities.length > 0
  ) {
    autofillReferenceCpiFor(cusip);
  }

  function calculate() {
    const params = new URLSearchParams({
      tab: "tips",
      tipsMode: mode,
      tipsPrice: price,
    });

    // A price-service value is looked up again by `load` (readings, not
    // currentCpi); only a typed one travels in the URL, marked so `load`
    // never overwrites it.
    const cpiFromPriceService =
      mode === "cusip" && currentCpiSource === "price-service";
    if (currentCpi && !cpiFromPriceService) {
      params.set("currentCpi", currentCpi);
    }
    if (mode === "cusip" && currentCpiTyped) {
      params.set("currentCpiSource", "manual");
    }
    if (settlementDate) params.set("settlementDate", settlementDate);

    if (mode === "cusip") {
      if (cusip) params.set("tipsCusip", cusip);
    } else {
      if (faceValue) params.set("tipsFaceValue", faceValue);
      if (realCouponRate) params.set("realCouponRate", realCouponRate);
      if (couponFrequency) params.set("tipsCouponFrequency", couponFrequency);
      if (maturityDate) params.set("tipsMaturityDate", maturityDate);
      if (issueDate) params.set("tipsIssueDate", issueDate);
    }
    // Reference CPI applies to both modes — the input is rendered outside
    // the mode-toggle block. In CUSIP mode, a form-supplied referenceCpi
    // overrides the wire's base_cpi (which is missing on some pre-#263-
    // backfill TIPS records, causing valuation-service to reject the
    // request with "Missing required field: base_cpi").
    if (referenceCpi) params.set("referenceCpi", referenceCpi);

    window.location.href = `/data/calculators?${params.toString()}`;
  }

  function formatPercent(val: string | undefined): string {
    if (!val) return "—";
    const n = parseFloat(val);
    return isNaN(n) ? val : `${(n * 100).toFixed(4)}%`;
  }

  function formatYears(val: string | undefined): string {
    if (!val) return "—";
    const n = parseFloat(val);
    return isNaN(n) ? val : `${n.toFixed(4)} yrs`;
  }

  function formatPrice(val: string | undefined): string {
    if (!val) return "—";
    const n = parseFloat(val);
    return isNaN(n) ? val : `${n.toFixed(4)}`;
  }

  // Treasury publishes index ratios to 5 decimals.
  function formatIndexRatio(val: string | undefined): string {
    if (!val) return "—";
    const n = parseFloat(val);
    return isNaN(n) ? val : `${n.toFixed(5)}`;
  }

  function formatAmount(val: string | undefined): string {
    if (!val) return "—";
    const n = parseFloat(val);
    return isNaN(n)
      ? val
      : n.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
  }
</script>

<div class="portfolio_container px-10 py-7">
  <h2 class="text-3xl font-extrabold my-3">TIPS Pricer</h2>

  <!-- Mode toggle -->
  <div class="mode-toggle mb-6">
    <button
      class="mode-btn"
      class:active={mode === "cusip"}
      on:click={() => (mode = "cusip")}
    >
      CUSIP Lookup
    </button>
    <button
      class="mode-btn"
      class:active={mode === "manual"}
      on:click={() => (mode = "manual")}
    >
      Manual Entry
    </button>
  </div>

  <div class="calculator-layout">
    <!-- Inputs -->
    <div class="inputs-panel">
      {#if mode === "cusip"}
        <div class="field-group autocomplete-wrapper">
          <label for="tipsCusip">CUSIP</label>
          <input
            id="tipsCusip"
            type="text"
            bind:value={cusip}
            placeholder="Start typing a TIPS CUSIP..."
            autocomplete="off"
            on:focus={() => {
              showSuggestions = true;
              selectedIndex = -1;
            }}
            on:blur={handleCusipBlur}
            on:keydown={handleCusipKeydown}
            on:change={handleCusipOrDateChange}
            on:input={() => {
              showSuggestions = true;
              selectedIndex = -1;
            }}
            aria-describedby={pickedSecurity ? "tipsCusipNote" : undefined}
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
                    {sec.couponRate ? sec.couponRate + "%" : "Zero"} — matures {sec.maturityDate}
                  </span>
                </li>
              {/each}
            </ul>
          {/if}
          {#if pickedSecurity}
            <p id="tipsCusipNote" class="field-note">
              {pickedSecurity.couponRate
                ? pickedSecurity.couponRate + "%"
                : "Zero"} — matures {pickedSecurity.maturityDate}
            </p>
          {/if}
        </div>
        <div class="field-group">
          <label for="settlementDate">Settlement Date</label>
          <input
            id="settlementDate"
            type="text"
            bind:value={settlementDate}
            on:change={handleCusipOrDateChange}
            placeholder="YYYY-MM-DD"
          />
        </div>
        <div class="field-group">
          <label for="tipsPrice">Price (% of par)</label>
          <input
            id="tipsPrice"
            type="number"
            step="0.001"
            bind:value={price}
            on:change={handlePriceChange}
            placeholder="e.g. 98.5"
          />
        </div>
      {:else}
        <div class="field-group">
          <label for="tipsFaceValue">Face Value ($)</label>
          <input
            id="tipsFaceValue"
            type="number"
            bind:value={faceValue}
            placeholder="1000"
          />
        </div>
        <div class="field-group">
          <label for="realCouponRate">Real Coupon Rate (%)</label>
          <input
            id="realCouponRate"
            type="number"
            step="0.001"
            bind:value={realCouponRate}
            placeholder="e.g. 0.625"
          />
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
          <input
            id="tipsIssueDate"
            type="text"
            bind:value={issueDate}
            placeholder="YYYY-MM-DD"
          />
        </div>
        <div class="field-group">
          <label for="tipsMaturityDate">Maturity Date</label>
          <input
            id="tipsMaturityDate"
            type="text"
            bind:value={maturityDate}
            placeholder="YYYY-MM-DD"
          />
        </div>
      {/if}

      <div class="field-group">
        <label for="referenceCpi">
          Reference CPI (at issuance)
          {#if referenceCpiSource === "auto"}
            <span
              class="cpi-source cpi-source-auto"
              title="Populated from the Security record (TipsDetailsProto.base_cpi)"
            >
              from Security master
            </span>
          {:else if referenceCpiSource === "manual"}
            <span
              class="cpi-source cpi-source-manual"
              title="Manually overridden — auto-fill from the Security record is disabled until this field is cleared"
            >
              manual override
            </span>
          {/if}
        </label>
        <input
          id="referenceCpi"
          type="number"
          step="0.001"
          bind:value={referenceCpi}
          on:input={handleReferenceCpiInput}
          placeholder="e.g. 258.446"
        />
      </div>
      <div class="field-group">
        {#if mode === "cusip"}
          <label for="currentCpi">
            Current CPI (for settlement date)
            {#if currentCpiSource === "price-service"}
              <span
                class="cpi-source cpi-source-auto"
                title="Reference CPI from valuation-service, interpolated from the price service's CPI-U readings"
              >
                from price service
              </span>
            {:else if currentCpiSource === "manual"}
              <span
                class="cpi-source cpi-source-manual"
                title="Typed value, sent as the reference CPI. It is not saved."
              >
                manual entry
              </span>
            {/if}
          </label>
        {:else}
          <label for="currentCpi">Current CPI</label>
        {/if}
        <input
          id="currentCpi"
          type="number"
          step="0.001"
          bind:value={currentCpi}
          on:input={handleCurrentCpiInput}
          placeholder="e.g. 312.230"
          aria-describedby={mode === "cusip" &&
          (cpiReadings.length > 0 || currentCpiNote)
            ? "currentCpiNote"
            : undefined}
        />
        {#if mode === "cusip" && currentCpiSource === "price-service" && cpiReadings.length > 0}
          <p id="currentCpiNote" class="field-note">
            From {cpiReadings
              .map((r) => `${r.label} (${r.value})`)
              .join(" and ")}.
            {#if !currentCpi}Enter Price to see the value.{/if}
          </p>
        {:else if mode === "cusip" && currentCpiNote}
          <p id="currentCpiNote" class="field-note">{currentCpiNote}</p>
        {/if}
      </div>
      {#if mode === "manual"}
        <div class="field-group">
          <label for="settlementDate">Settlement Date</label>
          <input
            id="settlementDate"
            type="text"
            bind:value={settlementDate}
            placeholder="YYYY-MM-DD"
          />
        </div>
        <div class="field-group">
          <label for="tipsPrice">Price (% of par)</label>
          <input
            id="tipsPrice"
            type="number"
            step="0.001"
            bind:value={price}
            placeholder="e.g. 98.5"
          />
        </div>
      {/if}

      <button class="calc-button mt-4" on:click={calculate}> Calculate </button>
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
              <td class="value"
                >{formatAmount(result.inflationAdjustedPrincipal)}</td
              >
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
              <td class="value">{formatIndexRatio(result.indexRatio)}</td>
            </tr>
            <tr>
              <td class="label">CPI source</td>
              <td class="value">{result.cpiSource ?? "—"}</td>
            </tr>
          </tbody>
        </table>
      {:else}
        <p class="placeholder-msg">
          Enter inputs and click Calculate to see inflation-adjusted valuation
          results.
        </p>
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
            <td class="numeric"
              >{formatPrice(
                result.cashflows
                  .reduce((s, cf) => s + parseFloat(cf.fvAmount), 0)
                  .toString()
              )}</td
            >
            <td class="numeric"
              >{formatPrice(
                result.cashflows
                  .reduce((s, cf) => s + parseFloat(cf.pvAmount), 0)
                  .toString()
              )}</td
            >
          </tr>
        </tbody>
      </table>
    </div>
  {/if}
</div>

<style lang="scss">
  @import "../../styles/grid-table";

  // #266 Reference-CPI source indicator pill — sits inline with the
  // field label, kept visually subtle (small + muted) so it doesn't
  // compete with the input for attention.
  .cpi-source {
    display: inline-block;
    margin-left: 8px;
    padding: 1px 8px;
    font-size: 0.7rem;
    font-weight: 500;
    border-radius: 10px;
    vertical-align: 1px;
    letter-spacing: 0.02em;
  }
  .cpi-source-auto {
    background-color: rgba(34, 197, 94, 0.18);
    color: #86efac;
  }
  .cpi-source-manual {
    background-color: rgba(245, 158, 11, 0.18);
    color: #fde68a;
  }

  // Sticky inputs+results so the user keeps parameters visible while
  // scrolling a long cashflow schedule (#223 calc-page amendment). See
  // BondCalculator.svelte for full rationale.
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

    &:first-child {
      border-radius: $bd-radius 0 0 $bd-radius;
    }
    &:last-child {
      border-radius: 0 $bd-radius $bd-radius 0;
    }

    &.active {
      background: $success;
      color: $bgc-color;
      font-weight: bold;
    }
    &:not(.active):hover {
      background: rgba(255, 255, 255, 0.1);
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

    input,
    select {
      padding: 4px 10px;
      border: 1px solid $border-color;
      border-radius: 4px;
      font-size: 0.875rem;
      height: 38px;
      box-sizing: border-box;
      background-color: white;
      color: $black;

      &::placeholder {
        color: $grey;
      }
    }
  }

  // US-229: a short hint under a field (coupon/maturity, CPI readings).
  .field-note {
    margin: 2px 0 0;
    font-size: 0.75rem;
    color: $ltgrey;
    overflow-wrap: anywhere;
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

      &:hover,
      &.selected {
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

    th,
    td {
      padding: 8px 10px;
      font-size: 0.85rem;
    }

    th {
      color: $ltgrey;
      font-weight: 600;
      border-bottom: 2px solid $border-color;
      text-align: left;

      &.numeric {
        text-align: right;
      }
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
