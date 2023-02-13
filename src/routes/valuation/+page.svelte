<script>
	import {
		Tile,
		Grid,
		Row,
		Column,
		Form,
		Button,
		TextInput,
		SelectItem,
		Select
	} from 'carbon-components-svelte';
</script>

<Grid padding>
	<Row>
		<Column>
			<h1>Bond Valuation</h1>
		</Column>
	</Row>
	<Row>
		<Column sm={{ span: 2, offset: 4 }}>
			<Tile>
				<div class="f">
					<Form on:submit>
						<div class="valuation-input">
							<Select id="select-1" labelText="Target Measure" value="placeholder-item">
								<SelectItem value="option-1" text="Yield To Maturity" />
							</Select>
						</div>
						<div class="valuation-input">
							<TextInput labelText="Coupon Rate" placeholder="Enter Coupon Rate..." light />
						</div>
						<div class="valuation-input">
							<TextInput labelText="Coupon Value" placeholder="Enter Coupon Value..." light />
						</div>
						<div class="valuation-input">
							<TextInput labelText="Face Value" placeholder="Enter Face Value..." light />
						</div>
						<div class="valuation-input">
							<TextInput labelText="Price" placeholder="Enter Price..." light />
						</div>
					</Form>
				</div>
				<Button>Calculate</Button>
			</Tile>
		</Column>
	</Row>
</Grid>

<style>
	.f {
		margin-bottom: 10px;
	}
	.valuation-input {
		margin-bottom: 5px;
	}
</style>
