<!-- Section 2 of /free/soma: the dark snapshot card (headline, composition
     bar and the year-over-year table), from DataExplorer.dc.html. -->
<script lang="ts">
  import {
    changeDirection,
    formatChange,
    formatOneDecimal,
  } from "$lib/free/format";
  import type { SomaResponse } from "$lib/free/mock/types";

  export let data: SomaResponse;

  $: compositionLabel =
    "Composition: " +
    data.composition
      .map((slice) => `${slice.spoken} ${slice.pct.toFixed(1)}%`)
      .join(", ");
  $: rows = [...data.table.rows, data.table.total];
</script>

<section aria-labelledby="snap-title" class="snapshot">
  <div class="top">
    <div class="titles">
      <span class="eyebrow">Portfolio in Fintekkers</span>
      <h2 id="snap-title">Federal Reserve SOMA Holdings</h2>
    </div>
    <span class="as-of">As of {data.asOf}</span>
  </div>
  <div class="body">
    <div class="headline">
      <span class="total">{data.headline.total}</span>
      <span class="caption">{data.headline.caption}</span>
      <span class="headline-change">{data.headline.change}</span>
    </div>
    <div class="composition">
      <div role="img" aria-label={compositionLabel} class="bar">
        {#each data.composition as slice, i}
          <div
            style="flex: {i === data.composition.length - 1
              ? '1 1 auto'
              : `0 0 ${slice.pct}%`}; background: {slice.color}"
          />
        {/each}
      </div>
      <div class="legend">
        {#each data.composition as slice}
          <span>
            <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true"
              ><rect width="10" height="10" rx="2" fill={slice.color} /></svg
            >{slice.label}
            {slice.pct.toFixed(1)}%
          </span>
        {/each}
      </div>
    </div>
    <div class="table-scroll">
      <table>
        <thead>
          <tr>
            <th scope="col">$ billions</th>
            <th scope="col">{data.table.columns[0]}</th>
            <th scope="col">{data.table.columns[1]}</th>
            <th scope="col">Change</th>
          </tr>
        </thead>
        <tbody>
          {#each rows as row, i}
            <tr class:total-row={i === rows.length - 1}>
              <td>{row.label}</td>
              <td>{formatOneDecimal(row.current)}</td>
              <td class="prior">{formatOneDecimal(row.prior)}</td>
              <td class={changeDirection(row.change)}
                >{formatChange(row.change)}</td
              >
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>
</section>

<style>
  .snapshot {
    background: var(--ink);
    color: #e6eaf0;
    border-radius: 12px;
    overflow: hidden;
  }
  .top {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    padding: 18px 24px;
    border-bottom: 1px solid #22344a;
  }
  .titles {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
  }
  .eyebrow {
    font-family: var(--mono);
    font-size: 12px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #9aa6b8;
  }
  h2 {
    margin: 0;
    font-weight: 700;
    font-size: 20px;
    color: #ffffff;
  }
  .as-of {
    font-family: var(--mono);
    font-size: 13px;
    padding: 6px 10px;
    border: 1px solid #2a4058;
    border-radius: 6px;
    color: #c3ccd8;
  }
  .body {
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 24px;
  }
  .headline {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 8px 20px;
  }
  .total {
    font-family: var(--mono);
    font-size: clamp(36px, 4.4vw, 52px);
    font-weight: 500;
    color: #ffffff;
    letter-spacing: -0.02em;
  }
  .caption {
    font-size: 15px;
    color: #c3ccd8;
  }
  .headline-change {
    font-family: var(--mono);
    font-size: 14px;
    color: #6fd6a0;
  }
  .composition {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .bar {
    display: flex;
    height: 28px;
    border-radius: 6px;
    overflow: hidden;
    gap: 2px;
  }
  .legend {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 24px;
    font-size: 13px;
    color: #c3ccd8;
  }
  .legend span {
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }
  .table-scroll {
    overflow-x: auto;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    font-family: var(--mono);
    font-size: 14px;
    min-width: 520px;
  }
  tr {
    text-align: right;
  }
  th {
    padding: 10px 0 10px 16px;
    font-weight: 500;
    color: #9aa6b8;
  }
  td {
    padding: 10px 0 10px 16px;
  }
  th:first-child,
  td:first-child {
    padding: 10px 0;
    text-align: left;
  }
  tbody tr {
    border-top: 1px solid #1c2e44;
  }
  tbody tr.total-row {
    border-top-color: #3a5370;
    font-weight: 500;
    color: #ffffff;
  }
  .prior,
  .flat {
    color: #9aa6b8;
  }
  .up {
    color: #6fd6a0;
  }
  .down {
    color: #f5a3a3;
  }
</style>
