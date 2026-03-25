/**
 * QA tests for the Bond Calculator cashflow schedule display.
 *
 * DEPENDENCY: Requires ui-dev to implement the cashflow schedule table in BondCalculator.
 * These tests verify acceptance criteria for the cashflow feature.
 *
 * Prerequisites:
 * - valuation-service running on port 8080 (with cashflow support)
 * - ui-service running on port 443
 * - @fintekkers/ledger-models updated with CashflowProto
 *
 * Test bond: 5% coupon, semi-annual, face $1000, maturity 2030-01-15,
 *            settlement 2026-03-19, price 100 (at par)
 * Expected: 8 semiannual coupon periods from settlement to maturity
 */
import { describe, expect, test, vi } from 'vitest';

vi.mock('@fintekkers/ledger-models/node/fintekkers/services/valuation-service/valuation_service_grpc_pb.js', async () => {
	const { createValuationClientMock } = await import('./valuationMockHelper');
	return { ValuationClient: createValuationClientMock() };
});

vi.mock('$lib/grpc-auth', () => ({
	getServiceConnection: vi.fn().mockReturnValue({ url: 'localhost:80', credentials: {} }),
}));

import { RunValuation } from '$lib/valuation';
import type { BondCalculatorInputs, ValuationResult, CashflowEntry } from '$lib/valuation';

// ============================================================================
// Test bond: 5% semiannual, face $1000, maturity 2030-01-15
// Settlement 2026-03-19 → ~3.8 years → 8 semiannual periods
// (Jul 2026, Jan 2027, Jul 2027, Jan 2028, Jul 2028, Jan 2029, Jul 2029, Jan 2030)
// ============================================================================
const TEST_BOND: BondCalculatorInputs = {
	mode: 'manual',
	price: '100',
	faceValue: '1000',
	couponRate: '5',
	couponFrequency: 'SEMIANNUALLY',
	maturityDate: '2030-01-15',
};

