/**
 * Bond Pricing Consistency tests — mocks ValuationClient so no running service needed.
 *
 * Tests the critical three-way invariant: PV == sum(cashflow_PVs).
 */
import { describe, expect, test, vi } from 'vitest';

vi.mock('@fintekkers/ledger-models/node/fintekkers/services/valuation-service/valuation_service_grpc_pb.js', async () => {
	const { createValuationClientMock } = await import('./valuationMockHelper');
	return { ValuationClient: createValuationClientMock() };
});

vi.mock('$lib/grpc-auth', () => ({
	getServiceConnection: vi.fn().mockReturnValue({ url: 'localhost:80', credentials: {} }),
}));
import { RunValuation, RunTipsValuation } from '$lib/valuation';
import type {
	BondCalculatorInputs,
	ValuationResult,
	CashflowEntry,
	TipsCalculatorInputs,
	TipsValuationResult,
} from '$lib/valuation';

// =============================================================================
// Quant-dev Scenario A: Par Bond (coupon = yield = 5%)
// Source: tests/scenarios/scenario_a_par_bond.md
// 5% semi-annual, face=100, 4yr maturity 2030-01-15, price=100
// On coupon date: PV=100.00 exactly. Between coupon dates: PV ≈ 100.
// =============================================================================
const QD_SCENARIO_A: BondCalculatorInputs = {
	mode: 'manual',
	price: '100',
	faceValue: '100',
	couponRate: '5',
	couponFrequency: 'SEMIANNUALLY',
	maturityDate: '2030-01-15',
};

// =============================================================================
// Quant-dev Scenario B: Discount Bond (price=92.56, exact YTM=6%)
// Source: tests/scenarios/scenario_b_discount_bond.md
// 5% semi-annual, face=100, 10yr maturity 2036-01-15, price=92.5613
// PV should reproduce input price (after YTM fix).
// =============================================================================
const QD_SCENARIO_B: BondCalculatorInputs = {
	mode: 'manual',
	price: '92.5613',
	faceValue: '100',
	couponRate: '5',
	couponFrequency: 'SEMIANNUALLY',
	maturityDate: '2036-01-15',
};

// =============================================================================
// Quant-dev Scenario C: Premium Bond (price=108.18, exact YTM=4%)
// Source: tests/scenarios/scenario_c_premium_bond.md
// 5% semi-annual, face=100, 10yr maturity 2036-01-15, price=108.1757
// PV should reproduce input price (after YTM fix).
// =============================================================================
const QD_SCENARIO_C: BondCalculatorInputs = {
	mode: 'manual',
	price: '108.1757',
	faceValue: '100',
	couponRate: '5',
	couponFrequency: 'SEMIANNUALLY',
	maturityDate: '2036-01-15',
};

// =============================================================================
// Quant-dev Scenario E: TIPS Bond (2% real coupon, inflation-adjusted)
// Source: tests/scenarios/scenario_e_tips_bond.md
// 2% semi-annual TIPS, face=100, 5yr maturity 2031-01-15, price=100 (real)
// base CPI=256.394, current CPI=265.015, index_ratio=1.033617
// =============================================================================
const QD_SCENARIO_E: TipsCalculatorInputs = {
	mode: 'manual',
	price: '100',
	faceValue: '100',
	realCouponRate: '2',
	couponFrequency: 'SEMIANNUALLY',
	maturityDate: '2031-01-15',
	currentCpi: '265.015',
	referenceCpi: '256.394',
};

// =============================================================================
// Original scenarios (from earlier valuation-service tests)
// =============================================================================

// Original A: 5% $100 face discount at 98.5 (from cashflow_schedule_test.rs)
const ORIG_DISCOUNT: BondCalculatorInputs = {
	mode: 'manual',
	price: '98.5',
	faceValue: '100',
	couponRate: '5',
	couponFrequency: 'SEMIANNUALLY',
	maturityDate: '2030-01-15',
};

// Original B: 5% $1000 at par (from present_value_test.rs)
const ORIG_PAR_1000: BondCalculatorInputs = {
	mode: 'manual',
	price: '100',
	faceValue: '1000',
	couponRate: '5',
	couponFrequency: 'SEMIANNUALLY',
	maturityDate: '2030-01-15',
};

// Original C: 8% $1000 at par
const ORIG_8PCT: BondCalculatorInputs = {
	mode: 'manual',
	price: '100',
	faceValue: '1000',
	couponRate: '8',
	couponFrequency: 'SEMIANNUALLY',
	maturityDate: '2030-01-15',
};

