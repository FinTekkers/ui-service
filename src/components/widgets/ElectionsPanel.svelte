<script lang="ts">
  // US-242: view and edit a portfolio's AmortisationElectionsProto. Save
  // only opens a confirmation; the form posts to ?/saveElections when the
  // user confirms, and Cancel sends nothing.
  import { enhance } from "$app/forms";
  import { ELECTION_FIELDS, electionLabel } from "$lib/electionText";
  import { diffElections, type ElectionValues } from "$lib/electionValues";

  export let portfolioId: string;
  export let portfolioName = "";
  export let elections: { asOf: string; elections: ElectionValues } | null =
    null;
  export let error: string | null = null;
  export let result: {
    ok: boolean;
    error?: string;
    changes?: unknown[];
  } | null = null;

  let selected: ElectionValues = {
    bondPremium: 0,
    marketDiscountInclusion: 0,
    marketDiscountAccrual: 0,
  };
  let showConfirm = false;
  let saving = false;
  let saveDate = "";

  // Start again from the stored values whenever they are (re)loaded.
  $: reset(elections);
  function reset(e: typeof elections) {
    if (e) selected = { ...e.elections };
    showConfirm = false;
  }

  $: changes = elections ? diffElections(elections.elections, selected) : [];

  function openConfirm() {
    if (changes.length === 0) return;
    saveDate = new Date().toISOString().slice(0, 10);
    showConfirm = true;
  }

  function closeConfirm() {
    if (!saving) showConfirm = false;
  }

  function fieldLabel(key: string): string {
    return ELECTION_FIELDS.find((f) => f.key === key)?.label ?? key;
  }

  function formatAsOf(iso: string): string {
    return iso ? `${iso.slice(0, 10)} ${iso.slice(11, 16)} UTC` : "—";
  }

  function focusOnOpen(node: HTMLElement) {
    node.focus();
  }
</script>

