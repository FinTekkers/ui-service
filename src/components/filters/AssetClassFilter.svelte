<script lang="ts">
  /**
   * Phase 3 of second-brain#226, updated for M5 / #260 — tree-aware
   * asset class picker.
   *
   * The 0.2.1 asset_class registry (hierarchy.json) is a tree:
   *
   *   FIXED_INCOME
   *   ├── RATES
   *   └── CREDIT
   *   COMMODITY
   *   ├── METALS
   *   ├── ENERGY
   *   └── AGRICULTURAL
   *   EQUITY · VOLATILITY · CASH · FX · CRYPTO · REAL_ESTATE · ALTERNATIVE
   *
   * Selecting `FIXED_INCOME` in this dropdown means "match anything
   * with asset_class in {FIXED_INCOME, RATES, CREDIT}". That descendant
   * expansion happens server-side in the page-server via
   * `assetClassDescendantsOf()` — this component just emits the picked
   * node name unchanged. URL convention is stable from pre-M5
   * (?assetClass=FIXED_INCOME). The semantic change is purely
   * additive: bookmarks for leaf nodes (?assetClass=EQUITY) keep
   * matching exactly what they used to.
   *
   * Options are rendered as a flat list with depth-indentation so the
   * tree shape is visible. Walking with `assetClassParentOf` to compute
   * each node's depth.
   *
   * API conventions mirror IdentifierFilter / DateFilter / ProductTypeFilter:
   *   - Two-way bound state (bind:value).
   *   - No URL knowledge — parent owns serialization.
   *   - Class pass-through (selectClass).
   *   - supportedTypes / labels props for subset + override.
   */
  import {
    ASSET_CLASS_NAMES,
    ASSET_CLASS_LABELS,
    type AssetClassName,
  } from '$lib/securityFilterTypes';
  import { assetClassParentOf } from '@fintekkers/ledger-models/node/wrappers/models/security/product_hierarchy';

  export let value: AssetClassName | '' = '';
  export let supportedTypes: readonly AssetClassName[] = ASSET_CLASS_NAMES;
  export let labels: Partial<Record<AssetClassName, string>> = {};
  export let selectClass: string = '';
  export let selectId: string = 'asset-class-filter-value';
  export let allLabel: string = 'All';

  $: resolvedLabels = { ...ASSET_CLASS_LABELS, ...labels } as Record<string, string>;

  // Compute depth via parent walk so the dropdown can render tree
  // shape visually. Roots return depth 0; their immediate children
  // depth 1; and so on. Cached per render via the supportedTypes
  // reactive — O(n*depth) once, not per option render.
  function depthOf(node: string): number {
    let depth = 0;
    let cur: string | null = node;
    // Safety cap — guards against accidental cycles in hierarchy.json.
    for (let i = 0; i < 16 && cur; i++) {
      const parent = assetClassParentOf(cur);
      if (!parent) break;
      depth += 1;
      cur = parent;
    }
    return depth;
  }

  // Visual indent for tree depth. Two non-breaking spaces per level so
  // the indent survives a plain HTML <select>. Standard pattern for
  // shallow trees rendered in a flat dropdown; if depths grow, switch
  // to an actual tree widget.
  function indentFor(node: string): string {
    return '  '.repeat(depthOf(node));
  }

  // Order options so parents render before their descendants. Tree
  // appearance only works when the flat list is in a stable parent-
  // first order; hierarchy.json's natural key order isn't guaranteed
  // to be one. Sort by (root, depth, label).
  function rootOf(node: string): string {
    let cur: string | null = node;
    for (let i = 0; i < 16; i++) {
      const parent = assetClassParentOf(cur!);
      if (!parent) return cur!;
      cur = parent;
    }
    return cur!;
  }

  $: orderedSupportedTypes = [...supportedTypes].sort((a, b) => {
    const ra = rootOf(a);
    const rb = rootOf(b);
    if (ra !== rb) return ra.localeCompare(rb);
    const da = depthOf(a);
    const db = depthOf(b);
    if (da !== db) return da - db;
    return (resolvedLabels[a] ?? a).localeCompare(resolvedLabels[b] ?? b);
  });
</script>

<select
  id={selectId}
  class={selectClass}
  bind:value
  aria-label="Asset class"
>
  <option value="">{allLabel}</option>
  {#each orderedSupportedTypes as t}
    <option value={t}>{indentFor(t)}{resolvedLabels[t] ?? t}</option>
  {/each}
</select>
