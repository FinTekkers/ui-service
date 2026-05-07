<script lang="ts" context="module">
  /**
   * Friendly default labels for AssetClass enum entries.
   *
   * `CASH_ASSET_CLASS` is the proto name due to a package-wide enum
   * collision with `IdentifierTypeProto.CASH` — the friendly 'Cash'
   * label hides the wart from end users while the URL/proto still
   * carries the canonical name (?assetClass=CASH_ASSET_CLASS).
   *
   * Consumers can override per-entry via the `labels` prop.
   */
  import type { AssetClassName } from '$lib/securityFilterTypes';

  export const DEFAULT_LABELS: Record<AssetClassName, string> = {
    FIXED_INCOME: 'Fixed Income',
    EQUITY: 'Equity',
    CASH_ASSET_CLASS: 'Cash',
    INDEX: 'Index',
  };
</script>

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
   */
  // AssetClassName type is already imported in <script context="module">
  // above and shared with this instance script.
  import { ASSET_CLASS_NAMES } from '$lib/securityFilterTypes';

  export let value: AssetClassName | '' = '';
  export let supportedTypes: readonly AssetClassName[] = ASSET_CLASS_NAMES;
  export let labels: Partial<Record<AssetClassName, string>> = {};
  export let selectClass: string = '';
  export let selectId: string = 'asset-class-filter-value';
  export let allLabel: string = 'All';

  $: resolvedLabels = { ...DEFAULT_LABELS, ...labels };
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
