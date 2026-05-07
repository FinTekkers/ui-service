<script lang="ts">
  /**
   * Phase 3 of second-brain#226 — third composable filter primitive,
   * matching IdentifierFilter / DateFilter conventions:
   *   - Two-way bound state (bind:value).
   *   - No URL knowledge — parent owns serialization.
   *   - Class pass-through (selectClass) for consumer styling.
   *   - supportedTypes / labels props for subset + override.
   *
   * Owns: a single proto-name dropdown for SecurityType. Includes an
   * "All" empty option so consumers can express "no filter" by emitting
   * an empty string.
   *
   * Friendly default labels (e.g. BOND_SECURITY → 'Bond') live in
   * $lib/securityFilterTypes alongside the runtime name list — single
   * source for the proto-enum vocabulary. Adding a new SecurityTypeProto
   * enum entry lights up the dropdown via SecurityType.getAllTypeNames()
   * automatically; the raw proto name displays until a label is added —
   * deliberate review hook.
   */
  import {
    SECURITY_TYPE_NAMES,
    SECURITY_TYPE_LABELS,
    type SecurityTypeName,
  } from '$lib/securityFilterTypes';

  // Two-way binding — empty string represents "no filter" / All.
  export let value: SecurityTypeName | '' = '';

  // Subset of proto names the consumer wants. Default = full set from
  // SecurityType.getAllTypeNames().
  export let supportedTypes: readonly SecurityTypeName[] = SECURITY_TYPE_NAMES;

  // Per-entry label override; merged over the centralized SECURITY_TYPE_LABELS.
  export let labels: Partial<Record<SecurityTypeName, string>> = {};

  // Class pass-through (matches IdentifierFilter / DateFilter).
  export let selectClass: string = '';
  export let selectId: string = 'security-type-filter-value';

  // Empty-option label. Consumers wanting strict "must pick a type" UX
  // can pass `allLabel=''` and constrain via the parent.
  export let allLabel: string = 'All';

  $: resolvedLabels = { ...SECURITY_TYPE_LABELS, ...labels };
</script>

<select
  id={selectId}
  class={selectClass}
  bind:value
  aria-label="Security type"
>
  <option value="">{allLabel}</option>
  {#each supportedTypes as t}
    <option value={t}>{resolvedLabels[t]}</option>
  {/each}
</select>
