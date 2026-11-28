<!-- /free/corporate-bond/crwv-2030 (US-354): the CoreWeave 9.25% 2030
     senior notes inside the Free data explorer shell (../../+layout.svelte).
     The terms and call schedule are text. The calculator's figures, the cash
     flows and the price/yield sweep are valuation-service's, loaded and
     formatted by ./+page.server.ts; a failed call says "Unavailable" and
     shows no numbers. Valued to maturity only. No bond maths here. -->
<script lang="ts">
  import FreeCodeCard from "../../../../components/free/FreeCodeCard.svelte";
  import CrwvCalculator from "../../../../components/free/bond/CrwvCalculator.svelte";
  import CrwvCharts from "../../../../components/free/bond/CrwvCharts.svelte";
  import {
    CRWV_CALL_SCHEDULE,
    CRWV_CHANGE_OF_CONTROL,
    CRWV_TERMS,
    DEFAULT_CLEAN_PRICE,
    VALUATION_NOTE,
    type CorporateBondPageData,
  } from "$lib/free/corporateBond";
  import pySample from "$lib/free/samples/crwv.py?raw";
  import tsSample from "$lib/free/samples/crwv.ts?raw";

  export let data: CorporateBondPageData;
</script>

<svelte:head>
  <title>CoreWeave 9.25% 2030 · Free data explorer · Fintekkers</title>
</svelte:head>

<!-- 1. What the page shows -->
<article class="card narrative" aria-labelledby="crwv-title">
  <div class="narrative-text">
    <h2 id="crwv-title" class="section-title">
      CoreWeave 9.25% senior notes due 2030
    </h2>
    <p>
      A high-yield corporate bond from the AI cloud provider CoreWeave. Enter a
      clean price and a trade date, and valuation-service works out when the
      trade settles, the accrued interest, the yield to maturity and how
      sensitive the price is to a change in yield.
    </p>
    <p>
      The example price, {DEFAULT_CLEAN_PRICE}, is well below par: the market
      asks a yield far above the coupon to hold this credit.
    </p>
  </div>
</article>

