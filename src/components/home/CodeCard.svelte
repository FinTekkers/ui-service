<script lang="ts">
  // The card shows this file verbatim; src/tests/home-first-call-tsc.test.ts
  // compiles it against the installed @fintekkers/ledger-models.
  import source from "$lib/home/first-call.ts?raw";

  const LANGUAGES = ["TypeScript", "Python", "Java", "Rust"];

  // Plain-text colouring only: no {@html}, so the <pre> text is the file.
  const TOKEN = /(\/\/[^\n]*|"[^"\n]*"|\b(?:import|from|const|new|await)\b)/g;
  const parts = source
    .trimEnd()
    .split(TOKEN)
    .filter((text) => text !== "")
    .map((text) => ({
      text,
      kind: text.startsWith("//")
        ? "comment"
        : text.startsWith('"')
        ? "string"
        : /^(?:import|from|const|new|await)$/.test(text)
        ? "keyword"
        : "",
    }));
</script>

<div class="card">
  <div class="bar">
    <div class="tabs">
      {#each LANGUAGES as language, i}
        <span class:active={i === 0}>{language}</span>
      {/each}
    </div>
    <span class="file">first-call.ts</span>
  </div>
  <div class="body">
    <p class="install">$ npm i @fintekkers/ledger-models</p>
    <!-- Focusable so keyboard users can scroll the long lines sideways. -->
    <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
    <pre tabindex="0" aria-label="TypeScript sample, first-call.ts"><code
        >{#each parts as part}{#if part.kind}<span class={part.kind}
              >{part.text}</span
            >{:else}{part.text}{/if}{/each}</code
      ></pre>
  </div>
  <div class="output">
    <span class="arrow" aria-hidden="true">→</span>
    <span>Federal Reserve SOMA Holdings</span>
  </div>
</div>

<style>
  .card {
    flex: 1 1 520px;
    min-width: 0;
    background: var(--ink);
    border-radius: 14px;
    overflow: hidden;
    box-shadow: 0 24px 48px -24px rgba(13, 27, 42, 0.45);
    font-family: var(--mono);
  }
  .bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 12px 18px;
    border-bottom: 1px solid #22344a;
    flex-wrap: wrap;
  }
  .tabs {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    font-size: 13px;
  }
  .tabs span {
    padding: 6px 10px;
    border-radius: 6px;
    color: #9aa6b8;
  }
  .tabs span.active {
    background: #1c2e44;
    color: #ffffff;
  }
  .file {
    font-size: 12px;
    color: #9aa6b8;
  }
  .body {
    padding: 20px 22px;
  }
  .install {
    margin: 0 0 14px;
    font-size: 13.5px;
    color: #9aa6b8;
  }
  pre {
    margin: 0;
    overflow-x: auto;
    white-space: pre;
    font-family: var(--mono);
    font-size: 13.5px;
    line-height: 1.75;
    color: #e6eaf0;
  }
  pre:focus-visible {
    outline: 2px solid #8fb8ff;
    outline-offset: 2px;
  }
  .keyword {
    color: #8fb8ff;
  }
  .string {
    color: #f5b971;
  }
  .comment {
    color: #9aa6b8;
  }
  .output {
    padding: 14px 22px;
    border-top: 1px solid #22344a;
    background: #0a1622;
    font-size: 13px;
    display: flex;
    gap: 10px;
    align-items: center;
    color: #e6eaf0;
  }
  .arrow {
    color: #6fd6a0;
  }
</style>
