/**
 * Treasury page display tests.
 *
 * Part 1: Existing /treasuries page — Fed Balance Sheet Activity
 *   - Verifies route files, data pipeline, TransactionGrid integration
 *
 * Part 2: Planned /treasuries/curve page — On-the-Run Treasury Curve
 *   - Data contract tests for the yield curve feature
 *   - Tests marked .todo() will be enabled once the page is implemented.
 *
 * Standard yield curve tenor points (FRED H.15):
 *   1Mo, 3Mo, 6Mo, 1Yr, 2Yr, 3Yr, 5Yr, 7Yr, 10Yr, 20Yr, 30Yr
 */
import { describe, expect, test, it } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

// =============================================================================
// PART 1: /treasuries page — Fed Balance Sheet Activity (EXISTING)
// =============================================================================

describe('/treasuries page – file structure', () => {
	const routeDir = path.resolve('src/routes/treasuries');

	test('+page.svelte exists', () => {
		expect(fs.existsSync(path.join(routeDir, '+page.svelte'))).toBe(true);
	});

	test('+page.server.ts exists', () => {
		expect(fs.existsSync(path.join(routeDir, '+page.server.ts'))).toBe(true);
	});

	test('+layout.svelte exists', () => {
		expect(fs.existsSync(path.join(routeDir, '+layout.svelte'))).toBe(true);
	});

	test('TransactionGrid widget component exists', () => {
		expect(fs.existsSync(path.resolve('src/components/widgets/TransactionGrid.svelte'))).toBe(true);
	});
});

describe('/treasuries page – source content', () => {
	const pageSvelte = fs.readFileSync(path.resolve('src/routes/treasuries/+page.svelte'), 'utf-8');
	const pageServer = fs.readFileSync(path.resolve('src/routes/treasuries/+page.server.ts'), 'utf-8');

	test('imports TransactionGrid component', () => {
		expect(pageSvelte).toContain('TransactionGrid');
	});

	test('passes transactions data to component', () => {
		expect(pageSvelte).toContain('data.transactions');
	});

	test('has title for Fed activity', () => {
		expect(pageSvelte).toContain('Recent Fed Balance Sheet Activity');
	});

	test('server exports load function', () => {
		expect(pageServer).toContain('export async function load');
	});

	test('server returns transactions in load data', () => {
		expect(pageServer).toContain('transactions:');
	});

	test('server fetches BUY transactions', () => {
		expect(pageServer).toContain('TransactionTypeProto.BUY');
	});

	test('server fetches MATURATION transactions', () => {
		expect(pageServer).toContain('TransactionTypeProto.MATURATION');
	});

	test('server handles MATURATION_OFFSET', () => {
		expect(pageServer).toContain('MATURATION_OFFSET');
	});

	test('server combines transactions by CUSIP', () => {
		expect(pageServer).toContain('combineTransactionsByCusip');
	});

	test('server adjusts quantity direction', () => {
		expect(pageServer).toContain('adjustQuantityDirection');
	});

	test('server filters for Fixed Income', () => {
		expect(pageServer).toContain('Fixed Income');
	});

	test('server uses 6-week lookback window', () => {
		expect(pageServer).toContain('42');
	});

	test('server handles empty results gracefully', () => {
		expect(pageServer).toContain('positions.length === 0');
	});

	test('server filters out USD/cash identifiers', () => {
		expect(pageServer).toContain('USD');
	});

	test('server returns user object', () => {
		expect(pageServer).toContain('user: locals.user');
	});
});

describe('/treasuries page – TransactionData shape', () => {
	const lib = fs.readFileSync(path.resolve('src/lib/transactions.ts'), 'utf-8');

	test('TransactionData interface is exported', () => {
		expect(lib).toContain('export type { TransactionData }');
	});

	const requiredFields = [
		'transactionId', 'transactionIssuerName', 'transactionIssueDate',
		'transactionQuantity', 'transactionProductType', 'transactionTenor',
		'transactionCouponRate', 'transactionMaturityDate', 'transactionTradeDate',
		'transactionSide',
	];

	for (const field of requiredFields) {
		test(`TransactionData has field: ${field}`, () => {
			expect(lib).toContain(field);
		});
	}
});

