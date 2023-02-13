<script>
	import { Tile, Grid, Row, Column, AspectRatio } from 'carbon-components-svelte';
</script>

<Grid padding>
	<Row>
		<Column>
			<h1>Your New Financial Platform</h1>
		</Column>
	</Row>
	<Row padding>
		<Column padding aspectRatio="2x1">
			<Tile>
				<div class="div-content">
					<h2>Language Agnostic</h2>
					<p>
						All API's based on ProtoBuff's, with bindings for Rust, Typescript/Javascript, Java,
						Python, Go, and C++.
					</p>
				</div>
			</Tile>
		</Column>
		<Column padding aspectRatio="2x1">
			<Tile>
				<div class="div-content">
					<h2>Cloud Native</h2>
					<p>Built to be cloud agnostic - hosted on AWS</p>
				</div>
			</Tile>
		</Column>
		<Column padding aspectRatio="2x1">
			<Tile>
				<div class="div-content">
					<h2>Performant</h2>
					<p>Core services are written in Rust for speed and memory safety.</p>
				</div>
			</Tile>
		</Column>
	</Row>
</Grid>

<style>
	.div-content {
		min-height: 100px;
	}
	h2 {
		padding-bottom: 5px;
	}
</style>
