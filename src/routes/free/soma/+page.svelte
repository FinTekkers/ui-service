<!-- /free/soma: the 7 sections of the owner's DataExplorer.dc.html artboard,
     inside the Free data explorer shell (../+layout.svelte). US-307:
     the snapshot, findings and maturity profile are the ledger's SOMA
     Treasury holdings for the Business date's week, from the server load
     (./+page.server.ts). US-309: so is Positions by CUSIP, from the same
     search. US-317: Holdings over time is the ledger's weekly SOMA par,
     streamed after the rest of the page (data.streamed.history). -->
<script lang="ts">
  import FreeCodeCard from "../../../components/free/FreeCodeCard.svelte";
  import SomaHistory from "../../../components/free/soma/SomaHistory.svelte";
  import SomaMaturity from "../../../components/free/soma/SomaMaturity.svelte";
  import SomaPositions from "../../../components/free/soma/SomaPositions.svelte";
  import SomaSnapshot from "../../../components/free/soma/SomaSnapshot.svelte";
  import SomaWeekPicker from "../../../components/free/soma/SomaWeekPicker.svelte";
  import pySample from "$lib/free/samples/soma.py?raw";
  import tsSample from "$lib/free/samples/soma.ts?raw";
  import type { PageData } from "./$types";

  export let data: PageData;
</script>

<svelte:head>
  <title>Federal Reserve SOMA Holdings · Free data explorer · Fintekkers</title>
</svelte:head>

<!-- 1. Narrative -->
<article class="card narrative">
  <div class="narrative-text">
    <h2 class="section-title">What is the Federal Reserve SOMA?</h2>
    <p>
      The System Open Market Account (SOMA) is the Federal Reserve's investment
      portfolio. It holds the securities the Fed buys and sells through open
      market operations, the main tool it uses to carry out monetary policy.
    </p>
    <p>
      The account is managed by the Open Market Trading Desk at the Federal
      Reserve Bank of New York. It grows when the Fed buys securities, as in
      quantitative easing, and shrinks as holdings mature or roll off, as in
      quantitative tightening. Watching how its size and mix change over time is
      one of the clearest views into Fed policy.
    </p>
  </div>
  <dl>
    <div>
      <dt>Managed by</dt>
      <dd>Federal Reserve Bank of New York</dd>
    </div>
    <div>
      <dt>Holds</dt>
      <dd>US Treasury bills, notes, bonds, TIPS and FRNs</dd>
    </div>
    <div>
      <dt>Source</dt>
      <dd>
        <a href="https://www.newyorkfed.org/markets/soma-holdings"
          >New York Fed SOMA holdings</a
        >
      </dd>
    </div>
  </dl>
</article>

<SomaWeekPicker asOf={data.asOf} today={data.today} />

<!-- 2. Snapshot -->
<SomaSnapshot snapshot={data.snapshot} asOfLabel={data.asOfLabel} />

<!-- 3. What the data says -->
<article class="card findings">
  <div class="findings-intro">
    <h2 class="section-title">What the portfolio is telling us</h2>
    <p>
      The Fed stopped shrinking its balance sheet on December 1, 2025. A year of
      data since then shows how the end of quantitative tightening reshaped what
      the Fed owns.
    </p>
  </div>
  {#if data.findings.ok}
    <p class="as-of">As of {data.asOfLabel}</p>
    <div class="finding-grid">
      {#each data.findings.data.cards as finding}
        <div class="finding">
          <span class="figure">{finding.figure}</span>
          <h3>{finding.title}</h3>
          <p>
            {finding.body}{#if finding.link}{" "}<a href={finding.link.href}
                >{finding.link.label}</a
              >{/if}
          </p>
        </div>
      {/each}
    </div>
  {:else}
    <p class="as-of">{data.findings.message}</p>
  {/if}
</article>

<!-- 4. Maturity profile -->
<SomaMaturity maturity={data.maturity} asOfLabel={data.asOfLabel} />

<!-- 5. Holdings over time -->
{#await data.streamed.history}
  <SomaHistory history={null} asOf={data.asOf} asOfLabel={data.asOfLabel} />
{:then history}
  <SomaHistory {history} asOf={data.asOf} asOfLabel={data.asOfLabel} />
{/await}

<!-- 6. Positions by CUSIP -->
<SomaPositions positions={data.positions} asOfLabel={data.asOfLabel} />

<!-- 7. Code -->
<section aria-labelledby="code-title" class="code-section">
  <div class="code-intro">
    <p class="eyebrow">Use it in code</p>
    <h2 id="code-title">Pull SOMA data from the API</h2>
    <p>
      Find the portfolio, then load its positions as of any date. No API key
      needed for public data.
    </p>
    <a href="https://github.com/FinTekkers/ledger-models"
      >See the ledger-models docs</a
    >
  </div>
  <div class="code-cards">
    <FreeCodeCard
      title="Find the portfolio"
      lang="TypeScript"
      source={tsSample}
    />
    <FreeCodeCard title="Find the portfolio" lang="Python" source={pySample} />
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
  .findings-intro p {
    margin: 0;
    font-size: 17px;
    line-height: 1.65;
    color: #33404f;
  }
  dl {
    flex: 1 1 240px;
    min-width: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  dl div {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  dt {
    font-family: var(--mono);
    font-size: 12px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--muted);
  }
  dd {
    margin: 0;
    font-size: 15px;
    line-height: 1.5;
  }

  .findings {
    padding: clamp(24px, 4vw, 40px);
    display: flex;
    flex-direction: column;
    gap: 28px;
  }
  .findings-intro {
    display: flex;
    flex-direction: column;
    gap: 12px;
    max-width: 46em;
  }
  .findings .as-of {
    margin: 0;
    font-family: var(--mono);
    font-size: 13px;
    color: var(--muted);
  }
  .finding-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 16px;
  }
  .finding {
    border: 1px solid var(--line);
    border-radius: 10px;
    padding: 22px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    min-width: 0;
  }
  .figure {
    font-family: var(--mono);
    font-size: 28px;
    font-weight: 500;
    color: var(--accent);
  }
  .finding h3 {
    margin: 0;
    font-weight: 700;
    font-size: 17px;
  }
  .finding p {
    margin: 0;
    font-size: 15px;
    line-height: 1.6;
    color: var(--muted);
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
  .code-intro .eyebrow {
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
