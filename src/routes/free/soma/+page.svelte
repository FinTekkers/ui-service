<!-- /free/soma: the 7 sections of the owner's DataExplorer.dc.html artboard,
     inside the Free data explorer shell (../+layout.svelte). Holdings over
     time and Positions by CUSIP show the artboard's placeholders until
     US-252b fills them. -->
<script lang="ts">
  import FreeCodeCard from "../../../components/free/FreeCodeCard.svelte";
  import SomaMaturity from "../../../components/free/soma/SomaMaturity.svelte";
  import SomaSnapshot from "../../../components/free/soma/SomaSnapshot.svelte";
  import pySample from "$lib/free/samples/soma.py?raw";
  import tsSample from "$lib/free/samples/soma.ts?raw";
  import type { PageData } from "./$types";

  export let data: PageData;

  const RANGES = ["1Y", "5Y", "All"];
  const PLACEHOLDER_ROWS = 6;
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
      <dd>
        US Treasury bills, notes, bonds, TIPS and FRNs; agency debt; agency
        mortgage-backed securities
      </dd>
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

<!-- 2. Snapshot -->
<SomaSnapshot {data} />

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
  <div class="finding-grid">
    {#each data.findings as finding}
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
</article>

<!-- 4. Maturity profile -->
<SomaMaturity maturity={data.maturity} />

<!-- 5. Holdings over time (artboard placeholder until US-252b) -->
<div class="card history">
  <div class="panel-top">
    <h2 class="panel-title">Holdings over time</h2>
    <div role="group" aria-label="Time range" class="ranges">
      {#each RANGES as range}
        <button
          type="button"
          disabled
          aria-pressed={range === "All" ? "true" : undefined}>{range}</button
        >
      {/each}
    </div>
  </div>
  <div class="chart-placeholder">
    <span>[Live chart component — real-time SOMA holdings]</span>
  </div>
</div>

<!-- 6. Positions (artboard placeholder until US-252b) -->
<div class="card positions">
  <div class="panel-top positions-top">
    <h2 class="panel-title">Positions by CUSIP</h2>
    <label>
      <span class="visually-hidden">Search positions</span>
      <input type="search" placeholder="Search securities" disabled />
    </label>
  </div>
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
        {#each { length: PLACEHOLDER_ROWS } as _}
          <tr>
            <td>[Security]</td>
            <td class="muted">[Type]</td>
            <td class="muted">[Date]</td>
            <td class="num">[Par]</td>
            <td class="num">[%]</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
  <div class="pager">
    <span>Showing [N] of [TOTAL] positions</span>
    <div class="pager-buttons">
      <button type="button" disabled>Previous</button>
      <button type="button" disabled>Next</button>
    </div>
  </div>
</div>

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

  .history {
    padding: 22px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .panel-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 12px;
  }
  .ranges {
    display: flex;
    gap: 4px;
    background: #f0f2f5;
    padding: 4px;
    border-radius: 8px;
  }
  .ranges button {
    min-height: 36px;
    padding: 0 12px;
    border: 0;
    border-radius: 6px;
    background: transparent;
    font-family: var(--mono);
    font-size: 13px;
    color: var(--muted);
  }
  .ranges button[aria-pressed="true"] {
    background: #ffffff;
    color: var(--ink);
    font-weight: 500;
  }
  .chart-placeholder {
    height: 300px;
    border: 1px dashed #c9cfd8;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    text-align: center;
    background-image: linear-gradient(#eef0f3 1px, transparent 1px);
    background-size: 100% 60px;
  }
  .chart-placeholder span {
    font-family: var(--mono);
    font-size: 14px;
    color: var(--muted);
    background: #ffffff;
    padding: 8px 12px;
    border-radius: 6px;
  }

  .positions {
    overflow: hidden;
  }
  .positions-top {
    padding: 18px 22px;
    border-bottom: 1px solid var(--line);
  }
  .positions label {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    color: var(--muted);
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
