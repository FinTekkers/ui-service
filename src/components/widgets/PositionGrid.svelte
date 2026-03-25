<script lang="ts">
	import { formatAmount, formatPercent } from "$lib/formatUtils";
	import { onMount } from "svelte";
	import {
		sortPositions as sortPositionsUtil,
		getSortIndicator,
		type SortDirection,
	} from "$lib/sortUtils";

	export let positions: any[] = [];
	export let requestData: any;
	export let metadata;
	export let onSortChange:
		| ((sortBy: string, sortDirection: "asc" | "desc") => void)
		| undefined = undefined;

	let fields = metadata.fields;
	let measures = metadata.measures;

	// Sort state - PositionGrid uses numeric indices with isField flag
	let sortField: number | null = null; // Field/measure index in requestData
	let sortDirection: SortDirection = "asc";
	let isField: boolean = true; // true if sorting by field, false if by measure

	// Initialize sort state from URL parameters
	onMount(() => {
		if (typeof window !== "undefined") {
			const urlParams = new URLSearchParams(window.location.search);
			const sortBy = urlParams.get("sortBy");
			const sortDir = urlParams.get("sortDirection") || "asc";

			if (sortBy) {
				// Find the field or measure index
				const fieldIndex = fields.findIndex(
					(f: string) => f === sortBy
				);
				if (fieldIndex !== -1) {
					sortField = fieldIndex;
					isField = true;
					sortDirection = (
						sortDir === "desc" ? "desc" : "asc"
					) as SortDirection;
				} else {
					const measureIndex = measures.findIndex(
						(m: string) => m === sortBy
					);
					if (measureIndex !== -1) {
						sortField = measureIndex;
						isField = false;
						sortDirection = (
							sortDir === "desc" ? "desc" : "asc"
						) as SortDirection;
					}
				}
			}
		}
	});

	// Sorted positions (reactive) - using universal sort utility
	$: sortedPositions = sortPositionsUtil(
		positions,
		sortField,
		sortDirection,
		isField,
		requestData
	);

	function formatName(fieldName: string) {
		return fieldName
			.split("_")
			.map(
				(word) =>
					word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
			)
			.join(" ");
	}

	function handleHeaderClick(fieldIndex: number, isFieldColumn: boolean) {
		// Use universal sort click handler logic
		if (sortField === fieldIndex && isField === isFieldColumn) {
			// Toggle direction if clicking the same column
			sortDirection = sortDirection === "asc" ? "desc" : "asc";
		} else {
			// New column, start with ascending
			sortField = fieldIndex;
			isField = isFieldColumn;
			sortDirection = "asc";
		}

		// Call callback with sort information
		if (onSortChange) {
			const sortByField = isFieldColumn
				? fields[fieldIndex]
				: measures[fieldIndex];
			onSortChange(sortByField, sortDirection);
		}
	}

	function getSortIndicatorForColumn(
		fieldIndex: number,
		isFieldColumn: boolean
	): string {
		if (sortField === fieldIndex && isField === isFieldColumn) {
			return getSortIndicator(sortField, fieldIndex, sortDirection);
		}
		return "";
	}

	const measureDisplayNames: Record<string, string> = {
		PROFIT_LOSS: "Unrealized P&L",
		PROFIT_LOSS_PERCENT: "P&L %",
		ACCRUED_INTEREST: "Accr. Int.",
		DIRTY_PRICE: "Dirty Price",
		CLEAN_PRICE: "Clean Price",
		CONVEXITY: "Convexity",
		MODIFIED_DURATION: "Mod. Duration",
		DV01: "DV01",
		YIELD_TO_MATURITY: "YTM",
	};

	const bondOnlyMeasures = new Set(["ACCRUED_INTEREST", "DIRTY_PRICE", "CLEAN_PRICE", "CONVEXITY", "MODIFIED_DURATION", "DV01", "YIELD_TO_MATURITY"]);

	function getMeasureDisplayName(measureName: string): string {
		return measureDisplayNames[measureName] ?? formatName(measureName);
	}

	// Summary row computations
	$: summary = (() => {
		const mvIdx = measures.indexOf('MARKET_VALUE');
		const plIdx = measures.indexOf('PROFIT_LOSS');
		const mdIdx = measures.indexOf('MODIFIED_DURATION');

		let totalMV: number | null = null;
		let totalPL: number | null = null;
		let weightedMD: number | null = null;

		if (mvIdx !== -1) {
			const mvKey = requestData.measures[mvIdx];
			let sum = 0;
			for (const p of sortedPositions) {
				const v = parseFloat(p[mvKey]);
				if (!isNaN(v)) sum += v;
			}
			totalMV = sum;
		}

		if (plIdx !== -1) {
			const plKey = requestData.measures[plIdx];
			let sum = 0;
			for (const p of sortedPositions) {
				const v = p[plKey];
				if (v != null && v !== '' && !isNaN(parseFloat(v))) sum += parseFloat(v);
			}
			totalPL = sum;
		}

		if (mvIdx !== -1 && mdIdx !== -1) {
			const mvKey = requestData.measures[mvIdx];
			const mdKey = requestData.measures[mdIdx];
			let weightedSum = 0;
			let totalWeight = 0;
			for (const p of sortedPositions) {
				const mv = parseFloat(p[mvKey]);
				const md = parseFloat(p[mdKey]);
				if (!isNaN(mv) && !isNaN(md)) {
					weightedSum += mv * md;
					totalWeight += mv;
				}
			}
			if (totalWeight !== 0) weightedMD = weightedSum / totalWeight;
		}

		return { totalMV, totalPL, weightedMD, mvIdx, plIdx, mdIdx };
	})();

	function getPnlClass(measureName: string, value: any): string {
		if (measureName !== "PROFIT_LOSS" && measureName !== "PROFIT_LOSS_PERCENT") return "";
		if (value == null || value === undefined || value === "") return "";
		const num = parseFloat(value);
		if (isNaN(num)) return "";
		if (num > 0) return "text-green-600";
		if (num < 0) return "text-red-600";
		return "";
	}
