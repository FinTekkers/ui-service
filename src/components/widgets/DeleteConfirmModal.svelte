<script lang="ts">
  import { enhance } from '$app/forms';
  import { createEventDispatcher } from 'svelte';

  export let show = false;
  export let entityName = '';
  export let uuidHex = '';
  export let dryRunResult: {
    success: boolean;
    totalCount: number;
    affectedEntities: Array<{ entityType: number; description: string }>;
    warnings: string[];
    error?: string;
  } | null = null;
  export let deleteLoading = false;
  export let deleteError = '';

  const dispatch = createEventDispatcher();

  $: requiresForce = (dryRunResult?.warnings ?? []).some(
    (w) => w.toLowerCase().includes('portfolio') || w.toLowerCase().includes('referenced')
  );
  $: requiresCascade = (dryRunResult?.warnings ?? []).some(
    (w) => w.toLowerCase().includes('cascade') || w.toLowerCase().includes('transaction')
  );

  let confirmInput = '';

  function close() {
    confirmInput = '';
    dispatch('close');
  }
</script>

{#if show && dryRunResult}
  <div class="modal-overlay" on:click={close} on:keydown={(e) => e.key === 'Escape' && close()}>
    <div class="modal-content" on:click|stopPropagation role="dialog" aria-modal="true">
      <h3 class="modal-title">Confirm Delete</h3>
      <p class="modal-question">Are you sure you want to delete <strong>{entityName}</strong>?</p>

      {#if dryRunResult.totalCount > 1}
        <div class="affected-summary">
          {dryRunResult.totalCount - 1} related {dryRunResult.totalCount - 1 === 1 ? 'entity' : 'entities'} will also be affected
        </div>
      {/if}

      {#if dryRunResult.affectedEntities.length > 0}
        <div class="affected-list">
          <strong>Affected entities:</strong>
          <ul>
            {#each dryRunResult.affectedEntities as entity}
              <li>{entity.description || `Entity type ${entity.entityType}`}</li>
            {/each}
          </ul>
        </div>
      {/if}

      {#if dryRunResult.warnings.length > 0}
        <div class="warnings-box">
          <strong>Warnings:</strong>
          <ul>
            {#each dryRunResult.warnings as warning}
              <li>{warning}</li>
            {/each}
          </ul>
        </div>
      {/if}

      {#if requiresForce || requiresCascade}
        <div class="force-confirm">
          <label for="confirmDelete">Type <strong>DELETE</strong> to confirm:</label>
          <input id="confirmDelete" type="text" bind:value={confirmInput} placeholder="DELETE" />
        </div>
      {/if}

      {#if deleteError}
        <div class="modal-error">{deleteError}</div>
      {/if}

      <div class="modal-actions">
        <button class="btn-cancel" on:click={close}>Cancel</button>
        <form method="POST" action="?/confirmDelete" use:enhance={() => {
          deleteLoading = true;
          return async ({ result }) => {
            if (result.type === 'success' && result.data?.deleteResult?.success) {
              dispatch('deleted');
            } else {
              deleteError = result.data?.deleteResult?.error ?? 'Delete failed';
              deleteLoading = false;
            }
          };
        }}>
          <input type="hidden" name="uuidHex" value={uuidHex} />
          <input type="hidden" name="force" value={requiresForce ? 'true' : 'false'} />
          <input type="hidden" name="cascade" value={requiresCascade ? 'true' : 'false'} />
          <button
            type="submit"
            class="btn-delete"
            disabled={deleteLoading || ((requiresForce || requiresCascade) && confirmInput !== 'DELETE')}
          >
            {deleteLoading ? 'Deleting...' : 'Delete'}
          </button>
        </form>
      </div>
    </div>
  </div>
{/if}

<style lang="scss">
  @import "../../styles/variables";

  .modal-overlay {
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
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

  .modal-title { font-size: 1.25rem; font-weight: 700; margin-bottom: 12px; }
  .modal-question { font-size: 0.9rem; margin-bottom: 16px; strong { color: $success; } }

  .affected-summary {
    background-color: #1b4d63;
    border-radius: 4px;
    padding: 8px 12px;
    font-size: 0.85rem;
    margin-bottom: 12px;
    color: #fbbf24;
  }

  .affected-list, .warnings-box {
    margin-bottom: 12px;
    font-size: 0.8rem;
    strong { display: block; margin-bottom: 4px; }
    ul { margin: 0; padding-left: 1.2em; list-style: disc; li { margin-bottom: 2px; } }
  }

  .warnings-box {
    background-color: #7f1d1d33;
    border: 1px solid $error;
    border-radius: 4px;
    padding: 8px 12px;
    color: #fecaca;
  }

  .force-confirm {
    margin-bottom: 12px;
    label { display: block; font-size: 0.8rem; margin-bottom: 6px; strong { color: $error; } }
    input {
      width: 100%; padding: 6px 10px;
      border: 1px solid $error; border-radius: 4px;
      font-size: 0.85rem; background-color: white; color: #05192a;
      box-sizing: border-box;
    }
  }

  .modal-error {
    background-color: #7f1d1d; color: #fecaca;
    border-radius: 4px; padding: 8px 12px; font-size: 0.8rem; margin-bottom: 12px;
  }

  .modal-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 16px; }

  .btn-cancel {
    padding: 8px 20px; border: 1px solid #ddd; border-radius: 4px;
    background: transparent; color: $white; font-size: 0.85rem; cursor: pointer;
    &:hover { background-color: rgba(255, 255, 255, 0.1); }
  }

  .btn-delete {
    padding: 8px 20px; border: none; border-radius: 4px;
    background-color: $error; color: white; font-size: 0.85rem; font-weight: 600; cursor: pointer;
    &:hover:not(:disabled) { background-color: #a33049; }
    &:disabled { opacity: 0.5; cursor: not-allowed; }
  }
</style>
