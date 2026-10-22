<footer data-section="footer">
  <div class="container footer">
    <div class="about">
      <span class="name">Fintekkers</span>
      <p>
        Open-source ledger models and hosted infrastructure for fintech
        builders.
      </p>
    </div>
    <nav aria-label="Product">
      <span class="label">Product</span>
      <a href="/free">Data explorer</a>
      <a href="/login">Get an API key</a>
    </nav>
    <nav aria-label="Developers">
      <span class="label">Developers</span>
      <a href="https://github.com/FinTekkers/ledger-models">Docs</a>
      <a href="https://github.com/FinTekkers/ledger-models">GitHub</a>
      <a href="https://github.com/FinTekkers/ledger-models">Code examples</a>
    </nav>
    <nav aria-label="Company">
      <span class="label">Company</span>
      <a href="https://www.linkedin.com/company/fintekkers">LinkedIn</a>
      <a href="/contactus">Contact</a>
      <a href="/contactus">Support</a>
    </nav>
    <p class="copyright">© 2026 Fintekkers</p>
  </div>
</footer>

<style>
  footer {
    background: #ffffff;
    border-top: 1px solid var(--line);
  }
  .footer {
    padding-top: 56px;
    padding-bottom: 32px;
    display: flex;
    flex-wrap: wrap;
    gap: 40px;
    justify-content: space-between;
  }
  .about {
    flex: 1 1 260px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .name {
    font-weight: 700;
    font-size: 18px;
  }
  .about p {
    margin: 0;
    font-size: 15px;
    line-height: 1.6;
    color: var(--muted);
    max-width: 26em;
  }
  nav {
    flex: 0 1 160px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    font-size: 15px;
  }
  .label {
    font-family: var(--mono);
    font-size: 12px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--muted);
  }
  nav a {
    color: var(--ink);
    text-decoration: none;
  }
  nav a:hover {
    color: var(--accent);
    text-decoration: underline;
  }
  .copyright {
    flex: 1 0 100%;
    margin: 0;
    padding-top: 20px;
    border-top: 1px solid var(--line);
    font-size: 13px;
    color: var(--muted);
  }
</style>
