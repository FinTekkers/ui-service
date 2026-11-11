<!-- Section 6 of /free/soma: Positions by CUSIP, from DataExplorer.dc.html.
     US-309: one row per Treasury CUSIP the ledger's SOMA portfolio holds
     for the week, biggest par first, from the server load. Search and paging
     run here, on the loaded rows; a new week starts again at page 1. 100
     rows a page by default (SOMA_PAGE_SIZE). -->
<script lang="ts">
  import {
    SOMA_PAGE_SIZE,
    filterPositions,
    pageOf,
    showingLabel,
    weekLabel,
    type Section,
    type SomaPositionsView,
  } from "$lib/free/soma";

  export let positions: Section<SomaPositionsView>;
  export let asOfLabel: string;
  export let pageSize: number = SOMA_PAGE_SIZE;

  let query = "";
  let page = 0;

  $: rows = positions.ok ? positions.data.rows : [];
  // A new search or a new week starts at page 1.
  $: rows, query, (page = 0);
  $: filtered = filterPositions(rows, query);
  $: view = pageOf(filtered, page, pageSize);

  const billions = (b: number) =>
    `$${b.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}B`;
</script>

<section aria-labelledby="pos-title" class="positions">
  <div class="top">
    <div class="titles">
      <h2 id="pos-title">Positions by CUSIP</h2>
      <span class="as-of">As of {asOfLabel}</span>
    </div>
    {#if positions.ok}
      <label>
        <span class="visually-hidden">Search positions</span>
        <input
          type="search"
          placeholder="Search by CUSIP"
          autocomplete="off"
          spellcheck="false"
          bind:value={query}
        />
      </label>
    {/if}
  </div>
  {#if positions.ok}
    <div class="table-scroll">
      <table>
        <thead>
          <tr>
            <th scope="col">Security</th>
            <th scope="col">Type</th>
            <th scope="col">Maturity</th>
            <th scope="col" class="num">Par value</th>
            <th scope="col" class="num">Weight</th>
          </tr>
        </thead>
        <tbody>
          {#each view.rows as row (row.cusip)}
            <tr>
              <td>{row.cusip}</td>
              <td class="muted">{row.type}</td>
              <td class="muted">{weekLabel(row.maturity)}</td>
              <td class="num">{billions(row.parB)}</td>
              <td class="num">{row.weightPct.toFixed(2)}%</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
    <div class="pager">
      <span aria-live="polite"
        >{showingLabel(view.from, view.to, filtered.length)}</span
      >
      {#if Number.isFinite(pageSize)}
        <div class="pager-buttons">
          <button
            type="button"
            disabled={view.page === 0}
            on:click={() => (page = view.page - 1)}>Previous</button
          >
          <button
            type="button"
            disabled={view.page >= view.pages - 1}
            on:click={() => (page = view.page + 1)}>Next</button
          >
        </div>
      {/if}
    </div>
  {:else}
    <p class="unavailable">{positions.message}</p>
  {/if}
</section>

<style>
  .positions {
    background: #ffffff;
    border: 1px solid var(--line);
    border-radius: 12px;
    overflow: hidden;
  }
  .top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 12px;
    padding: 18px 22px;
    border-bottom: 1px solid var(--line);
  }
  .titles {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  h2 {
    margin: 0;
    font-weight: 700;
    font-size: 18px;
  }
  .as-of {
    font-family: var(--mono);
    font-size: 13px;
    color: var(--muted);
  }
  label {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    color: var(--muted);
    max-width: 100%;
  }
  .visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
  }
  input {
    min-height: 40px;
    box-sizing: border-box;
    padding: 0 12px;
    border: 1px solid #c9cfd8;
    border-radius: 8px;
    font-family: inherit;
    font-size: 14px;
    width: 220px;
    max-width: 100%;
  }
  .table-scroll {
    overflow-x: auto;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 14px;
    min-width: 640px;
  }
  thead tr {
    background: #f8f9fb;
    text-align: left;
  }
  th {
    padding: 12px 16px;
    font-weight: 600;
    color: var(--muted);
    font-size: 13px;
  }
  tbody {
    font-family: var(--mono);
  }
  tbody tr {
    border-top: 1px solid #eef0f3;
  }
  td {
    padding: 14px 16px;
  }
  th:first-child,
  td:first-child,
  th:last-child,
  td:last-child {
    padding-left: 22px;
    padding-right: 22px;
  }
  .num {
    text-align: right;
  }
  .muted {
    color: var(--muted);
  }
  .pager {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 12px;
    padding: 14px 22px;
    border-top: 1px solid var(--line);
    font-size: 14px;
    color: var(--muted);
  }
  .pager-buttons {
    display: flex;
    gap: 8px;
  }
  .pager button {
    min-height: 40px;
    padding: 0 14px;
    border: 1px solid #c9cfd8;
    border-radius: 8px;
    background: #ffffff;
    font-family: inherit;
    font-size: 14px;
    color: var(--ink);
  }
  .pager button:disabled {
    color: var(--muted);
    opacity: 0.6;
  }
  .unavailable {
    margin: 0;
    padding: 18px 22px;
    font-size: 15px;
    color: var(--muted);
  }
</style>
