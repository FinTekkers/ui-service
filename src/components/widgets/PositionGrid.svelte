<script lang="ts">
	import { formatAmount } from "$lib/formatUtils";
	import { onMount } from "svelte";

	export let positions: any[] = [];
	export let requestData: any;
	export let metadata;
	export let onSortChange: ((sortBy: string, sortDirection: 'asc' | 'desc') => void) | undefined = undefined;

	let fields = metadata.fields;
	let measures = metadata.measures;

	// Sort state - initialize from URL if available
	let sortField: number | null = null; // Field/measure index in requestData
	let sortDirection: 'asc' | 'desc' = 'asc';
	let isField: boolean = true; // true if sorting by field, false if by measure

	// Initialize sort state from URL parameters
	onMount(() => {
		if (typeof window !== 'undefined') {
			const urlParams = new URLSearchParams(window.location.search);
			const sortBy = urlParams.get('sortBy');
			const sortDir = urlParams.get('sortDirection') || 'asc';

			if (sortBy) {
				// Find the field or measure index
				const fieldIndex = fields.findIndex((f: string) => f === sortBy);
				if (fieldIndex !== -1) {
					sortField = fieldIndex;
					isField = true;
					sortDirection = (sortDir === 'desc' ? 'desc' : 'asc') as 'asc' | 'desc';
				} else {
					const measureIndex = measures.findIndex((m: string) => m === sortBy);
					if (measureIndex !== -1) {
						sortField = measureIndex;
						isField = false;
						sortDirection = (sortDir === 'desc' ? 'desc' : 'asc') as 'asc' | 'desc';
					}
				}
			}
		}
	});

	// Sorted positions (reactive)
	$: sortedPositions = sortPositions(positions, sortField, sortDirection, isField, requestData);

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
		if (sortField === fieldIndex && isField === isFieldColumn) {
			// Toggle direction if clicking the same column
			sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
		} else {
			// New column, start with ascending
			sortField = fieldIndex;
			isField = isFieldColumn;
			sortDirection = 'asc';
		}

		// Call callback with sort information
		if (onSortChange) {
			const sortByField = isField ? fields[fieldIndex] : measures[fieldIndex];
			onSortChange(sortByField, sortDirection);
		}
	}

	function sortPositions(
		positions: any[],
		sortField: number | null,
		sortDirection: 'asc' | 'desc',
		isField: boolean,
		requestData: any
	): any[] {
		if (sortField === null) {
			return positions;
		}

		const sorted = [...positions].sort((a, b) => {
			const key = isField ? requestData.fields[sortField] : requestData.measures[sortField];
			const valueA = a[key];
			const valueB = b[key];

			// Handle null/undefined values
			if (valueA == null && valueB == null) return 0;
			if (valueA == null) return 1;
			if (valueB == null) return -1;

			let comparison = 0;

			// Try numeric comparison first (for measures and numeric fields)
			const numA = Number(valueA);
			const numB = Number(valueB);
			if (!isNaN(numA) && !isNaN(numB)) {
				comparison = numA - numB;
			} else {
				// Fall back to string comparison
				comparison = String(valueA).localeCompare(String(valueB));
			}

			return sortDirection === 'desc' ? -comparison : comparison;
		});

		return sorted;
	}

	function getSortIndicator(fieldIndex: number, isFieldColumn: boolean): string {
		if (sortField === fieldIndex && isField === isFieldColumn) {
			return sortDirection === 'asc' ? '↑' : '↓';
		}
		return '';
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
						on:keydown={(e) => e.key === 'Enter' && handleHeaderClick(fieldIndex, true)}
					>
						{formatName(field)} {getSortIndicator(fieldIndex, true)}
					</th>
				{/each}
				{#each measures as measure, measureIndex}
					<th 
						class="text-semibold text-lg px-4 py-2 table-width sortable-header"
						role="button"
						tabindex="0"
						on:click={() => handleHeaderClick(measureIndex, false)}
						on:keydown={(e) => e.key === 'Enter' && handleHeaderClick(measureIndex, false)}
					>
						{formatName(measure)} {getSortIndicator(measureIndex, false)}
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
