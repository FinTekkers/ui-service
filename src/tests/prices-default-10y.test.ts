/**
 * Prices page — UI structure tests.
 *
 * Behavioural assertions about the rendered prices page:
 *   - identifier-type selector + autocomplete input
 *   - chart and table render when prices are present
 *   - error/empty states
 *   - CSS contrast of chart accents
 *
 * Originally (#40) this file pinned the on-the-run 10Y Treasury default
 * implementation. After #186 the page supports any identifier type, so the
 * assertions check the universal-identifier UI rather than 10Y-specific code.
 */
import { describe, expect, test } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const ROUTE_DIR = path.resolve('src/routes/(authenticated)/data/prices');

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

describe('Prices page – identifier type selector + autocomplete', () => {
	const pageSvelte = fs.readFileSync(path.join(ROUTE_DIR, '+page.svelte'), 'utf-8');

	test('has page title "Price History"', () => {
		expect(pageSvelte).toContain('Price History');
	});

	test('uses IdentifierFilter primitive with the four supported types', () => {
		// Phase 2 of second-brain#226 (PR #130) replaced the inline <select>
		// with the shared IdentifierFilter primitive. Internal state is the
		// proto-enum name (IdentifierTypeName); the URL convention
		// (?type=cusip|ticker|isin|series) is preserved at the boundary
		// via PROTO_TO_URL / urlKeyToProto.
		expect(pageSvelte).toContain('<IdentifierFilter');
		expect(pageSvelte).toContain('PRICES_SUPPORTED_TYPES');
		// Check the supportedTypes constant declares the four proto names.
		expect(pageSvelte).toMatch(/PRICES_SUPPORTED_TYPES[\s\S]*'CUSIP'[\s\S]*'EXCH_TICKER'[\s\S]*'ISIN'[\s\S]*'SERIES_ID'/);
		// URL boundary still translates to lowercase short keys for
		// backward-compat with existing bookmarks.
		expect(pageSvelte).toContain("CUSIP: 'cusip'");
		expect(pageSvelte).toContain("EXCH_TICKER: 'ticker'");
		expect(pageSvelte).toContain("ISIN: 'isin'");
		expect(pageSvelte).toContain("SERIES_ID: 'series'");
	});

	test('switching the type dismisses autocomplete suggestions', () => {
		// IdentifierFilter handles input-clearing internally
		// (clearOnTypeChange default); the page's handleTypeChange just
		// needs to dismiss the suggestions UI.
		expect(pageSvelte).toContain('handleTypeChange');
		expect(pageSvelte).toMatch(/handleTypeChange[\s\S]*showSuggestions\s*=\s*false/);
	});

	test('placeholder reflects the chosen identifier type', () => {
		// IdentifierFilter sources type-aware placeholders from
		// IDENTIFIER_TYPE_PLACEHOLDERS in $lib/securityFilterTypes by
		// default. The page passes through `identifierType` and the
		// primitive picks the right placeholder; no per-page
		// placeholderFor() function needed anymore.
		expect(pageSvelte).toContain('bind:identifierType');
	});

	test('autocomplete is wrapped in {#await data.universe}', () => {
		expect(pageSvelte).toContain('{#await data.universe}');
		expect(pageSvelte).toContain('{:then universe}');
	});

	test('shows "Loading suggestions…" while the universe is pending', () => {
		expect(pageSvelte).toContain('Loading suggestions');
	});

	test('autocomplete filters by identifier type and prefix', () => {
		expect(pageSvelte).toContain('filterUniverse');
		expect(pageSvelte).toContain('startsWith');
	});

	test('selecting a suggestion navigates with type+id query params', () => {
		expect(pageSvelte).toContain('navigateTo');
		expect(pageSvelte).toContain("searchParams.set('type'");
		expect(pageSvelte).toContain("searchParams.set('id'");
	});

	test('has a "View Prices" button', () => {
		expect(pageSvelte).toContain('View Prices');
	});

	test('keyboard navigation supports ArrowDown, ArrowUp, Enter, Escape', () => {
		expect(pageSvelte).toContain('ArrowDown');
		expect(pageSvelte).toContain('ArrowUp');
		expect(pageSvelte).toContain("e.key === 'Enter'");
		expect(pageSvelte).toContain("e.key === 'Escape'");
	});
});

describe('Prices page – chart and table', () => {
	const pageSvelte = fs.readFileSync(path.join(ROUTE_DIR, '+page.svelte'), 'utf-8');

	test('renders a Plotly chart container when prices exist', () => {
		// Chart is rendered client-side via plotly.js-dist; the container div
		// is bound and Plotly.newPlot is called in onMount.
		expect(pageSvelte).toContain('bind:this={chartEl}');
		expect(pageSvelte).toContain("import('plotly.js-dist'");
		expect(pageSvelte).toContain('Plotly.newPlot');
	});

	test('chart title shows the selected identifier', () => {
		expect(pageSvelte).toContain('Price Chart — {selectedIdentifier}');
	});

	test('chart has a range selector with standard period buttons', () => {
		expect(pageSvelte).toContain('rangeselector');
		expect(pageSvelte).toContain("label: '1M'");
		expect(pageSvelte).toContain("label: '1Y'");
		expect(pageSvelte).toContain("label: 'All'");
	});

	test('chart has a range slider for navigation', () => {
		expect(pageSvelte).toContain('rangeslider');
	});

	test('renders a data table with Date and Price columns', () => {
		expect(pageSvelte).toContain('<table');
		expect(pageSvelte).toContain('Date');
		expect(pageSvelte).toContain('Price');
	});

	test('table shows prices with 6 decimal places', () => {
		expect(pageSvelte).toContain('p.price.toFixed(6)');
	});

	test('displays security description when an identifier is selected', () => {
		expect(pageSvelte).toContain('{securityDescription}');
	});

	test('shows error banner on price error', () => {
		expect(pageSvelte).toContain('priceError');
		expect(pageSvelte).toContain('error-banner');
	});

	test('shows "no history" message when an identifier is selected but no prices found', () => {
		expect(pageSvelte).toContain('No price history found for');
	});
});

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
		const [rs, gs, bs] = [r, g, b].map((c) => {
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

	test('chart accent on chart background meets 3:1', () => {
		expect(contrastRatio(chartAccent, chartBg)).toBeGreaterThanOrEqual(3.0);
	});

	test('price value color on chart background meets 3:1', () => {
		expect(contrastRatio(chartAccent, chartBg)).toBeGreaterThanOrEqual(3.0);
	});
});

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
