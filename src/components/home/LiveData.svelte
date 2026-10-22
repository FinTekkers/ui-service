<script lang="ts">
  import GraphSection from "../GraphSection.svelte";

  export let data: {
    cusip: string;
    issueDate: Date;
    maturityDate: Date;
    outstandingAmount: number;
  }[];
</script>

<section data-section="live" class="live">
  <div class="container section live-grid">
    <div class="copy">
      <p class="eyebrow">Live from the backend</p>
      <h2>Thousands of data points, rendered as they stream in.</h2>
      <p class="lead">
        This chart isn't a screenshot. It's live US Treasury issuance data,
        pulled from the same API you'll call.
      </p>
      <a href="/free" class="btn btn-light">
        Open the data explorer
        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
          <path
            d="M3 8h10M9 4l4 4-4 4"
            stroke="currentColor"
            stroke-width="1.8"
            fill="none"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </a>
    </div>
    <div class="card">
      <div class="card-head">
        <span class="title">US Treasury outstanding, by year</span>
        {#if data.length > 0}
          <span class="badge">
            <svg width="8" height="8" viewBox="0 0 8 8" aria-hidden="true">
              <circle cx="4" cy="4" r="4" fill="#6FD6A0" />
            </svg>
            LIVE
          </span>
        {/if}
      </div>
      {#if data.length > 0}
        <div class="chart">
          <GraphSection {data} />
        </div>
      {:else}
        <!-- The loader returns no rows when the broker refuses a call
             without an API key (logged out) or is unreachable. -->
        <p class="empty">
          <span>
            The live chart loads for signed-in users.
            <a href="/login">Sign in</a> to see it, or browse the data in the
            <a href="/free">free data explorer</a>.
          </span>
        </p>
      {/if}
    </div>
  </div>
</section>

<style>
  .live {
    background: var(--ink);
    color: #ffffff;
  }
  .live-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 48px;
    align-items: center;
  }
  .copy {
    flex: 1 1 340px;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 18px;
  }
  /* Beats the page-wide .ft-home .eyebrow accent on the dark background. */
  .live .eyebrow {
    color: #8fb8ff;
  }
  .lead {
    margin: 0;
    font-size: 17px;
    line-height: 1.6;
    color: #c3ccd8;
  }
  .btn-light {
    align-self: flex-start;
    background: #ffffff;
    color: var(--ink);
  }
  .btn-light:hover {
    background: #e6eaf0;
    color: var(--ink);
  }
  .btn-light:focus-visible {
    outline-color: #8fb8ff;
  }
  .card {
    flex: 1.6 1 520px;
    min-width: 0;
    background: #12253a;
    border: 1px solid #2a4058;
    border-radius: 14px;
    padding: 22px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .card-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
  }
  .title {
    font-weight: 600;
    font-size: 15px;
  }
  .badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-family: var(--mono);
    font-size: 12px;
    color: #6fd6a0;
  }
  .empty {
    margin: 0;
    min-height: 200px;
    display: grid;
    place-content: center;
    padding: 24px;
    text-align: center;
    border: 1px dashed #3a5370;
    border-radius: 10px;
    font-size: 15px;
    line-height: 1.6;
    color: #c3ccd8;
  }
  .empty a {
    color: #8fb8ff;
  }
  .empty a:focus-visible {
    outline-color: #8fb8ff;
  }
  .chart {
    min-width: 0;
    overflow: hidden;
    border-radius: 10px;
  }
  /* GraphSection is kept as is (US-243); restyle its markup from here.
     Its own heading is replaced by the card title above. */
  .chart :global(.graph) {
    padding: 0;
    background-color: transparent;
    border-top: 0;
  }
  .chart :global(.intro-chart) {
    display: none;
  }
  .chart :global(#plot) {
    width: 100%;
    height: 420px;
    margin: 0;
  }
  /* Plotly paints paper_bgcolor (#258ea8) as inline styles on its SVGs. */
  .chart :global(#plot .main-svg) {
    background: transparent !important;
  }
  .chart :global(#plot .bg) {
    fill: transparent !important;
  }
  /* The card title above replaces Plotly's, which clips on a phone. */
  .chart :global(#plot .gtitle) {
    display: none;
  }
</style>