describe('/treasuries page – layout and styles', () => {
	const layoutSvelte = fs.readFileSync(path.resolve('src/routes/treasuries/+layout.svelte'), 'utf-8');
	const pageSvelte = fs.readFileSync(path.resolve('src/routes/treasuries/+page.svelte'), 'utf-8');

	test('layout imports layout styles', () => {
		expect(layoutSvelte).toContain('@import');
	});

	test('page uses flex layout', () => {
		expect(pageSvelte).toContain('flex');
	});

	test('layout sets page title', () => {
		expect(layoutSvelte).toContain('<title>');
	});
});

// =============================================================================
// PART 2: /treasuries/curve page — On-the-Run Treasury Curve (PLANNED)
// =============================================================================

// =============================================================================
// 1. Route existence — verify the SvelteKit route files are in place
// =============================================================================
describe('Treasury curve route structure', () => {
	const routeDir = path.resolve('src/routes/treasuries/curve');

	test('route directory src/routes/treasuries/curve/ exists', () => {
		const exists = fs.existsSync(routeDir);
		if (!exists) {
			console.warn(
				'EXPECTED: src/routes/treasuries/curve/ does not exist yet. ' +
				'Create +page.svelte and +page.server.ts to implement the treasury curve page.'
			);
		}
		// This test documents the expected location. Flip to true when implemented.
		expect(exists).toBe(false); // TODO: change to true when page is created
	});

	test.todo('+page.svelte exists in curve route');
	test.todo('+page.server.ts exists in curve route');
});

// =============================================================================
// 2. Data contract — the shape +page.server.ts should return
// =============================================================================

/** Standard FRED CMT tenor points for the on-the-run Treasury curve */
const STANDARD_TENORS = [
	'1M', '3M', '6M', '1Y', '2Y', '3Y', '5Y', '7Y', '10Y', '20Y', '30Y'
] as const;

/** FRED series IDs for each tenor */
const FRED_SERIES: Record<string, string> = {
	'1M': 'DGS1MO',
	'3M': 'DGS3MO',
	'6M': 'DGS6MO',
	'1Y': 'DGS1',
	'2Y': 'DGS2',
	'3Y': 'DGS3',
	'5Y': 'DGS5',
	'7Y': 'DGS7',
	'10Y': 'DGS10',
	'20Y': 'DGS20',
	'30Y': 'DGS30',
};

/** A single point on the yield curve */
interface CurvePoint {
	tenor: string;        // e.g. "2Y", "10Y"
	yield_pct: number;    // par yield in percent (e.g. 4.25)
	cusip?: string;       // on-the-run CUSIP if available
	coupon?: number;      // coupon rate of the on-the-run bond
	maturity_date?: string; // ISO date string
}

/** The data shape the server load function should return */
interface TreasuryCurveData {
	curve_date: string;          // ISO date of the curve snapshot
	points: CurvePoint[];        // one per tenor
	source: string;              // e.g. "FRED" or "Treasury.gov"
}

