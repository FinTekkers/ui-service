<!-- Section 4 of /free/soma: remaining maturity by bucket, Treasuries only,
     from DataExplorer.dc.html. US-307: the server load buckets the ledger's
     holdings, inflation compensation included, as H.4.1 Table 2 does; bar
     widths are its shares. -->
<script lang="ts">
  import { formatMillionsAsBillions } from "$lib/free/format";
  import {
    SOMA_BUCKET_LABELS,
    type Section,
    type SomaMaturityView,
  } from "$lib/free/soma";

  export let maturity: Section<SomaMaturityView>;
  export let asOfLabel: string;

  const COLOR = "#2F5BB7";
</script>

<section aria-labelledby="mat-title" class="maturity">
  <div class="top">
    <div class="intro">
      <p class="eyebrow">Maturity profile</p>
      <h2 id="mat-title">When the holdings come due</h2>
      <p class="note">
        {maturity.ok ? maturity.data.note : maturity.message}
      </p>
    </div>
  </div>
  {#if maturity.ok}
    <div class="buckets">
      {#each maturity.data.buckets as bucket, i}
        <div class="bucket">
          <span class="label">{SOMA_BUCKET_LABELS[i]}</span>
          <div class="track">
            <div
              class="fill"
              style="width: {bucket.sharePct}%; background: {COLOR}"
            />
          </div>
          <span class="value"
            >{formatMillionsAsBillions(bucket.valueM)}
            <span class="share">· {bucket.sharePct.toFixed(1)}%</span></span
          >
        </div>
      {/each}
    </div>
  {/if}
  <p class="source">
    Remaining maturity, $ billions, as of {asOfLabel}, inflation compensation
    included. Source: the Fintekkers ledger, bucketed as in
    <a href="https://www.federalreserve.gov/releases/h41/current/"
      >Federal Reserve H.4.1, Table 2</a
    >
  </p>
</section>

<style>
  .maturity {
    background: #ffffff;
    border: 1px solid var(--line);
    border-radius: 12px;
    padding: clamp(24px, 4vw, 40px);
    display: flex;
    flex-direction: column;
    gap: 24px;
  }
  .top {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: flex-end;
    gap: 16px;
  }
  .intro {
    display: flex;
    flex-direction: column;
    gap: 10px;
    max-width: 40em;
  }
  .eyebrow {
    margin: 0;
    font-family: var(--mono);
    font-size: 13px;
    font-weight: 500;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--accent);
  }
  h2 {
    margin: 0;
    font-weight: 700;
    font-size: clamp(24px, 2.6vw, 30px);
    line-height: 1.15;
    letter-spacing: -0.02em;
  }
  .note {
    margin: 0;
    font-size: 16px;
    line-height: 1.6;
    color: var(--muted);
  }
  .buckets {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .bucket {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 16px;
  }
  .label {
    flex: 0 0 120px;
    font-size: 14px;
    color: #33404f;
  }
  .track {
    flex: 1 1 260px;
    min-width: 0;
    height: 26px;
    background: #f0f2f5;
    border-radius: 4px;
    overflow: hidden;
  }
  .fill {
    height: 100%;
    border-radius: 4px;
  }
  .value {
    flex: 0 0 150px;
    font-family: var(--mono);
    font-size: 14px;
    text-align: right;
  }
  .share {
    color: var(--muted);
  }
  .source {
    margin: 0;
    font-size: 13px;
    color: var(--muted);
  }
  a {
    color: var(--accent);
    text-decoration: underline;
  }
  a:hover {
    color: var(--accent-hover);
  }
</style>
