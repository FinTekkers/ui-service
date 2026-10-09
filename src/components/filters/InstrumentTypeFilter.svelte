<script lang="ts">
  /**
   * M5 / #260 — new filter primitive for InstrumentTypeProto, the
   * third dimension of the v0.2.1 product registry alongside product_type
   * and asset_class. The instrument_type dimension answers
   * "structurally, what kind of thing is this":
   *
   *   CASH            — tradable underlying that settles to a position
   *                     (T-Bill, common stock, BTC, FX spot, money-market
   *                     fund, ETF).
   *   DERIVATIVE      — contract whose value derives from an underlying
   *                     (future, option, swap, forward, FX swap, variance
   *                     swap).
   *   REFERENCE_INDEX — observational only, never positioned. Used as
   *                     fixings for derivatives or display benchmarks
   *                     (.SPX, .NDX, .VIX, .SOFR, .CPI, BCOM index level).
   *
   * The distinction makes "show me only what I can hold vs only what
   * I'm referencing" a one-click filter on /data/securities. Primary
   * motivating example (from #256): .SPX (REFERENCE_INDEX) and SPY
   * (CASH ETF tracking .SPX) are both index_type=index but only SPY
   * is positionable.
   *
   * Default option set = `allInstrumentTypes()` from hierarchy.json.
   * Adding a new instrument_type upstream auto-propagates to the
   * dropdown.
   *
   * API conventions mirror IdentifierFilter / DateFilter / ProductTypeFilter:
   *   - Two-way bound state (bind:value).
   *   - No URL knowledge — parent owns serialization.
   *   - Class pass-through.
   *   - supportedTypes prop for a subset; labels come from ledger-models.
   */
  import {
    INSTRUMENT_TYPE_NAMES,
    instrumentTypeCodeLabelOf,
  } from "$lib/securityFilterTypes";

  // Two-way binding — empty string represents "no filter" / All.
  export let value: string = "";

  // Subset of instrument types the consumer wants. Default = full set.
  export let supportedTypes: readonly string[] = INSTRUMENT_TYPE_NAMES;

  // Class pass-through.
  export let selectClass: string = "";
  export let selectId: string = "instrument-type-filter-value";

  // Empty-option label.
  export let allLabel: string = "All";
</script>

<select
  id={selectId}
  class={selectClass}
  bind:value
  aria-label="Instrument type"
>
  <option value="">{allLabel}</option>
  {#each supportedTypes as t}
    <option value={t}>{instrumentTypeCodeLabelOf(t)}</option>
  {/each}
</select>
