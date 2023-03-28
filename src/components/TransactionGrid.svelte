<script lang="ts">
	import {
		DataTable,
		Toolbar,
		ToolbarContent,
		ToolbarSearch,
		ToolbarMenu,
		ToolbarMenuItem,
		Button,
		Pagination
	} from 'carbon-components-svelte';

	export let rows: Array<{
		id: string;
		portfolio: string;
		security: string;
		transactionType: string;
		quantity: number;
		price: number;
		tradeDate: string;
		settlementDate: string;
	}>;

	let pageSize = 5;
	let page = 1;
</script>

<div class="container mx-auto my-6 shadow px-10 py-7">
	<h2 class="text-3xl font-extrabold text-slate-700 my-3">Transactions</h2>
	<table class="min-w-full text-left">
		<thead class="border-b border-slate-400">
			<tr>
				<th class="text-semibold text-lg"> Portfolio </th>
				<th class="text-semibold text-lg">Security</th>
				<th class="text-semibold text-lg">Transaction Type</th>
				<th class="text-semibold text-lg">Quantity</th>
				<th class="text-semibold text-lg">Price</th>
				<th class="text-semibold text-lg">Trade Date</th>
				<th class="text-semibold text-lg">Settlement Date</th>
			</tr>
		</thead>
		<tbody>
			{#each rows as row}
				<tr class="table-row border-b border-slate-400">
					<td class="table-cell">{row.portfolio}</td>
					<td class="table-cell">{row.security}</td>
					<td class="table-cell">{row.transactionType}</td>
					<td class="table-cell">{row.quantity}</td>
					<td class="table-cell">{row.price}</td>
					<td class="table-cell">{row.tradeDate}</td>
					<td class="table-cell">{row.settlementDate}</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
