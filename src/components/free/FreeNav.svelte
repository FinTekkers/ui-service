<!-- Free data explorer nav, from the owner's DataExplorer.dc.html artboard. -->
<header class="free-nav">
  <nav aria-label="Primary" class="container">
    <a href="/" class="brand">
      <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true">
        <rect x="1" y="1" width="26" height="26" rx="6" fill="#0D1B2A" />
        <path
          d="M8 19V9h10M8 14h7"
          stroke="#FFFFFF"
          stroke-width="2.4"
          fill="none"
          stroke-linecap="round"
        />
        <circle cx="20" cy="19" r="2" fill="#1D4ED8" />
      </svg>
      <span>Fintekkers</span>
    </a>
    <div class="links">
      <!-- "true", not "page": every /free/* page is in this section, but
           only /free itself is the link's page. -->
      <a href="/free" aria-current="true" class="current">Free data explorer</a>
      <a href="/login" class="pro">Pro register/login</a>
      <a href="/contactus" class="text-link">Contact</a>
    </div>
  </nav>
</header>

<style>
  .free-nav {
    background: #ffffff;
    border-bottom: 1px solid var(--line);
  }
  nav {
    padding-top: 16px;
    padding-bottom: 16px;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }
  .brand {
    display: flex;
    align-items: center;
    gap: 10px;
    text-decoration: none;
    color: var(--ink);
  }
  .brand span {
    font-weight: 700;
    font-size: 19px;
    letter-spacing: -0.01em;
  }
  .links {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px 24px;
    font-size: 15px;
  }
  .current {
    color: var(--ink);
    font-weight: 600;
    text-decoration: none;
    padding: 12px 0;
    border-bottom: 2px solid var(--accent);
  }
  .text-link {
    color: #33404f;
    text-decoration: none;
    padding: 12px 0;
  }
  .text-link:hover {
    color: var(--accent);
  }
  .pro {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    padding: 0 18px;
    border-radius: 8px;
    background: var(--ink);
    color: #ffffff;
    text-decoration: none;
    font-weight: 600;
  }
  .pro:hover {
    background: #1c2e44;
  }
</style>
