<!-- /free/tips: the 5 sections of the owner's DataExplorerTIPS.dc.html
     artboard (version 1792630643-19db), inside the Free data explorer shell
     (../+layout.svelte). US-298: the figures are live, loaded and formatted
     by ./+page.server.ts; a section whose source failed says so. The
     calculator is display only. -->
<script lang="ts">
  import FreeCodeCard from "../../../components/free/FreeCodeCard.svelte";
  import TipsCalculatorDisplay from "../../../components/free/TipsCalculatorDisplay.svelte";
  import {
    UNAVAILABLE,
    firstUnavailable,
    type TipsPageData,
  } from "$lib/free/tips";
  import pySample from "$lib/free/samples/tips.py?raw";
  import tsSample from "$lib/free/samples/tips.ts?raw";

  export let data: TipsPageData;

  $: security = data.security.ok ? data.security.data : null;
  $: price = data.price.ok ? data.price.data : null;
  $: cpi = data.cpi.ok ? data.cpi.data : null;
  $: valuation = data.valuation.ok ? data.valuation.data : null;
  // The worked example needs every source: the valuation needs the others.
  $: example =
    security && price && cpi && valuation
      ? { security, price, cpi, valuation }
      : null;
  $: exampleMessage = firstUnavailable(
    data.security,
    data.price,
    data.cpi,
    data.valuation
  );

  // The price date and the CPI-U months the figures use.
  $: asOf = data.asOf.priceDate
    ? `As of ${data.asOf.priceDate}${
        data.asOf.cpiMonths ? ` · ${data.asOf.cpiMonths}` : ""
      }`
    : "Live price unavailable";

  $: securityRows = security
    ? [
        ["CUSIP", security.cusip],
        ["Issuer", security.issuer],
        ["Product", security.product],
        ["Coupon (real)", `${security.couponRate}%`],
        ["Frequency", security.frequency],
        ["Pay dates", security.payDates],
        ["Dated date", security.datedDate],
        ["Maturity", security.maturityDate],
        ["Index", security.index],
        ["Base ref CPI", security.baseCpi],
        [
          price ? `Ref CPI (${price.date})` : "Ref CPI",
          valuation?.referenceCpi ?? UNAVAILABLE.value,
        ],
      ]
    : [];

  $: steps = example
    ? [
        {
          number: "01",
          title: "A starting point is locked in",
          body: `On the dated date, ${example.security.datedDateLong}, the bond's base reference CPI was fixed. Every future adjustment is measured against it.`,
          figure: example.security.baseCpi,
        },
        {
          number: "02",
          title: "The reference CPI moves every day",
          body: `CPI is published monthly with a lag, so Treasury uses the index from three months earlier. ${example.price.monthName} 1 takes ${example.cpi.readings[0].monthName}'s CPI-U (${example.cpi.readings[0].value}). ${example.price.nextMonthName} 1 takes ${example.cpi.readings[1].monthName}'s (${example.cpi.readings[1].value}). Days in between are interpolated, so ${example.price.dateLong} sits between the two.`,
          figure: example.valuation.referenceCpi,
        },
        {
          number: "03",
          title: "The index ratio measures inflation so far",
          body: `${example.valuation.referenceCpi} ÷ ${example.security.baseCpi}. Prices ${example.valuation.inflationVerb} about ${example.valuation.inflationPct} between the dated date and ${example.price.dateLong}, and the bond's principal ${example.valuation.inflationVerb} with them.`,
          figure: example.valuation.indexRatio,
        },
        {
          number: "04",
          title: "Principal grows with the ratio",
          body: `A ${example.security.faceDisplay} position is now worth ${example.security.faceDisplay} × ${example.valuation.indexRatio} in principal terms.`,
          figure: example.valuation.adjustedPrincipal,
        },
        {
          number: "05",
          title: "Coupons are paid on the larger principal",
          body: `Half the ${example.security.couponRate}% annual rate, applied to ${example.valuation.adjustedPrincipal}.`,
          figure: example.valuation.nextCoupon ?? UNAVAILABLE.value,
        },
        {
          number: "06",
          title: "Par is the floor at maturity",
          body: `On ${example.security.maturityDateLong} the holder receives the adjusted principal, or ${example.security.faceDisplay} if deflation has pushed the index ratio below 1.`,
          figure: "max(adj., par)",
        },
      ]
    : [];
