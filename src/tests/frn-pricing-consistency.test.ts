// @vitest-environment node
/**
 * FRN (Floating Rate Note) Pricing Consistency Tests — UI layer
 *
 * Authoritative scenarios from quant-dev (tests/scenarios/scenario_{f,g,h}):
 *   - Scenario F: FRN at par (QM=DM=50bps) → PV = 100 exactly
 *   - Scenario G: FRN at discount (QM=50bps, DM=75bps) → PV ≈ 99.5257
 *   - Scenario H: FRN at premium (QM=50bps, DM=25bps) → PV ≈ 100.4769
 *
 * All scenarios: quarterly, 2yr maturity, R=4%, face=100.
 *
 * Refactored for #208: this file now exercises the UI's RunFrnValuation
 * function against a mocked ValuationClient (via valuationMockHelper).
 * Backend correctness is covered by valuation-service's own scenario_{f,g,h}
 * test suite. The UI tests verify:
 *   - Request shape is correct (#208 engine path).
 *   - Response measure values get mapped onto the typed FrnValuationResult.
 *   - Cashflow shape (8 periods, $1.125 / final $101.125 quarterly coupons)
 *     is preserved through the response parser.
 *   - The CRITICAL invariant PV == sum(cashflow PVs) holds.
 */
import { describe, expect, test, vi } from 'vitest';

vi.mock('@fintekkers/ledger-models/node/fintekkers/services/valuation-service/valuation_service_grpc_pb.js', async () => {
	const { createValuationClientMock } = await import('./valuationMockHelper');
	return { ValuationClient: createValuationClientMock() };
});

vi.mock('$lib/grpc-auth', () => ({
	getServiceConnection: vi.fn().mockReturnValue({ url: 'localhost:80', credentials: {} }),
}));

import { RunFrnValuation } from '$lib/valuation';
import type { FrnCalculatorInputs, FrnValuationResult } from '$lib/valuation';

// Scenarios as UI inputs. All quarterly 2yr starting from 2026-03-19, so
// maturity = 2028-01-15 → ~7 quarters elapsed at as_of date used by the
// mock ('2026-03-19'); periods derived from maturity → 8 quarters.
const SCENARIO_F: FrnCalculatorInputs = {
	mode: 'manual',
	price: '100',
	referenceRate: '4',     // % — matches mock expectation
	spread: '50',           // bps — quoted margin
	faceValue: '100',
	couponFrequency: 'QUARTERLY',
	maturityDate: '2028-01-15',
};

const SCENARIO_G: FrnCalculatorInputs = { ...SCENARIO_F, price: '99.5257' };
const SCENARIO_H: FrnCalculatorInputs = { ...SCENARIO_F, price: '100.4769' };

function pvQuotedFromCashflows(result: FrnValuationResult, faceValue: number): number {
	const cfs = result.cashflows ?? [];
	const pvSumDollar = cfs.reduce((sum, cf) => sum + parseFloat(cf.pvAmount), 0);
	return pvSumDollar / (faceValue / 100);
}

// =====================================================================
// SCENARIO F: FRN at Par (QM=DM=50bps)
// =====================================================================
describe('QD Scenario F – FRN at Par (QM=DM=50bps, R=4%, quarterly, 2yr)', () => {
	test('Valuation succeeds with 8 cashflow periods', async () => {
		const result = await RunFrnValuation(SCENARIO_F);
		expect(result.error).toBeUndefined();
		expect(result.presentValue).toBeDefined();
		expect(result.cashflows?.length).toBe(8);
	});

	test('PV = 100 for at-par FRN (QM=DM)', async () => {
		const result = await RunFrnValuation(SCENARIO_F);
		expect(parseFloat(result.presentValue!)).toBeCloseTo(100, 1);
	});

	test('CRITICAL: PV == sum(cashflow PVs)', async () => {
		const result = await RunFrnValuation(SCENARIO_F);
		const pvQuoted = parseFloat(result.presentValue!);
		const pvSumQuoted = pvQuotedFromCashflows(result, 100);
		expect(pvSumQuoted).toBeCloseTo(pvQuoted, 1);
	});

	test('sum(cashflow PVs) = 100 for at-par FRN', async () => {
		const result = await RunFrnValuation(SCENARIO_F);
		expect(pvQuotedFromCashflows(result, 100)).toBeCloseTo(100, 1);
	});

	test('Discount margin ≈ 50 bps for at-par FRN', async () => {
		const result = await RunFrnValuation(SCENARIO_F);
		expect(result.discountMargin).toBeDefined();
		// Mock returns DM in bps; UI exposes the raw string. At par DM≈QM=50bps.
		expect(parseFloat(result.discountMargin!)).toBeCloseTo(50, -1);
	});

	test('Coupon FV = $1.125 per period, final = $101.125', async () => {
		const result = await RunFrnValuation(SCENARIO_F);
		const cfs = result.cashflows!;
		for (let i = 0; i < 7; i++) {
			expect(parseFloat(cfs[i].fvAmount)).toBeCloseTo(1.125, 2);
		}
		expect(parseFloat(cfs[7].fvAmount)).toBeCloseTo(101.125, 2);
	});

	test('Cashflow dates are chronological with ~3-month spacing', async () => {
		const result = await RunFrnValuation(SCENARIO_F);
		const cfs = result.cashflows!;
		for (let i = 1; i < cfs.length; i++) {
			const prev = new Date(cfs[i - 1].date);
			const curr = new Date(cfs[i].date);
			expect(curr.getTime()).toBeGreaterThan(prev.getTime());
			const daysDiff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
			expect(daysDiff).toBeGreaterThan(80);
			expect(daysDiff).toBeLessThan(100);
		}
	});
});

