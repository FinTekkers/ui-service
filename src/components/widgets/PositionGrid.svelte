<script lang="ts">
	import { formatAmount } from "$lib/formatUtils";
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
</script>

<div class="portfolio_container mx-auto shadow px-10 py-7 my-4">
	<h2 class="text-3xl font-extrabold my-3">Positions</h2>
	<table class="min-w-full text-left table-fixed">
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
						{formatName(measure)}
						{getSortIndicatorForColumn(measureIndex, false)}
					</th>
				{/each}
			</tr>
		</thead>
		<tbody>
			{#each sortedPositions as position}
				<tr class="table-row border-b border-slate-400">
					{#each requestData.fields as field}
						<td class="table-cell px-4 py-2">
							{position[field]}
						</td>
					{/each}
					{#each requestData.measures as measure}
						<td class="table-cell px-4 py-2">
							{formatAmount(position[measure])}
						</td>
					{/each}
				</tr>
			{/each}
		</tbody>
	</table>
</div>

<style lang="scss">
	@import "../../styles/grid-table";

	// Keep only component-specific overrides if needed
	.portfolio_container {
		margin: 15px auto; // PositionGrid-specific override
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
