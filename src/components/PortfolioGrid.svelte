<script lang="ts">
	import {
		DataTable,
		Toolbar,
		ToolbarContent,
		ToolbarSearch,
		Button,
		Pagination
	} from 'carbon-components-svelte';

	export let rows: Array<{ portfolio: string; portfolioId: string | undefined; id: string }>;
</script>

<div class="container mx-auto my-6 shadow px-10 py-7">
	<h2 class="text-3xl font-extrabold text-slate-700 my-3">Portfolios</h2>
	<table class="min-w-full text-left">
		<thead class="border-b border-slate-400">
			<tr>
				<th class="text-semibold text-lg"> Portfolio </th>
				<th class="text-semibold text-lg">ID</th>
			</tr>
		</thead>
		<tbody>
			{#each rows as row}
				<tr class="table-row border-b border-slate-400">
					<td class="table-cell">{row.portfolio}</td>
					<td class="table-cell">{row.portfolioId}</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