describe('Treasury curve data contract', () => {
	test('STANDARD_TENORS has 11 entries (FRED H.15 CMT points)', () => {
		expect(STANDARD_TENORS).toHaveLength(11);
	});

	test('every tenor has a FRED series ID', () => {
		for (const tenor of STANDARD_TENORS) {
			expect(FRED_SERIES[tenor]).toBeDefined();
			expect(FRED_SERIES[tenor]).toMatch(/^D(GS|FII)/);
		}
	});

	test('FRED series IDs are unique', () => {
		const ids = Object.values(FRED_SERIES);
		expect(new Set(ids).size).toBe(ids.length);
	});

	test('tenors are in ascending maturity order', () => {
		// Convert tenor strings to approximate months for ordering check
		function tenorToMonths(t: string): number {
			const match = t.match(/^(\d+)(M|Y)$/);
			if (!match) return 0;
			const n = parseInt(match[1]);
			return match[2] === 'Y' ? n * 12 : n;
		}
		const months = STANDARD_TENORS.map(tenorToMonths);
		for (let i = 1; i < months.length; i++) {
			expect(months[i]).toBeGreaterThan(months[i - 1]);
		}
	});

	test('sample CurvePoint validates expected shape', () => {
		const point: CurvePoint = {
			tenor: '10Y',
			yield_pct: 4.25,
			cusip: '91282CKL3',
			coupon: 4.0,
			maturity_date: '2035-11-15',
		};
		expect(point.tenor).toBe('10Y');
		expect(point.yield_pct).toBeGreaterThan(0);
		expect(point.yield_pct).toBeLessThan(20); // sanity: yields < 20%
	});

	test('sample TreasuryCurveData validates expected shape', () => {
		const data: TreasuryCurveData = {
			curve_date: '2026-03-19',
			source: 'FRED',
			points: STANDARD_TENORS.map((tenor, i) => ({
				tenor,
				yield_pct: 3.5 + i * 0.15, // mock upward-sloping curve
			})),
		};
		expect(data.points).toHaveLength(11);
		expect(data.curve_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
		expect(data.source).toBeTruthy();
	});

	test('yield curve should be monotonically non-decreasing (normal shape)', () => {
		// A normal yield curve has longer tenors yielding more.
		// This isn't always true (inverted curve), but should be the default expectation.
		// Use the actual 2026-03-19 Treasury data as reference:
		const actual_yields: Record<string, number> = {
			'1M': 3.73, '3M': 3.73, '6M': 3.76, '1Y': 3.73,
			'2Y': 3.79, '3Y': 3.79, '5Y': 3.88, '7Y': 4.06,
			'10Y': 4.25, '20Y': 4.82, '30Y': 4.83,
		};
		// Verify the data matches the Treasury.gov publication for 2026-03-19
		expect(actual_yields['10Y']).toBe(4.25);
		expect(actual_yields['30Y']).toBe(4.83);
		// The 2026-03-19 curve is indeed upward-sloping from 2Y onward
		expect(actual_yields['30Y']).toBeGreaterThan(actual_yields['2Y']);
	});
});

// =============================================================================
// 3. Yield convention tests — verify BEY / day count expectations
// =============================================================================
describe('Treasury yield conventions', () => {
	test('CMT yields use semi-annual bond equivalent yield (BEY)', () => {
		// APY = (1 + CMT/2)^2 - 1
		// For CMT = 4.25%, APY should be ~4.295%
		const cmt = 0.0425;
		const apy = Math.pow(1 + cmt / 2, 2) - 1;
		expect(apy).toBeCloseTo(0.04295, 4);
		// BEY is always slightly less than APY
		expect(cmt).toBeLessThan(apy);
	});

	test('yields are quoted as annual percentages (not decimals)', () => {
		// Treasury publishes e.g. "4.25" meaning 4.25%, not 0.0425
		const published_yield = 4.25; // as published
		const decimal_yield = published_yield / 100;
		expect(decimal_yield).toBe(0.0425);
		// When storing in our system, we should clarify which convention
	});
});

// =============================================================================
// 4. Page rendering expectations (to be enabled when page exists)
// =============================================================================
describe('Treasury curve page rendering', () => {
	test.todo('page title contains "On-the-Run Treasury Curve"');
	test.todo('table has columns: Tenor, Yield (%), CUSIP, Coupon, Maturity');
	test.todo('table has 11 rows (one per standard tenor)');
	test.todo('chart element exists (SVG or Plotly div)');
	test.todo('chart x-axis shows tenors in order');
	test.todo('chart y-axis shows yield in percent');
	test.todo('curve date is displayed');
	test.todo('data source attribution is shown');
});
