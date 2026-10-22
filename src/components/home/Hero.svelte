<script lang="ts">
  import CodeCard from "./CodeCard.svelte";
</script>

<section data-section="hero">
  <div class="container hero">
    <div class="copy">
      <p class="eyebrow">Open source Fintech infrastructure</p>
      <h1>The plumbing behind your fintech product.</h1>
      <p class="lead">
        Open data models and hosted services for securities, transactions,
        positions and portfolios. We handle scale, security and plumbing. You
        spend your time on the idea that sets you apart.
      </p>
      <div class="ctas">
        <a href="/login" class="btn btn-primary">
          Login/Register for Pro
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
        <a href="/free" class="btn btn-secondary">
          Explore our free data/insights
        </a>
      </div>
      <p class="note">
        Browse public data free, no sign-up. Get a free API key to use it in
        your code.
      </p>
    </div>
    <CodeCard />
  </div>
</section>

<style>
  .hero {
    padding-top: clamp(48px, 7vw, 96px);
    padding-bottom: 64px;
    display: flex;
    flex-wrap: wrap;
    gap: 56px;
    align-items: center;
  }
  .copy {
    flex: 1 1 440px;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 24px;
  }
  h1 {
    margin: 0;
    font-size: clamp(40px, 5.2vw, 64px);
    line-height: 1.04;
    letter-spacing: -0.025em;
    font-weight: 700;
  }
  .lead {
    margin: 0;
    font-size: 19px;
    line-height: 1.55;
    color: var(--muted);
    max-width: 34em;
  }
  .ctas {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-top: 8px;
  }
  .note {
    margin: 0;
    font-size: 14px;
    color: var(--muted);
  }
</style>
