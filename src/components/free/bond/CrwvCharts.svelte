<!-- US-354: the CoreWeave 2030 charts, each with a table of the same
     figures: the cash flows to maturity with valuation-service's present
     value of each, and its yield to maturity across clean prices with the
     visitor's price marked. Plotting only; no bond maths here. -->
<script lang="ts">
  import PlotlyChart from "../PlotlyChart.svelte";
  import {
    cashflowSpec,
    sweepSpec,
    type CalcSection,
    type SweepSection,
  } from "$lib/free/corporateBond";

  export let calc: CalcSection;
  export let sweep: SweepSection;

  $: view = calc.status === "ok" ? calc.data : null;
  $: points = sweep.status === "ok" ? sweep.points : null;
  $: marked = points?.find((p) => p.marked) ?? null;
</script>

<section aria-labelledby="crwv-cf-title" class="card block">
  <h2 id="crwv-cf-title" class="panel-title">Cash flows to maturity</h2>
  {#if calc.status === "unavailable"}
    <p class="status" role="status">{calc.message}</p>
  {:else if view}
    <p class="caption">
      Each payment per {view.faceDisplay} face, and its present value at the yield
      to maturity, settling {view.settlementDate}.
    </p>
    {#if view.cashflows.length}
      <PlotlyChart
        spec={cashflowSpec(view.cashflows, view.faceDisplay)}
        label="Cash flows per {view.faceDisplay} face and their present values, {view
          .cashflows.length} payments to maturity"
        testid="crwv-cashflow-plot"
      />
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th scope="col">Date</th>
              <th scope="col">Payment</th>
              <th scope="col" class="num">Cash flow</th>
              <th scope="col" class="num">Present value</th>
            </tr>
          </thead>
          <tbody>
            {#each view.cashflows as row}
              <tr
                data-testid="cashflow-row"
                data-date={row.date}
                data-kind={row.kind}
                data-fv={row.fv}
                data-pv={row.pv}
              >
                <td>{row.date}</td>
                <td>{row.kind === "coupon" ? "Coupon" : "Principal"}</td>
                <td class="num">{row.fvDisplay}</td>
                <td class="num">{row.pvDisplay}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {:else}
      <p class="status">
        Unavailable: valuation-service returned no cash flows.
      </p>
    {/if}
  {/if}
</section>

<section aria-labelledby="crwv-sweep-title" class="card block">
  <h2 id="crwv-sweep-title" class="panel-title">Price and yield</h2>
  {#if sweep.status === "unavailable"}
    <p class="status" role="status">{sweep.message}</p>
  {:else if points}
    <p class="caption">
      Yield to maturity at each clean price, from valuation-service at the same
      settlement date.{marked
        ? ` Your price, ${marked.price}, yields ${marked.ytmPct}%.`
        : ""}
    </p>
    <PlotlyChart
      spec={sweepSpec(points)}
      label="Yield to maturity against clean price{marked
        ? `, your price ${marked.price} marked`
        : ''}"
      testid="crwv-sweep-plot"
    />
    <details>
      <summary>Sweep points</summary>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th scope="col" class="num">Clean price</th>
              <th scope="col" class="num">Yield to maturity</th>
            </tr>
          </thead>
          <tbody>
            {#each points as point}
              <tr
                data-testid="sweep-point"
                data-price={point.price}
                data-ytm={point.ytm}
                data-marked={point.marked ? "true" : "false"}
                class:marked={point.marked}
              >
                <td class="num">{point.price}</td>
                <td class="num">{point.ytmPct}%</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </details>
  {/if}
</section>

<style>
  .card {
    background: #ffffff;
    border: 1px solid var(--line);
    border-radius: 12px;
  }
  .block {
    padding: 22px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    min-width: 0;
  }
  .panel-title {
    margin: 0;
    font-weight: 700;
    font-size: 18px;
  }
  .caption,
  .status {
    margin: 0;
    font-family: var(--mono);
    font-size: 14px;
    line-height: 1.5;
    color: var(--muted);
    overflow-wrap: anywhere;
  }
  .table-wrap {
    overflow-x: auto;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    font-family: var(--mono);
    font-size: 13px;
  }
  th,
  td {
    padding: 8px 10px;
    border-bottom: 1px solid var(--line);
    text-align: left;
    white-space: nowrap;
  }
  th {
    font-weight: 500;
    color: var(--muted);
  }
  .num {
    text-align: right;
  }
  tr.marked td {
    font-weight: 700;
    color: var(--ink);
  }
  summary {
    cursor: pointer;
    font-family: var(--mono);
    font-size: 13px;
    color: var(--accent);
  }
</style>
