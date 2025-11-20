<script lang="ts">
  import type { TransactionData } from "$lib/transactions";
  import { formatAmount } from "$lib/formatUtils";
  import {
    sortData,
    getSortIndicator,
    handleSortClick,
    type SortDirection,
  } from "$lib/sortUtils";

  export let rows: TransactionData[];
  export let titleOverride: string | undefined = undefined;

  // Sort state - using universal sort utilities
  let sortField: keyof TransactionData | null = null;
  let sortDirection: SortDirection = "asc";

  // Column definitions with their corresponding TransactionData keys
  const columns: Array<{ label: string; key: keyof TransactionData }> = [
    { label: "ID", key: "transactionId" },
    { label: "Issuer Name", key: "transactionIssuerName" },
    { label: "Issue Date", key: "transactionIssueDate" },
    { label: "Maturity Date", key: "transactionMaturityDate" },
    { label: "Tenor", key: "transactionTenor" },
    { label: "Coupon Frequency", key: "transactionCouponFrequency" },
    { label: "Coupon Type", key: "transactionCouponType" },
    { label: "Coupon Rate", key: "transactionCouponRate" },
    { label: "Product Type", key: "transactionProductType" },
    { label: "Side", key: "transactionSide" },
    { label: "Quantity", key: "transactionQuantity" },
    { label: "Trade Date", key: "transactionTradeDate" },
    { label: "Settlement Date", key: "transactionSettlementDate" },
  ];

  // Sorted rows (reactive) - using universal sort utility
  $: sortedRows = sortData(rows, sortField, sortDirection);

  function handleHeaderClick(fieldKey: keyof TransactionData) {
    const newSort = handleSortClick(sortField, fieldKey, sortDirection);
    sortField = newSort.sortField;
    sortDirection = newSort.sortDirection;
  }

  function getSortIndicatorForColumn(fieldKey: keyof TransactionData): string {
    return getSortIndicator(sortField, fieldKey, sortDirection);
  }
</script>

<div class="portfolio_container mx-auto shadow px-10 py-7">
  <h2 class="text-3xl font-extrabold my-3">
    {titleOverride ?? "Transactions"}
  </h2>
  <div class="table-wrapper">
    <table class="text-left">
      <thead class="border-b border-slate-400">
        <tr>
          {#each columns as column}
            <th
              class="text-semibold text-lg px-4 py-2 sortable-header"
              role="button"
              tabindex="0"
              on:click={() => handleHeaderClick(column.key)}
              on:keydown={(e) =>
                e.key === "Enter" && handleHeaderClick(column.key)}
            >
              {column.label}
              {getSortIndicatorForColumn(column.key)}
            </th>
          {/each}
        </tr>
      </thead>
      <tbody>
        {#each sortedRows as row}
          <tr class="table-row border-b border-slate-400">
            {#each columns as column}
              <td class="table-cell px-4 py-2">
                {#if column.key === "transactionQuantity"}
                  {formatAmount(row[column.key])}
                {:else}
                  {row[column.key]}
                {/if}
              </td>
            {/each}
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>

<style lang="scss">
  @import "../../styles/grid-table";

  .table-wrapper {
    overflow-x: auto;
    width: 100%;
  }

  table {
    width: max-content;
    min-width: 100%;
  }

  th,
  td {
    white-space: nowrap;
    min-width: 120px;
  }

  .sortable-header {
    cursor: pointer;
    user-select: none;
    transition: background-color 0.2s;

    &:hover {
      background-color: rgba(0, 0, 0, 0.05);
    }

    &:focus {
      outline: 2px solid #3b82f6;
      outline-offset: -2px;
    }
  }
</style>
