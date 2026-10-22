<!-- Free data explorer page header, from the DataExplorer.dc.html artboard.
     The slot holds the dataset picker, on the right on wide screens. -->
<section class="free-header container">
  <div class="intro">
    <p class="eyebrow">Free data · no sign-up</p>
    <h1>Free data explorer</h1>
    <p class="lede">
      Browse public portfolio data served by the Fintekkers API. Everything here
      is open to everyone, and every view can be pulled into your own code.
    </p>
  </div>
  <div class="picker">
    <slot />
  </div>
</section>

<style>
  .free-header {
    padding-top: 48px;
    padding-bottom: 32px;
    display: flex;
    flex-wrap: wrap;
    gap: 24px;
    align-items: flex-end;
    justify-content: space-between;
  }
  .intro {
    flex: 1 1 480px;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 12px;
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
  h1 {
    margin: 0;
    font-size: clamp(32px, 4vw, 48px);
    font-weight: 700;
    line-height: 1.08;
    letter-spacing: -0.025em;
    overflow-wrap: anywhere;
  }
  .lede {
    margin: 0;
    font-size: 17px;
    line-height: 1.6;
    color: var(--muted);
    max-width: 38em;
  }
  .picker {
    flex: 0 1 340px;
    min-width: 0;
  }
</style>
