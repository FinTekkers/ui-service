<script lang="ts">
  import type { TreasuryTransaction } from "$lib/treasury_positions";

  export let data: import("./$types").PageData;

  const transactions = data.transactions as TreasuryTransaction[] || [];

  // Sorting state
  let sortColumn: string | null = null;
  let sortDirection: 'asc' | 'desc' = 'asc';

  // Format date for display
  function formatDate(dateStr: string | undefined): string {
    if (!dateStr) return 'N/A';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch {
      return dateStr;
    }
  }

  // Format number with commas
  function formatNumber(num: number): string {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num);
  }

  // Parse date for sorting
  function parseDate(dateStr: string | undefined): Date {
    if (!dateStr) return new Date(0);
    try {
      return new Date(dateStr);
    } catch {
      return new Date(0);
    }
  }

  // Get sortable value for a transaction
  function getSortValue(txn: TreasuryTransaction, column: string): any {
    switch (column) {
      case 'IDENTIFIER':
        return txn.IDENTIFIER || '';
      case 'TRADE_DATE':
        return parseDate(txn.TRADE_DATE).getTime();
      case 'TRANSACTION_TYPE':
        return txn.TRANSACTION_TYPE || '';
      case 'PRODUCT_TYPE':
        return txn.PRODUCT_TYPE || '';
      case 'ISSUE_DATE':
        return parseDate(txn.ISSUE_DATE).getTime();
      case 'MATURITY_DATE':
        return parseDate(txn.MATURITY_DATE).getTime();
      case 'TENOR':
        if (txn.TENOR) {
          return (txn.TENOR.years || 0) * 12 + (txn.TENOR.months || 0);
        }
        return txn.ADJUSTED_TENOR || '';
      case 'DIRECTED_QUANTITY':
        return txn.DIRECTED_QUANTITY || 0;
      default:
        return '';
    }
  }

  // Sort transactions
  function sortTransactions(txns: TreasuryTransaction[], column: string, direction: 'asc' | 'desc'): TreasuryTransaction[] {
    return [...txns].sort((a, b) => {
      const aVal = getSortValue(a, column);
      const bVal = getSortValue(b, column);
      
      let comparison = 0;
      if (aVal < bVal) comparison = -1;
      else if (aVal > bVal) comparison = 1;
      
      return direction === 'asc' ? comparison : -comparison;
    });
  }

  // Handle column header click
  function handleSort(column: string) {
    if (sortColumn === column) {
      // Toggle direction if same column
      sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      // New column, default to ascending
      sortColumn = column;
      sortDirection = 'asc';
    }
  }

  // Get sorted transactions
  $: sortedTransactions = sortColumn 
    ? sortTransactions(transactions, sortColumn, sortDirection)
    : transactions;

  // Calculate grand totals
  $: grandTotalQuantity = transactions.reduce((sum, txn) => sum + (txn.DIRECTED_QUANTITY || 0), 0);
  $: grandTotalPositive = transactions
    .filter(txn => (txn.DIRECTED_QUANTITY || 0) > 0)
    .reduce((sum, txn) => sum + (txn.DIRECTED_QUANTITY || 0), 0);
  $: grandTotalNegative = transactions
    .filter(txn => (txn.DIRECTED_QUANTITY || 0) < 0)
    .reduce((sum, txn) => sum + (txn.DIRECTED_QUANTITY || 0), 0);
</script>