// Helper: sum cashflow PV amounts and convert to quoted price (% of par)
function cashflowPvSumQuoted(cashflows: CashflowEntry[], faceValue: number): number {
	const pvSumDollar = cashflows.reduce((sum, cf) => sum + parseFloat(cf.pvAmount), 0);
	const priceScaleFactor = faceValue / 100;
	return pvSumDollar / priceScaleFactor;
}

// =====================================================================
// QUANT-DEV SCENARIO A: Par Bond
// =====================================================================
describe('QD Scenario A – Par Bond (5% coupon, face=100, price=100)', () => {
	test('Valuation succeeds with cashflows', async () => {
		const result = await RunValuation(QD_SCENARIO_A);
		expect(result.error).toBeUndefined();
		expect(result.presentValue).toBeDefined();
		expect(result.cashflows).toBeDefined();
		expect(result.cashflows!.length).toBe(8);
	}, 30000);

	test('PV ≈ 100 for at-par bond', async () => {
		const result = await RunValuation(QD_SCENARIO_A);
		const pv = parseFloat(result.presentValue!);
		// At par: PV should be ~100 (may differ slightly due to between-coupon-date settlement)
		expect(pv).toBeCloseTo(100, 0);
	}, 30000);

	test('Coupon FV = $2.50, final FV = $102.50', async () => {
		const result = await RunValuation(QD_SCENARIO_A);
		const cashflows = result.cashflows!;

		for (let i = 0; i < 7; i++) {
			expect(parseFloat(cashflows[i].fvAmount)).toBeCloseTo(2.50, 2);
		}
		expect(parseFloat(cashflows[7].fvAmount)).toBeCloseTo(102.50, 2);
	}, 30000);

	test('CRITICAL: PV == sum(cashflow PVs)', async () => {
		const result = await RunValuation(QD_SCENARIO_A);
		const pvQuoted = parseFloat(result.presentValue!);
		const pvSumQuoted = cashflowPvSumQuoted(result.cashflows!, 100);
		expect(pvSumQuoted).toBeCloseTo(pvQuoted, 1);
	}, 30000);

	test('YTM ≈ 5% for at-par bond', async () => {
		const result = await RunValuation(QD_SCENARIO_A);
		const ytm = parseFloat(result.yieldToMaturity!);
		expect(ytm).toBeCloseTo(0.05, 2);
	}, 30000);

	test('Current yield ≈ 5% for at-par bond', async () => {
		const result = await RunValuation(QD_SCENARIO_A);
		const cy = parseFloat(result.currentYield!);
		expect(cy).toBeCloseTo(0.05, 2);
	}, 30000);
});

// =====================================================================
// QUANT-DEV SCENARIO B: Discount Bond
// =====================================================================
describe('QD Scenario B – Discount Bond (5% coupon, face=100, price=92.56, YTM≈6%)', () => {
	test('Valuation succeeds with 20 cashflow periods', async () => {
		const result = await RunValuation(QD_SCENARIO_B);
		expect(result.error).toBeUndefined();
		expect(result.presentValue).toBeDefined();
		expect(result.cashflows).toBeDefined();
		// 10 years * 2 = 20 semiannual periods
		expect(result.cashflows!.length).toBe(20);
	}, 30000);

	test('PV is near input price (~92.56)', async () => {
		const result = await RunValuation(QD_SCENARIO_B);
		const pv = parseFloat(result.presentValue!);
		// With YTM bug fixed, PV should be close to the input price
		// Allow tolerance for between-coupon-date settlement
		expect(pv).toBeGreaterThan(90);
		expect(pv).toBeLessThan(95);
	}, 30000);

	test('Coupon FV = $2.50, final FV = $102.50', async () => {
		const result = await RunValuation(QD_SCENARIO_B);
		const cashflows = result.cashflows!;

		for (let i = 0; i < 19; i++) {
			expect(parseFloat(cashflows[i].fvAmount)).toBeCloseTo(2.50, 2);
		}
		expect(parseFloat(cashflows[19].fvAmount)).toBeCloseTo(102.50, 2);
	}, 30000);

	test('CRITICAL: PV == sum(cashflow PVs)', async () => {
		const result = await RunValuation(QD_SCENARIO_B);
		const pvQuoted = parseFloat(result.presentValue!);
		const pvSumQuoted = cashflowPvSumQuoted(result.cashflows!, 100);
		expect(pvSumQuoted).toBeCloseTo(pvQuoted, 1);
	}, 30000);

	test('YTM > coupon rate (discount bond)', async () => {
		const result = await RunValuation(QD_SCENARIO_B);
		const ytm = parseFloat(result.yieldToMaturity!);
		// Discount bond: YTM > coupon rate (5%)
		expect(ytm).toBeGreaterThan(0.05);
		// Should be near 6% per quant-dev scenario
		expect(ytm).toBeCloseTo(0.06, 1);
	}, 30000);

	test('Cashflow dates span ~10 years with ~6-month spacing', async () => {
		const result = await RunValuation(QD_SCENARIO_B);
		const cashflows = result.cashflows!;

		for (let i = 1; i < cashflows.length; i++) {
			const prev = new Date(cashflows[i - 1].date);
			const curr = new Date(cashflows[i].date);
			const daysDiff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
			expect(daysDiff).toBeGreaterThan(150);
			expect(daysDiff).toBeLessThan(200);
		}

		const last = new Date(cashflows[19].date);
		expect(last.getFullYear()).toBe(2036);
		expect(last.getMonth()).toBe(0); // January
	}, 30000);
});

