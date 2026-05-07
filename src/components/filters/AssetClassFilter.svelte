<script lang="ts">
  /**
   * Phase 3 of second-brain#226 — fourth composable filter primitive.
   * Same shape as SecurityTypeFilter / IdentifierFilter / DateFilter:
   *   - Two-way bound state (bind:value).
   *   - No URL knowledge — parent owns serialization.
   *   - Class pass-through (selectClass).
   *   - supportedTypes / labels props for subset + override.
   *
   * Owns: a single proto-name dropdown for AssetClass. Includes an
   * "All" empty option for the "no filter" case.
   *
   * Phased note (per dispatch): the proto field on Security is still a
   * free-form string — this filter normalizes the UI side to emit the
   * enum name (e.g. 'FIXED_INCOME') as the assetClass URL param value.
   * Backend can match the string OR free-form values; no backend change
   * required for this PR.
   *
   * Friendly default labels (e.g. CASH_ASSET_CLASS → 'Cash') live in
   * $lib/securityFilterTypes — single source for the proto-enum
   * vocabulary; the friendly label hides the CASH_ASSET_CLASS naming
   * wart (collision with IdentifierTypeProto.CASH) from end users.
   */
  import {
    ASSET_CLASS_NAMES,
    ASSET_CLASS_LABELS,
    type AssetClassName,
  } from '$lib/securityFilterTypes';

  export let value: AssetClassName | '' = '';
  export let supportedTypes: readonly AssetClassName[] = ASSET_CLASS_NAMES;
  export let labels: Partial<Record<AssetClassName, string>> = {};
  export let selectClass: string = '';
  export let selectId: string = 'asset-class-filter-value';
  export let allLabel: string = 'All';

  $: resolvedLabels = { ...ASSET_CLASS_LABELS, ...labels };
</script>

<select
  id={selectId}
  class={selectClass}
  bind:value
  aria-label="Asset class"
>
  <option value="">{allLabel}</option>
  {#each supportedTypes as t}
    <option value={t}>{resolvedLabels[t]}</option>
  {/each}
</select>
