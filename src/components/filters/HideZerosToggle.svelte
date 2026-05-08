<script lang="ts">
  /**
   * Phase 3 of second-brain#226 — seventh and final composable filter
   * primitive. A labeled checkbox that hides rows whose every measure
   * is zero. Single in-tree consumer today: PositionSelect.svelte.
   *
   * Factored out for consistency with the other Phase 3 primitives —
   * the entire filter row on /data/positions is now a sequence of
   * small composable parts. No URL knowledge; the page consumer
   * owns ?hideZeros=true emission and parsing.
   */

  // Two-way binding. URL convention is "true" / absent (no false on
  // the URL — same as the existing /data/positions emit pattern).
  export let value: boolean = false;

  export let label: string = 'Hide zero values';
  export let id: string = 'hide-zeros-toggle';
</script>

<label class="inline-flex items-center cursor-pointer" for={id}>
  <input
    {id}
    type="checkbox"
    bind:checked={value}
    class="form-checkbox h-4 w-4 text-green-600"
  />
  <span class="ml-2">{label}</span>
</label>
