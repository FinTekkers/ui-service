<script lang="ts">
	import { Tile } from 'carbon-components-svelte';
	import PortfolioGrid from '../../components/PortfolioGrid.svelte';

	export let data: import('./$types').PageData;
</script>

<div>
	<Tile>
		<PortfolioGrid rows={data.portfolioData} />
	</Tile>
</div>

<style>
	:global(:root) {
		--grid-height: 75vh;
	}
</style>
