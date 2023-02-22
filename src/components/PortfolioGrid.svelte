<script lang="ts">
	import {
		DataTable,
		Toolbar,
		ToolbarContent,
		ToolbarSearch,
		Button,
		Pagination
	} from 'carbon-components-svelte';

	export let rows: Array<{ portfolio: string; portfolioId: number; id: number }>;

	let pageSize = 5;
	let page = 1;
</script>

<DataTable
	title="Portfolios"
	headers={[
		{ key: 'portfolio', value: 'Portfolio' },
		{ key: 'portfolioId', value: 'ID' }
	]}
	{page}
	{pageSize}
	{rows}
>
	<Toolbar>
		<ToolbarContent>
			<ToolbarSearch />
			<Button
				on:click={() => {
					console.log('TODO');
				}}>Create Portfolio</Button
			>
		</ToolbarContent>
	</Toolbar>
</DataTable>
<Pagination bind:pageSize bind:page totalItems={rows.length} pageSizeInputDisabled />
