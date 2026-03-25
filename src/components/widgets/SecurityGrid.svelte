<script lang="ts">
  import { formatAmount } from "$lib/formatUtils";
  import {
    sortData,
    getSortIndicator,
    handleSortClick,
    type SortDirection,
  } from "$lib/sortUtils";
  import { createEventDispatcher } from 'svelte';

  type SecurityData = {
    identifier: string;
    identifierType: string;
    settlementCurrency: string;
    cusip: string;               // deprecated alias kept for compatibility
    uuidHex?: string;
    issueDate: string;
    maturityDate: string;
    outstandingAmount: string;
    issuerName: string;
    assetClass: string;
    securityType?: number;
    productType: string;
    productClass?: string;
    tenor?: string;
    couponRate?: string;
    couponType?: string;
    couponFrequency?: string;
    faceValue?: string;
    datedDate?: string;
    asOf: string;
  };

  const SECURITY_TYPE_LABELS: Record<number, string> = {
    1: 'Cash',
    2: 'Equity',
    3: 'Bond',
    4: 'TIPS',
    5: 'FRN',
    6: 'Index',
    8: 'Equity Index',
  };

  export let rows: Array<SecurityData>;

  const dispatch = createEventDispatcher();

  // Sort state
  let sortField: keyof SecurityData | null = null;
  let sortDirection: SortDirection = "asc";

  const columns: Array<{ label: string; key: keyof SecurityData }> = [
    { label: "Identifier", key: "identifier" },
    { label: "ID Type", key: "identifierType" },
    { label: "Issuer Name", key: "issuerName" },
    { label: "Asset Class", key: "assetClass" },
    { label: "Security Type", key: "securityType" },
    { label: "Product Type", key: "productType" },
    { label: "Product Class", key: "productClass" },
    { label: "Issue Date", key: "issueDate" },
    { label: "Maturity Date", key: "maturityDate" },
    { label: "Dated Date", key: "datedDate" },
    { label: "Tenor", key: "tenor" },
    { label: "Coupon Rate", key: "couponRate" },
    { label: "Coupon Type", key: "couponType" },
    { label: "Coupon Frequency", key: "couponFrequency" },
    { label: "Face Value", key: "faceValue" },
    { label: "Outstanding Amount", key: "outstandingAmount" },
    { label: "As Of", key: "asOf" },
  ];

  $: sortedRows = sortData(rows, sortField, sortDirection);

  function handleHeaderClick(fieldKey: keyof SecurityData) {
    const newSort = handleSortClick(sortField, fieldKey, sortDirection);
    sortField = newSort.sortField;
    sortDirection = newSort.sortDirection;
  }

  function getSortIndicatorForColumn(fieldKey: keyof SecurityData): string {
    return getSortIndicator(sortField, fieldKey, sortDirection);
  }

  function formatCellValue(row: SecurityData, key: keyof SecurityData): string {
    const value = row[key];
    if (key === "securityType") {
      return value != null ? (SECURITY_TYPE_LABELS[value as number] ?? String(value)) : '-';
    }
    if (key === "faceValue" || key === "outstandingAmount") {
      return value ? formatAmount(String(value)) : '-';
    }
    return value != null ? String(value) : '-';
  }

  function handleDeleteClick(row: SecurityData) {
    dispatch('requestDelete', { identifier: row.identifier || row.cusip, cusip: row.identifier || row.cusip, uuidHex: row.uuidHex, issuerName: row.issuerName });
  }
</script>

<div class="portfolio_container mx-auto shadow px-10 py-7">
  <h2 class="text-3xl font-extrabold my-3">Security</h2>
  <div class="table-wrapper">
    <table class="text-left">
      <thead class="border-b border-slate-400">
        <tr>
          <th class="text-semibold text-lg px-4 py-2 action-col">Actions</th>
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
            <td class="table-cell px-4 py-2 action-col">
              <button
                class="delete-btn"
                title="Delete {row.identifier || row.cusip}"
                on:click|stopPropagation={() => handleDeleteClick(row)}
              >
                Delete
              </button>
            </td>
            {#each columns as column}
              <td class="table-cell px-4 py-2">
                {formatCellValue(row, column.key)}
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

  .action-col {
    min-width: 70px !important;
    width: 70px;
  }

  thead .action-col {
    background-color: #0c3a46;
  }

  .delete-btn {
    background-color: #c43d5a;
    border: none;
    color: white;
    font-size: 0.8rem;
    font-weight: 700;
    padding: 4px 8px;
    border-radius: 4px;
    cursor: pointer;
    white-space: nowrap;
    transition: all 0.15s;

    &:hover {
      background-color: #a33049;
    }
  }
</style>
