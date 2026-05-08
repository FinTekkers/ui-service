<script lang="ts">
	import {
		sortData,
		getSortIndicator,
		handleSortClick,
		type SortDirection,
	} from "$lib/sortUtils";
	import { createEventDispatcher } from 'svelte';

	type PortfolioData = {
		portfolioName: string;
		portfolioId: string;
		portfolioAsOf: string;
		uuidHex?: string;
	};

	export let rows: Array<PortfolioData>;

	const dispatch = createEventDispatcher();

	function getPositionsUrl(portfolioId: string): string {
		// Only request measures the ledger-service position-search currently
		// implements. ACCRUED_INTEREST, DIRTY_PRICE, CLEAN_PRICE, CONVEXITY,
		// MODIFIED_DURATION, and UNADJUSTED_COST_BASIS return UNIMPLEMENTED
		// today (they live in the valuation pipeline, not the position search)
		// and a single unsupported measure 500s the whole positions page.
		// Backend gap tracked in second-brain#219; restore the bond analytics
		// columns here once that issue is closed.
		//
		// View defaults:
		//   - positionType=TRANSACTION rolls up positions at the transaction
		//     level (current state), not per tax lot — what a portfolio
		//     manager wants on first load.
		//   - tradeDate <= today excludes future-dated trades while including
		//     today's. A PM checking their book at end-of-day expects trades
		//     booked today to appear.
		//   - hideZeros suppresses positions whose every measure is zero.
		//   - portfolioId scopes the search to the clicked portfolio (SOMA in
		//     the seeded dataset). The /data/positions page-server already
		//     wires this through to FetchPosition's PORTFOLIO_ID filter — no
		//     extension required.
		const today = new Date().toISOString().slice(0, 10);
		const params = new URLSearchParams({
			portfolioId,
			fields: 'SECURITY_DESCRIPTION,PORTFOLIO_NAME',
			measures: 'DIRECTED_QUANTITY,MARKET_VALUE,PROFIT_LOSS,CURRENT_YIELD,YIELD_TO_MATURITY',
			positionView: 'DEFAULT_VIEW',
			positionType: 'TRANSACTION',
			tradeDate: today,
			tradeDateOperator: 'LESS_THAN_OR_EQUALS',
			hideZeros: 'true',
		});
		return `/data/positions?${params.toString()}`;
	}

	let sortField: keyof PortfolioData | null = null;
	let sortDirection: SortDirection = "asc";

	// Column-level renderer override. PortfolioData.portfolioAsOf comes
	// from ZonedDateTime.toString() ("YYYY/MM/DD HH:MM:SS" UTC) — too
	// noisy for an index column. Format to plain UTC YYYY-MM-DD; em-dash
	// for missing/malformed (the per-row guard from #221's
	// safe()-wrapped page-server may emit '' here when getAsOf()
	// throws).
	function formatAsOf(raw: string | undefined): string {
		if (!raw) return '—';
		// Accept either "YYYY/MM/DD ..." (the wrapper's output) or
		// "YYYY-MM-DD" (test fixtures already in target shape) or any
		// other ISO-ish prefix. Anything we don't recognize → em-dash.
		const m = raw.match(/^(\d{4})[-/](\d{2})[-/](\d{2})/);
		return m ? `${m[1]}-${m[2]}-${m[3]}` : '—';
	}

	type Column = {
		label: string;
		key: keyof PortfolioData;
		format?: (raw: string) => string;
	};

	const columns: Array<Column> = [
		{ label: "Portfolio", key: "portfolioName" },
		{ label: "ID", key: "portfolioId" },
		{ label: "As Of", key: "portfolioAsOf", format: formatAsOf },
	];

	$: sortedRows = sortData(rows, sortField, sortDirection);

	function handleHeaderClick(fieldKey: keyof PortfolioData) {
		const newSort = handleSortClick(sortField, fieldKey, sortDirection);
		sortField = newSort.sortField;
		sortDirection = newSort.sortDirection;
	}

	function getSortIndicatorForColumn(fieldKey: keyof PortfolioData): string {
		return getSortIndicator(sortField, fieldKey, sortDirection);
	}

	function getTransactionsUrl(portfolioId: string): string {
		// Land on the transactions page scoped to this portfolio. The
		// /data/transactions page-server reads portfolioId and routes to
		// FetchTransactionByPortfolio (PORTFOLIO_ID PositionFilter), mirroring
		// the positions-side wiring fixed under second-brain#220 / PR #123.
		return `/data/transactions?portfolioId=${encodeURIComponent(portfolioId)}`;
	}

	function handleDeleteClick(row: PortfolioData) {
		dispatch('requestDelete', { name: row.portfolioName, uuidHex: row.uuidHex });
	}
</script>

<div class="portfolio_container mx-auto shadow px-10 py-7">
	<h2 class="text-3xl font-extrabold my-3">Portfolios</h2>
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
					<tr class="table-row border-b border-slate-400 clickable-row">
						<td class="table-cell px-4 py-2 action-col">
							<a href={getTransactionsUrl(row.portfolioId)} class="txn-btn" title="View transactions for {row.portfolioName}">Txns</a>
							<button class="delete-btn" title="Delete {row.portfolioName}" on:click|stopPropagation={() => handleDeleteClick(row)}>Delete</button>
						</td>
						{#each columns as column}
							<td class="table-cell px-4 py-2">
								<a href={getPositionsUrl(row.portfolioId)} class="row-link">
									{column.format ? column.format(row[column.key] ?? '') : row[column.key]}
								</a>
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

	// No overflow-x here: we let the page-level wrapper own horizontal
	// scrolling so the user sees one global scrollbar instead of one per
	// grid (second-brain#223).
	.table-wrapper {
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

		&:hover { background-color: rgba(0, 0, 0, 0.05); }
		&:focus { outline: 2px solid #3b82f6; outline-offset: -2px; }
	}

	.clickable-row {
		cursor: pointer;
		transition: background-color 0.2s;
		&:hover { background-color: rgba(0, 0, 0, 0.05); }
	}

	.row-link {
		color: inherit;
		text-decoration: none;
		display: block;
		width: 100%;
		height: 100%;
	}

	.action-col {
		min-width: 110px !important;
		width: 110px;
		position: sticky;
		left: 0;
		z-index: 1;
		background-color: inherit;
	}

	thead .action-col { background-color: #0c3a46; }

	.txn-btn {
		display: inline-block;
		background-color: #1d6a80;
		border: none;
		color: white;
		font-size: 0.8rem;
		font-weight: 700;
		padding: 4px 8px;
		border-radius: 4px;
		cursor: pointer;
		white-space: nowrap;
		text-decoration: none;
		margin-right: 4px;
		transition: all 0.15s;

		&:hover { background-color: #155a6e; }
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

		&:hover { background-color: #a33049; }
	}
</style>
