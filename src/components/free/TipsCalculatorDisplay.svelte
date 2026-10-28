<!-- The calculator of DataExplorerTIPS.dc.html, display only: its 7 inputs
     show the default inputs and are disabled, and the outputs are the live
     figures /free/tips's server load returns (US-298). Nothing recalculates.
     A figure whose source failed reads "Unavailable". The nominal yield and
     the projected cashflows need an inflation forecast the valuation
     request can't carry yet (US-298b), so they say so. -->
<script lang="ts">
  import { UNAVAILABLE, type TipsPageData } from "$lib/free/tips";

  export let data: TipsPageData;

  $: security = data.security.ok ? data.security.data : null;
  $: price = data.price.ok ? data.price.data : null;
  $: valuation = data.valuation.ok ? data.valuation.data : null;

  $: fields = [
    { label: "Face value ($)", value: security?.faceValue },
    { label: "Real coupon (%)", value: security?.couponRate },
    { label: "Base ref CPI", value: security?.baseCpi },
    { label: "Current ref CPI", value: valuation?.referenceCpi },
    { label: "Years to maturity", value: data.calculator.years },
    // YIELD_TO_MATURITY: for a TIPS it is the real yield.
    { label: "Real yield (%)", value: valuation?.realYield },
    {
      label: "Assumed annual inflation (%)",
      value: data.calculator.inflation,
    },
  ];

  $: tiles = [
    { label: "Index ratio", value: valuation?.indexRatio },
    { label: "Adjusted principal", value: valuation?.adjustedPrincipal },
    { label: "Next coupon", value: valuation?.nextCoupon },
    {
      label: price
        ? `Real clean price (FedInvest, ${price.date})`
        : "Real clean price (FedInvest)",
      value: price?.value,
    },
    { label: "Position value", value: valuation?.marketValue },
    // US-298b: needs an inflation forecast in the request.
    { label: "Nominal YTM", value: UNAVAILABLE.value },
  ];
</script>

<div class="calculator">
  <div class="inputs">
    {#each fields as field, i}
      <label class:wide={i === fields.length - 1}
        >{field.label}
        <input
          type="text"
          value={field.value ?? ""}
          placeholder={UNAVAILABLE.value}
          disabled
        />
      </label>
    {/each}
    <p class="wide">
      Assumes valuation on a coupon date, so there's no accrued interest. Future
      CPI grows at the assumed rate.
    </p>
  </div>

  <div class="outputs">
    {#if !data.valuation.ok}
      <p class="unavailable" role="status">{data.valuation.message}</p>
    {/if}
    <dl class="tiles">
      {#each tiles as tile, i}
        <div class="tile" class:dark={i === tiles.length - 1}>
          <dt>{tile.label}</dt>
          <dd>{tile.value ?? UNAVAILABLE.value}</dd>
        </div>
      {/each}
    </dl>

    <div class="flows">
      <div class="flows-top">
        <span class="flows-title" id="flows-title">Projected cashflows</span>
        <span class="muted"
          >Total received: <span class="total">{UNAVAILABLE.value}</span></span
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
            <tr>
              <td class="unavailable-row" colspan="5"
                >{UNAVAILABLE.projection}</td
              >
            </tr>
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
  .unavailable-row {
    text-align: left;
    white-space: normal;
  }
  .unavailable {
    margin: 0;
    font-size: 14px;
    color: var(--muted);
  }
</style>
