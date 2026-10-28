<script lang="ts">
  /**
   * US-297: detail for the measure picked in the "By product type" view.
   * A depends_on chip that names a catalog measure is a button that selects
   * it; an input name (e.g. TAX_LOTS) is plain text.
   */
  import { createEventDispatcher } from "svelte";
  import { measureByName, type CatalogMeasure } from "$lib/measureCatalog";

  export let measure: CatalogMeasure | null = null;

  const dispatch = createEventDispatcher<{ select: { name: string } }>();

  function formatCategory(cat: string): string {
    return cat.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }
</script>

<aside class="detail-panel" aria-label="Measure detail">
  {#if measure}
    <h3 class="panel-title">
      {measure.display_name}
      {#if !measure.implemented}<span class="badge-planned">Planned</span>{/if}
    </h3>
    <p class="mono-sub">{measure.name}</p>
    <p class="description">{measure.description}</p>

    <dl class="facts">
      <dt>Category</dt>
      <dd>{formatCategory(measure.category)}</dd>
      <dt>Units</dt>
      <dd>{measure.units ?? "—"}</dd>
      <dt>Computed by</dt>
      <dd>{measure.computed_by ?? "—"}</dd>
    </dl>

    {#if measure.formula}
      <h4 class="detail-label">Formula</h4>
      <code class="detail-code">{measure.formula}</code>
    {/if}

    {#if measure.model_assumptions.length > 0}
      <h4 class="detail-label">Model assumptions</h4>
      <ul class="detail-list">
        {#each measure.model_assumptions as assumption}
          <li>{assumption}</li>
        {/each}
      </ul>
    {/if}

    <h4 class="detail-label">Depends on</h4>
    {#if measure.depends_on.length > 0}
      <ul class="chips">
        {#each measure.depends_on as dep (dep)}
          <li>
            {#if measureByName(dep)}
              <button
                type="button"
                class="chip chip-link"
                on:click={() => dispatch("select", { name: dep })}>{dep}</button
              >
            {:else}
              <span class="chip">{dep}</span>
            {/if}
          </li>
        {/each}
      </ul>
    {:else}
      <p class="empty">None</p>
    {/if}
  {:else}
    <p class="empty">Select a measure to see its details.</p>
  {/if}
</aside>

<style lang="scss">
  @import "../../styles/variables";

  .detail-panel {
    background-color: $bgc-color;
    border: 1px solid $border-color;
    border-radius: $bd-radius;
    padding: 16px;
    color: $white;
    min-width: 0;
    overflow-wrap: anywhere;
  }

  .panel-title {
    font-size: 1.1rem;
    font-weight: 700;
    margin: 0;
  }

  .badge-planned {
    display: inline-block;
    font-size: 0.65rem;
    font-weight: 500;
    padding: 1px 6px;
    border-radius: 3px;
    background-color: #c43d5a33;
    color: #e8788e;
    margin-left: 6px;
    vertical-align: middle;
  }

  .mono-sub {
    font-size: 0.7rem;
    color: $ltgrey;
    font-family: monospace;
    margin: 2px 0 8px 0;
  }

  .description {
    font-size: 0.85rem;
    margin: 0 0 12px 0;
  }

  .facts {
    display: grid;
    grid-template-columns: max-content 1fr;
    gap: 4px 12px;
    font-size: 0.8rem;
    margin: 0 0 12px 0;

    dt {
      color: $ltgrey;
    }
    dd {
      margin: 0;
    }
  }

  .detail-label {
    font-size: 0.75rem;
    font-weight: 700;
    color: $ltgrey;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    margin: 12px 0 4px 0;
  }

  .detail-code {
    display: block;
    font-size: 0.8rem;
    color: $white;
    background: #071f29;
    padding: 6px 10px;
    border-radius: 3px;
    white-space: pre-wrap;
    word-break: break-word;
  }

  .detail-list {
    margin: 0;
    padding-left: 1.2em;
    list-style: disc;

    li {
      font-size: 0.8rem;
      margin-bottom: 2px;
    }
  }

  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .chip {
    display: inline-block;
    font-family: monospace;
    font-size: 0.7rem;
    padding: 2px 8px;
    border-radius: 10px;
    border: 1px solid $border-color;
    color: $ltgrey;
    background: #071f29;
  }

  .chip-link {
    color: $success;
    border-color: $success;
    cursor: pointer;

    &:hover {
      background-color: $border-color;
    }

    &:focus-visible {
      outline: 2px solid $success;
      outline-offset: 2px;
    }
  }

  .empty {
    font-size: 0.8rem;
    color: $ltgrey;
    margin: 0;
  }
</style>
