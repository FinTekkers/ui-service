<script lang="ts">
	import {
		DataTable,
		Toolbar,
		ToolbarContent,
		ToolbarSearch,
		ToolbarMenu,
		ToolbarMenuItem,
		Button,
		Pagination
	} from 'carbon-components-svelte';

	export let rows: Array<{
		id: string;
		portfolio: string;
		security: string;
		transactionType: string;
		quantity: number;
		price: number;
		tradeDate: string;
		settlementDate: string;
	}>;

	let pageSize = 5;
	let page = 1;
</script>

<DataTable
	title="Transactions"
	headers={[
		{ key: 'portfolio', value: 'Portfolio' },
		{ key: 'security', value: 'Security' },
		{ key: 'transactionType', value: 'Transaction Type' },
		{ key: 'quantity', value: 'Quantity' },
		{ key: 'price', value: 'Price' },
		{ key: 'tradeDate', value: 'Trade Date' },
		{ key: 'settlementDate', value: 'Settlement Date' }
	]}
	{rows}
	{page}
	{pageSize}
>
	<Toolbar>
		<ToolbarContent>
			<ToolbarSearch />
			<ToolbarMenu />
			<Button>Create Transaction</Button>
		</ToolbarContent>
	</Toolbar>
</DataTable>
<Pagination bind:pageSize bind:page totalItems={rows.length} pageSizeInputDisabled />
