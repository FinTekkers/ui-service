<!-- /free/spy (US-334): SPY's history from its stored SecurityMetric series,
     inside the Free data explorer shell (../+layout.svelte). The server load
     (./+page.server.ts) reads the series through the broker and derives the
     flows and fee figures; each chart shows its reason when it can't be
     built. -->
<script lang="ts">
  import SpyFees from "../../../components/free/spy/SpyFees.svelte";
  import SpyFlows from "../../../components/free/spy/SpyFlows.svelte";
  import SpyShares from "../../../components/free/spy/SpyShares.svelte";
  import { SPY_STALE_DAYS, dateLabel, groupDigits } from "$lib/free/spy";
  import type { SpyPageData } from "$lib/free/spy";

  export let data: SpyPageData;
</script>

<svelte:head>
  <title>SPDR S&P 500 ETF Trust (SPY) · Free data explorer · Fintekkers</title>
</svelte:head>

<!-- 1. Narrative -->
<article class="card narrative">
  <div class="narrative-text">
    <h2 class="section-title">What is SPY?</h2>
    <p>
      The SPDR S&P 500 ETF Trust (SPY) was the first US exchange-traded fund and
      is still one of the largest. It holds the stocks of the S&P 500 index. It
      is State Street's fund, part of its SPDR family, not an iShares fund from
      BlackRock.
    </p>
    <p>
      Authorised participants create and redeem SPY shares in large blocks, so
      the share count moves with investor demand. Its assets change for two
      reasons: money flowing in or out, and the market value of the stocks it
      holds. The charts below separate the two.
    </p>
  </div>
  <dl>
    <div>
      <dt>Fund</dt>
      <dd>SPDR S&P 500 ETF Trust, ticker SPY</dd>
    </div>
    <div>
      <dt>Sponsor family</dt>
      <dd>State Street (SPDR)</dd>
    </div>
    <div>
      <dt>Source</dt>
      <dd>
        <a
          href="https://www.ssga.com/us/en/intermediary/etfs/spdr-sp-500-etf-trust-spy"
          >State Street SPY fund data</a
        >, daily from May 31, 2006
      </dd>
    </div>
  </dl>
</article>

<!-- 2. Latest share count -->
<section aria-labelledby="spy-latest-title" class="card latest">
  <h2 id="spy-latest-title" class="label">Latest shares outstanding</h2>
  {#if data.latest.ok}
    <p class="figure">{groupDigits(data.latest.data.value)}</p>
    <p class="as-of">As of {dateLabel(data.latest.data.date)}</p>
    {#if data.latest.data.stale}
      <p class="stale" role="note" data-testid="spy-stale">
        This figure is {data.latest.data.ageDays} days old, more than {SPY_STALE_DAYS}
        days. Newer State Street figures have not been loaded yet.
      </p>
    {/if}
  {:else}
    <p class="as-of">{data.latest.message}</p>
  {/if}
</section>

<!-- 3. Shares outstanding over time -->
<SpyShares shares={data.shares} asOf={data.asOf} />

<!-- 4. Monthly AUM change -->
<SpyFlows flows={data.flows} />

<!-- 5. Sponsor fee revenue -->
<SpyFees fees={data.fees} />

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