</script>

<svelte:head>
  <title
    >Treasury Inflation-Protected Securities · Free data explorer · Fintekkers</title
  >
</svelte:head>

<!-- 1. What are TIPS -->
<article class="card narrative">
  <div class="narrative-text">
    <h2 class="section-title">
      What are Treasury Inflation-Protected Securities?
    </h2>
    <p>
      TIPS are US Treasury bonds whose principal rises and falls with inflation.
      Instead of paying a fixed dollar amount, the Treasury scales each bond's
      principal by the Consumer Price Index, so the holder's purchasing power is
      protected.
    </p>
    <p>
      The coupon rate is fixed when the bond is issued, but it's paid on the
      inflation-adjusted principal. When prices rise, both the principal and
      every coupon payment rise with them. At maturity the holder receives the
      adjusted principal or the original par amount, whichever is greater, so
      deflation can never push repayment below par.
    </p>
    <p>
      Because the payments keep pace with inflation, a TIPS yield is a real
      yield. The gap between a nominal Treasury yield and a TIPS yield of the
      same maturity is the market's breakeven inflation rate.
    </p>
  </div>
  <dl>
    <div>
      <dt>Issuer</dt>
      <dd>US Department of the Treasury</dd>
    </div>
    <div>
      <dt>Terms</dt>
      <dd>5, 10 and 30 years</dd>
    </div>
    <div>
      <dt>Inflation index</dt>
      <dd>CPI-U, not seasonally adjusted</dd>
    </div>
    <div>
      <dt>Coupons</dt>
      <dd>Semiannual, fixed rate on adjusted principal</dd>
    </div>
    <div>
      <dt>At maturity</dt>
      <dd>Greater of adjusted principal or par</dd>
    </div>
  </dl>
</article>

