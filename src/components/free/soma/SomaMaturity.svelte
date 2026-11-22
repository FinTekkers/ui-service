<!-- Section 4 of /free/soma: remaining maturity by bucket, Treasuries only,
     from DataExplorer.dc.html. US-307: the server load buckets the ledger's
     holdings, inflation compensation included, as H.4.1 Table 2 does; bar
     widths are its shares. US-327: each bar is stacked by Holdings over
     time's groups, in its colours, with the same legend. -->
<script lang="ts">
  import { formatMillionsAsBillions } from "$lib/free/format";
  import {
    SOMA_BUCKET_LABELS,
    SOMA_STACKS,
    SOMA_STACK_COLORS,
    SOMA_STACK_LABELS,
    type Section,
    type SomaMaturityView,
    type SomaSegment,
  } from "$lib/free/soma";

  export let maturity: Section<SomaMaturityView>;
  export let asOfLabel: string;

  /** e.g. "TIPS: $10.0B, 1.9% of bucket". */
  function segmentLabel(seg: SomaSegment): string {
    return `${SOMA_STACK_LABELS[seg.stack]}: ${formatMillionsAsBillions(
      seg.valueM
    )}, ${seg.sharePct.toFixed(1)}% of bucket`;
  }
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
            <div class="fill" style="width: {bucket.sharePct}%">
              {#each bucket.segments as seg}
                <div
                  class="segment"
                  data-stack={seg.stack}
                  role="img"
                  aria-label={segmentLabel(seg)}
                  style="flex: {seg.valueM} 1 0; background: {SOMA_STACK_COLORS[
                    seg.stack
                  ]}"
                />
              {/each}
            </div>
          </div>
          <span class="value"
            >{formatMillionsAsBillions(bucket.valueM)}
            <span class="share">· {bucket.sharePct.toFixed(1)}%</span></span
          >
        </div>
      {/each}
    </div>
    <ul class="legend">
      {#each SOMA_STACKS as stack}
        <li>
          <span class="swatch" style="background: {SOMA_STACK_COLORS[stack]}" />
          {SOMA_STACK_LABELS[stack]}
        </li>
      {/each}
    </ul>
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
    display: flex;
    height: 100%;
    border-radius: 4px;
    overflow: hidden;
  }
  /* No padding, border or margin: flex-grow alone sets each width. */
  .segment {
    min-width: 0;
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
  .legend {
    margin: 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-wrap: wrap;
    gap: 8px 20px;
    font-size: 14px;
  }
  .legend li {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .swatch {
    width: 12px;
    height: 12px;
    border-radius: 3px;
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
