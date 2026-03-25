<script lang="ts">
	import type { TransactionData } from '$lib/transactions';
	import { formatAmount } from '$lib/formatUtils';

	export let transactions: TransactionData[] = [];
	export let portfolioId: string | null = null;
</script>

<div class="txn-container mx-auto shadow px-10 py-7 my-4">
	<h2 class="text-3xl font-extrabold my-3">Transaction History</h2>

	{#if !portfolioId}
		<p class="empty-state">Select a portfolio to view its transaction history.</p>
	{:else if transactions.length === 0}
		<p class="empty-state">No transactions found for this portfolio.</p>
	{:else}
		<div class="table-wrapper">
			<table class="text-left">
				<thead class="border-b border-slate-400">
					<tr>
						<th class="text-semibold text-lg px-4 py-2">Date</th>
						<th class="text-semibold text-lg px-4 py-2">Security</th>
						<th class="text-semibold text-lg px-4 py-2">Quantity</th>
						<th class="text-semibold text-lg px-4 py-2">Price</th>
						<th class="text-semibold text-lg px-4 py-2">Type</th>
					</tr>
				</thead>
				<tbody>
					{#each transactions as txn}
						<tr class="table-row border-b border-slate-400">
							<td class="table-cell px-4 py-2">{txn.transactionTradeDate || '—'}</td>
							<td class="table-cell px-4 py-2">{txn.transactionId || '—'}</td>
							<td class="table-cell px-4 py-2">{txn.transactionQuantity ? formatAmount(txn.transactionQuantity) : '—'}</td>
							<td class="table-cell px-4 py-2">{txn.transactionPrice ? Number(txn.transactionPrice).toFixed(4) : '—'}</td>
							<td class="table-cell px-4 py-2">{txn.transactionSide || '—'}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
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

	.empty-state {
		color: rgba(255, 255, 255, 0.6);
		font-style: italic;
		padding: 1rem 0;
	}

	.table-row {
		transition: background-color 0.2s;
		&:hover { background-color: rgba(0, 0, 0, 0.05); }
	}
</style>
