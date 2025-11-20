<script lang="ts">
  import type { TransactionData } from "$lib/transactions";
  import { formatAmount } from "$lib/formatUtils";

  export let rows: TransactionData[];
  export let titleOverride: string | undefined = undefined;

  // Sort state
  let sortField: keyof TransactionData | null = null;
  let sortDirection: "asc" | "desc" = "asc";

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

  // Sorted rows (reactive)
  $: sortedRows = sortTransactions(rows, sortField, sortDirection);

  function handleHeaderClick(fieldKey: keyof TransactionData) {
    if (sortField === fieldKey) {
      // Toggle direction if clicking the same column
      sortDirection = sortDirection === "asc" ? "desc" : "asc";
    } else {
      // New column, start with ascending
      sortField = fieldKey;
      sortDirection = "asc";
    }
  }

  function sortTransactions(
    transactions: TransactionData[],
    sortField: keyof TransactionData | null,
    sortDirection: "asc" | "desc"
  ): TransactionData[] {
    if (sortField === null) {
      return transactions;
    }

    const sorted = [...transactions].sort((a, b) => {
      const valueA = a[sortField];
      const valueB = b[sortField];

      // Handle null/undefined values
      if (valueA == null && valueB == null) return 0;
      if (valueA == null) return 1;
      if (valueB == null) return -1;

      let comparison = 0;

      // Try numeric comparison first (for quantity and coupon rate)
      const numA = Number(valueA);
      const numB = Number(valueB);
      if (!isNaN(numA) && !isNaN(numB)) {
        comparison = numA - numB;
      } else {
        // Fall back to string comparison
        comparison = String(valueA).localeCompare(String(valueB));
      }

      return sortDirection === "desc" ? -comparison : comparison;
    });

    return sorted;
  }

  function getSortIndicator(fieldKey: keyof TransactionData): string {
    if (sortField === fieldKey) {
      return sortDirection === "asc" ? "↑" : "↓";
    }
    return "";
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
              {getSortIndicator(column.key)}
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
