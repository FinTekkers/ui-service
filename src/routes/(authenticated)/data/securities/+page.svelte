<script lang="ts">
  import DashboardSideBar from "../../../../components/DashboardSideBar.svelte";
  import Security from "../../../../components/widgets/SecurityGrid.svelte";
  import SecurityDetail from "../../../../components/widgets/SecurityDetail.svelte";
  import SecuritySelect from "../../../../components/widgets/SecuritySelect.svelte";
  import { enhance } from '$app/forms';

  export let data: import("./$types").PageData;
  export let form: import("./$types").ActionData;

  // Delete modal state
  let showModal = false;
  let deleteTarget: { cusip: string; uuidHex: string; issuerName: string } | null = null;
  let confirmInput = '';
  let deleteLoading = false;
  let deleteError = '';
  let deleteSuccess = '';
  let dryRunSubmitBtn: HTMLButtonElement;

  // Dry-run result from form action
  $: dryRunResult = form?.deleteResult;
  $: dryRunUuid = form?.uuidHex;

  // Show modal when dry-run result comes back
  $: if (dryRunResult && !dryRunResult.error && dryRunUuid) {
    showModal = true;
    deleteLoading = false;
  }
  $: if (dryRunResult?.error) {
    deleteError = dryRunResult.error;
    deleteLoading = false;
  }

  // Check if warnings mention cross-portfolio impact (requires typing DELETE)
  $: requiresForce = (dryRunResult?.warnings ?? []).some(
    (w: string) => w.toLowerCase().includes('portfolio') || w.toLowerCase().includes('referenced')
  );

  // Auto-submit dry-run when deleteTarget is set
  $: if (deleteTarget && !showModal && dryRunSubmitBtn) {
    setTimeout(() => dryRunSubmitBtn?.click(), 0);
  }

  function handleRequestDelete(e: CustomEvent<{ cusip: string; uuidHex: string; issuerName: string }>) {
    deleteTarget = e.detail;
    deleteError = '';
    deleteSuccess = '';
    confirmInput = '';
  }

  function closeModal() {
    showModal = false;
    deleteTarget = null;
    confirmInput = '';
    deleteError = '';
  }

  function handleDeleteSuccess() {
    showModal = false;
    deleteSuccess = `Security ${deleteTarget?.cusip} deleted successfully.`;
    deleteTarget = null;
    // Refresh page to reload securities list
    setTimeout(() => { window.location.reload(); }, 1500);
  }
</script>

