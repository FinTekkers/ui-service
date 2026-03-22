/**
 * ISSUE #40: Verify prices page default CUSIP via gRPC and grpc-auth fix.
 *
 * Validates:
 * 1. +page.server.ts defaults to on-the-run 10Y Treasury via gRPC SearchSecurities
 * 2. grpc-auth.ts getServiceConnection() uses grpc.credentials.createInsecure()
 *    (not require(), which caused 'require is not defined' in ESM)
 */
import { describe, expect, test } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const PRICES_SERVER = path.resolve('src/routes/(authenticated)/data/prices/+page.server.ts');
const GRPC_AUTH = path.resolve('src/lib/grpc-auth.ts');

// =============================================================================
// 1. Default CUSIP logic in +page.server.ts — gRPC-based 10Y Treasury default
// =============================================================================
describe('Prices page – 10Y Treasury default via gRPC', () => {
	const src = fs.readFileSync(PRICES_SERVER, 'utf-8');

	test('+page.server.ts exists', () => {
		expect(fs.existsSync(PRICES_SERVER)).toBe(true);
	});

	test('exports an async load function', () => {
		expect(src).toContain('export async function load');
	});

	test('reads cusip from query params', () => {
		expect(src).toContain("searchParams.get('cusip')");
	});

	test('defaults to 10Y Treasury via SecurityService gRPC call when no cusip param', () => {
		expect(src).toContain('new SecurityService()');
		expect(src).toContain('searchSecurityAsOfNow');
	});

	test('default is applied only when selectedCusip is falsy', () => {
		expect(src).toContain('if (!selectedCusip)');
	});

	test('returns selectedCusip in the page data', () => {
		expect(src).toMatch(/return\s*\{[\s\S]*selectedCusip/);
	});
});

// =============================================================================
// 2. grpc-auth.ts – 'require is not defined' fix
// =============================================================================
describe('grpc-auth.ts – ESM-compatible credentials', () => {
	const src = fs.readFileSync(GRPC_AUTH, 'utf-8');

	test('grpc-auth.ts exists', () => {
		expect(fs.existsSync(GRPC_AUTH)).toBe(true);
	});

	test('does NOT use require() anywhere', () => {
		// require() breaks in ESM; the fix replaced it with grpc.credentials
		const requireCalls = src.match(/\brequire\s*\(/g);
		expect(requireCalls).toBeNull();
	});

	test('getServiceConnection uses grpc.credentials.createInsecure()', () => {
		// Extract the getServiceConnection function body
		const fnStart = src.indexOf('export function getServiceConnection');
		expect(fnStart).toBeGreaterThan(-1);
		const fnBody = src.slice(fnStart);
		expect(fnBody).toContain('grpc.credentials.createInsecure()');
	});

	test('imports grpc from @grpc/grpc-js (ESM import, not require)', () => {
		expect(src).toMatch(/import\s+grpc\s+from\s+['"]@grpc\/grpc-js['"]/);
	});

	test('getAuthClient also uses grpc.credentials.createInsecure()', () => {
		const fnStart = src.indexOf('function getAuthClient');
		expect(fnStart).toBeGreaterThan(-1);
		// Find the function's closing brace (after nested braces)
		const fnBody = src.slice(fnStart, fnStart + 600);
		expect(fnBody).toContain('grpc.credentials.createInsecure()');
	});
});
