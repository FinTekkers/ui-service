<!-- A code sample card for the Free data explorer (/free/*), from the
     DataExplorer.dc.html artboard. Pass the sample file's text through
     `?raw` so the card shows the file verbatim. -->
<script lang="ts">
  import { tokenize, type CodeLang } from "$lib/free/tokenize";

  export let title: string;
  export let lang: CodeLang;
  export let source: string;

  $: tokens = tokenize(source.trimEnd(), lang);
</script>

<div class="card">
  <div class="title">{title} · {lang}</div>
  <!-- Focusable so keyboard users can scroll the long lines sideways. -->
  <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
  <pre tabindex="0" aria-label="{title}, {lang} sample"><code
      >{#each tokens as token}{#if token.kind}<span class={token.kind}
            >{token.text}</span
          >{:else}{token.text}{/if}{/each}</code
    ></pre>
</div>

<style>
  .card {
    background: #0a1622;
    border: 1px solid #22344a;
    border-radius: 10px;
    overflow: hidden;
  }
  .title {
    padding: 10px 16px;
    border-bottom: 1px solid #22344a;
    font-family: var(--mono);
    font-size: 12px;
    color: #9aa6b8;
    overflow-wrap: anywhere;
  }
  pre {
    margin: 0;
    padding: 16px;
    overflow-x: auto;
    white-space: pre;
    font-family: var(--mono);
    font-size: 13px;
    line-height: 1.75;
    color: #e6eaf0;
  }
  pre:focus-visible {
    outline: 2px solid #8fb8ff;
    outline-offset: -2px;
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
</style>