describe('Bond Calculator – Cashflow Schedule', () => {
	// =========================================================================
	// AC1: Bond calculator shows a cashflow schedule table when valuation is run
	// =========================================================================
	test('RunValuation result includes cashflows array', async () => {
		const result = await RunValuation(TEST_BOND);

		expect(result.error).toBeUndefined();
		expect(result.cashflows).toBeDefined();
		expect(Array.isArray(result.cashflows)).toBe(true);
	}, 30000);

	// =========================================================================
	// AC2: Cashflow table has correct columns: Date, Future Value, Present Value
	// =========================================================================
	test('Each cashflow entry has date, fvAmount, and pvAmount fields', async () => {
		const result = await RunValuation(TEST_BOND);
		const cashflows = result.cashflows!;

		expect(cashflows).toBeDefined();
		expect(cashflows.length).toBeGreaterThan(0);

		for (const cf of cashflows) {
			expect(cf).toHaveProperty('date');
			expect(cf).toHaveProperty('fvAmount');
			expect(cf).toHaveProperty('pvAmount');

			// All fields should be populated strings
			expect(cf.date).toBeTruthy();
			expect(cf.fvAmount).toBeTruthy();
			expect(cf.pvAmount).toBeTruthy();
		}
	}, 30000);

	// =========================================================================
	// AC3: Number of cashflow rows matches expected coupon periods
	// =========================================================================
	test('5% semiannual bond maturing 2030-01-15 from 2026-03-19 has 8 cashflow rows', async () => {
		const result = await RunValuation(TEST_BOND);
		const cashflows = result.cashflows!;

		expect(cashflows).toBeDefined();
		// 8 semiannual periods: Jul-2026, Jan-2027, Jul-2027, Jan-2028,
		//                       Jul-2028, Jan-2029, Jul-2029, Jan-2030
		expect(cashflows.length).toBe(8);
	}, 30000);

	// =========================================================================
	// AC4: PV total in cashflow table matches Present Value in main results
	// =========================================================================
	test('Sum of cashflow present values matches main presentValue result', async () => {
		const result = await RunValuation(TEST_BOND);
		const cashflows = result.cashflows!;

		expect(cashflows).toBeDefined();
		expect(result.presentValue).toBeDefined();

		const pvTotal = cashflows.reduce(
			(sum: number, cf: CashflowEntry) => sum + parseFloat(cf.pvAmount),
			0
		);
		const mainPV = parseFloat(result.presentValue!);

		// presentValue is returned as % of par; cashflows are in dollar terms.
		// Scale: mainPV (% of par) * faceValue / 100 = dollar PV
		const faceValue = parseFloat(TEST_BOND.faceValue ?? '1000');
		const mainPVDollars = mainPV * faceValue / 100;

		// Allow small floating-point tolerance
		expect(pvTotal).toBeCloseTo(mainPVDollars, 2);
	}, 30000);

	// =========================================================================
	// AC5: Concrete bond verification (same as AC3, detailed check)
	// =========================================================================
	test('Cashflow future values: coupon payments + final principal', async () => {
		const result = await RunValuation(TEST_BOND);
		const cashflows = result.cashflows!;

		expect(cashflows).toBeDefined();
		expect(cashflows.length).toBe(8);

		// Semiannual coupon = 5% * 1000 / 2 = $25 per period
		const periodicCoupon = 25;

		// First 7 rows should be coupon-only
		for (let i = 0; i < cashflows.length - 1; i++) {
			const fv = parseFloat(cashflows[i].fvAmount);
			expect(fv).toBeCloseTo(periodicCoupon, 1);
		}

		// Last row should be coupon + principal = 25 + 1000 = 1025
		const lastFv = parseFloat(cashflows[cashflows.length - 1].fvAmount);
		expect(lastFv).toBeCloseTo(periodicCoupon + 1000, 1);
	}, 30000);

	// =========================================================================
	// AC6a: No empty rows, no NaN values
	// =========================================================================
	test('No empty rows or NaN values in cashflow data', async () => {
		const result = await RunValuation(TEST_BOND);
		const cashflows = result.cashflows!;

		expect(cashflows).toBeDefined();
		expect(cashflows.length).toBeGreaterThan(0);

		for (let i = 0; i < cashflows.length; i++) {
			const cf = cashflows[i];

			// No empty/undefined fields
			expect(cf.date).toBeTruthy();
			expect(cf.fvAmount).toBeTruthy();
			expect(cf.pvAmount).toBeTruthy();

			// No NaN values
			const fv = parseFloat(cf.fvAmount);
			const pv = parseFloat(cf.pvAmount);
			expect(isNaN(fv)).toBe(false);
			expect(isNaN(pv)).toBe(false);

			// Values should be positive
			expect(fv).toBeGreaterThan(0);
			expect(pv).toBeGreaterThan(0);

			// PV should be <= FV (discounting reduces value)
			expect(pv).toBeLessThanOrEqual(fv + 0.01);
		}
	}, 30000);

	// =========================================================================
	// AC6b: Dates are in chronological order
	// =========================================================================
	test('Cashflow dates are in chronological order', async () => {
		const result = await RunValuation(TEST_BOND);
		const cashflows = result.cashflows!;

		expect(cashflows).toBeDefined();
		expect(cashflows.length).toBeGreaterThan(1);

		for (let i = 1; i < cashflows.length; i++) {
			const prevDate = new Date(cashflows[i - 1].date);
			const currDate = new Date(cashflows[i].date);
			expect(currDate.getTime()).toBeGreaterThan(prevDate.getTime());
		}
	}, 30000);

	// =========================================================================
	// Additional: PV decreases for later cashflows (discounting effect)
	// =========================================================================
	test('Present values of equal coupons decrease over time (discount effect)', async () => {
		const result = await RunValuation(TEST_BOND);
		const cashflows = result.cashflows!;

		expect(cashflows).toBeDefined();

		// For coupon-only periods (not the last which includes principal),
		// PV should decrease as we go further into the future
		for (let i = 1; i < cashflows.length - 1; i++) {
			const prevPV = parseFloat(cashflows[i - 1].pvAmount);
			const currPV = parseFloat(cashflows[i].pvAmount);
			expect(currPV).toBeLessThan(prevPV + 0.01);
		}
	}, 30000);
});