</script>

<div class="portfolio_container mx-auto shadow px-10 py-7 my-4">
	<h2 class="text-3xl font-extrabold my-3">Positions</h2>
	<div class="table-wrapper">
		<table class="text-left">
			<thead class="border-b border-slate-400">
				<tr>
					{#each fields as field, fieldIndex}
						<th
							class="text-semibold text-lg px-4 py-2 table-width capitalize sortable-header"
							role="button"
							tabindex="0"
							on:click={() => handleHeaderClick(fieldIndex, true)}
							on:keydown={(e) =>
								e.key === "Enter" &&
								handleHeaderClick(fieldIndex, true)}
						>
							{formatName(field)}
							{getSortIndicatorForColumn(fieldIndex, true)}
						</th>
					{/each}
					{#each measures as measure, measureIndex}
						<th
							class="text-semibold text-lg px-4 py-2 table-width sortable-header"
							role="button"
							tabindex="0"
							on:click={() => handleHeaderClick(measureIndex, false)}
							on:keydown={(e) =>
								e.key === "Enter" &&
								handleHeaderClick(measureIndex, false)}
						>
							{getMeasureDisplayName(measure)}
							{getSortIndicatorForColumn(measureIndex, false)}
						</th>
					{/each}
				</tr>
			</thead>
			<tbody>
				{#each sortedPositions as position}
					<tr class="table-row border-b border-slate-400">
						{#each requestData.fields as field, fieldIndex}
							<td class="table-cell px-4 py-2">
								{#if position[field] == null || position[field] === ""}
									{fields[fieldIndex] === "STRATEGY" ? "Unassigned" : "—"}
								{:else}
									{position[field]}
								{/if}
							</td>
						{/each}
						{#each requestData.measures as measure, i}
							<td class="table-cell px-4 py-2 {getPnlClass(measures[i], position[measure])}">
								{#if measures[i] === "PROFIT_LOSS" || measures[i] === "PROFIT_LOSS_PERCENT"}
									{#if position[measure] == null || position[measure] === undefined || position[measure] === ""}
										&mdash;
									{:else if measures[i] === "PROFIT_LOSS_PERCENT"}
										{formatPercent(position[measure])}
									{:else}
										{formatAmount(position[measure])}
									{/if}
								{:else if bondOnlyMeasures.has(measures[i])}
									{#if position[measure] == null || position[measure] === undefined || position[measure] === ""}
										&mdash;
									{:else if measures[i] === "YIELD_TO_MATURITY"}
										{formatPercent(position[measure])}
									{:else}
										{Number(position[measure]).toFixed(4)}
									{/if}
								{:else if measures[i] === "CURRENT_YIELD"}
									{formatPercent(position[measure])}
								{:else}
									{formatAmount(position[measure])}
								{/if}
							</td>
						{/each}
					</tr>
				{/each}
				{#if sortedPositions.length > 0}
					<tr class="summary-row border-t-2 border-slate-500">
						{#each requestData.fields as field, fieldIndex}
							<td class="table-cell px-4 py-2">
								{#if fieldIndex === 0}
									<strong>Portfolio Total</strong>
								{:else}
									—
								{/if}
							</td>
						{/each}
						{#each requestData.measures as measure, i}
							<td class="table-cell px-4 py-2">
								{#if measures[i] === 'MARKET_VALUE' && summary.totalMV !== null}
									<strong>{formatAmount(summary.totalMV)}</strong>
								{:else if measures[i] === 'PROFIT_LOSS' && summary.totalPL !== null}
									<strong class={summary.totalPL > 0 ? 'text-green-600' : summary.totalPL < 0 ? 'text-red-600' : ''}>{formatAmount(summary.totalPL)}</strong>
								{:else if measures[i] === 'MODIFIED_DURATION' && summary.weightedMD !== null}
									<strong>{summary.weightedMD.toFixed(4)}</strong>
								{:else}
									—
								{/if}
							</td>
						{/each}
					</tr>
				{/if}
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

	.summary-row {
		font-weight: bold;
		background-color: rgba(12, 58, 70, 0.08);
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
