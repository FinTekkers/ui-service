<script lang="ts">
	export let rows: Array<{
		portfolioName: string;
		portfolioId: string;
		portfolioAsOf: string;
	}>;
</script>

<div class="portfolio_container container mx-auto shadow px-10 py-7">
	<h2 class="text-3xl font-extrabold my-3">Portfolios</h2>
	<table class="min-w-full text-left table-fixed">
		<thead class="border-b border-slate-400">
			<tr>
				<th class="text-semibold text-lg px-4 py-2 w-1/4"> Portfolio </th>
				<th class="text-semibold text-lg px-4 py-2 w-1/4">ID</th>
				<th class="text-semibold text-lg px-4 py-2 w-1/4">Created (AsOf)</th>
			</tr>
		</thead>
		<tbody>
			{#each rows as row}
				<tr class="table-row border-b border-slate-400">
					<td class="table-cell px-4 py-2">{row.portfolioName}</td>
					<td class="table-cell px-4 py-2">{row.portfolioId}</td>
					<td class="table-cell px-4 py-2">{row.portfolioAsOf}</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>

<style lang="scss">
	@import "../../style.scss";
	.portfolio_container {
		height: 100%;
		width: 82vw;
		background-color: $primary-color;
		// padding: 1em;
		overflow: auto;
	}

	th,
	td {
		border: 1px solid #ddd;
	}

	th {
		/* background-color: #f2f2f2; */
	}

	tr:hover {
		background-color: $bgc-color;
		cursor: pointer;
	}
</style>
