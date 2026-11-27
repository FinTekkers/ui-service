<!-- "Missing a chart or dataset?" band (US-352), from the "Entry points on
     every free page" artboard. The free layout shows it above FreeFooter on
     every /free page except /free/request itself. Its title is not a
     heading, so a page's h2s stay its own sections. -->
<script lang="ts">
  import { FREE_REQUEST_PATH } from "$lib/free/request";
</script>

<section class="request-band" aria-labelledby="request-band-title">
  <div class="container band">
    <div class="copy">
      <p id="request-band-title" class="title">Missing a chart or dataset?</p>
      <p>
        Tell us what you'd like to see. We build the most requested analyses
        into the free data explorer.
      </p>
    </div>
    <a class="cta" href={FREE_REQUEST_PATH}>Request a free analysis</a>
  </div>
</section>

<style>
  .request-band {
    background: #eef2fb;
    border-top: 1px solid var(--line);
  }
  .band {
    padding-top: 32px;
    padding-bottom: 32px;
    display: flex;
    flex-wrap: wrap;
    gap: 16px 32px;
    align-items: center;
    justify-content: space-between;
  }
  .copy {
    flex: 1 1 420px;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .title {
    margin: 0;
    color: var(--ink);
    font-size: 22px;
    font-weight: 700;
    letter-spacing: -0.01em;
  }
  p {
    margin: 0;
    font-size: 16px;
    line-height: 1.55;
    color: var(--muted);
  }
  .cta {
    min-height: 44px;
    padding: 0 20px;
    border-radius: 8px;
    display: inline-flex;
    align-items: center;
    background: var(--accent);
    color: #ffffff;
    font-size: 15px;
    font-weight: 600;
    text-decoration: none;
  }
  .cta:hover {
    background: var(--accent-hover);
  }
  .cta:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }
</style>
