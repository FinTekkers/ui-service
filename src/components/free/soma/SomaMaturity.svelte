<!-- Section 4 of /free/soma: remaining maturity by bucket, with a
     Treasuries / MBS toggle, from DataExplorer.dc.html. Bar widths and
     shares are the stored figures in src/lib/free/mock/soma.ts. -->
<script lang="ts">
  import { formatMillionsAsBillions } from "$lib/free/format";
  import type { SomaResponse } from "$lib/free/mock/types";

  export let maturity: SomaResponse["maturity"];

  const VIEWS = [
    { id: "tsy", label: "Treasuries" },
    { id: "mbs", label: "MBS" },
  ] as const;

  let view: "tsy" | "mbs" = "tsy";

  $: current = maturity[view];
</script>

<section aria-labelledby="mat-title" class="maturity">
  <div class="top">
    <div class="intro">
      <p class="eyebrow">Maturity profile</p>
      <h2 id="mat-title">When the holdings come due</h2>
      <p class="note" data-view={view}>{current.note}</p>
    </div>
    <div role="group" aria-label="Asset type" class="toggle">
      {#each VIEWS as option}
        <button
          type="button"
          aria-pressed={view === option.id}
          on:click={() => (view = option.id)}>{option.label}</button
        >
      {/each}
    </div>
  </div>
  <div class="buckets">
    {#each current.buckets as bucket, i}
      <div class="bucket">
        <span class="label">{maturity.labels[i]}</span>
        <div class="track">
          <div
            class="fill"
            style="width: {bucket.sharePct}%; background: {current.color}"
          />
        </div>
        <span class="value"
          >{formatMillionsAsBillions(bucket.valueM)}
          <span class="share">· {bucket.sharePct.toFixed(1)}%</span></span
        >
      </div>
    {/each}
  </div>
  <p class="source">
    Remaining maturity, $ billions, as of October 14, 2026. Source: <a
      href="https://www.federalreserve.gov/releases/h41/current/"
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
  .toggle {
    display: flex;
    gap: 4px;
    background: #f0f2f5;
    padding: 4px;
    border-radius: 8px;
  }
  .toggle button {
    min-height: 40px;
    padding: 0 16px;
    border: 0;
    border-radius: 6px;
    background: transparent;
    font-family: inherit;
    font-size: 14px;
    font-weight: 600;
    color: var(--ink);
    cursor: pointer;
  }
  .toggle button[aria-pressed="true"] {
    background: #ffffff;
  }
  .toggle button:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
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
