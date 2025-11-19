<script lang="ts">
	import { formatAmount } from "$lib/formatUtils";

	export let positions: any[] = [];
	export let requestData: any;
	export let metadata;

	let fields = metadata.fields;
	let measures = metadata.measures;

	function formatName(fieldName: string) {
		return fieldName
			.split("_")
			.map(
				(word) =>
					word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
			)
			.join(" ");
	}
</script>

<div class="portfolio_container mx-auto shadow px-10 py-7 my-4">
	<h2 class="text-3xl font-extrabold my-3">Positions</h2>
	<table class="min-w-full text-left table-fixed">
		<thead class="border-b border-slate-400">
			<tr>
				{#each fields as field}
					<th
						class="text-semibold text-lg px-4 py-2 table-width capitalize"
						>{formatName(field)}</th
					>
				{/each}
				{#each measures as measure}
					<th class="text-semibold text-lg px-4 py-2 table-width"
						>{formatName(measure)}</th
					>
				{/each}
			</tr>
		</thead>
		<tbody>
			{#each positions as position}
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
</style>
