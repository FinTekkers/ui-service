<script lang="ts" context="module">
  /**
   * Friendly default labels for SecurityType enum entries. Hides the
   * `_SECURITY` suffix on the user-facing dropdown while the URL/proto
   * still carries the canonical name (e.g. ?securityType=BOND_SECURITY).
   * Consumers can override per-entry via the `labels` prop.
   *
   * Adding a new SecurityTypeProto enum entry lights up automatically in
   * the dropdown via SecurityType.getAllTypeNames() — but it'll display
   * its raw proto name until added here. Treated as a deliberate review
   * hook (same as the IdentifierTypeName literal-union lag).
   */
  import type { SecurityTypeName } from '$lib/securityFilterTypes';

  export const DEFAULT_LABELS: Record<SecurityTypeName, string> = {
    BOND_SECURITY: 'Bond',
    EQUITY_SECURITY: 'Equity',
    INDEX_SECURITY: 'Index',
    CASH_SECURITY: 'Cash',
    TIPS: 'TIPS',
    FRN: 'FRN',
    FX_SPOT: 'FX Spot',
    EQUITY_INDEX_SECURITY: 'Equity Index',
  };
</script>

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
   */
  // SecurityTypeName type is already imported in <script context="module">
  // above and shared with this instance script.
  import { SECURITY_TYPE_NAMES } from '$lib/securityFilterTypes';

  // Two-way binding — empty string represents "no filter" / All.
  export let value: SecurityTypeName | '' = '';

  // Subset of proto names the consumer wants. Default = full set from
  // SecurityType.getAllTypeNames().
  export let supportedTypes: readonly SecurityTypeName[] = SECURITY_TYPE_NAMES;

  // Per-entry label override; merged over DEFAULT_LABELS.
  export let labels: Partial<Record<SecurityTypeName, string>> = {};

  // Class pass-through (matches IdentifierFilter / DateFilter).
  export let selectClass: string = '';
  export let selectId: string = 'security-type-filter-value';

  // Empty-option label. Consumers wanting strict "must pick a type" UX
  // can pass `allLabel=''` and constrain via the parent.
  export let allLabel: string = 'All';

  $: resolvedLabels = { ...DEFAULT_LABELS, ...labels };
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
