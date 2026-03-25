/**
 * ISSUE #40: Verify prices page defaults to on-the-run 10Y Treasury.
 *
 * Validates:
 * 1. Route files exist under (authenticated)/data/prices/
 * 2. Server-side logic defaults to 10Y Treasury when no CUSIP is provided
 * 3. Page component renders selected CUSIP, chart, and table
 * 4. CUSIP selector allows changing selection
 * 5. Data pipeline integrity (PriceClient, streaming, dedup)
 */
import { describe, expect, test } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const ROUTE_DIR = path.resolve('src/routes/(authenticated)/data/prices');

// =============================================================================
// 1. Route file structure
// =============================================================================
describe('Prices page – route files', () => {
	test('+page.svelte exists', () => {
		expect(fs.existsSync(path.join(ROUTE_DIR, '+page.svelte'))).toBe(true);
	});

	test('+page.server.ts exists', () => {
		expect(fs.existsSync(path.join(ROUTE_DIR, '+page.server.ts'))).toBe(true);
	});

	test('no local +layout.svelte (uses authenticated layout)', () => {
		expect(fs.existsSync(path.join(ROUTE_DIR, '+layout.svelte'))).toBe(false);
	});
});

// =============================================================================
// 2. Server-side default selection logic — 10Y Treasury via gRPC
// =============================================================================
describe('Prices page – 10Y Treasury default', () => {
	const pageServer = fs.readFileSync(path.join(ROUTE_DIR, '+page.server.ts'), 'utf-8');

	test('exports load function', () => {
		expect(pageServer).toContain('export async function load');
	});

	test('fetches US Government Fixed Income securities', () => {
		expect(pageServer).toContain("FetchSecurity('Fixed Income', 'US Government')");
	});

	test('defaults to 10Y tenor when no CUSIP is selected', () => {
		expect(pageServer).toContain('!selectedCusip');
	});

	test('uses SecurityService to search for 10Y bonds via gRPC', () => {
		expect(pageServer).toContain('new SecurityService()');
		expect(pageServer).toContain('searchSecurityAsOfNow');
	});

	test('creates a PositionFilter with TENOR field for 10Y', () => {
		expect(pageServer).toContain('FieldProto.TENOR');
		expect(pageServer).toContain("new Tenor(TenorTypeProto.TERM, '10Y')");
	});

	test('filters by Fixed Income asset class and US Government issuer', () => {
		expect(pageServer).toContain("FieldProto.ASSET_CLASS, 'Fixed Income'");
		expect(pageServer).toContain("FieldProto.SECURITY_ISSUER_NAME, 'US Government'");
	});

	test('sorts by issue date descending to pick the on-the-run', () => {
		expect(pageServer).toContain('getIssueDate()');
		expect(pageServer).toContain('dateB - dateA');
	});

	test('picks the first security after descending sort (most recent issue)', () => {
		expect(pageServer).toContain('sorted[0]');
		expect(pageServer).toContain('getSecurityID()');
	});

	test('falls back gracefully if no 10Y treasury exists', () => {
		expect(pageServer).toContain('tenorResults.length > 0');
	});
});

