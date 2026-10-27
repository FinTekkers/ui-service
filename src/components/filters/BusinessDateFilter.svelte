<script lang="ts">
  /**
   * US-291: the Business date control on /data/positions and
   * /data/transactions. A date picker, Today, All dates, an (i) explainer
   * and a note line that spells out what the page shows.
   *
   * Renders from the page-server's resolved BusinessDateState, so "today"
   * is the server's date for this request, never the browser's. No URL
   * knowledge: it dispatches `change` with { mode, date } and the parent
   * writes the URL (businessDateUrlOverrides).
   *
   * forceAll: the parent sets it while Position Type is Tax Lot. The
   * control shows All dates and disables the picker and Today.
   */
  import { createEventDispatcher } from "svelte";
  import {
    BUSINESS_DATE_OPERATOR,
    businessDateNote,
    isIsoDate,
    type BusinessDateMode,
    type BusinessDateState,
  } from "$lib/filters/businessDate";

  export let state: BusinessDateState;
  export let forceAll: boolean = false;
  export let inputClass: string = "";
  export let inputId: string = "business-date-input";

  const dispatch = createEventDispatcher<{
    change: { mode: BusinessDateMode; date: string | null };
  }>();

  // Follows the page data (a new load resets it); a choice updates it until
  // the navigation it starts lands. Tax Lot comes from forceAll (the
  // parent's live Position Type), not the loaded state, so switching back
  // to Transaction re-enables the picker.
  let current: BusinessDateState;
  $: current = { ...state, taxLot: false };
  let open = false;
  let infoButton: HTMLButtonElement;

  $: shown = forceAll
    ? {
        ...current,
        mode: "all" as const,
        date: null,
        tradeDateOperator: null,
        taxLot: true,
      }
    : current;
  $: note = businessDateNote(shown);
  $: inputValue = shown.mode === "date" ? shown.date ?? "" : "";
  $: panelId = `${inputId}-explainer`;
  $: noteId = `${inputId}-note`;

  function choose(mode: BusinessDateMode, date: string | null) {
    current = {
      ...current,
      mode,
      date: mode === "date" ? date : null,
      tradeDateOperator: mode === "date" ? BUSINESS_DATE_OPERATOR : null,
      legacy: false,
    };
    dispatch("change", { mode, date: current.date });
  }

  function onPick(event: Event) {
    const value = (event.currentTarget as HTMLInputElement).value;
    // Typing a year by keyboard passes through 0002, 0020, 0202 first;
    // only a full four-digit year is a choice.
    if (isIsoDate(value) && value >= "1900-01-01") choose("date", value);
  }

  function closeExplainer() {
    open = false;
    infoButton?.focus();
  }

  function onPanelKeydown(event: KeyboardEvent) {
    if (event.key === "Escape") closeExplainer();
  }
</script>

<div class="business-date" data-business-date-mode={shown.mode}>
  <label class="business-date-label" for={inputId}>Business date</label>
  <div class="business-date-row">
    <input
      type="date"
      id={inputId}
      class="business-date-input {inputClass}"
      value={inputValue}
      disabled={forceAll}
      aria-describedby={noteId}
      on:change={onPick}
    />
    <button
      type="button"
      id="{inputId}-today"
      class="business-date-button"
      disabled={forceAll}
      on:click={() => choose("date", state.today)}
    >
      Today
    </button>
    <button
      type="button"
      id="{inputId}-all"
      class="business-date-button"
      aria-pressed={shown.mode === "all"}
      on:click={() => choose("all", null)}
    >
      All dates
    </button>
    <button
      type="button"
      id="{inputId}-info"
      class="business-date-info"
      aria-label="About business date"
      aria-expanded={open}
      aria-controls={panelId}
      bind:this={infoButton}
      on:click={() => (open = !open)}
    >
      i
    </button>
  </div>
  <p id={noteId} class="business-date-note" aria-live="polite">{note}</p>
  {#if open}
    <div
      id={panelId}
      class="business-date-explainer"
      role="region"
      aria-label="About business date"
      on:keydown={onPanelKeydown}
    >
      <h5>Business date</h5>
      <p>
        Positions and transactions are shown as of the end of the business date:
        every trade dated on or before that day is included, and anything dated
        later is left out.
      </p>
      <p>
        It starts at today, so future-dated activity, such as a bond's scheduled
        maturity, doesn't change today's positions.
      </p>
      <p>
        Choose <strong>All dates</strong> to remove the date filter and see everything,
        including future-dated activity.
      </p>
      <p>
        Tax lots don't support a business date yet, so they always show all
        dates.
      </p>
      <button
        type="button"
        class="business-date-button"
        on:click={closeExplainer}
      >
        Close
      </button>
    </div>
  {/if}
</div>

<style lang="scss">
  @import "../../styles/_shared.scss";

  // Keep the picker, buttons and explainer together even when the parent
  // row is wider than the screen (a wide results table on a phone).
  .business-date {
    position: relative;
    min-width: 0;
    max-width: 30rem;
  }

  .business-date-label {
    display: block;
    margin: 4px 0;
    font-size: 0.875rem;
    font-weight: bold;
  }

  .business-date-row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: stretch;
  }

  .business-date-input {
    flex: 0 1 11rem;
    min-width: 9rem;
  }

  .business-date-button {
    background-color: $primary-button;
    color: $brightwhite;
    font-weight: bold;
    padding: 0 16px;
    min-height: 38px;
    border: 1px solid $primary-button;
    border-radius: 4px;
    font-size: 0.875rem;
    white-space: nowrap;
    cursor: pointer;

    &:hover:not(:disabled) {
      background-color: lighten($primary-button, 5%);
    }

    &[aria-pressed="true"] {
      background-color: $success;
      border-color: $success;
      color: $bgc-color;
    }

    &:disabled {
      background-color: #ccc;
      border-color: #ccc;
      color: #666;
      cursor: not-allowed;
    }
  }

  .business-date-info {
    width: 38px;
    min-height: 38px;
    border: 1px solid $ltgrey;
    border-radius: 50%;
    background: transparent;
    color: $brightwhite;
    font-weight: bold;
    font-style: italic;
    font-family: Georgia, serif;
    cursor: pointer;

    &[aria-expanded="true"] {
      background-color: $primary-button;
    }
  }

  .business-date-button:focus-visible,
  .business-date-info:focus-visible {
    outline: 2px solid $success;
    outline-offset: 2px;
  }

  .business-date-note {
    margin: 4px 0 0;
    font-size: 0.8rem;
    color: $tealwhite;
    overflow-wrap: anywhere;
  }

  .business-date-explainer {
    position: absolute;
    top: 100%;
    left: 0;
    z-index: 20;
    width: min(26rem, calc(100vw - 2rem));
    margin-top: 6px;
    padding: 12px 16px;
    background-color: $black;
    border: 1px solid $border-color;
    border-radius: $bd-radius;
    font-size: 0.85rem;
    line-height: 1.4;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);

    h5 {
      margin: 0 0 6px;
      font-size: 0.95rem;
      font-weight: bold;
    }

    p {
      margin: 0 0 8px;
    }
  }
</style>
