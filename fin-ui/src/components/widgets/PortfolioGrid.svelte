<script lang="ts">
	import {
		DataTable,
		Toolbar,
		ToolbarContent,
		ToolbarSearch,
		Button,
		Pagination,
	} from "carbon-components-svelte";

	export let rows: Array<{
		portfolioName: string;
		portfolioId: string;
		portfolioAsOf: string;
	}>; //: string; portfolioId: string | undefined; id: string }>;
</script>

<div class="portfolio_container container mx-auto my-6 shadow px-10 py-7">
	<h2 class="text-3xl font-extrabold my-3">Portfolios</h2>
	<table class="min-w-full text-left">
		<thead class="border-b border-slate-400">
			<tr>
				<th class="text-semibold text-lg"> Portfolio </th>
				<th class="text-semibold text-lg">ID</th>
				<th class="text-semibold text-lg">Created (AsOf)</th>
			</tr>
		</thead>
		<tbody>
			{#each rows as row}
				<tr class="table-row border-b border-slate-400">
					<td class="table-cell">{row.portfolioName}</td>
					<td class="table-cell">{row.portfolioId}</td>
					<td class="table-cell">{row.portfolioAsOf}</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>

<style lang="scss">
	@import "../../style.scss";
.portfolio_container{
	height: 100%;
	width: 82vw;
	background-color: $primary-color;
	padding: 1em;
}

</style>