<section class="elections-panel shadow" aria-labelledby="elections-title">
  <h2 id="elections-title" class="panel-title">Amortisation elections</h2>
  {#if portfolioName}
    <p class="portfolio-name">{portfolioName}</p>
  {/if}

  {#if error}
    <p class="panel-error" role="alert">{error}</p>
  {:else if elections}
    <p class="panel-note">
      Fixed for this portfolio: they apply to every lot. Last saved {formatAsOf(
        elections.asOf
      )}.
    </p>

    {#if result?.ok}
      <p class="panel-success" role="status">Elections saved.</p>
    {:else if result?.error}
      <p class="panel-error" role="alert">{result.error}</p>
    {/if}

    <ul class="election-list">
      {#each ELECTION_FIELDS as field (field.key)}
        <li class="election-row">
          <div class="election-head">
            <label for="election-{field.key}">{field.label}</label>
            <span class="irc">IRC {field.irc}</span>
          </div>
          <p class="current" data-testid="election-current-{field.key}">
            {electionLabel(field.key, elections.elections[field.key])}
          </p>
          <select
            id="election-{field.key}"
            bind:value={selected[field.key]}
            disabled={saving}
          >
            <option value={0}>{electionLabel(field.key, 0)}</option>
            {#each field.options as option (option.value)}
              <option value={option.value}>{option.label}</option>
            {/each}
          </select>
          <p class="explanation">{field.explanation}</p>
        </li>
      {/each}
    </ul>

    <div class="panel-actions">
      <button
        type="button"
        class="btn-primary"
        disabled={changes.length === 0 || saving}
        on:click={openConfirm}>Save</button
      >
    </div>
  {/if}
</section>

{#if showConfirm && elections}
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <div class="modal-overlay" on:click={closeConfirm}>
    <div
      class="modal-content"
      role="dialog"
      aria-modal="true"
      aria-labelledby="elections-confirm-title"
      tabindex="-1"
      use:focusOnOpen
      on:click|stopPropagation
      on:keydown={(e) => e.key === "Escape" && closeConfirm()}
    >
      <h3 id="elections-confirm-title" class="modal-title">
        Save elections for {portfolioName || "this portfolio"}?
      </h3>
      <ul class="change-list">
        {#each changes as change (change.key)}
          <li>
            <strong>{fieldLabel(change.key)}:</strong>
            {electionLabel(change.key, change.from)} →
            {electionLabel(change.key, change.to)}
          </li>
        {/each}
      </ul>
      <p class="modal-date">
        Saved on {saveDate} (UTC) when you confirm. The new elections apply to every
        lot in this portfolio.
      </p>
      <div class="modal-actions">
        <button
          type="button"
          class="btn-cancel"
          disabled={saving}
          on:click={closeConfirm}>Cancel</button
        >
        <form
          method="POST"
          action="?/saveElections"
          use:enhance={() => {
            saving = true;
            return async ({ update }) => {
              await update({ reset: false });
              saving = false;
              showConfirm = false;
            };
          }}
        >
          <input type="hidden" name="portfolioId" value={portfolioId} />
          <input type="hidden" name="baseAsOf" value={elections.asOf} />
          {#each changes as change (change.key)}
            <input type="hidden" name={change.key} value={change.to} />
          {/each}
          <button type="submit" class="btn-primary" disabled={saving}>
            {saving ? "Saving…" : "Confirm"}
          </button>
        </form>
      </div>
    </div>
  </div>
{/if}

<style lang="scss">
  @import "../../styles/variables";

  .elections-panel {
    flex: 0 1 26rem;
    min-width: 18rem;
    padding: 1.75rem 1.5rem;
    color: $white;
  }

  .panel-title {
    font-size: 1.5rem;
    font-weight: 800;
    margin-bottom: 0.25rem;
  }

  .portfolio-name {
    color: $ltgrey;
    margin-bottom: 0.75rem;
    overflow-wrap: anywhere;
  }

  .panel-note {
    font-size: 0.85rem;
    color: $ltgrey;
    margin-bottom: 1rem;
  }

  .election-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .election-row {
    border-top: 1px solid $border-color;
    padding: 0.75rem 0;
  }

  .election-head {
    display: flex;
    justify-content: space-between;
    gap: 0.5rem;
    font-weight: 700;
  }

  .irc {
    color: $success;
    font-size: 0.85rem;
    white-space: nowrap;
  }

  .current {
    font-size: 0.9rem;
    margin: 0.25rem 0;
  }

  select {
    width: 100%;
    padding: 4px 6px;
    border-radius: 4px;
    background-color: $black;
    color: $white;
    border: 1px solid $border-color;
  }

  .explanation {
    font-size: 0.8rem;
    color: $ltgrey;
    margin-top: 0.35rem;
  }

  .panel-actions,
  .modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 16px;
  }

  .btn-primary {
    padding: 8px 20px;
    border: none;
    border-radius: 4px;
    background-color: $primary-button;
    color: white;
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    &:hover:not(:disabled) {
      background-color: $primary-color;
    }
    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  .btn-cancel {
    padding: 8px 20px;
    border: 1px solid #ddd;
    border-radius: 4px;
    background: transparent;
    color: $white;
    font-size: 0.85rem;
    cursor: pointer;
    &:hover {
      background-color: rgba(255, 255, 255, 0.1);
    }
  }

  .panel-error {
    background-color: #7f1d1d;
    color: #fecaca;
    padding: 8px 12px;
    border-radius: 4px;
    font-size: 0.85rem;
    margin-bottom: 0.75rem;
  }

  .panel-success {
    background-color: #065f46;
    color: #d1fae5;
    padding: 8px 12px;
    border-radius: 4px;
    font-size: 0.85rem;
    margin-bottom: 0.75rem;
  }

  .modal-overlay {
    position: fixed;
    inset: 0;
    background-color: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .modal-content {
    background-color: $bgc-color;
    border-radius: 8px;
    padding: 24px;
    max-width: 520px;
    width: 90%;
    color: $white;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  }

  .modal-title {
    font-size: 1.25rem;
    font-weight: 700;
    margin-bottom: 12px;
    overflow-wrap: anywhere;
  }

  .change-list {
    font-size: 0.9rem;
    margin-bottom: 12px;
    li {
      margin-bottom: 4px;
    }
  }

  .modal-date {
    font-size: 0.85rem;
    color: $ltgrey;
  }
</style>
