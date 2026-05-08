<script lang="ts">
  /**
   * Phase 3 of second-brain#226 — second composable filter primitive.
   * Matches IdentifierFilter's API conventions (Phase 2): two-way bound
   * state, no URL knowledge, class pass-through, optional slot below
   * the value input.
   *
   * Owns: ISO-date input + (optional) operator dropdown.
   *
   * Does NOT own:
   *   - URL <-> form sync. The page builds + parses URL params (e.g.
   *     ?tradeDate=…&tradeDateOperator=…) and binds the result here.
   *   - The (date, operator) coupling rule — both required for a valid
   *     filter, neither alone is meaningful. The parent enforces that
   *     when emitting to URL.
   *   - Operator names. The dropdown's option values come from the
   *     ledger-models PositionFilterOperator wrapper directly (no
   *     UI-side enum / label map / shadow translation — #229 review).
   *     Friendly per-operator descriptions belong upstream in
   *     ledger-models; until that lands, options render the proto
   *     enum name verbatim.
   */

  import { PositionFilterOperator } from '@fintekkers/ledger-models/node/wrappers/models/position/position_filter_operator';

  // Two-way bindings — parent owns the state. operator is the proto
  // enum name string (e.g. 'MORE_THAN'); empty string means "no
  // operator selected".
  export let date: string = '';
  export let operator: string = '';

  // Optional: render only the date input, no operator. Useful when the
  // consumer wants an absolute equals-this-date filter without exposing
  // the operator switcher.
  export let withOperator: boolean = true;

  // Operator set for the dropdown. Defaults to the full
  // PositionFilterOperator runtime list (proto declaration order,
  // sentinel UNKNOWN_OPERATOR excluded). Adding a new proto entry
  // automatically widens the dropdown — no UI edit required.
  export let operators: readonly string[] = PositionFilterOperator.getAllTypeNames();

  // Class pass-through (matches IdentifierFilter). Consumer supplies
  // its own page-specific styling on the rendered <input>/<select>.
  export let inputClass: string = '';
  export let selectClass: string = '';
  export let inputId: string = 'date-filter-value';
</script>

<div class="date-filter">
  <div class="value-col">
    <input
      type="date"
      id={inputId}
      class={inputClass}
      bind:value={date}
      on:change
      on:input
    />
    <slot />
  </div>
  {#if withOperator}
    <div class="operator-col">
      <select
        class={selectClass}
        bind:value={operator}
        disabled={!date}
        aria-label="Date operator"
      >
        <option value="">Select operator...</option>
        {#each operators as op}
          <option value={op}>{op}</option>
        {/each}
      </select>
    </div>
  {/if}
</div>

<style lang="scss">
  .date-filter {
    display: flex;
    gap: 8px;
    align-items: stretch;
  }

  // position: relative so the consumer can absolutely-position helper
  // UI under the date input via the default slot (matches the
  // IdentifierFilter slot anchoring convention).
  .value-col {
    flex: 1 1 auto;
    position: relative;
  }

  .operator-col {
    flex: 0 0 auto;
  }
</style>
