<!-- US-354: the CoreWeave 2030 calculator. A GET form (?price=&tradeDate=),
     so a result is a shareable URL and works without JavaScript; the server
     load checks both fields and values the bond. Each tile shows
     valuation-service's figure as the server formatted it, with the value
     as returned in data-value. No bond maths here. -->
<script lang="ts">
  import {
    UNAVAILABLE,
    type BondMeasureView,
    type CorporateBondPageData,
  } from "$lib/free/corporateBond";

  export let data: CorporateBondPageData;

  $: calc = data.calc.status === "ok" ? data.calc.data : null;

  type Tile = {
    id: string;
    label: string;
    measure: BondMeasureView | null;
    unit?: string;
  };

  $: tiles = calc
    ? ([
        {
          id: "settlement",
          label: "Settlement date",
          measure: { value: calc.settlementDate, display: calc.settlementDate },
        },
        {
          id: "clean",
          label: "Clean price",
          measure: { value: data.input.price, display: data.input.price },
        },
        { id: "accrued", label: "Accrued interest", measure: calc.accrued },
        { id: "dirty", label: "Dirty price", measure: calc.dirtyPrice },
        { id: "ytm", label: "Yield to maturity", measure: calc.ytm },
        {
          id: "macaulay",
          label: "Macaulay duration",
          measure: calc.macaulayDuration,
          unit: "years",
        },
        {
          id: "modified",
          label: "Modified duration",
          measure: calc.modifiedDuration,
        },
        { id: "convexity", label: "Convexity", measure: calc.convexity },
        {
          id: "dv01",
          label: "DV01",
          measure: calc.dv01,
          unit: "per $1M face",
        },
      ] as Tile[])
    : [];
</script>

<form method="GET" class="form" novalidate>
  <div class="field">
    <label for="crwv-price">Clean price</label>
    <input
      id="crwv-price"
      name="price"
      type="text"
      inputmode="decimal"
      autocomplete="off"
      value={data.input.price}
      aria-invalid={data.fieldErrors.price ? "true" : undefined}
      aria-describedby={data.fieldErrors.price
        ? "crwv-price-error"
        : "crwv-price-hint"}
    />
    {#if data.fieldErrors.price}
      <p id="crwv-price-error" class="field-error">{data.fieldErrors.price}</p>
    {:else}
      <p id="crwv-price-hint" class="hint">
        Per 100 face, e.g. the example price 81.375.
      </p>
    {/if}
  </div>
  <div class="field">
    <label for="crwv-trade-date">Trade date</label>
    <input
      id="crwv-trade-date"
      name="tradeDate"
      type="date"
      value={data.input.tradeDate}
      aria-invalid={data.fieldErrors.tradeDate ? "true" : undefined}
      aria-describedby={data.fieldErrors.tradeDate
        ? "crwv-trade-date-error"
        : "crwv-trade-date-hint"}
    />
    {#if data.fieldErrors.tradeDate}
      <p id="crwv-trade-date-error" class="field-error">
        {data.fieldErrors.tradeDate}
      </p>
    {:else}
      <p id="crwv-trade-date-hint" class="hint">
        Settles T+1 on the SIFMA US bond calendar.
      </p>
    {/if}
  </div>
  <button type="submit">Calculate</button>
</form>

<div class="results" data-testid="crwv-results">
  {#if data.calc.status === "unavailable"}
    <p class="unavailable" role="status">{data.calc.message}</p>
  {:else if calc}
    <dl class="tiles">
      {#each tiles as tile (tile.id)}
        <div
          class="tile"
          data-testid="tile-{tile.id}"
          data-value={tile.measure?.value ?? ""}
        >
          <dt>{tile.label}</dt>
          {#if tile.measure}
            <dd>
              {tile.measure.display}{#if tile.unit}<span class="unit">
                  {tile.unit}</span
                >{/if}
            </dd>
          {:else}
            <dd class="missing">{UNAVAILABLE.measure}</dd>
          {/if}
        </div>
      {/each}
    </dl>
    <p class="basis">
      Prices and accrued interest per 100 face. DV01: the dollar change for a
      one basis point rise in yield on $1,000,000 face.
    </p>
  {/if}
</div>

<style>
  .form {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    gap: 16px 24px;
  }
  .field {
    display: flex;
    flex-direction: column;
    gap: 6px;
    flex: 1 1 200px;
    min-width: 0;
  }
  label {
    font-family: var(--mono);
    font-size: 12px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--muted);
  }
  input {
    padding: 10px 12px;
    border: 1px solid var(--line);
    border-radius: 8px;
    font-family: var(--mono);
    font-size: 16px;
    color: var(--ink);
    background: #ffffff;
    min-width: 0;
  }
  input[aria-invalid="true"] {
    border-color: #b42318;
  }
  input:focus-visible,
  button:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }
  .hint,
  .field-error {
    margin: 0;
    font-size: 13px;
    line-height: 1.5;
  }
  .hint {
    color: var(--muted);
  }
  .field-error {
    color: #b42318;
  }
  button {
    align-self: flex-end;
    margin-bottom: 26px;
    padding: 10px 20px;
    border: 0;
    border-radius: 8px;
    background: var(--accent);
    color: #ffffff;
    font-weight: 600;
    font-size: 15px;
    cursor: pointer;
  }
  button:hover {
    background: var(--accent-hover);
  }
  .results {
    min-width: 0;
  }
  .tiles {
    margin: 0;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 12px;
  }
  .tile {
    padding: 14px 16px;
    border: 1px solid var(--line);
    border-radius: 10px;
    background: #f7f8fa;
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
  }
  .tile dt {
    font-family: var(--mono);
    font-size: 12px;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--muted);
  }
  .tile dd {
    margin: 0;
    font-family: var(--mono);
    font-size: 20px;
    font-weight: 600;
    color: var(--ink);
    overflow-wrap: anywhere;
  }
  .tile .unit {
    margin-left: 6px;
    font-size: 12px;
    font-weight: 400;
    color: var(--muted);
  }
  .tile .missing {
    font-size: 15px;
    font-weight: 500;
    color: var(--muted);
  }
  .basis,
  .unavailable {
    margin: 12px 0 0;
    font-family: var(--mono);
    font-size: 13px;
    line-height: 1.5;
    color: var(--muted);
    overflow-wrap: anywhere;
  }
</style>
