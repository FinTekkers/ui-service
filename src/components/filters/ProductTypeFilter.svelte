<script lang="ts">
  /**
   * Phase 3 of second-brain#226, updated for M5 / #260 (ledger-models
   * v0.2.1 cutover). Replaces SecurityTypeFilter — the SecurityType
   * wrapper + SecurityTypeProto enum were retired in 0.2.1 in favour
   * of ProductTypeProto + the product_hierarchy registry.
   *
   * Owns: a single proto-name dropdown for ProductType. Default
   * option set = `activeProductTypes()` from hierarchy.json (status=
   * active leaves only; abstract nodes BOND / GOV_BOND / OPTION are
   * intentionally absent — those are walked via the registry helpers,
   * not picked directly).
   *
   * Friendly labels come from `labelOf(name)` (hierarchy.json's
   * `label` field) and are exposed through `PRODUCT_TYPE_LABELS` in
   * $lib/securityFilterTypes. Adding a new active leaf upstream lights
   * up the dropdown automatically with its registry label.
   *
   * API conventions mirror IdentifierFilter / DateFilter / AssetClassFilter:
   *   - Two-way bound state (bind:value).
   *   - No URL knowledge — parent owns serialization.
   *   - Class pass-through (selectClass) for consumer styling.
   *   - supportedTypes / labels props for subset + override.
   */
  import {
    PRODUCT_TYPE_NAMES,
    PRODUCT_TYPE_LABELS,
    type ProductTypeName,
  } from '$lib/securityFilterTypes';

  // Two-way binding — empty string represents "no filter" / All.
  export let value: ProductTypeName | '' = '';

  // Subset of proto names the consumer wants. Default = full active
  // set from product_hierarchy.activeProductTypes().
  export let supportedTypes: readonly ProductTypeName[] = PRODUCT_TYPE_NAMES;

  // Per-entry label override; merged over PRODUCT_TYPE_LABELS.
  export let labels: Partial<Record<ProductTypeName, string>> = {};

  // Class pass-through.
  export let selectClass: string = '';
  export let selectId: string = 'product-type-filter-value';

  // Empty-option label. Consumers wanting strict "must pick a type" UX
  // can pass `allLabel=''` and constrain via the parent.
  export let allLabel: string = 'All';

  $: resolvedLabels = { ...PRODUCT_TYPE_LABELS, ...labels } as Record<string, string>;
</script>

<select
  id={selectId}
  class={selectClass}
  bind:value
  aria-label="Product type"
>
  <option value="">{allLabel}</option>
  {#each supportedTypes as t}
    <option value={t}>{resolvedLabels[t] ?? t}</option>
  {/each}
</select>