// =====================================================================
// QUANT-DEV SCENARIO C: Premium Bond
// =====================================================================
describe('QD Scenario C – Premium Bond (5% coupon, face=100, price=108.18, YTM≈4%)', () => {
	test('Valuation succeeds with 20 cashflow periods', async () => {
		const result = await RunValuation(QD_SCENARIO_C);
		expect(result.error).toBeUndefined();
		expect(result.presentValue).toBeDefined();
		expect(result.cashflows).toBeDefined();
		expect(result.cashflows!.length).toBe(20);
	}, 30000);

	test('PV is near input price (~108.18)', async () => {
		const result = await RunValuation(QD_SCENARIO_C);
		const pv = parseFloat(result.presentValue!);
		// Premium bond PV should be above par
		expect(pv).toBeGreaterThan(105);
		expect(pv).toBeLessThan(112);
	}, 30000);

	test('CRITICAL: PV == sum(cashflow PVs)', async () => {
		const result = await RunValuation(QD_SCENARIO_C);
		const pvQuoted = parseFloat(result.presentValue!);
		const pvSumQuoted = cashflowPvSumQuoted(result.cashflows!, 100);
		expect(pvSumQuoted).toBeCloseTo(pvQuoted, 1);
	}, 30000);

	test('YTM < coupon rate (premium bond)', async () => {
		const result = await RunValuation(QD_SCENARIO_C);
		const ytm = parseFloat(result.yieldToMaturity!);
		// Premium bond: YTM < coupon rate (5%)
		expect(ytm).toBeLessThan(0.05);
		// Should be near 4% per quant-dev scenario
		expect(ytm).toBeCloseTo(0.04, 1);
	}, 30000);
});

// =====================================================================
// QUANT-DEV SCENARIO E: TIPS Bond
// =====================================================================
describe('QD Scenario E – TIPS Bond (2% real coupon, inflation-adjusted)', () => {
	test('Valuation succeeds with cashflows', async () => {
		const result = await RunTipsValuation(QD_SCENARIO_E);
		expect(result.error).toBeUndefined();
		expect(result.presentValue).toBeDefined();
		expect(result.cashflows).toBeDefined();
		// 5 years * 2 = 10 semiannual periods
		expect(result.cashflows!.length).toBe(10);
	}, 30000);

	test('Index ratio is correct (265.015 / 256.394 ≈ 1.0336)', async () => {
		const result = await RunTipsValuation(QD_SCENARIO_E);
		expect(result.indexRatio).toBeDefined();
		const ir = parseFloat(result.indexRatio!);
		expect(ir).toBeCloseTo(265.015 / 256.394, 4);
	}, 30000);

	test('Inflation-adjusted coupon FV ≈ $1.034 (2% * 103.36 / 2)', async () => {
		const result = await RunTipsValuation(QD_SCENARIO_E);
		const cashflows = result.cashflows!;
		const adjustedPrincipal = 100 * (265.015 / 256.394); // ≈ 103.3617
		const expectedCoupon = 0.02 * adjustedPrincipal / 2; // ≈ 1.033617

		// First coupon should be inflation-adjusted
		const firstFv = parseFloat(cashflows[0].fvAmount);
		expect(firstFv).toBeCloseTo(expectedCoupon, 1);
	}, 30000);

	test('Final cashflow includes adjusted principal', async () => {
		const result = await RunTipsValuation(QD_SCENARIO_E);
		const cashflows = result.cashflows!;
		const adjustedPrincipal = 100 * (265.015 / 256.394);
		const expectedCoupon = 0.02 * adjustedPrincipal / 2;
		const expectedFinal = expectedCoupon + adjustedPrincipal;

		const lastFv = parseFloat(cashflows[cashflows.length - 1].fvAmount);
		expect(lastFv).toBeCloseTo(expectedFinal, 0);
	}, 30000);

	test('CRITICAL: PV == sum(cashflow PVs)', async () => {
		const result = await RunTipsValuation(QD_SCENARIO_E);
		const cashflows = result.cashflows!;
		const pvQuoted = parseFloat(result.presentValue!);
		const pvSumQuoted = cashflowPvSumQuoted(cashflows, 100);
		expect(pvSumQuoted).toBeCloseTo(pvQuoted, 1);
	}, 30000);
});

