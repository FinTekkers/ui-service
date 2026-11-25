<!-- /free/tech-vs-sp500 (US-339): tech's drawdown relative to the S&P 500,
     the XLK ÷ SPY ratio of daily closes against its 252-session high,
     inside the Free data explorer shell (../+layout.svelte). The server load
     (./+page.server.ts) reads the closes through the broker and computes
     the series, troughs and 'worst since' date; every figure is text here,
     and the two panels draw it with Plotly. -->
<script lang="ts">
  import DrawdownPanel from "../../../components/free/tech/DrawdownPanel.svelte";
  import { dateLabel } from "$lib/free/etf";
  import {
    SINCE_2004,
    TECH_VS_SP500_BASIS,
    TECH_VS_SP500_FORMULA,
    TECH_VS_SP500_SESSIONS,
    TECH_VS_SP500_SOURCE,
    percentLabel,
    type TechVsSp500PageData,
  } from "$lib/free/techVsSp500";

  export let data: TechVsSp500PageData;
</script>

<svelte:head>
  <title
    >Tech's drawdown relative to the S&P 500 · Free data explorer · Fintekkers</title
  >
</svelte:head>

<!-- 1. Narrative and the latest figure -->
<article class="card narrative" aria-labelledby="tech-title">
  <h2 id="tech-title" class="section-title">
    Tech's drawdown relative to the S&P 500
  </h2>
  <p>
    How far technology stocks trail the market: the ratio of XLK (the Technology
    Select Sector SPDR fund) to SPY (the S&P 500), measured against its highest
    close over the past 252 trading sessions, about a year. 0% means tech is at
    a 52-week high relative to the S&P 500.
  </p>
  {#if data.ok}
    <p class="headline" data-testid="tech-headline">
      {#if data.data.latest.dd === 0}
        On {dateLabel(data.data.latest.date)} the XLK ÷ SPY ratio was at a 52-week
        relative high.
      {:else if data.data.worstSince}
        On {dateLabel(data.data.latest.date)} the XLK ÷ SPY ratio was {percentLabel(
          data.data.latest.dd
        )} from its 52-week high: worst since {dateLabel(data.data.worstSince)}.
      {:else}
        On {dateLabel(data.data.latest.date)} the XLK ÷ SPY ratio was {percentLabel(
          data.data.latest.dd
        )} from its 52-week high: the deepest on record.
      {/if}
    </p>
    <p class="latest" data-testid="tech-latest">
      Latest: {percentLabel(data.data.latest.dd)} on {dateLabel(
        data.data.latest.date
      )}
    </p>
  {:else}
    <p class="status">{data.message}</p>
  {/if}
</article>

<!-- 2. Full history, 3. Since 2004 -->
<DrawdownPanel id="tech-full" title="Full history" {data} dtick={10} />
<DrawdownPanel
  id="tech-2004"
  title="Since 2004"
  {data}
  from={SINCE_2004}
  dtick={5}
/>

<!-- 4. Troughs, as the charts annotate them -->
<section aria-labelledby="tech-troughs-title" class="card block">
  <h2 id="tech-troughs-title" class="panel-title">Episodes deeper than 10%</h2>
  {#if !data.ok}
    <p class="status">{data.message}</p>
  {:else if data.data.troughs.length}
    <ol class="troughs" data-testid="tech-troughs">
      {#each data.data.troughs as t}
        <li>
          <span>{dateLabel(t.date)}</span>
          <span class="value">{percentLabel(t.dd)}</span>
        </li>
      {/each}
    </ol>
  {:else}
    <p class="status">No episode has been deeper than 10%.</p>
  {/if}
</section>

<!-- 5. Source note -->
<section aria-labelledby="tech-note-title" class="card block">
  <h2 id="tech-note-title" class="panel-title">Source and method</h2>
  <div class="note" data-testid="tech-note">
    <p>{TECH_VS_SP500_FORMULA}</p>
    <p>{TECH_VS_SP500_BASIS}</p>
    <p>{TECH_VS_SP500_SESSIONS}</p>
    <p>{TECH_VS_SP500_SOURCE}</p>
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
  .narrative {
    padding: clamp(24px, 4vw, 40px);
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .narrative p {
    margin: 0;
    max-width: 72ch;
    font-size: 17px;
    line-height: 1.65;
    color: #33404f;
  }
  .narrative .headline {
    font-weight: 600;
    color: var(--ink);
  }
  .narrative .latest {
    font-family: var(--mono);
    font-size: clamp(20px, 4vw, 26px);
    font-weight: 500;
    color: var(--accent);
    overflow-wrap: anywhere;
  }
  .block {
    padding: 22px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    min-width: 0;
  }
  .status {
    margin: 0;
    font-family: var(--mono);
    font-size: 14px;
    line-height: 1.5;
    color: var(--muted);
  }
  .troughs {
    margin: 0;
    padding: 0;
    list-style: none;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 8px 24px;
    font-size: 15px;
  }
  .troughs li {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    padding: 6px 0;
    border-bottom: 1px solid var(--line);
  }
  .value {
    font-family: var(--mono);
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
</style>
