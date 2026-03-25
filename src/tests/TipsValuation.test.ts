/**
 * TIPS Valuation tests — mocks ValuationClient so no running service needed.
 *
 * @vitest-environment node
 */
import { describe, expect, test, vi } from 'vitest';

vi.mock('@fintekkers/ledger-models/node/fintekkers/services/valuation-service/valuation_service_grpc_pb.js', async () => {
	const { createValuationClientMock } = await import('./valuationMockHelper');
	return { ValuationClient: createValuationClientMock() };
});

vi.mock('$lib/grpc-auth', () => ({
	getServiceConnection: vi.fn().mockReturnValue({ url: 'localhost:80', credentials: {} }),
}));

import { RunTipsValuation } from '$lib/valuation';
import type { TipsCalculatorInputs, TipsValuationResult } from '$lib/valuation';

const TIPS_BOND: TipsCalculatorInputs = {
	mode: 'manual',
	price: '100',
	currentCpi: '314.175',
	settlementDate: '2026-03-19',
	faceValue: '100',
	realCouponRate: '0.625',
	couponFrequency: 'SEMIANNUALLY',
	referenceCpi: '256.394',
	issueDate: '2020-01-15',
	maturityDate: '2030-01-15',
};

describe('TIPS Valuation – 0.625% 2030-01-15 bond', () => {
	let result: TipsValuationResult;

	test('RunTipsValuation returns a result without error', async () => {
		result = await RunTipsValuation(TIPS_BOND);
		expect(result.error).toBeUndefined();
	}, 30_000);

	test('Inflation-Adjusted Principal is approximately 122.53', () => {
		expect(result.inflationAdjustedPrincipal).toBeDefined();
		const adjPrincipal = parseFloat(result.inflationAdjustedPrincipal!);
		// Index ratio = 314.175 / 256.394 = 1.22536
		// Adjusted principal = 100 * 1.22536 = 122.536
		expect(adjPrincipal).toBeCloseTo(122.536, 1);
	});

	test('Present Value (market value) is reasonable for par-priced TIPS', () => {
		expect(result.presentValue).toBeDefined();
		const pv = parseFloat(result.presentValue!);
		// At par price (100) with current market rates, PV should be near face value
		// Service returned ~99.48 in direct test
		expect(pv).toBeGreaterThan(90);
		expect(pv).toBeLessThan(110);
	});

	test('Macaulay Duration is approximately 3.8–4.0 years', () => {
		expect(result.macaulayDuration).toBeDefined();
		const duration = parseFloat(result.macaulayDuration!);
		// Low coupon (0.625%) means cash flows heavily weighted toward maturity
		// 8 semi-annual periods = 4 years max, so duration should be ~3.8–4.0
		// Service returned ~3.95 in direct test
		expect(duration).toBeGreaterThan(3.5);
		expect(duration).toBeLessThan(4.2);
	});

	test('Current Yield is positive', () => {
		expect(result.currentYield).toBeDefined();
		const cy = parseFloat(result.currentYield!);
		expect(cy).toBeGreaterThan(0);
	});

	test('Yield to Maturity is positive', () => {
		expect(result.yieldToMaturity).toBeDefined();
		const ytm = parseFloat(result.yieldToMaturity!);
		expect(ytm).toBeGreaterThan(0);
	});

	test('Real Yield is positive', () => {
		expect(result.realYield).toBeDefined();
		const ry = parseFloat(result.realYield!);
		expect(ry).toBeGreaterThan(0);
	});

	test('Index Ratio is computed client-side as currentCpi / referenceCpi', () => {
		expect(result.indexRatio).toBeDefined();
		const ratio = parseFloat(result.indexRatio!);
		const expected = 314.175 / 256.394;
		expect(ratio).toBeCloseTo(expected, 4);
	});
});

describe('TIPS Valuation – input validation', () => {
	test('rejects missing price', async () => {
		const result = await RunTipsValuation({ ...TIPS_BOND, price: '' });
		expect(result.error).toContain('price');
	});

	test('rejects missing current CPI', async () => {
		const result = await RunTipsValuation({ ...TIPS_BOND, currentCpi: '' });
		expect(result.error).toContain('CPI');
	});

	test('rejects empty CUSIP in cusip mode', async () => {
		const result = await RunTipsValuation({ ...TIPS_BOND, mode: 'cusip', cusip: '' });
		expect(result.error).toContain('CUSIP');
	});
});
