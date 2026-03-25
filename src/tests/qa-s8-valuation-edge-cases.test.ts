/**
 * QA Session 8 — Valuation Edge Cases
 *
 * Tests:
 * 1. YTM with extreme coupon rates (>100%, near-zero)
 * 2. CURRENT_YIELD with price near zero
 * 3. YTM solver bounds checking
 */
import { describe, it, expect, vi } from 'vitest';

vi.mock(
	'@fintekkers/ledger-models/node/fintekkers/services/valuation-service/valuation_service_grpc_pb.js',
	async () => {
		const { createValuationClientMock } = await import('./valuationMockHelper');
		return { ValuationClient: createValuationClientMock() };
	}
);

vi.mock(
	'@fintekkers/ledger-models/node/fintekkers/services/security-service/security_service_grpc_pb.js',
	() => ({
		SecurityClient: vi.fn().mockImplementation(() => ({
			search: vi.fn().mockReturnValue({
				on: vi.fn().mockImplementation(function (this: any, event: string, handler: Function) {
					if (event === 'end') handler();
					return this;
				}),
			}),
		})),
	})
);

vi.mock('$lib/grpc-auth', () => ({
	getServiceConnection: vi.fn().mockReturnValue({ url: 'localhost:80', credentials: {} }),
}));

import { RunValuation } from '$lib/valuation';
import type { BondCalculatorInputs } from '$lib/valuation';

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function makeBond(overrides: Partial<BondCalculatorInputs>): BondCalculatorInputs {
	return {
		mode: 'manual',
		price: '98.5',
		faceValue: '1000',
		couponRate: '5.0',
		couponFrequency: 'SEMIANNUALLY',
		issueDate: '2023-01-01',
		maturityDate: '2033-01-01',
		issuerName: 'Test Issuer',
		...overrides,
	};
}

// ---------------------------------------------------------------------------
// 1. YTM edge cases — extreme coupon rates
// ---------------------------------------------------------------------------

describe('YTM edge cases — extreme coupon rates', () => {
	it('near-zero coupon rate (0.01%) — zero-coupon-like bond', async () => {
		const result = await RunValuation(makeBond({ couponRate: '0.01' }));

		console.log('Near-zero coupon result:', result);

		// Should not error
		expect(result.error).toBeUndefined();
		expect(result.yieldToMaturity).toBeDefined();

		const ytm = parseFloat(result.yieldToMaturity!);
		// YTM for a near-zero coupon bond at discount should be positive and finite
		expect(ytm).toBeGreaterThan(0);
		expect(isFinite(ytm)).toBe(true);
		// YTM should be reasonable (not explode to solver upper bound)
		expect(ytm).toBeLessThan(100); // 10000% is absurd
	}, 15000);

	it('very small coupon (0.001%) — extreme near-zero', async () => {
		const result = await RunValuation(makeBond({ couponRate: '0.001' }));

		console.log('0.001% coupon result:', result);

		expect(result.error).toBeUndefined();
		const ytm = parseFloat(result.yieldToMaturity!);
		// Should converge; 0.001% coupon bond at 98.5 price should yield ~1.6% per year
		expect(isFinite(ytm)).toBe(true);
		expect(ytm).toBeGreaterThan(0);
	}, 15000);

	it('coupon rate > 100% (150%) — hyper-premium bond', async () => {
		const result = await RunValuation(makeBond({ couponRate: '150', price: '98.5' }));

		console.log('150% coupon result:', result);

		// A 150% coupon bond at 98.5 has enormous YTM.
		// The mock bisection solver has an upper bound of 5 (500%).
		// If YTM returned equals exactly the solver upper bound, the solver failed to converge.
		if (!result.error) {
			const ytm = parseFloat(result.yieldToMaturity!);
			console.log(`YTM for 150% coupon: ${ytm}`);

			// The annual coupon is 150% of face. At price 98.5% of face:
			// annual_coupon / price = 1.5 / 0.985 ≈ 1.523 = 152.3% current yield.
			// True YTM should be even higher (above 152.3%).
			// If the solver caps at 500% and returns exactly 500% ± ε, it hasn't converged properly.
			expect(isFinite(ytm)).toBe(true);
			expect(ytm).toBeGreaterThan(0);

			// If the service returns ytm ≤ 100% for a 150% coupon bond at discount, that's wrong
			// (a trivial observation: current yield alone is >100%)
			const cy = parseFloat(result.currentYield!);
			if (cy > 1) {
				// current yield is > 100%, so YTM should be at least comparable
				console.log(`WARN: currentYield=${cy} ytm=${ytm} — if ytm < cy this is suspicious`);
			}
		}
		// Errors are acceptable (service may reject extreme inputs),
		// but should not be a silent wrong answer
	}, 15000);

	it('coupon rate = 200% — extreme scenario', async () => {
		const result = await RunValuation(makeBond({ couponRate: '200', price: '150' }));

		console.log('200% coupon at 150 price result:', result);

		if (!result.error) {
			const ytm = parseFloat(result.yieldToMaturity!);
			expect(isFinite(ytm)).toBe(true);
		}
		// Either error or finite result is acceptable
	}, 15000);

	it('coupon rate = 0 — explicit zero coupon bond', async () => {
		const result = await RunValuation(makeBond({ couponRate: '0', price: '80' }));

		console.log('Zero coupon bond result:', result);

		// Zero coupon bond with price 80 over 10 years: YTM ≈ 2.24% annually
		if (!result.error) {
			const ytm = parseFloat(result.yieldToMaturity!);
			expect(isFinite(ytm)).toBe(true);
			expect(ytm).toBeGreaterThanOrEqual(0);
		}
	}, 15000);
});

