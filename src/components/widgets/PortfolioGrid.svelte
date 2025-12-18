<script lang="ts">
	import {
		sortData,
		getSortIndicator,
		handleSortClick,
		type SortDirection,
	} from "$lib/sortUtils";

	type PortfolioData = {
		portfolioName: string;
		portfolioId: string;
		portfolioAsOf: string;
	};

	export let rows: Array<PortfolioData>;

	// Sort state - using universal sort utilities
	let sortField: keyof PortfolioData | null = null;
	let sortDirection: SortDirection = "asc";

	// Column definitions with their corresponding PortfolioData keys
	const columns: Array<{ label: string; key: keyof PortfolioData }> = [
		{ label: "Portfolio", key: "portfolioName" },
		{ label: "ID", key: "portfolioId" },
		{ label: "Created (AsOf)", key: "portfolioAsOf" },
	];

	// Sorted rows (reactive) - using universal sort utility
	$: sortedRows = sortData(rows, sortField, sortDirection);

	function handleHeaderClick(fieldKey: keyof PortfolioData) {
		const newSort = handleSortClick(sortField, fieldKey, sortDirection);
		sortField = newSort.sortField;
		sortDirection = newSort.sortDirection;
	}

	function getSortIndicatorForColumn(fieldKey: keyof PortfolioData): string {
		return getSortIndicator(sortField, fieldKey, sortDirection);
	}
</script>

<div class="portfolio_container mx-auto shadow px-10 py-7">
	<h2 class="text-3xl font-extrabold my-3">Portfolios</h2>
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
							<td class="table-cell px-4 py-2">{row[column.key]}</td>
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
