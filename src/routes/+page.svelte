<script lang="ts">
  import Hero from "../components/home/Hero.svelte";
  import GetStarted from "../components/home/GetStarted.svelte";
  import HomeFooter from "../components/home/HomeFooter.svelte";
  import HomeNav from "../components/home/HomeNav.svelte";
  import LanguageStrip from "../components/home/LanguageStrip.svelte";
  import LiveData from "../components/home/LiveData.svelte";
  import Pillars from "../components/home/Pillars.svelte";
  import SupportCta from "../components/home/SupportCta.svelte";
  import "$lib/styles/ft-theme.css";

  export let data: import("./$types").PageData;
</script>

<svelte:head>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="" />
  <link
    rel="stylesheet"
    href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap"
  />
</svelte:head>

<div class="ft-home">
  <HomeNav />
  <Hero />
  <LanguageStrip />
  <Pillars />
  <LiveData data={data.closes} />
  <GetStarted />
  <SupportCta />
  <HomeFooter />
</div>

<style>
  .ft-home {
    min-height: 100%;
    font-family: var(--sans);
    color: var(--ink);
    background: var(--bg);
  }

  /* The homepage has its own nav (HomeNav). Hide the app shell's Navbar
     (.navigation_bar, src/components/Navbar.svelte) and SidebarNav
     (.mobile-nav, src/components/SidebarNav.svelte) on / only, since
     src/routes/+layout.svelte renders them on every route. */
  :global(body:has(.ft-home) .navigation_bar),
  :global(body:has(.ft-home) .mobile-nav) {
    display: none;
  }

  /* Shared by the section components in src/components/home/. */
  .ft-home :global(.container) {
    box-sizing: border-box;
    max-width: 1200px;
    margin: 0 auto;
    padding-left: clamp(16px, 4vw, 40px);
    padding-right: clamp(16px, 4vw, 40px);
  }
  .ft-home :global(.section) {
    padding-top: clamp(64px, 8vw, 112px);
    padding-bottom: clamp(64px, 8vw, 112px);
  }
  .ft-home :global(.intro) {
    display: flex;
    flex-direction: column;
    gap: 14px;
    max-width: 640px;
    margin-bottom: 48px;
  }
  .ft-home :global(.eyebrow) {
    margin: 0;
    font-family: var(--mono);
    font-size: 13px;
    font-weight: 500;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--accent);
  }
  .ft-home :global(h1),
  .ft-home :global(h2),
  .ft-home :global(h3) {
    margin: 0;
    font-family: var(--sans);
    font-weight: 700;
    color: inherit;
  }
  .ft-home :global(h2) {
    font-size: clamp(30px, 3.4vw, 42px);
    line-height: 1.1;
    letter-spacing: -0.02em;
  }
  .ft-home :global(h3) {
    font-size: 21px;
    font-weight: 600;
  }
  .ft-home :global(p a) {
    color: var(--accent);
    text-decoration: underline;
  }
  .ft-home :global(p a:hover) {
    color: var(--accent-hover);
  }
  .ft-home :global(a:focus-visible) {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }
  .ft-home :global(.btn) {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    min-height: 48px;
    padding: 0 22px;
    border-radius: 8px;
    text-decoration: none;
    font-weight: 600;
    font-size: 16px;
  }
  .ft-home :global(.btn-primary) {
    background: var(--accent);
    color: #ffffff;
  }
  .ft-home :global(.btn-primary:hover) {
    background: var(--accent-hover);
    color: #ffffff;
  }
  .ft-home :global(.btn-secondary) {
    background: #ffffff;
    border: 1px solid #c9cfd8;
    color: var(--ink);
  }
  .ft-home :global(.btn-secondary:hover) {
    border-color: var(--ink);
  }
</style>