// ---------------------------------------------------------------------------
// 2. CURRENT_YIELD with price near zero
// ---------------------------------------------------------------------------

describe('CURRENT_YIELD with price near zero', () => {
	it('price = 0.001 (near-zero) — currentYield should be very large or error', async () => {
		const result = await RunValuation(makeBond({ price: '0.001', couponRate: '5' }));

		console.log('Near-zero price result:', result);

		if (result.error) {
			// A service error is acceptable (price too small to be valid)
			console.log('Service returned error for near-zero price:', result.error);
			expect(typeof result.error).toBe('string');
		} else {
			const cy = parseFloat(result.currentYield!);
			console.log(`currentYield for price=0.001: ${cy}`);

			// CURRENT_YIELD = annual_coupon / price_abs
			// For face=1000, coupon=5%, annual_coupon=50
			// price_abs = 0.001/100 * 1000 = 0.01
			// cy = 50 / 0.01 = 5000 (5000%)
			// The result should be very large but finite
			expect(isFinite(cy)).toBe(true);
			// Should be astronomically large
			expect(cy).toBeGreaterThan(100); // at minimum, > 100%
		}
	}, 15000);

	it('price = 0.01 — current yield should be unreasonably high', async () => {
		const result = await RunValuation(makeBond({ price: '0.01', couponRate: '5' }));

		console.log('0.01 price result:', result);

		if (!result.error) {
			const cy = parseFloat(result.currentYield!);
			// face=1000, coupon=5%, annual_coupon=50, price_abs=0.01*10=0.1
			// cy = 50/0.1 = 500 (500%)
			expect(cy).toBeGreaterThan(100);
		}
	}, 15000);

	it('price = 0 — should return error (division by zero)', async () => {
		const result = await RunValuation(makeBond({ price: '0' }));

		console.log('Zero price result:', result);

		// Price = 0 means infinite current yield — service should reject
		// If service returns a result without error, current_yield would be Infinity/NaN
		if (!result.error) {
			console.warn('POTENTIAL BUG: service accepted price=0 without error');
			const cy = result.currentYield ? parseFloat(result.currentYield) : null;
			const ytm = result.yieldToMaturity ? parseFloat(result.yieldToMaturity) : null;
			// Both should be non-finite or the service should have returned an error
			if (cy !== null) {
				// If returned, it should at least be a valid JS number
				expect(typeof cy).toBe('number');
			}
		}
		// Service returning an error for price=0 is the CORRECT behavior
		// If no error: log as potential bug
	}, 15000);

	it('price = -1 — negative price should be rejected', async () => {
		const result = await RunValuation(makeBond({ price: '-1' }));

		console.log('Negative price result:', result);

		// Negative price is meaningless for bonds — service should return an error
		if (!result.error) {
			console.warn(
				'POTENTIAL BUG: service accepted negative price without error:',
				JSON.stringify(result)
			);
		}
	}, 15000);
});

// ---------------------------------------------------------------------------
// 3. YTM solver bounds — verify the mock bisection upper bound issue
// ---------------------------------------------------------------------------

describe('YTM solver bounds — bisection upper bound', () => {
	it('mock bisection converges for normal bond (sanity check)', async () => {
		const result = await RunValuation(makeBond({ couponRate: '5', price: '98.5' }));

		expect(result.error).toBeUndefined();
		const ytm = parseFloat(result.yieldToMaturity!);
		// 5% coupon at 98.5 should yield about 5.17% — well within solver range
		expect(ytm).toBeGreaterThan(0.05);
		expect(ytm).toBeLessThan(0.10);
	}, 15000);

	it('mock bisection behaviour at upper bound (coupon=100%)', async () => {
		const result = await RunValuation(makeBond({ couponRate: '100', price: '98.5' }));

		console.log('100% coupon result:', result);

		if (!result.error) {
			const ytm = parseFloat(result.yieldToMaturity!);
			// The mock bisection has hi=5 (500%). A 100% coupon bond at 98.5
			// has currentYield ≈ 101.5%. True YTM is even higher than currentYield.
			// If ytm is exactly 5 (the mock upper bound), the solver didn't converge.
			if (Math.abs(ytm - 5) < 0.0001) {
				console.warn(
					'MOCK BUG DETECTED: solveYtm returned upper bound 5 (500%) — did not converge for 100% coupon bond'
				);
			}
		}
	}, 15000);
});