<!-- 2. Terms and call schedule -->
<section aria-labelledby="crwv-terms-title" class="security">
  <div class="security-top">
    <div class="titles">
      <span class="eyebrow">Terms</span>
      <h2 id="crwv-terms-title">CoreWeave, Inc. 9.25% 2030</h2>
    </div>
  </div>
  <dl class="security-fields">
    {#each CRWV_TERMS as term}
      <div>
        <dt>{term.label}</dt>
        <dd>{term.value}</dd>
      </div>
    {/each}
  </dl>
  <div class="schedule">
    <h3>Call schedule</h3>
    <table>
      <thead>
        <tr>
          <th scope="col">From</th>
          <th scope="col">Redemption price</th>
        </tr>
      </thead>
      <tbody>
        {#each CRWV_CALL_SCHEDULE as call}
          <tr>
            <td>{call.from}</td>
            <td>{call.price}</td>
          </tr>
        {/each}
      </tbody>
    </table>
    <p>{CRWV_CHANGE_OF_CONTROL}</p>
    <p class="note">{VALUATION_NOTE}</p>
  </div>
</section>

<!-- 3. Calculator -->
<section aria-labelledby="crwv-calc-title" class="card calc">
  <div class="calc-intro">
    <p class="eyebrow-accent">Calculator</p>
    <h2 id="crwv-calc-title" class="section-title">Yield and duration</h2>
  </div>
  <CrwvCalculator {data} />
</section>

<!-- 4. Charts -->
<CrwvCharts calc={data.calc} sweep={data.sweep} />

<!-- 5. Explainer -->
<section aria-labelledby="crwv-note-title" class="card block">
  <h2 id="crwv-note-title" class="panel-title">What the figures mean</h2>
  <div class="note">
    <p>
      Settlement date: the trade date plus one business day on the SIFMA US bond
      calendar, so a trade before a market holiday settles after it.
    </p>
    <p>
      Accrued interest: the coupon earned since the last payment date, which the
      buyer pays the seller. The dirty price is the clean price plus accrued.
    </p>
    <p>
      Yield to maturity: the single annual rate, compounded semiannually, that
      discounts every remaining coupon and the principal to the dirty price.
    </p>
    <p>
      Macaulay duration: the present-value-weighted average time to the cash
      flows, in years. Modified duration: the percentage price change for a 1%
      change in yield. Convexity: how much that sensitivity itself changes.
    </p>
    <p>
      DV01: the dollar change in value for a one basis point rise in yield, on
      $1,000,000 face.
    </p>
    <p>{VALUATION_NOTE}</p>
  </div>
</section>

<!-- 6. Code -->
<section aria-labelledby="crwv-code-title" class="code-section">
  <div class="code-intro">
    <p class="eyebrow-code">Use it in code</p>
    <h2 id="crwv-code-title">Pull the bond from the API</h2>
    <p>Look up the notes by ISIN, then value them with your own inputs.</p>
    <a href="https://github.com/FinTekkers/ledger-models"
      >See the ledger-models docs</a
    >
  </div>
  <div class="code-cards">
    <FreeCodeCard
      title="One bond by ISIN"
      lang="TypeScript"
      source={tsSample}
    />
    <FreeCodeCard title="One bond by ISIN" lang="Python" source={pySample} />
  </div>
</section>

<style>
  .card {
    background: #ffffff;
    border: 1px solid var(--line);
    border-radius: 12px;
  }
  .section-title {
    margin: 0;
    font-weight: 700;
    font-size: clamp(24px, 2.6vw, 30px);
    line-height: 1.15;
    letter-spacing: -0.02em;
  }
  .panel-title {
    margin: 0;
    font-weight: 700;
    font-size: 18px;
  }
  a {
    color: var(--accent);
    text-decoration: underline;
  }
  a:hover {
    color: var(--accent-hover);
  }

  .narrative {
    padding: clamp(24px, 4vw, 40px);
  }
  .narrative-text {
    display: flex;
    flex-direction: column;
    gap: 14px;
    min-width: 0;
  }
  .narrative-text p {
    margin: 0;
    max-width: 72ch;
    font-size: 17px;
    line-height: 1.65;
    color: #33404f;
  }

  .security {
    background: var(--ink);
    color: #e6eaf0;
    border-radius: 12px;
    overflow: hidden;
  }
  .security-top {
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
  .security h2 {
    margin: 0;
    font-weight: 700;
    font-size: 20px;
    color: #ffffff;
    overflow-wrap: anywhere;
  }
  .security-fields {
    margin: 0;
    padding: 8px 24px 8px;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 0 32px;
    font-family: var(--mono);
    font-size: 14px;
  }
  .security-fields div {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    padding: 12px 0;
    border-bottom: 1px solid #1c2e44;
  }
  .security-fields dt {
    color: #9aa6b8;
  }
  .security-fields dd {
    margin: 0;
    text-align: right;
    overflow-wrap: anywhere;
  }
  .schedule {
    padding: 8px 24px 24px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    min-width: 0;
  }
  .schedule h3 {
    margin: 8px 0 0;
    font-size: 15px;
    color: #ffffff;
  }
  .schedule table {
    width: 100%;
    border-collapse: collapse;
    font-family: var(--mono);
    font-size: 13px;
  }
  .schedule th,
  .schedule td {
    padding: 8px 0;
    border-bottom: 1px solid #1c2e44;
    text-align: left;
    vertical-align: top;
  }
  .schedule th {
    font-weight: 500;
    color: #9aa6b8;
  }
  .schedule td:first-child {
    padding-right: 16px;
  }
  .schedule p {
    margin: 0;
    font-size: 14px;
    line-height: 1.6;
    color: #c3ccd8;
  }
  .schedule .note {
    color: #8fb8ff;
  }

  .calc {
    padding: clamp(24px, 4vw, 40px);
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
  .calc-intro {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .calc-intro .eyebrow-accent {
    margin: 0;
    font-family: var(--mono);
    font-size: 13px;
    font-weight: 500;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--accent);
  }

  .block {
    padding: 22px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    min-width: 0;
  }
  .note {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .note p {
    margin: 0;
    font-size: 14px;
    line-height: 1.6;
    color: var(--muted);
    overflow-wrap: anywhere;
  }

  .code-section {
    background: var(--ink);
    color: #e6eaf0;
    border-radius: 12px;
    padding: clamp(24px, 4vw, 40px);
    display: flex;
    flex-wrap: wrap;
    gap: 32px;
  }
  .code-intro {
    flex: 1 1 280px;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .code-intro .eyebrow-code {
    margin: 0;
    font-family: var(--mono);
    font-size: 13px;
    font-weight: 500;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #8fb8ff;
  }
  .code-intro h2 {
    margin: 0;
    font-weight: 700;
    font-size: clamp(24px, 2.6vw, 30px);
    line-height: 1.15;
    letter-spacing: -0.02em;
    color: #ffffff;
  }
  .code-intro p {
    margin: 0;
    font-size: 16px;
    line-height: 1.6;
    color: #c3ccd8;
  }
  .code-intro a {
    color: #8fb8ff;
    font-weight: 600;
  }
  .code-cards {
    flex: 2 1 480px;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
</style>
