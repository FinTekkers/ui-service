<script lang="ts">
  import DashboardSideBar from "../../../../components/DashboardSideBar.svelte";
  import Portfolio from "../../../../components/widgets/PortfolioGrid.svelte";
  import DeleteConfirmModal from "../../../../components/widgets/DeleteConfirmModal.svelte";
  import TransactionHistoryGrid from "../../../../components/widgets/TransactionHistoryGrid.svelte";
  import { enhance } from '$app/forms';
  export let data: import("./$types").PageData;
  export let form: import("./$types").ActionData;

  let deleteTarget: { name: string; uuidHex: string } | null = null;
  let showModal = false;
  let deleteLoading = false;
  let deleteError = '';
  let deleteSuccess = '';
  let dryRunSubmitBtn: HTMLButtonElement;

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

  function handleRequestDelete(e: CustomEvent<{ name: string; uuidHex: string }>) {
    deleteTarget = e.detail;
    deleteError = '';
    deleteSuccess = '';
  }

  function handleClose() {
    showModal = false;
    deleteTarget = null;
  }

  function handleDeleted() {
    showModal = false;
    deleteSuccess = `Portfolio "${deleteTarget?.name}" deleted successfully.`;
    deleteTarget = null;
    setTimeout(() => { window.location.reload(); }, 1500);
  }
</script>

<div class="w-screen h-full flex">
  <DashboardSideBar {data} />

  <div class="h-full w-full dashboard-container">
    {#if deleteSuccess}
      <div class="success-banner">{deleteSuccess}</div>
    {/if}
    {#if deleteError && !showModal}
      <div class="error-banner">{deleteError}</div>
    {/if}

    <Portfolio
      rows={Array.isArray(data.portfolioData) ? data.portfolioData : [data.portfolioData]}
      on:requestDelete={handleRequestDelete}
    />

    <TransactionHistoryGrid
      transactions={data.transactions ?? []}
      portfolioId={data.selectedPortfolioId ?? null}
    />

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

<DeleteConfirmModal
  show={showModal}
  entityName={deleteTarget?.name ?? ''}
  uuidHex={deleteTarget?.uuidHex ?? ''}
  {dryRunResult}
  {deleteLoading}
  {deleteError}
  on:close={handleClose}
  on:deleted={handleDeleted}
/>

<style lang="scss">
  @import "../../../../style";
  .dashboard-container { background-color: $primary-color; overflow: auto; }
  .hidden-submit { display: none; }
  .success-banner { background-color: #065f46; color: #d1fae5; padding: 10px 40px; font-size: 0.85rem; font-weight: 600; }
  .error-banner { background-color: #7f1d1d; color: #fecaca; padding: 10px 40px; font-size: 0.85rem; font-weight: 600; }
</style>
