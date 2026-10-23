<!-- The calculator of DataExplorerTIPS.dc.html, display only: its 7 inputs
     show the artboard's defaults and are disabled, and the outputs are the
     literals stored in src/lib/free/mock/tips.ts. Nothing recalculates. -->
<script lang="ts">
  import { tipsMeasure } from "$lib/free/mock/tips";
  import type { MockMeasureResult, TipsResponse } from "$lib/free/mock/types";

  export let data: TipsResponse;

  $: fields = [
    { label: "Face value ($)", value: data.inputs.face },
    { label: "Real coupon (%)", value: data.inputs.coupon },
    { label: "Base ref CPI", value: data.inputs.baseCpi },
    { label: "Current ref CPI", value: data.inputs.refCpi },
    { label: "Years to maturity", value: data.inputs.years },
    { label: "Real yield (%)", value: data.inputs.realYield },
    { label: "Assumed annual inflation (%)", value: data.inputs.inflation },
  ];

  // One measure per tile; Next coupon has no MeasureProto.
  const TILES: [string, MockMeasureResult["measure"] | null][] = [
    ["Index ratio", "INDEX_RATIO"],
    ["Adjusted principal", "INFLATION_ADJUSTED_PRINCIPAL"],
    ["Next coupon", null],
    ["Real price (per 100)", "CLEAN_PRICE"],
    ["Position value", "MARKET_VALUE"],
    ["Nominal YTM", "YIELD_TO_MATURITY"],
  ];

  $: tiles = TILES.map(([label, measure]) => ({
    label,
    value: measure
      ? tipsMeasure(data, measure).display
      : data.valuation.nextCoupon,
  }));
</script>

<div class="calculator">
  <div class="inputs">
    {#each fields as field, i}
      <label class:wide={i === fields.length - 1}
        >{field.label}
        <input type="text" value={field.value} disabled />
      </label>
    {/each}
    <p class="wide">
      Assumes valuation on a coupon date, so there's no accrued interest. Future
      CPI grows at the assumed rate.
    </p>
  </div>

  <div class="outputs">
    <dl class="tiles">
      {#each tiles as tile, i}
        <div class="tile" class:dark={i === tiles.length - 1}>
          <dt>{tile.label}</dt>
          <dd>{tile.value}</dd>
        </div>
      {/each}
    </dl>

    <div class="flows">
      <div class="flows-top">
        <span class="flows-title" id="flows-title">Projected cashflows</span>
        <span class="muted"
          >Total received: <span class="total"
            >{data.valuation.totalReceived}</span
          ></span
        >
      </div>
      <!-- Focusable so keyboard users can scroll the table. -->
      <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
      <div
        class="table-scroll"
        tabindex="0"
        role="region"
        aria-labelledby="flows-title"
      >
        <table>
          <thead>
            <tr>
              <th scope="col">Time</th>
              <th scope="col">Index ratio</th>
              <th scope="col">Coupon</th>
              <th scope="col">Principal</th>
              <th scope="col">Total</th>
            </tr>
          </thead>
          <tbody>
            {#each data.valuation.cashflows as row}
              <tr>
                <td>{row.time}</td>
                <td>{row.indexRatio}</td>
                <td>{row.coupon}</td>
                <td>{row.principal}</td>
                <td class="row-total">{row.total}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>
  </div>
</div>

<style>
  .calculator {
    display: flex;
    flex-wrap: wrap;
    gap: 32px;
  }
  .inputs {
    flex: 1 1 300px;
    min-width: 0;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
    align-content: start;
  }
  label {
    display: flex;
    flex-direction: column;
    gap: 6px;
    font-size: 13px;
    color: var(--muted);
  }
  .wide {
    grid-column: 1 / -1;
  }
  input {
    min-height: 44px;
    box-sizing: border-box;
    padding: 0 12px;
    border: 1px solid #c9cfd8;
    border-radius: 8px;
    font-family: var(--mono);
    font-size: 15px;
    color: var(--ink);
    width: 100%;
  }
  input:disabled {
    background: var(--bg);
    border-style: dashed;
    color: var(--muted);
    cursor: not-allowed;
    opacity: 1;
  }
  .inputs p {
    margin: 0;
    font-size: 13px;
    line-height: 1.5;
    color: var(--muted);
  }

  .outputs {
    flex: 1.4 1 380px;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .tiles {
    margin: 0;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
    gap: 12px;
  }
  .tile {
    background: var(--bg);
    border-radius: 10px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
  }
  .tile dt {
    font-size: 13px;
    color: var(--muted);
  }
  .tile dd {
    margin: 0;
    font-family: var(--mono);
    font-size: 22px;
    font-weight: 500;
    overflow-wrap: anywhere;
  }
  .tile.dark {
    background: var(--ink);
    color: #ffffff;
  }
  .tile.dark dt {
    color: #c3ccd8;
  }

  .flows {
    border: 1px solid var(--line);
    border-radius: 10px;
    overflow: hidden;
  }
  .flows-top {
    display: flex;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 8px;
    padding: 12px 16px;
    background: #f8f9fb;
    border-bottom: 1px solid var(--line);
    font-size: 14px;
  }
  .flows-title {
    font-weight: 600;
  }
  .muted {
    color: var(--muted);
  }
  .total {
    font-family: var(--mono);
    color: var(--ink);
  }
  .table-scroll {
    max-height: 340px;
    overflow: auto;
  }
  .table-scroll:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: -2px;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    font-family: var(--mono);
    font-size: 13px;
    min-width: 460px;
  }
  tr {
    text-align: right;
  }
  th {
    padding: 10px 16px;
    font-weight: 500;
    color: var(--muted);
    position: sticky;
    top: 0;
    background: #ffffff;
  }
  td {
    padding: 9px 16px;
  }
  th:first-child,
  td:first-child {
    text-align: left;
  }
  td:first-child {
    color: var(--muted);
  }
  tbody tr {
    border-top: 1px solid #eef0f3;
  }
  .row-total {
    font-weight: 500;
  }
</style>
