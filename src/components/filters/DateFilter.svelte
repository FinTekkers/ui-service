<script lang="ts" context="module">
  /**
   * Operator vocabulary for date filters. Currently sourced from the
   * tradeDateOperator shape PositionSelect already used (preserved end-
   * to-end for URL compat with /data/positions/+page.server.ts). PR-B
   * (transactions + securities migrations) adopts the same set; if a
   * future consumer needs `equals` / `greater_than_or_equals`, extend
   * here and the dropdown picks them up automatically.
   *
   * Note on shape sharing with IdentifierFilter: IdentifierFilter sources
   * its names from ledger-models's `Identifier.getAllTypeNames()` so a
   * proto enum addition propagates without UI edits. Date operators
   * have no proto enum to share — they're URL-string conventions in
   * /data/*+page.server.ts, so a hand-typed union is the right shape.
   * Documented for the Phase 3+ "shared operator-label list" thought:
   * not factored because the two consumers (identifier-types vs date-
   * operators) genuinely have different sources of truth.
   */
  export type DateOperator =
    | 'greater_than'
    | 'lesser_than'
    | 'lesser_than_or_equals';

  export const DEFAULT_DATE_OPERATORS: readonly DateOperator[] = [
    'greater_than',
    'lesser_than',
    'lesser_than_or_equals',
  ] as const;

  export const DEFAULT_DATE_OPERATOR_LABELS: Record<DateOperator, string> = {
    greater_than: 'Greater Than',
    lesser_than: 'Lesser Than',
    lesser_than_or_equals: 'Lesser Than or Equal',
  };
</script>

<script lang="ts">
  /**
   * Phase 3 of second-brain#226 — second composable filter primitive.
   * Matches IdentifierFilter's API conventions (Phase 2): two-way bound
   * state, no URL knowledge, class pass-through, optional slot below
   * the value input. See IdentifierFilter.svelte for the full Phase 2
   * design rationale.
   *
   * Owns: ISO-date input + (optional) operator dropdown.
   *
   * Does NOT own:
   *   - URL <-> form sync. The page builds + parses URL params (e.g.
   *     ?tradeDate=…&tradeDateOperator=…) and binds the result here.
   *   - The (date, operator) coupling rule — both required for a valid
   *     filter, neither alone is meaningful. The parent enforces that
   *     when emitting to URL (see PositionSelect.fetchPositions for
   *     the canonical pattern).
   *
   * URL/serialization staying outside is consistent with IdentifierFilter:
   * /data/positions, /data/transactions, /data/securities each name their
   * date param differently (tradeDate vs issueDate vs settlementDate),
   * and the operator-naming convention may diverge in the future. Keeping
   * this primitive form-scoped means each page's URL can evolve without
   * touching shared code.
   */

  // Two-way bindings — parent owns the state.
  export let date: string = '';
  export let operator: DateOperator | '' = '';

  // Optional: render only the date input, no operator. Useful when the
  // consumer wants an absolute equals-this-date filter without exposing
  // the operator switcher.
  export let withOperator: boolean = true;

  // Operator subset + label override. Defaults match the existing
  // /data/positions tradeDateOperator vocabulary.
  export let operators: readonly DateOperator[] = DEFAULT_DATE_OPERATORS;
  export let operatorLabels: Partial<Record<DateOperator, string>> = {};

  // Class pass-through (matches IdentifierFilter). Consumer supplies
  // its own page-specific styling on the rendered <input>/<select>.
  export let inputClass: string = '';
  export let selectClass: string = '';
  export let inputId: string = 'date-filter-value';

  $: resolvedLabels = { ...DEFAULT_DATE_OPERATOR_LABELS, ...operatorLabels };
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
          <option value={op}>{resolvedLabels[op]}</option>
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
