<script lang="ts">
	import { Tile } from 'carbon-components-svelte';
	import PortfolioGrid from '../../components/PortfolioGrid.svelte';
	import TransactionGrid from '../../components/TransactionGrid.svelte';

	export let data: import('./$types').PageData;
</script>

<div>
	<Tile>
		<TransactionGrid rows={data.rows} />
	</Tile>
</div>

<style>
	:global(:root) {
		--grid-height: 75vh;
	}
</style>
