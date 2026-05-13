/**
 * Behavioural checks for the prices page server load.
 *
 * Originally pinned to specific 10Y Treasury source strings (#40). After #186
 * the page supports any identifier type, so the assertions are now behavioural:
 * "load function exists, reads type+id from query string, returns the expected
 * shape, handles legacy ?cusip= alias."
 */
import { describe, expect, test } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const PRICES_SERVER = path.resolve('src/routes/(authenticated)/data/prices/+page.server.ts');
const GRPC_AUTH = path.resolve('src/lib/grpc-auth.ts');

describe('Prices page – server load behaviour', () => {
	const src = fs.readFileSync(PRICES_SERVER, 'utf-8');

	test('+page.server.ts exists', () => {
		expect(fs.existsSync(PRICES_SERVER)).toBe(true);
	});

	test('exports an async load function', () => {
		expect(src).toContain('export async function load');
	});

	test('reads identifier type from ?type query param', () => {
		expect(src).toContain("searchParams.get('type')");
	});

	test('reads identifier value from ?id query param', () => {
		expect(src).toContain("searchParams.get('id')");
	});

	test('preserves legacy ?cusip= query param as an alias', () => {
		expect(src).toContain("searchParams.get('cusip')");
	});

	test('returns selectedIdentifier and selectedIdentifierType in page data', () => {
		expect(src).toMatch(/return\s*\{[\s\S]*selectedIdentifier/);
		expect(src).toMatch(/return\s*\{[\s\S]*selectedIdentifierType/);
	});

	test('returns the universe as a streamed promise (un-awaited)', () => {
		// The universe must be returned as a Promise so SvelteKit streams it.
		// `load()` should NOT await FetchSecurityUniverse before returning.
		expect(src).toContain('FetchSecurityUniverse(');
		const universeLine = src.split('\n').find((l) => l.includes('FetchSecurityUniverse('));
		expect(universeLine).toBeDefined();
		expect(universeLine!).not.toMatch(/await\s+FetchSecurityUniverse/);
	});

	test('handles price fetch errors gracefully', () => {
		expect(src).toContain('priceError');
		expect(src).toContain('catch');
	});
});

describe('grpc-auth.ts – ESM-compatible credentials', () => {
	const src = fs.readFileSync(GRPC_AUTH, 'utf-8');

	test('grpc-auth.ts exists', () => {
		expect(fs.existsSync(GRPC_AUTH)).toBe(true);
	});

	test('does NOT use require() anywhere', () => {
		const requireCalls = src.match(/\brequire\s*\(/g);
		expect(requireCalls).toBeNull();
	});

	test('getServiceConnection uses grpc.credentials.createInsecure()', () => {
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
		// 1000-char window: #267 Phase 1 added a comment block + a third
		// constructor arg `{ interceptors: [getTenantInterceptor()] }`, which
		// pushed `createInsecure()` past the prior 600-char slice. The
		// substring assertion is unchanged — it still proves the auth
		// client is built with insecure credentials.
		const fnBody = src.slice(fnStart, fnStart + 1000);
		expect(fnBody).toContain('grpc.credentials.createInsecure()');
	});
});
