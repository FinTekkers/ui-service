<script lang="ts">
  /**
   * US-297: Data Catalog "By product type" view. A row per measure, a column
   * group per product_hierarchy node. An expanded group shows one ✓ / — cell
   * per product type; a collapsed group shows defined/total. Measures,
   * groups and coverage all come from $lib/measureCatalog.
   */
  import { createEventDispatcher } from "svelte";
  import {
    MEASURES,
    cellState,
    groupCount,
    productGroups,
    type CatalogMeasure,
  } from "$lib/measureCatalog";
  import { labelOf } from "@fintekkers/ledger-models/node/wrappers/models/security/product_hierarchy";

  export let measures: readonly Pick<
    CatalogMeasure,
    "name" | "display_name" | "applies_to"
  >[] = MEASURES;
  export let selected: string | null = null;
  export let initiallyExpanded: readonly string[] = [];

  const dispatch = createEventDispatcher<{ select: { name: string } }>();

  const groups = productGroups();
  let expanded = new Set<string>(initiallyExpanded);

  function toggle(node: string) {
    if (expanded.has(node)) expanded.delete(node);
    else expanded.add(node);
    expanded = expanded;
  }

  const STATE_TEXT = { defined: "Defined", excluded: "Excluded" } as const;
  const GLYPH = { defined: "✓", excluded: "—" } as const;
</script>

<div class="matrix-scroll">
  <table class="matrix">
    <thead>
      <tr>
        <th class="measure-col" scope="col" rowspan="2">Measure</th>
        {#each groups as g (g.node)}
          {@const open = expanded.has(g.node)}
          <th
            scope="colgroup"
            colspan={open ? g.productTypes.length : 1}
            rowspan={open ? 1 : 2}
            class="group-head"
          >
            <button
              type="button"
              class="group-btn"
              data-node={g.node}
              aria-expanded={open}
              on:click={() => toggle(g.node)}
            >
              <span aria-hidden="true">{open ? "▾" : "▸"}</span>
              {g.label}
            </button>
          </th>
        {/each}
      </tr>
      <tr>
        {#each groups as g (g.node)}
          {#if expanded.has(g.node)}
            {#each g.productTypes as pt (pt)}
              <th scope="col" class="type-head">{labelOf(pt) ?? pt}</th>
            {/each}
          {/if}
        {/each}
      </tr>
    </thead>
    <tbody>
      {#each measures as m (m.name)}
        <tr class:selected={selected === m.name} data-measure={m.name}>
          <th scope="row" class="measure-col">
            <button
              type="button"
              class="measure-btn"
              aria-pressed={selected === m.name}
              on:click={() => dispatch("select", { name: m.name })}
            >
              {m.display_name}
            </button>
          </th>
          {#each groups as g (g.node)}
            {#if expanded.has(g.node)}
              {#each g.productTypes as pt (pt)}
                {@const state = cellState(m, pt)}
                <td class="cell {state}" data-product-type={pt}>
                  <span aria-hidden="true">{GLYPH[state]}</span>
                  <span class="sr-only">{STATE_TEXT[state]}</span>
                </td>
              {/each}
            {:else}
              {@const c = groupCount(m, g)}
              <td
                class="cell count"
                class:none={c.defined === 0}
                data-node={g.node}
              >
                {c.defined}/{c.total}
              </td>
            {/if}
          {/each}
        </tr>
      {/each}
    </tbody>
  </table>
</div>

<ul class="legend" aria-label="Legend">
  <li><span class="cell defined" aria-hidden="true">✓</span> Defined</li>
  <li><span class="cell excluded" aria-hidden="true">—</span> Excluded</li>
</ul>

<style lang="scss">
  @import "../../styles/variables";

  /* Own scroll box so the measure column can stick while the product-type
     columns scroll (a deliberate exception to the page-level scrolling of
     second-brain#223). Positioned, so the cells' absolute .sr-only text is
     clipped here instead of widening the page. */
  .matrix-scroll {
    position: relative;
    overflow-x: auto;
    max-width: 100%;
  }

  .matrix {
    border-collapse: separate;
    border-spacing: 0;
    width: max-content;
    min-width: 100%;
    font-size: 0.8rem;
  }

  th,
  td {
    border-bottom: 1px solid $border-color;
    padding: 6px 10px;
    text-align: center;
    white-space: nowrap;
  }

  thead th {
    background-color: $bgc-color;
    color: $white;
    font-weight: 600;
  }

  .measure-col {
    position: sticky;
    left: 0;
    z-index: 1;
    text-align: left;
    background-color: $bgc-color;
    min-width: 160px;
    max-width: 220px;
    white-space: normal;
  }

  .group-head {
    text-align: left;
  }

  @media (max-width: $breakingpoint_mobile) {
    .measure-col {
      min-width: 110px;
      max-width: 140px;
    }
  }

  .type-head {
    font-weight: 500;
    color: $ltgrey;
  }

  .group-btn,
  .measure-btn {
    background: none;
    border: none;
    color: inherit;
    font: inherit;
    cursor: pointer;
    padding: 0;
    text-align: left;

    &:focus-visible {
      outline: 2px solid $success;
      outline-offset: 2px;
    }
  }

  .group-btn {
    font-weight: 700;
  }

  .measure-btn {
    color: $white;
    overflow-wrap: anywhere;

    &:hover {
      text-decoration: underline;
    }
  }

  tbody tr.selected th,
  tbody tr.selected td {
    background-color: $border-color;
  }

  tbody tr.selected .measure-btn {
    color: $success;
    font-weight: 700;
  }

  .cell.defined {
    color: $success;
    font-weight: 700;
  }

  .cell.excluded,
  .cell.count.none {
    color: $ltgrey;
  }

  .cell.count {
    color: $white;
  }

  .legend {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    margin: 8px 0 0 0;
    padding: 0;
    list-style: none;
    font-size: 0.8rem;
    color: $ltgrey;
  }
</style>