<!-- 2. Security detail -->
<section aria-labelledby="sec-title" class="security">
  <div class="security-top">
    <div class="titles">
      <span class="eyebrow">Security in Fintekkers</span>
      <h2 id="sec-title">{security?.description ?? data.cusip}</h2>
    </div>
    <span class="as-of">{asOf}</span>
  </div>
  {#if security}
    <dl class="security-fields">
      {#each securityRows as [label, value]}
        <div>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      {/each}
      <div>
        <dt>Index ratio</dt>
        <dd class="ratio">{valuation?.indexRatio ?? UNAVAILABLE.value}</dd>
      </div>
    </dl>
  {:else if !data.security.ok}
    <p class="unavailable" role="status">{data.security.message}</p>
  {/if}
</section>

<!-- 3. Worked example -->
<article aria-labelledby="example-title" class="card example">
  <div class="example-intro">
    <h2 id="example-title" class="section-title">
      How this bond tracks inflation
    </h2>
    <p>
      Here's the mechanism above, applied to the January 2036 TIPS and the
      Treasury's own published CPI figures{price
        ? ` for ${price.monthYear}`
        : ""}.
    </p>
  </div>
  {#if example}
    <ol>
      {#each steps as step}
        <li>
          <span class="step-number">{step.number}</span>
          <div class="step-text">
            <h3>{step.title}</h3>
            <p>{step.body}</p>
          </div>
          <span class="step-figure">{step.figure}</span>
        </li>
      {/each}
    </ol>
    <p class="source">
      Reference CPI and index ratio: <a
        href="https://www.treasurydirect.gov/auctions/announcements-data-results/tips-cpi-data/"
        >TreasuryDirect CPI table, {example.price.monthYear}</a
      >
    </p>
  {:else}
    <p class="unavailable" role="status">{exampleMessage}</p>
  {/if}
</article>

<!-- 4. Calculator (display only) -->
<section aria-labelledby="calc-title" class="card calc">
  <div class="calc-intro">
    <p class="eyebrow-accent">Calculator</p>
    <h2 id="calc-title" class="section-title">Value a TIPS position</h2>
    <!-- Deviation from the artboard, which says "Change the real yield and
         your inflation assumption…": these inputs are disabled. -->
    <p>
      Pre-filled with the January 2036 bond. This preview shows the default
      result; sign in to change the real yield and inflation.
    </p>
  </div>
  <TipsCalculatorDisplay {data} />
</section>

<!-- 5. Code -->
<section aria-labelledby="code-title" class="code-section">
  <div class="code-intro">
    <p class="eyebrow-code">Use it in code</p>
    <h2 id="code-title">Pull TIPS data from the API</h2>
    <p>
      Look up a single bond by CUSIP, or list every TIPS in the system. No API
      key needed for public data.
    </p>
    <a href="https://github.com/FinTekkers/ledger-models"
      >See the ledger-models docs</a
    >
  </div>
  <div class="code-cards">
    <FreeCodeCard
      title="One bond by CUSIP"
      lang="TypeScript"
      source={tsSample}
    />
    <FreeCodeCard title="One bond by CUSIP" lang="Python" source={pySample} />
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
  a {
    color: var(--accent);
    text-decoration: underline;
  }
  a:hover {
    color: var(--accent-hover);
  }

  .narrative {
    padding: clamp(24px, 4vw, 40px);
    display: flex;
    flex-wrap: wrap;
    gap: 32px 48px;
  }
  .narrative-text {
    flex: 2 1 420px;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .narrative-text p,
  .example-intro p {
    margin: 0;
    font-size: 17px;
    line-height: 1.65;
    color: #33404f;
  }
  .narrative dl {
    flex: 1 1 240px;
    min-width: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .narrative dl div {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .narrative dt {
    font-family: var(--mono);
    font-size: 12px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--muted);
  }
  .narrative dd {
    margin: 0;
    font-size: 15px;
  }

  .security {
    background: var(--ink);
    color: #e6eaf0;
    border-radius: 12px;
    overflow: hidden;
  }
  .security-top {
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
  .security h2 {
    margin: 0;
    font-weight: 700;
    font-size: 20px;
    color: #ffffff;
    overflow-wrap: anywhere;
  }
  .as-of {
    font-family: var(--mono);
    font-size: 13px;
    padding: 6px 10px;
    border: 1px solid #2a4058;
    border-radius: 6px;
    color: #c3ccd8;
  }
  .security-fields {
    margin: 0;
    padding: 8px 24px 24px;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
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
  }
  .security-fields .ratio {
    color: #6fd6a0;
  }

  .example {
    padding: clamp(24px, 4vw, 40px);
    display: flex;
    flex-direction: column;
    gap: 28px;
  }
  .example-intro {
    display: flex;
    flex-direction: column;
    gap: 12px;
    max-width: 46em;
  }
  ol {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    border-top: 1px solid var(--line);
  }
  li {
    display: flex;
    flex-wrap: wrap;
    gap: 12px 32px;
    padding: 22px 0;
    border-bottom: 1px solid var(--line);
  }
  li:last-child {
    border-bottom: 0;
  }
  .step-number {
    flex: 0 0 40px;
    font-family: var(--mono);
    font-size: 14px;
    font-weight: 500;
    color: var(--accent);
  }
  .step-text {
    flex: 1 1 320px;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .step-text h3 {
    margin: 0;
    font-weight: 700;
    font-size: 18px;
  }
  .step-text p {
    margin: 0;
    font-size: 16px;
    line-height: 1.6;
    color: var(--muted);
  }
  .step-figure {
    flex: 0 1 220px;
    font-family: var(--mono);
    font-size: 18px;
    font-weight: 500;
    text-align: right;
  }
  .unavailable {
    margin: 0;
    padding: 0 24px 24px;
    font-size: 15px;
  }
  .example .unavailable {
    padding: 0;
    color: var(--muted);
  }
  .source {
    margin: 0;
    font-size: 13px;
    color: var(--muted);
  }

  .calc {
    padding: clamp(24px, 4vw, 40px);
    display: flex;
    flex-direction: column;
    gap: 28px;
  }
  .calc-intro {
    display: flex;
    flex-direction: column;
    gap: 10px;
    max-width: 46em;
  }
  .calc-intro p {
    margin: 0;
    font-size: 16px;
    line-height: 1.6;
    color: var(--muted);
  }
  .calc-intro .eyebrow-accent {
    font-family: var(--mono);
    font-size: 13px;
    font-weight: 500;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--accent);
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
