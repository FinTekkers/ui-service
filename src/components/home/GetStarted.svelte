<section data-section="get-started">
  <div class="container section">
    <div class="intro">
      <p class="eyebrow">Get started</p>
      <h2>From install to first query in minutes.</h2>
    </div>
    <ol>
      <li>
        <span class="step">01</span>
        <h3>Install a client</h3>
        <p>
          Add the ledger-models package for TypeScript, Python, Java or Rust.
        </p>
      </li>
      <li>
        <span class="step">02</span>
        <h3>Query public data</h3>
        <p>
          Explore public data in the free data explorer, then call the same API
          with your free key.
        </p>
      </li>
      <li>
        <span class="step">03</span>
        <h3>Register when you scale</h3>
        <p>
          Get an API key for your own data, security controls and production
          throughput.
        </p>
      </li>
    </ol>
  </div>
</section>

<style>
  ol {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(260px, 100%), 1fr));
    border-top: 2px solid var(--ink);
  }
  li {
    padding: 28px 28px 8px 0;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .step {
    font-family: var(--mono);
    font-size: 14px;
    font-weight: 500;
    color: var(--accent);
  }
  li p {
    margin: 0;
    font-size: 16px;
    line-height: 1.6;
    color: var(--muted);
  }
</style>
