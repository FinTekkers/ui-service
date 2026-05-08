<script lang="ts" context="module">
  /**
   * Phase 3 of second-brain#226 — sixth composable filter primitive.
   * Multi-select dropdown for picking position-measure names. The
   * external API speaks in proto enum names ('DIRECTED_QUANTITY',
   * 'MARKET_VALUE', ...); the dropdown renders friendly title-case
   * labels via DEFAULT_MEASURE_LABELS so the user never sees raw
   * upper-snake-case names.
   *
   * Single in-tree consumer today: PositionSelect.svelte. Factored
   * out for consistency with the other Phase 3 primitives — same API
   * shape (bind:value, supportedX prop, labels override) makes the
   * form a sequence of small composable parts instead of one
   * 300-line god-component.
   *
   * No URL knowledge — the page consumer owns ?measures=… emission
   * and parsing. No proto-name validation either; the URL convention
   * is already proto names, so a malformed URL just produces an
   * unselected option in the dropdown.
   */
  // Measure wrapper from ledger-models 0.1.138+ (PR #194). Same
  // consumer pattern as IDENTIFIER_TYPE_NAMES (#188), SECURITY_TYPE_NAMES
  // / ASSET_CLASS_NAMES (#189), PositionFilterOperator (#190). The
  // wrapper's getAllTypeNames() is the source-of-truth for "every
  // known measure name (sentinel UNKNOWN_MEASURE excluded)" — adding
  // a new proto entry upstream auto-propagates to this dropdown.
  import { Measure } from '@fintekkers/ledger-models/node/wrappers/models/position/measure';

  // Valuation-only measures are excluded by default — they require a
  // RunValuation call rather than the Position search the basic
  // /data/positions page hits, so showing them in the multiselect
  // would surface a silent no-op. Consumers that want them (a future
  // valuations page) can pass a different supportedMeasures list.
  // This is a UI policy choice on which measures belong on which
  // page, not a claim about the vocabulary itself — the vocabulary
  // lives upstream in ledger-models.
  const VALUATION_ONLY_MEASURES = new Set([
    'PRESENT_VALUE_CASHFLOWS',
    'PRESENT_VALUE',
    'REAL_YIELD',
    'INFLATION_ADJUSTED_PRINCIPAL',
    'DISCOUNT_MARGIN',
    'SPREAD_DURATION',
  ]);

  /**
   * The default proto-name allowlist: every Measure entry from the
   * wrapper minus the valuation-only set.
   */
  export const DEFAULT_MEASURE_NAMES: readonly string[] = Measure
    .getAllTypeNames()
    .filter((k) => !VALUATION_ONLY_MEASURES.has(k));

  function titleCase(name: string): string {
    return name
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
  }

  /** Friendly per-measure labels. Override individual entries via the `labels` prop. */
  export const DEFAULT_MEASURE_LABELS: Record<string, string> = Object.fromEntries(
    DEFAULT_MEASURE_NAMES.map((n) => [n, titleCase(n)]),
  );
</script>

<script lang="ts">
  import MultiSelect from 'svelte-multiselect';

  // Two-way binding — array of proto enum names. Empty array means
  // "no measures selected" (the URL convention drops the param).
  export let value: string[] = [];

  // Proto-name allowlist for the dropdown. Default = MeasureProto
  // keys minus valuation-only.
  export let supportedMeasures: readonly string[] = DEFAULT_MEASURE_NAMES;

  // Per-name label override. Falls back to DEFAULT_MEASURE_LABELS,
  // which falls back to the proto name verbatim if neither map has
  // an entry.
  export let labels: Partial<Record<string, string>> = {};

  // Class pass-through and DOM hooks (matches IdentifierFilter
  // conventions).
  export let containerClass: string = '';
  export let id: string = 'measure-multiselect';
  export let placeholder: string = 'Select measures...';

  $: resolvedLabels = { ...DEFAULT_MEASURE_LABELS, ...labels };

  // Build the MultiSelect's option-label list + a label↔name lookup
  // for the change handler. The dropdown speaks display labels; the
  // primitive's external API speaks proto names.
  $: optionLabels = supportedMeasures.map((name) => resolvedLabels[name] ?? name);
  $: labelToName = Object.fromEntries(
    supportedMeasures.map((name) => [resolvedLabels[name] ?? name, name]),
  );

  // Internal MultiSelect state holds the display labels. Reactive
  // sync from `value` (proto names) → `selected` (labels) handles
  // initial-state hydration and external updates. The equality guard
  // avoids a feedback loop with the on:change handler that writes
  // back to `value`. Initialized empty here and populated by the $:
  // block below — at instance-init time `resolvedLabels` hasn't been
  // computed yet, so a synchronous `value.map(...)` initializer
  // would dereference undefined.
  let selected: string[] = [];
  $: {
    const expected = value.map((name) => resolvedLabels[name] ?? name);
    if (
      expected.length !== selected.length ||
      expected.some((label, i) => label !== selected[i])
    ) {
      selected = expected;
    }
  }

  function handleChange() {
    const next = selected.map((label) => labelToName[label]).filter((n): n is string => Boolean(n));
    if (next.length !== value.length || next.some((v, i) => v !== value[i])) {
      value = next;
    }
  }
</script>

<div class={containerClass}>
  <MultiSelect
    {id}
    options={optionLabels}
    bind:selected
    on:change={handleChange}
    {placeholder}
  />
</div>