<div class="treasuries-container">
  <h1 class="page-title">Bond Activity (Excluding Bills) - December 2025</h1>

  {#if !transactions || transactions.length === 0}
    <div class="no-data">
      <p>No bond activity (excluding bills) found for December 2025.</p>
    </div>
  {:else}
    <div class="stats-bar">
      <div class="stat-item">
        <span class="stat-label">Total Transactions:</span>
        <span class="stat-value">{transactions.length}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Total Quantity:</span>
        <span class="stat-value">
          {formatNumber(transactions.reduce((sum, txn) => sum + (txn.DIRECTED_QUANTITY || 0), 0))}
        </span>
      </div>
    </div>

    <div class="table-container">
      <table class="bond-activity-table">
        <thead>
          <tr>
            <th class="sortable" on:click={() => handleSort('IDENTIFIER')}>
              Identifier
              {#if sortColumn === 'IDENTIFIER'}
                <span class="sort-indicator">{sortDirection === 'asc' ? '↑' : '↓'}</span>
              {/if}
            </th>
            <th class="sortable" on:click={() => handleSort('TRADE_DATE')}>
              Trade Date
              {#if sortColumn === 'TRADE_DATE'}
                <span class="sort-indicator">{sortDirection === 'asc' ? '↑' : '↓'}</span>
              {/if}
            </th>
            <th class="sortable" on:click={() => handleSort('TRANSACTION_TYPE')}>
              Transaction Type
              {#if sortColumn === 'TRANSACTION_TYPE'}
                <span class="sort-indicator">{sortDirection === 'asc' ? '↑' : '↓'}</span>
              {/if}
            </th>
            <th class="sortable" on:click={() => handleSort('PRODUCT_TYPE')}>
              Product Type
              {#if sortColumn === 'PRODUCT_TYPE'}
                <span class="sort-indicator">{sortDirection === 'asc' ? '↑' : '↓'}</span>
              {/if}
            </th>
            <th class="sortable" on:click={() => handleSort('ISSUE_DATE')}>
              Issue Date
              {#if sortColumn === 'ISSUE_DATE'}
                <span class="sort-indicator">{sortDirection === 'asc' ? '↑' : '↓'}</span>
              {/if}
            </th>
            <th class="sortable" on:click={() => handleSort('MATURITY_DATE')}>
              Maturity Date
              {#if sortColumn === 'MATURITY_DATE'}
                <span class="sort-indicator">{sortDirection === 'asc' ? '↑' : '↓'}</span>
              {/if}
            </th>
            <th class="sortable" on:click={() => handleSort('TENOR')}>
              Tenor
              {#if sortColumn === 'TENOR'}
                <span class="sort-indicator">{sortDirection === 'asc' ? '↑' : '↓'}</span>
              {/if}
            </th>
            <th class="sortable text-right" on:click={() => handleSort('DIRECTED_QUANTITY')}>
              Quantity
              {#if sortColumn === 'DIRECTED_QUANTITY'}
                <span class="sort-indicator">{sortDirection === 'asc' ? '↑' : '↓'}</span>
              {/if}
            </th>
          </tr>
        </thead>
        <tbody>
          {#each sortedTransactions as txn}
            <tr>
              <td class="identifier">{txn.IDENTIFIER}</td>
              <td>{formatDate(txn.TRADE_DATE)}</td>
              <td>
                <span class="transaction-type transaction-type-{txn.TRANSACTION_TYPE?.toLowerCase()}">
                  {txn.TRANSACTION_TYPE || 'N/A'}
                </span>
              </td>
              <td>{txn.PRODUCT_TYPE || 'N/A'}</td>
              <td>{formatDate(txn.ISSUE_DATE)}</td>
              <td>{formatDate(txn.MATURITY_DATE)}</td>
              <td>
                {#if txn.TENOR}
                  {txn.TENOR.years > 0 ? `${txn.TENOR.years}Y ` : ''}
                  {txn.TENOR.months > 0 ? `${txn.TENOR.months}M` : ''}
                {:else}
                  {txn.ADJUSTED_TENOR || 'N/A'}
                {/if}
              </td>
              <td class="text-right quantity {txn.DIRECTED_QUANTITY >= 0 ? 'positive' : 'negative'}">
                {formatNumber(txn.DIRECTED_QUANTITY || 0)}
              </td>
            </tr>
          {/each}
          <!-- Grand Totals Row -->
          <tr class="totals-row">
            <td colspan="7" class="totals-label">Grand Totals</td>
            <td class="text-right quantity {grandTotalQuantity >= 0 ? 'positive' : 'negative'}">
              {formatNumber(grandTotalQuantity)}
            </td>
          </tr>
          <tr class="totals-breakdown">
            <td colspan="7" class="totals-label">Total Positive</td>
            <td class="text-right quantity positive">
              {formatNumber(grandTotalPositive)}
            </td>
          </tr>
          <tr class="totals-breakdown">
            <td colspan="7" class="totals-label">Total Negative</td>
            <td class="text-right quantity negative">
              {formatNumber(grandTotalNegative)}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  {/if}
</div>

<style>
  :global(.main_ui_menu) {
    overflow: auto !important;
    max-height: none !important;
    height: auto !important;
  }

  .treasuries-container {
    padding: 2rem;
    min-height: 100vh;
    background-color: #1a1a1a;
    color: #fff;
    overflow-x: auto;
    width: 100%;
    box-sizing: border-box;
  }

  .page-title {
    font-size: 2.5rem;
    margin-bottom: 2rem;
    text-align: center;
    color: #fff;
  }

  .no-data {
    text-align: center;
    padding: 4rem;
    font-size: 1.2rem;
    color: #888;
  }

  .stats-bar {
    display: flex;
    gap: 2rem;
    margin-bottom: 2rem;
    padding: 1.5rem;
    background-color: #2a2a2a;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
  }

  .stat-item {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .stat-label {
    font-size: 0.9rem;
    color: #aaa;
  }

  .stat-value {
    font-size: 1.5rem;
    font-weight: bold;
    color: #4a9eff;
  }

  .table-container {
    background-color: #2a2a2a;
    border-radius: 8px;
    padding: 1.5rem;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
    overflow-x: auto;
  }

  .bond-activity-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.95rem;
  }

  .bond-activity-table thead {
    background-color: #1a1a1a;
    position: sticky;
    top: 0;
  }

  .bond-activity-table th {
    padding: 1rem;
    text-align: left;
    font-weight: 600;
    color: #fff;
    border-bottom: 2px solid #4a9eff;
    white-space: nowrap;
    position: relative;
  }

  .bond-activity-table th.text-right {
    text-align: right;
  }

  .bond-activity-table th.sortable {
    cursor: pointer;
    user-select: none;
    transition: background-color 0.2s;
  }

  .bond-activity-table th.sortable:hover {
    background-color: #2a2a2a;
  }

  .sort-indicator {
    margin-left: 0.5rem;
    color: #4a9eff;
    font-weight: bold;
    font-size: 1.1em;
  }

  .bond-activity-table tbody tr {
    border-bottom: 1px solid #3a3a3a;
    transition: background-color 0.2s;
  }

  .bond-activity-table tbody tr:hover {
    background-color: #333;
  }

  .bond-activity-table td {
    padding: 0.75rem 1rem;
    color: #ddd;
  }

  .bond-activity-table td.text-right {
    text-align: right;
  }

  .identifier {
    font-family: 'Courier New', monospace;
    color: #4a9eff;
    font-weight: 500;
  }

  .transaction-type {
    display: inline-block;
    padding: 0.25rem 0.75rem;
    border-radius: 4px;
    font-size: 0.85rem;
    font-weight: 500;
  }

  .transaction-type-buy {
    background-color: #2d5a2d;
    color: #90ee90;
  }

  .transaction-type-maturation {
    background-color: #5a2d2d;
    color: #ee9090;
  }

  .transaction-type-maturation_offset {
    background-color: #2d5a2d;
    color: #90ee90;
  }

  .quantity {
    font-weight: 600;
    font-family: 'Courier New', monospace;
  }

  .quantity.positive {
    color: #90ee90;
  }

  .quantity.negative {
    color: #ee9090;
  }

  .totals-row {
    background-color: #1a1a1a;
    border-top: 3px solid #4a9eff;
    font-weight: bold;
  }

  .totals-breakdown {
    background-color: #1f1f1f;
    font-size: 0.9rem;
  }

  .totals-label {
    font-weight: 600;
    color: #fff;
    text-align: right !important;
    padding-right: 1rem;
  }

  /* Mobile screens */
  @media (max-width: 768px) {
    .treasuries-container {
      padding: 1rem;
    }

    .page-title {
      font-size: 2rem;
    }

    .stats-bar {
      flex-direction: column;
      gap: 1rem;
      padding: 1rem;
    }

    .table-container {
      padding: 1rem;
    }

    .bond-activity-table {
      font-size: 0.85rem;
    }

    .bond-activity-table th,
    .bond-activity-table td {
      padding: 0.5rem;
    }
  }

  /* Very small screens */
  @media (max-width: 480px) {
    .treasuries-container {
      padding: 0.5rem;
    }

    .page-title {
      font-size: 1.5rem;
      margin-bottom: 1rem;
    }

    .bond-activity-table {
      font-size: 0.75rem;
    }
  }
</style>

