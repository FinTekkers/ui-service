<script lang="ts" context="module">
  /**
   * Phase 3 of second-brain#226 — fifth composable filter primitive.
   * Selects a portfolio by name via autocomplete, two-way-binding
   * `portfolioId` (the canonical UUID for URL serialization) and
   * `portfolioName` (the human-readable display value).
   *
   * Why a primitive (Option B in #226), not a panel: /data/positions and
   * /data/transactions both need this exact shape — pick a portfolio,
   * scope the search to it. A panel would have to encode the rest of
   * each page's filter UI; the primitive composes naturally with
   * IdentifierFilter / DateFilter / etc.
   *
   * Why bind both id AND name: URL serialization is by UUID
   * (?portfolioId=…), but the input must display the name so the user
   * can recognize what they've selected. Page-server resolves the
   * inbound UUID → name; the form binds both so the "selected
   * portfolio" stays in lock-step across a Fetch round-trip.
   */
  export interface PortfolioOption {
    portfolioId: string;
    portfolioName: string;
  }
</script>

<script lang="ts">
  import { onMount, tick } from 'svelte';

  // Two-way bindings — parent owns the state.
  export let portfolioId: string = '';
  export let portfolioName: string = '';

  // The list of (id, name) the user can autocomplete against. Page-
  // server fetches this via FetchPortfolioUniverse and threads it down.
  // Kept as a prop (not fetched here) so the primitive stays browser-
  // safe — no @grpc/grpc-js / SecurityService imports — and so the
  // page can decide caching / streaming behaviour.
  export let universe: readonly PortfolioOption[] = [];

  // UX knobs. Min chars before the suggestion list opens; debounce
  // delay on input changes. Defaults match #226's "friendly UX" note
  // (no auto-load on focus; minimum 2 chars). Consumers can tune.
  export let minChars: number = 2;
  export let debounceMs: number = 250;

  // Class pass-through (matches IdentifierFilter / DateFilter conventions).
  export let inputClass: string = '';
  export let inputId: string = 'portfolio-filter-input';
  export let placeholder: string = 'Type to search portfolios…';

  // Internal state
  let suggestions: PortfolioOption[] = [];
  let highlightedIndex = -1;
  let listOpen = false;
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  let inputEl: HTMLInputElement | undefined;

  // Recompute suggestions whenever the typed name changes. Debounce
  // here, not at the input level, so the bound `portfolioName`
  // updates immediately for the parent (and any other listeners), but
  // the suggestion query waits — typed-text-into-portfolioId search
  // is the only thing that benefits from a debounce.
  function scheduleFilter() {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      filterSuggestions();
    }, debounceMs);
  }

  function filterSuggestions() {
    const query = portfolioName.trim().toLowerCase();
    if (query.length < minChars) {
      suggestions = [];
      listOpen = false;
      highlightedIndex = -1;
      return;
    }
    suggestions = universe
      .filter((p) => p.portfolioName.toLowerCase().includes(query))
      // Cap at 20 — long lists overwhelm the dropdown UX. With the
      // current SOMA seed (one portfolio) this is academic.
      .slice(0, 20);
    listOpen = suggestions.length > 0;
    highlightedIndex = listOpen ? 0 : -1;
  }

  function onInput() {
    // User typed — they're starting a new search. Clear the bound
    // portfolioId so a stale UUID doesn't survive a name change. The
    // parent can detect "user is editing" via portfolioId === '' &&
    // portfolioName !== ''.
    if (portfolioId !== '') {
      portfolioId = '';
    }
    scheduleFilter();
  }

  function selectSuggestion(opt: PortfolioOption) {
    portfolioId = opt.portfolioId;
    portfolioName = opt.portfolioName;
    listOpen = false;
    suggestions = [];
    highlightedIndex = -1;
  }

  function onKeydown(e: KeyboardEvent) {
    if (!listOpen || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      highlightedIndex = (highlightedIndex + 1) % suggestions.length;
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      highlightedIndex =
        (highlightedIndex - 1 + suggestions.length) % suggestions.length;
    } else if (e.key === 'Enter') {
      if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
        e.preventDefault();
        selectSuggestion(suggestions[highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      listOpen = false;
      highlightedIndex = -1;
    }
  }

  // Close the suggestion list when the focus leaves the input AND
  // the suggestion list (small delay so a click on a suggestion has
  // time to register before blur tears down the list).
  async function onBlur() {
    await tick();
    setTimeout(() => {
      listOpen = false;
    }, 120);
  }

  onMount(() => {
    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
    };
  });
</script>

<div class="portfolio-filter">
  <input
    type="text"
    id={inputId}
    class={inputClass}
    {placeholder}
    bind:value={portfolioName}
    bind:this={inputEl}
    on:input={onInput}
    on:keydown={onKeydown}
    on:focus={filterSuggestions}
    on:blur={onBlur}
    autocomplete="off"
    role="combobox"
    aria-expanded={listOpen}
    aria-autocomplete="list"
    aria-controls="{inputId}-list"
    aria-haspopup="listbox"
  />
  {#if listOpen}
    <ul
      id="{inputId}-list"
      class="suggestion-list"
      role="listbox"
      aria-label="Portfolio suggestions"
    >
      {#each suggestions as opt, i}
        <li
          class="suggestion"
          class:highlighted={i === highlightedIndex}
          role="option"
          aria-selected={i === highlightedIndex}
          on:mousedown|preventDefault={() => selectSuggestion(opt)}
          on:mouseenter={() => (highlightedIndex = i)}
        >
          {opt.portfolioName}
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style lang="scss">
  // position: relative anchors the absolutely-positioned suggestion
  // list. Mirrors IdentifierFilter's .value-col convention.
  .portfolio-filter {
    position: relative;
    flex: 1 1 auto;
  }

  .suggestion-list {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    z-index: 50;
    margin: 2px 0 0;
    padding: 0;
    list-style: none;
    background: white;
    color: black;
    border: 1px solid #ccc;
    border-radius: 4px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
    max-height: 240px;
    overflow-y: auto;
  }

  .suggestion {
    padding: 6px 10px;
    cursor: pointer;
    font-size: 0.875rem;

    &.highlighted {
      background-color: #e6f0ff;
    }
  }
</style>