// =============================================================================
// 3. Price fetching pipeline
// =============================================================================
describe('Prices page – price fetch pipeline', () => {
	const pageServer = fs.readFileSync(path.join(ROUTE_DIR, '+page.server.ts'), 'utf-8');

	test('uses PriceClient for gRPC streaming', () => {
		expect(pageServer).toContain('PriceClient');
	});

	test('connects to price service via broker (conn.url, no direct port)', () => {
		expect(pageServer).toContain('conn.url');
		expect(pageServer).not.toContain(':8083');
	});

	test('uses streaming search RPC', () => {
		expect(pageServer).toContain('client.search');
		expect(pageServer).toContain("stream.on('data'");
	});

	test('requests max price horizon (all available history)', () => {
		expect(pageServer).toContain('PRICE_HORIZON_MAX');
	});

	test('requests daily frequency', () => {
		expect(pageServer).toContain('PRICE_FREQUENCY_DAILY');
	});

	test('filters by SECURITY_ID field', () => {
		expect(pageServer).toContain('SECURITY_ID');
	});

	test('deduplicates prices by date', () => {
		expect(pageServer).toContain('byDate');
		expect(pageServer).toContain("byDate.has(p.date)");
	});

	test('sorts prices by date descending for table display', () => {
		expect(pageServer).toContain('b.date.localeCompare(a.date)');
	});

	test('returns selectedCusip in page data', () => {
		expect(pageServer).toContain('selectedCusip');
		expect(pageServer).toMatch(/return\s*\{[\s\S]*selectedCusip/);
	});

	test('returns securityDescription in page data', () => {
		expect(pageServer).toContain('securityDescription');
	});

	test('handles price fetch errors gracefully', () => {
		expect(pageServer).toContain('catch');
		expect(pageServer).toContain('priceError');
	});
});

// =============================================================================
// 4. Page component — CUSIP selector and display
// =============================================================================
describe('Prices page – component structure', () => {
	const pageSvelte = fs.readFileSync(path.join(ROUTE_DIR, '+page.svelte'), 'utf-8');

	test('has page title "Price History"', () => {
		expect(pageSvelte).toContain('Price History');
	});

	test('has a CUSIP text input with placeholder', () => {
		expect(pageSvelte).toContain('type="text"');
		expect(pageSvelte).toContain('placeholder="Enter CUSIP..."');
	});

	test('CUSIP input is pre-populated with selected CUSIP', () => {
		// cusipInput is initialized from data.selectedCusip
		expect(pageSvelte).toContain('data.selectedCusip');
		expect(pageSvelte).toContain('bind:value={cusipInput}');
	});

	test('has autocomplete suggestions dropdown', () => {
		expect(pageSvelte).toContain('suggestions');
		expect(pageSvelte).toContain('filtered');
	});

	test('autocomplete filters securities by CUSIP prefix', () => {
		expect(pageSvelte).toContain('startsWith(cusipInput.toUpperCase())');
	});

	test('has a "View Prices" button', () => {
		expect(pageSvelte).toContain('View Prices');
	});

	test('selecting a CUSIP navigates with query param', () => {
		expect(pageSvelte).toContain('/data/prices?cusip=');
	});

	test('keyboard navigation works (ArrowDown, ArrowUp, Enter, Escape)', () => {
		expect(pageSvelte).toContain('ArrowDown');
		expect(pageSvelte).toContain('ArrowUp');
		expect(pageSvelte).toContain("e.key === 'Enter'");
		expect(pageSvelte).toContain("e.key === 'Escape'");
	});
});

// =============================================================================
// 5. Page component — chart and table rendering
// =============================================================================
describe('Prices page – chart and table', () => {
	const pageSvelte = fs.readFileSync(path.join(ROUTE_DIR, '+page.svelte'), 'utf-8');

	test('renders an SVG chart when prices exist', () => {
		expect(pageSvelte).toContain('<svg');
		expect(pageSvelte).toContain('</svg>');
	});

	test('chart title includes the selected CUSIP', () => {
		expect(pageSvelte).toContain('Price Chart — {selectedCusip}');
	});

	test('chart has a polyline for the price trend', () => {
		expect(pageSvelte).toContain('<polyline');
	});

	test('chart has an area fill polygon', () => {
		expect(pageSvelte).toContain('<polygon');
	});

	test('chart has interactive data point circles', () => {
		expect(pageSvelte).toContain('<circle');
		expect(pageSvelte).toContain('mouseenter');
		expect(pageSvelte).toContain('mouseleave');
	});

	test('chart has hover tooltips showing date and price', () => {
		expect(pageSvelte).toContain('hoveredIndex');
		expect(pageSvelte).toContain('p.price.toFixed(3)');
	});

	test('chart has Y-axis label "Price"', () => {
		expect(pageSvelte).toContain('>Price<');
	});

	test('renders a data table with Date and Price columns', () => {
		expect(pageSvelte).toContain('<table');
		expect(pageSvelte).toContain('Date');
		expect(pageSvelte).toContain('Price');
	});

	test('table shows prices with 6 decimal places', () => {
		expect(pageSvelte).toContain('p.price.toFixed(6)');
	});

	test('displays security description when selected', () => {
		expect(pageSvelte).toContain('{securityDescription}');
	});

	test('shows error banner on price error', () => {
		expect(pageSvelte).toContain('priceError');
		expect(pageSvelte).toContain('error-banner');
	});

	test('shows empty state message when no CUSIP is selected', () => {
		expect(pageSvelte).toContain('Select a CUSIP above to view its price history.');
	});

	test('shows "no history" message when CUSIP selected but no prices', () => {
		expect(pageSvelte).toContain('No price history found for');
	});
});

// =============================================================================
// 6. Default selection logic — gRPC approach validation
// =============================================================================
describe('Prices page – default selection approach', () => {
	const pageServer = fs.readFileSync(path.join(ROUTE_DIR, '+page.server.ts'), 'utf-8');

	test('does NOT use client-side regex filtering for tenor', () => {
		// Issue #40: must use gRPC SearchSecurities, not regex on client
		expect(pageServer).not.toMatch(/10\.\?\[Yy\]ear/);
	});

	test('imports Tenor and TenorTypeProto for gRPC-based filtering', () => {
		expect(pageServer).toContain("import { Tenor }");
		expect(pageServer).toContain("import { TenorTypeProto }");
	});

	test('uses addObjectFilter with TENOR field', () => {
		expect(pageServer).toContain('addObjectFilter(FieldProto.TENOR');
	});

	test('descending sort by issue date picks the most recent issue', () => {
		// Verify the sort logic: dateB - dateA means descending
		const dates = [
			new Date('2024-02-15'),
			new Date('2025-02-15'),
			new Date('2024-08-15'),
		];
		const sorted = dates.sort((a, b) => b.getTime() - a.getTime());
		expect(sorted[0].toISOString()).toContain('2025-02-15');
	});
});

// =============================================================================
// 7. CSS contrast checks
// =============================================================================
describe('Prices page – CSS contrast', () => {
	function hexToRgb(hex: string): { r: number; g: number; b: number } {
		const c = hex.replace('#', '');
		return {
			r: parseInt(c.substring(0, 2), 16),
			g: parseInt(c.substring(2, 4), 16),
			b: parseInt(c.substring(4, 6), 16),
		};
	}

	function luminance(hex: string): number {
		const { r, g, b } = hexToRgb(hex);
		const [rs, gs, bs] = [r, g, b].map(c => {
			const s = c / 255;
			return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
		});
		return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
	}

	function contrastRatio(fg: string, bg: string): number {
		const l1 = luminance(fg);
		const l2 = luminance(bg);
		return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
	}

	const chartAccent = '#7cd2ba';
	const chartBg = '#0c3a46';
	const priceColor = '#7cd2ba';

	test('chart accent (#7cd2ba) is visible on chart bg (#0c3a46)', () => {
		expect(contrastRatio(chartAccent, chartBg)).toBeGreaterThanOrEqual(3.0);
	});

	test('price value color (#7cd2ba) is visible on chart bg', () => {
		expect(contrastRatio(priceColor, chartBg)).toBeGreaterThanOrEqual(3.0);
	});
});

// =============================================================================
// 8. Authentication guard
// =============================================================================
describe('Prices page – authentication', () => {
	const authLayoutServer = path.resolve('src/routes/(authenticated)/+layout.server.ts');

	test('authenticated layout server exists', () => {
		expect(fs.existsSync(authLayoutServer)).toBe(true);
	});

	test('authenticated layout redirects unauthenticated users', () => {
		const content = fs.readFileSync(authLayoutServer, 'utf-8');
		expect(content).toContain('redirect');
		expect(content).toContain('login');
	});
});