// =====================================================================
// SCENARIO G: FRN at Discount (QM=50bps, DM=75bps)
// =====================================================================
describe('QD Scenario G – FRN at Discount (QM=50bps, DM=75bps)', () => {
	test('Valuation succeeds with 8 cashflow periods', async () => {
		const result = await RunFrnValuation(SCENARIO_G);
		expect(result.error).toBeUndefined();
		expect(result.presentValue).toBeDefined();
		expect(result.cashflows?.length).toBe(8);
	});

	test('PV ≈ 99.5257 (discount: DM > QM)', async () => {
		const result = await RunFrnValuation(SCENARIO_G);
		const pv = parseFloat(result.presentValue!);
		expect(pv).toBeGreaterThan(99.0);
		expect(pv).toBeLessThan(100.0);
	});

	test('CRITICAL: PV == sum(cashflow PVs)', async () => {
		const result = await RunFrnValuation(SCENARIO_G);
		const pvQuoted = parseFloat(result.presentValue!);
		const pvSumQuoted = pvQuotedFromCashflows(result, 100);
		expect(pvSumQuoted).toBeCloseTo(pvQuoted, 1);
	});

	test('Coupon FV = $1.125 per period (same QM)', async () => {
		const result = await RunFrnValuation(SCENARIO_G);
		const cfs = result.cashflows!;
		for (let i = 0; i < 7; i++) {
			expect(parseFloat(cfs[i].fvAmount)).toBeCloseTo(1.125, 2);
		}
		expect(parseFloat(cfs[7].fvAmount)).toBeCloseTo(101.125, 2);
	});
});

// =====================================================================
// SCENARIO H: FRN at Premium (QM=50bps, DM=25bps)
// =====================================================================
describe('QD Scenario H – FRN at Premium (QM=50bps, DM=25bps)', () => {
	test('Valuation succeeds with 8 cashflow periods', async () => {
		const result = await RunFrnValuation(SCENARIO_H);
		expect(result.error).toBeUndefined();
		expect(result.presentValue).toBeDefined();
		expect(result.cashflows?.length).toBe(8);
	});

	test('PV ≈ 100.4769 (premium: DM < QM)', async () => {
		const result = await RunFrnValuation(SCENARIO_H);
		const pv = parseFloat(result.presentValue!);
		expect(pv).toBeGreaterThan(100.0);
		expect(pv).toBeLessThan(101.0);
	});

	test('CRITICAL: PV == sum(cashflow PVs)', async () => {
		const result = await RunFrnValuation(SCENARIO_H);
		const pvQuoted = parseFloat(result.presentValue!);
		const pvSumQuoted = pvQuotedFromCashflows(result, 100);
		expect(pvSumQuoted).toBeCloseTo(pvQuoted, 1);
	});

	test('Coupon FV = $1.125 per period (same QM)', async () => {
		const result = await RunFrnValuation(SCENARIO_H);
		const cfs = result.cashflows!;
		for (let i = 0; i < 7; i++) {
			expect(parseFloat(cfs[i].fvAmount)).toBeCloseTo(1.125, 2);
		}
		expect(parseFloat(cfs[7].fvAmount)).toBeCloseTo(101.125, 2);
	});
});

// =====================================================================
// Cross-scenario invariants
// =====================================================================
describe('FRN cross-scenario invariants', () => {
	test('PV ordering: H (premium) > F (par) > G (discount)', async () => {
		const [f, g, h] = await Promise.all([
			RunFrnValuation(SCENARIO_F),
			RunFrnValuation(SCENARIO_G),
			RunFrnValuation(SCENARIO_H),
		]);
		const fPv = parseFloat(f.presentValue!);
		const gPv = parseFloat(g.presentValue!);
		const hPv = parseFloat(h.presentValue!);
		expect(hPv).toBeGreaterThan(fPv);
		expect(fPv).toBeGreaterThan(gPv);
	});
});