// =====================================================================
// ORIGINAL SCENARIOS (retained from earlier valuation-service tests)
// =====================================================================
describe('Original Scenarios – Retained for regression', () => {
	test('5% $100 face discount (98.5): PV == sum(CF PVs)', async () => {
		const result = await RunValuation(ORIG_DISCOUNT);
		expect(result.error).toBeUndefined();
		const pvQuoted = parseFloat(result.presentValue!);
		const pvSumQuoted = cashflowPvSumQuoted(result.cashflows!, 100);
		expect(pvSumQuoted).toBeCloseTo(pvQuoted, 1);
	}, 30000);

	test('5% $1000 at par: PV ≈ 100, PV == sum(CF PVs)', async () => {
		const result = await RunValuation(ORIG_PAR_1000);
		expect(result.error).toBeUndefined();
		expect(parseFloat(result.presentValue!)).toBeCloseTo(100, 0);
		const pvSumQuoted = cashflowPvSumQuoted(result.cashflows!, 1000);
		expect(pvSumQuoted).toBeCloseTo(parseFloat(result.presentValue!), 1);
	}, 30000);

	test('8% $1000 at par: PV ≈ 100, PV == sum(CF PVs)', async () => {
		const result = await RunValuation(ORIG_8PCT);
		expect(result.error).toBeUndefined();
		expect(parseFloat(result.presentValue!)).toBeCloseTo(100, 0);
		const pvSumQuoted = cashflowPvSumQuoted(result.cashflows!, 1000);
		expect(pvSumQuoted).toBeCloseTo(parseFloat(result.presentValue!), 1);
	}, 30000);
});

// =====================================================================
// CROSS-SCENARIO INVARIANTS
// =====================================================================
describe('Cross-scenario invariants', () => {
	test('Higher coupon at par → shorter duration (5% vs 8%)', async () => {
		const [r5, r8] = await Promise.all([
			RunValuation(ORIG_PAR_1000),
			RunValuation(ORIG_8PCT),
		]);
		const dur5 = parseFloat(r5.macaulayDuration!);
		const dur8 = parseFloat(r8.macaulayDuration!);
		expect(dur8).toBeLessThan(dur5);
	}, 30000);

	test('Discount bond YTM > coupon > premium bond YTM', async () => {
		const [discount, premium] = await Promise.all([
			RunValuation(QD_SCENARIO_B),
			RunValuation(QD_SCENARIO_C),
		]);
		const ytmDiscount = parseFloat(discount.yieldToMaturity!);
		const ytmPremium = parseFloat(premium.yieldToMaturity!);
		// Discount YTM (~6%) > coupon (5%) > premium YTM (~4%)
		expect(ytmDiscount).toBeGreaterThan(0.05);
		expect(ytmPremium).toBeLessThan(0.05);
		expect(ytmDiscount).toBeGreaterThan(ytmPremium);
	}, 30000);

	test('All scenarios: three-way consistency check', async () => {
		const scenarios: { inputs: BondCalculatorInputs; face: number }[] = [
			{ inputs: QD_SCENARIO_A, face: 100 },
			{ inputs: QD_SCENARIO_B, face: 100 },
			{ inputs: QD_SCENARIO_C, face: 100 },
			{ inputs: ORIG_DISCOUNT, face: 100 },
			{ inputs: ORIG_PAR_1000, face: 1000 },
			{ inputs: ORIG_8PCT, face: 1000 },
		];

		const results = await Promise.all(scenarios.map(s => RunValuation(s.inputs)));

		for (let i = 0; i < results.length; i++) {
			const result = results[i];
			expect(result.error).toBeUndefined();
			const pvQuoted = parseFloat(result.presentValue!);
			const pvSumQuoted = cashflowPvSumQuoted(result.cashflows!, scenarios[i].face);
			expect(pvSumQuoted).toBeCloseTo(pvQuoted, 1);
		}
	}, 60000);
});
