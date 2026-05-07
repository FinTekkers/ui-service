<script lang="ts">
  /**
   * Phase 2 of second-brain#226 — first composable filter primitive.
   *
   * Owns: identifier-type dropdown + identifier value input + type-aware
   * placeholder text. Two-way binds `identifierType` and `identifier` so the
   * parent owns the form state and any URL serialization.
   *
   * Does NOT own:
   *   - URL <-> form sync (each page has its own param convention; pricing
   *     uses ?type=ticker, securities uses ?identifierType=EXCH_TICKER —
   *     keeping URL knowledge at the page level avoids encoding both shapes
   *     in this primitive).
   *   - Autocomplete suggestions. The default slot renders below the input
   *     inside a `position: relative` wrapper so consumers (e.g. /data/prices)
   *     can absolutely-position a suggestion list under the input. Securities
   *     leaves the slot empty.
   *
   * Why a primitive (Option B in #226), not a panel (Option A): the two
   * consumers (securities, prices) do meaningfully different things around
   * this control — securities pairs it with text inputs, prices pairs it
   * with a streamed-universe autocomplete. A single FilterPanel would have
   * to encode both layouts; two pages composing one primitive is a smaller
   * abstraction.
   */
  import { createEventDispatcher } from 'svelte';
  import {
    IDENTIFIER_TYPE_NAMES,
    IDENTIFIER_TYPE_LABELS,
    IDENTIFIER_TYPE_PLACEHOLDERS,
    type IdentifierTypeName,
  } from '$lib/securityFilterTypes';

  // Two-way bindings — parent owns the state.
  export let identifierType: IdentifierTypeName = 'CUSIP';
  export let identifier: string = '';

  // Subset of types this consumer wants. Default = all known types.
  // /data/prices passes ['CUSIP','ISIN','EXCH_TICKER','SERIES_ID']; securities
  // passes the full list (or omits this prop).
  export let supportedTypes: readonly IdentifierTypeName[] = IDENTIFIER_TYPE_NAMES;

  // Built-in human-friendly labels + per-type placeholder hints. Defaults
  // live in $lib/securityFilterTypes (single source for the proto-enum
  // vocabulary); consumers can override per-type via the props below.
  export let labels: Partial<Record<IdentifierTypeName, string>> = {};
  export let placeholders: Partial<Record<IdentifierTypeName, string>> = {};

  // When true (default), switching the type clears the value input — a
  // CUSIP isn't a ticker, so leaving the previous value would lead to
  // confusing dead-end searches. Consumers that want to preserve the value
  // across type swaps (rare) can opt out.
  export let clearOnTypeChange: boolean = true;

  // Optional CSS classes for tailoring the input to the page's existing
  // styling. SecuritySelect has its own .filter-input styling; prices uses
  // .cusip-input. Pass-through avoids duplicating layout rules in the
  // primitive.
  export let inputClass: string = '';
  export let selectClass: string = '';
  export let inputId: string = 'identifier-filter-value';

  $: resolvedLabels = { ...IDENTIFIER_TYPE_LABELS, ...labels };
  $: resolvedPlaceholders = { ...IDENTIFIER_TYPE_PLACEHOLDERS, ...placeholders };
  $: currentPlaceholder = resolvedPlaceholders[identifierType];

  const dispatch = createEventDispatcher<{ typeChange: IdentifierTypeName }>();

  function handleTypeChange() {
    if (clearOnTypeChange) {
      identifier = '';
    }
    dispatch('typeChange', identifierType);
  }
</script>

<div class="identifier-filter">
  <div class="type-col">
    <select
      class={selectClass}
      bind:value={identifierType}
      on:change={handleTypeChange}
      aria-label="Identifier type"
    >
      {#each supportedTypes as type}
        <option value={type}>{resolvedLabels[type]}</option>
      {/each}
    </select>
  </div>
  <div class="value-col">
    <input
      type="text"
      id={inputId}
      class={inputClass}
      placeholder={currentPlaceholder}
      bind:value={identifier}
      autocomplete="off"
      on:keydown
      on:focus
      on:blur
      on:input
    />
    <slot />
  </div>
</div>

<style lang="scss">
  .identifier-filter {
    display: flex;
    gap: 8px;
    align-items: stretch;
  }

  .type-col {
    flex: 0 0 auto;
  }

  // position: relative so the consumer can absolutely-position a suggestion
  // list (or any other overlay) below the input via the default slot.
  .value-col {
    flex: 1 1 auto;
    position: relative;
  }
</style>