<div class="w-screen h-full flex">
  <DashboardSideBar {data} />

  <div class="h-full w-full dashboard-container">
    <SecuritySelect />

    {#if deleteSuccess}
      <div class="success-banner">{deleteSuccess}</div>
    {/if}
    {#if deleteError && !showModal}
      <div class="error-banner">{deleteError}</div>
    {/if}

    {#if Array.isArray(data.security) && data.security.length === 1}
      <SecurityDetail
        security={data.security[0]}
        on:requestDelete={handleRequestDelete}
      />
    {:else}
      <Security
        rows={Array.isArray(data.security) ? data.security : [data.security]}
        on:requestDelete={handleRequestDelete}
      />
    {/if}

    <!-- Dry-run form (hidden, auto-submitted when delete button clicked) -->
    {#if deleteTarget && !showModal}
      <form method="POST" action="?/dryRun" use:enhance={() => {
        deleteLoading = true;
        return async ({ update }) => { await update(); };
      }}>
        <input type="hidden" name="uuidHex" value={deleteTarget.uuidHex} />
        <button type="submit" class="hidden-submit" bind:this={dryRunSubmitBtn}></button>
      </form>
    {/if}
  </div>
</div>

<!-- Confirmation Modal -->
{#if showModal && dryRunResult && deleteTarget}
  <div class="modal-overlay" on:click={closeModal} on:keydown={(e) => e.key === 'Escape' && closeModal()}>
    <div class="modal-content" on:click|stopPropagation role="dialog" aria-modal="true">
      <h3 class="modal-title">Delete Security</h3>
      <p class="modal-question">Are you sure you want to delete <strong>{deleteTarget.cusip}</strong> ({deleteTarget.issuerName})?</p>

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

      {#if requiresForce}
        <div class="force-confirm">
          <label for="confirmDelete">Type <strong>DELETE</strong> to confirm (this security is referenced by other entities):</label>
          <input id="confirmDelete" type="text" bind:value={confirmInput} placeholder="DELETE" />
        </div>
      {/if}

      {#if deleteError}
        <div class="modal-error">{deleteError}</div>
      {/if}

      <div class="modal-actions">
        <button class="btn-cancel" on:click={closeModal}>Cancel</button>
        <form method="POST" action="?/confirmDelete" use:enhance={() => {
          deleteLoading = true;
          return async ({ result, update }) => {
            if (result.type === 'success' && result.data?.deleteResult?.success) {
              handleDeleteSuccess();
            } else {
              deleteError = result.data?.deleteResult?.error ?? 'Delete failed';
              deleteLoading = false;
            }
          };
        }}>
          <input type="hidden" name="uuidHex" value={deleteTarget.uuidHex} />
          <input type="hidden" name="force" value={requiresForce ? 'true' : 'false'} />
          <button
            type="submit"
            class="btn-delete"
            disabled={deleteLoading || (requiresForce && confirmInput !== 'DELETE')}
          >
            {deleteLoading ? 'Deleting...' : 'Delete'}
          </button>
        </form>
      </div>
    </div>
  </div>
{/if}

<style lang="scss">
  @import "../../../../style";

  .dashboard-container {
    background-color: $primary-color;
    overflow: auto;
  }

  .hidden-submit {
    display: none;
  }

  .success-banner {
    background-color: #065f46;
    color: #d1fae5;
    padding: 10px 40px;
    font-size: 0.85rem;
    font-weight: 600;
  }

  .error-banner {
    background-color: #7f1d1d;
    color: #fecaca;
    padding: 10px 40px;
    font-size: 0.85rem;
    font-weight: 600;
  }

  /* Modal overlay */
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .modal-content {
    background-color: #0c3a46;
    border-radius: 8px;
    padding: 24px;
    max-width: 520px;
    width: 90%;
    color: whitesmoke;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  }

  .modal-title {
    font-size: 1.25rem;
    font-weight: 700;
    margin-bottom: 12px;
  }

  .modal-question {
    font-size: 0.9rem;
    margin-bottom: 16px;

    strong { color: #7cd2ba; }
  }

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

    ul {
      margin: 0;
      padding-left: 1.2em;
      list-style: disc;

      li { margin-bottom: 2px; }
    }
  }

  .warnings-box {
    background-color: #7f1d1d33;
    border: 1px solid #c43d5a;
    border-radius: 4px;
    padding: 8px 12px;
    color: #fecaca;
  }

  .force-confirm {
    margin-bottom: 12px;

    label {
      display: block;
      font-size: 0.8rem;
      margin-bottom: 6px;
      strong { color: #c43d5a; }
    }

    input {
      width: 100%;
      padding: 6px 10px;
      border: 1px solid #c43d5a;
      border-radius: 4px;
      font-size: 0.85rem;
      background-color: white;
      color: #05192a;
      box-sizing: border-box;
    }
  }

  .modal-error {
    background-color: #7f1d1d;
    color: #fecaca;
    border-radius: 4px;
    padding: 8px 12px;
    font-size: 0.8rem;
    margin-bottom: 12px;
  }

  .modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 16px;
  }

  .btn-cancel {
    padding: 8px 20px;
    border: 1px solid #ddd;
    border-radius: 4px;
    background: transparent;
    color: whitesmoke;
    font-size: 0.85rem;
    cursor: pointer;

    &:hover { background-color: rgba(255, 255, 255, 0.1); }
  }

  .btn-delete {
    padding: 8px 20px;
    border: none;
    border-radius: 4px;
    background-color: #c43d5a;
    color: white;
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;

    &:hover:not(:disabled) { background-color: #a33049; }
    &:disabled { opacity: 0.5; cursor: not-allowed; }
  }
</style>
