<!-- /free/etf/[ticker] (US-334 as /free/spy, US-338 for every fund in
     ETF_FUNDS): a fund's history from its stored SecurityMetric series,
     inside the Free data explorer shell (../../+layout.svelte). The server
     load (./+page.server.ts) reads the series through the broker and
     derives the flows and fee figures; each chart shows its reason when it
     can't be built. Every word about the fund comes from its config entry
     (data.fund). -->
<script lang="ts">
  import EtfFees from "../../../../components/free/etf/EtfFees.svelte";
  import EtfFlows from "../../../../components/free/etf/EtfFlows.svelte";
  import EtfShares from "../../../../components/free/etf/EtfShares.svelte";
  import { ETF_STALE_DAYS, dateLabel, groupDigits } from "$lib/free/etf";
  import type { EtfPageData } from "$lib/free/etf";

  export let data: EtfPageData;

  $: fund = data.fund;
</script>

<svelte:head>
  <title>{fund.name} ({fund.ticker}) · Free data explorer · Fintekkers</title>
</svelte:head>

<!-- 1. Narrative -->
<article class="card narrative">
  <div class="narrative-text">
    <h2 class="section-title">What is {fund.ticker}?</h2>
    {#each fund.paragraphs as paragraph}
      <p>{paragraph}</p>
    {/each}
    {#if fund.splitNote}
      <p class="split-note" role="note" data-testid="etf-split-note">
        {fund.splitNote}
      </p>
    {/if}
  </div>
  <dl>
    <div>
      <dt>Fund</dt>
      <dd>{fund.name}, ticker {fund.ticker}</dd>
    </div>
    <div>
      <dt>Sponsor family</dt>
      <dd>{fund.sponsorFamily}</dd>
    </div>
    <div>
      <dt>Source</dt>
      <dd>
        <a href={fund.source.href}>{fund.source.label}</a>, daily from {dateLabel(
          fund.source.since
        )}
      </dd>
    </div>
  </dl>
</article>

<!-- 2. Latest share count -->
<section aria-labelledby="etf-latest-title" class="card latest">
  <h2 id="etf-latest-title" class="label">Latest shares outstanding</h2>
  {#if data.latest.ok}
    <p class="figure">{groupDigits(data.latest.data.value)}</p>
    <p class="as-of">As of {dateLabel(data.latest.data.date)}</p>
    {#if data.latest.data.stale}
      <p class="stale" role="note" data-testid="etf-stale">
        This figure is {data.latest.data.ageDays} days old, more than {ETF_STALE_DAYS}
        days. Newer {fund.sponsor} figures have not been loaded yet.
      </p>
    {/if}
  {:else}
    <p class="as-of">{data.latest.message}</p>
  {/if}
</section>

<!-- 3. Shares outstanding over time -->
<EtfShares {fund} shares={data.shares} asOf={data.asOf} />

<!-- 4. Monthly AUM change -->
<EtfFlows {fund} flows={data.flows} />

<!-- 5. Sponsor fee revenue -->
<EtfFees {fund} fees={data.fees} />

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
  .narrative-text p {
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
  dt,
  .label {
    font-family: var(--mono);
    font-size: 12px;
    font-weight: 400;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--muted);
  }
  dd {
    margin: 0;
    font-size: 15px;
    line-height: 1.5;
    overflow-wrap: anywhere;
  }

  .latest {
    padding: 22px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .latest .label,
  .latest p {
    margin: 0;
  }
  .figure {
    font-family: var(--mono);
    font-size: clamp(26px, 5vw, 34px);
    font-weight: 500;
    color: var(--accent);
    overflow-wrap: anywhere;
  }
  .as-of {
    font-family: var(--mono);
    font-size: 13px;
    color: var(--muted);
  }
  .narrative-text .split-note {
    padding: 10px 12px;
    border-left: 4px solid var(--accent);
    background: #f5f6f8;
    border-radius: 4px;
    font-size: 15px;
    line-height: 1.5;
    color: var(--ink);
  }
  .stale {
    padding: 10px 12px;
    border-left: 4px solid #e8a33d;
    background: #f5f6f8;
    border-radius: 4px;
    font-size: 14px;
    line-height: 1.5;
    color: var(--ink);
  }
</style>
