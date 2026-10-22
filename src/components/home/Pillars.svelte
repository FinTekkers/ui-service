<section data-section="pillars">
  <div class="container section">
    <div class="intro">
      <p class="eyebrow">Why Fintekkers</p>
      <h2>Infrastructure you'd build yourself, if you had a year to spare.</h2>
    </div>
    <div class="grid">
      <article>
        <svg width="32" height="32" viewBox="0 0 32 32" aria-hidden="true">
          <path
            d="M17 4 7 18h8l-1 10 10-14h-8l1-10Z"
            stroke="#0D1B2A"
            stroke-width="2"
            fill="none"
            stroke-linejoin="round"
          />
        </svg>
        <h3>Fast</h3>
        <p>
          Binary data streams instead of XML and JSON documents. Smaller
          payloads, faster parsing, and room to scale globally.
        </p>
      </article>
      <article>
        <svg width="32" height="32" viewBox="0 0 32 32" aria-hidden="true">
          <path
            d="M11 10 5 16l6 6M21 10l6 6-6 6M18 7l-4 18"
            stroke="#0D1B2A"
            stroke-width="2"
            fill="none"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
        <h3>Open</h3>
        <p>
          Built on open-source models you can read, fork and extend. Start
          writing your application instead of reading reams of API docs.
          <a href="https://github.com/FinTekkers/ledger-models">See the code</a>
        </p>
      </article>
      <article>
        <svg width="32" height="32" viewBox="0 0 32 32" aria-hidden="true">
          <rect
            x="5"
            y="5"
            width="9"
            height="9"
            rx="2"
            stroke="#0D1B2A"
            stroke-width="2"
            fill="none"
          />
          <rect
            x="18"
            y="5"
            width="9"
            height="9"
            rx="2"
            stroke="#0D1B2A"
            stroke-width="2"
            fill="none"
          />
          <rect
            x="5"
            y="18"
            width="9"
            height="9"
            rx="2"
            stroke="#0D1B2A"
            stroke-width="2"
            fill="none"
          />
          <rect
            x="18"
            y="18"
            width="9"
            height="9"
            rx="2"
            stroke="#0D1B2A"
            stroke-width="2"
            fill="none"
            stroke-dasharray="3 3"
          />
        </svg>
        <h3>Flexible</h3>
        <p>
          Use the services you need, nothing more. Start by browsing public data
          for free, and register when you need the API, security and scale.
        </p>
      </article>
    </div>
  </div>
</section>

<style>
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(280px, 100%), 1fr));
    gap: 20px;
  }
  article {
    background: #ffffff;
    border: 1px solid var(--line);
    border-radius: 12px;
    padding: 28px;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  article p {
    margin: 0;
    font-size: 16px;
    line-height: 1.6;
    color: var(--muted);
  }
</style>
