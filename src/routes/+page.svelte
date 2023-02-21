<script>
	import { Tile, Grid, Row, Column, AspectRatio } from 'carbon-components-svelte';
</script>

<h1>Your New Financial Platform</h1>

<div class="cards">
	<div class="card">
		<Tile>
			<div class="div-content">
				<h2>Language Agnostic</h2>
				<p>
					All API's are based on ProtoBuff's, with out of the box bindings for Rust,
					Typescript/Javascript, Java, Python, Go, and C++.
				</p>
			</div>
		</Tile>
	</div>
	<div class="card">
		<Tile>
			<div class="div-content">
				<h2>Cloud Native</h2>
				<p>Built to be cloud agnostic - hosted on AWS.</p>
			</div>
		</Tile>
	</div>
	<div class="card">
		<Tile>
			<div class="div-content">
				<h2>Performant</h2>
				<p>
					Core services are written in Rust for speed and memory safety. Our UI's are built with
					Svelte to keep page loads snappy.
				</p>
			</div>
		</Tile>
	</div>
</div>

<style>
	h1 {
		padding-bottom: 2rem;
	}
	.div-content {
		min-height: 125px;
	}
	h2 {
		padding-bottom: 1rem;
	}
	.cards {
		display: flex;
		gap: 2rem;
	}
	.card {
		flex: 1;
		flex-basis: 100%;
	}
</style>
