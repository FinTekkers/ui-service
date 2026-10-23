<script lang="ts">
  import Portfolio from "../../../../components/widgets/PortfolioGrid.svelte";
  import DeleteConfirmModal from "../../../../components/widgets/DeleteConfirmModal.svelte";
  import TransactionHistoryGrid from "../../../../components/widgets/TransactionHistoryGrid.svelte";
  import ElectionsPanel from "../../../../components/widgets/ElectionsPanel.svelte";
  import { enhance } from "$app/forms";
  export let data: import("./$types").PageData;
  export let form: import("./$types").ActionData;

  let deleteTarget: { name: string; uuidHex: string } | null = null;
  let showModal = false;
  let deleteLoading = false;
  let deleteError = "";
  let deleteSuccess = "";
  let dryRunSubmitBtn: HTMLButtonElement;

  $: rows = Array.isArray(data.portfolioData)
    ? data.portfolioData
    : [data.portfolioData];
  $: selectedName =
    rows.find((r) => r.portfolioId === data.selectedPortfolioId)
      ?.portfolioName ?? "";

  $: dryRunResult = form?.deleteResult;
  $: dryRunUuid = form?.uuidHex;

  $: if (dryRunResult && !dryRunResult.error && dryRunUuid) {
    showModal = true;
    deleteLoading = false;
  }
  $: if (dryRunResult?.error && !showModal) {
    deleteError = dryRunResult.error;
    deleteLoading = false;
  }

  $: if (deleteTarget && !showModal && dryRunSubmitBtn) {
    setTimeout(() => dryRunSubmitBtn?.click(), 0);
  }

  function handleRequestDelete(
    e: CustomEvent<{ name: string; uuidHex: string }>
  ) {
    deleteTarget = e.detail;
    deleteError = "";
    deleteSuccess = "";
  }

  function handleClose() {
    showModal = false;
    deleteTarget = null;
  }

  function handleDeleted() {
    showModal = false;
    deleteSuccess = `Portfolio "${deleteTarget?.name}" deleted successfully.`;
    deleteTarget = null;
    setTimeout(() => {
      window.location.reload();
    }, 1500);
  }
</script>

{#if deleteSuccess}
  <div class="success-banner">{deleteSuccess}</div>
{/if}
{#if deleteError && !showModal}
  <div class="error-banner">{deleteError}</div>
{/if}

<div class="portfolios-layout" class:with-panel={!!data.selectedPortfolioId}>
  <Portfolio {rows} on:requestDelete={handleRequestDelete} />

  {#if data.selectedPortfolioId}
    <ElectionsPanel
      portfolioId={data.selectedPortfolioId}
      portfolioName={selectedName}
      elections={data.elections}
      error={data.electionsError}
      result={form && "elections" in form ? form.elections : null}
    />
  {/if}
</div>

<TransactionHistoryGrid
  transactions={data.transactions ?? []}
  portfolioId={data.selectedPortfolioId ?? null}
/>

{#if deleteTarget && !showModal}
  <form
    method="POST"
    action="?/dryRun"
    use:enhance={() => {
      deleteLoading = true;
      return async ({ update }) => {
        await update();
      };
    }}
  >
    <input type="hidden" name="uuidHex" value={deleteTarget.uuidHex} />
    <button type="submit" class="hidden-submit" bind:this={dryRunSubmitBtn} />
  </form>
{/if}

<DeleteConfirmModal
  show={showModal}
  entityName={deleteTarget?.name ?? ""}
  uuidHex={deleteTarget?.uuidHex ?? ""}
  {dryRunResult}
  {deleteLoading}
  {deleteError}
  on:close={handleClose}
  on:deleted={handleDeleted}
/>

<style lang="scss">
  @import "../../../../style";
  // US-242: the elections panel sits beside the list, and wraps below it
  // on narrow screens. Without a selection the list keeps its old layout.
  .portfolios-layout.with-panel {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    gap: 1rem;
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
</style>
