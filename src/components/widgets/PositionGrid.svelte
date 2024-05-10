<script lang="ts">
	export let positions: any[] = [];
	export let requestData: any;
	export let metadata;

	let fields = metadata.fields;
	let measures = metadata.measures;

	function formatAmount(amount: number) {
		return new Intl.NumberFormat("en-US", {
			style: "currency",
			currency: "USD",
		}).format(amount);
	}

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
	@import "../../style.scss";
	.portfolio_container {
		height: 100%;
		width: 100%;
		background-color: $primary-color; /* assuming $primary-color is a dark color */
		overflow: auto;
		margin: 15px auto;
		padding: 28px 40px;
		box-shadow: 0 0 10px rgba(0, 0, 0, 0.1); /* added shadow */
	}

	table {
		border-collapse: collapse;
		width: 100%;
	}

	th,
	td {
		border: 1px solid #ddd;
		padding: 10px;
		text-align: left;
	}

	th {
		font-weight: bold;
		/* background-color: #f2f2f2; */
	}

	tr:hover {
		background-color: $bgc-color; /* assuming $bgc-color is a light color */
		cursor: pointer;
	}

	.text-3xl {
		font-size: 36px;
	}

	.font-extrabold {
		font-weight: 800;
	}

	.my-3 {
		margin-bottom: 24px;
	}

	.text-semibold {
		font-weight: 600;
	}

	.text-lg {
		font-size: 18px;
	}

	.px-4 {
		padding-left: 16px;
		padding-right: 16px;
	}

	.py-2 {
		padding-top: 8px;
		padding-bottom: 8px;
	}

	.table-width {
		width: 25%;
	}

	.capitalize {
		text-transform: capitalize;
	}

	.table-row {
		border-bottom: 1px solid #ddd;
	}

	.table-cell {
		padding: 10px;
	}
</style>
