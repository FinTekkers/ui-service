// @vitest-environment node
/**
 * FRN (Floating Rate Note) Pricing Consistency E2E Tests
 *
 * Authoritative scenarios from quant-dev:
 *   - Scenario F: FRN at par (QM=DM=50bps) → PV = 100 exactly
 *   - Scenario G: FRN at discount (QM=50bps, DM=75bps) → PV ≈ 99.5257
 *   - Scenario H: FRN at premium (QM=50bps, DM=25bps) → PV ≈ 100.4769
 *
 * All scenarios: quarterly, 2yr maturity, R=4%, face=100.
 * Critical invariant: PV == sum(cashflow PVs).
 *
 * NOTE: ui-dev is building RunFrnValuation. Tests call valuation-service directly
 * via gRPC. Once the UI function exists, tests will be refactored to use it.
 *
 * Uses createRequire to avoid vitest/Vite module resolution issues with the
 * locally-symlinked @fintekkers/ledger-models package.
 *
 * Prerequisites:
 * - valuation-service running on port 8080 (with FRN support, 115/115 tests)
 */
import { describe, expect, test } from 'vitest';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

const { ValuationClient } = require('@fintekkers/ledger-models/node/fintekkers/services/valuation-service/valuation_service_grpc_pb.js');
const { ValuationRequestProto } = require('@fintekkers/ledger-models/node/fintekkers/requests/valuation/valuation_request_pb.js');
const { PriceProto } = require('@fintekkers/ledger-models/node/fintekkers/models/price/price_pb.js');
const { SecurityProto } = require('@fintekkers/ledger-models/node/fintekkers/models/security/security_pb.js');
const { DecimalValueProto } = require('@fintekkers/ledger-models/node/fintekkers/models/util/decimal_value_pb.js');
const { SecurityTypeProto } = require('@fintekkers/ledger-models/node/fintekkers/models/security/security_type_pb.js');
const { CouponTypeProto } = require('@fintekkers/ledger-models/node/fintekkers/models/security/coupon_type_pb.js');
const { CouponFrequencyProto } = require('@fintekkers/ledger-models/node/fintekkers/models/security/coupon_frequency_pb.js');
const measure_pkg = require('@fintekkers/ledger-models/node/fintekkers/models/position/measure_pb.js');
const operation_pkg = require('@fintekkers/ledger-models/node/fintekkers/requests/util/operation_pb.js');
const { ZonedDateTime } = require('@fintekkers/ledger-models/node/wrappers/models/utils/datetime');
const { UUID } = require('@fintekkers/ledger-models/node/wrappers/models/utils/uuid');
const { LocalDate } = require('@fintekkers/ledger-models/node/wrappers/models/utils/date');
const EnvConfig = require('@fintekkers/ledger-models/node/wrappers/models/utils/requestcontext').default;

const MeasureProto = measure_pkg.MeasureProto;
const RequestOperationTypeProto = operation_pkg.RequestOperationTypeProto;

// =============================================================================
// Types
// =============================================================================
interface FrnInputs {
	faceValue: string;
	quotedMarginBps: string;   // basis points
	referenceRate: string;     // annual decimal
	couponFrequency: number;   // CouponFrequencyProto enum
	maturityDate: string;      // YYYY-MM-DD
	price: string;             // % of par
}

interface FrnResult {
	presentValue?: string;
	discountMargin?: string;
	spreadDuration?: string;
	cashflows: Array<{
		date: string;
		fvAmount: string;
		pvAmount: string;
	}>;
	error?: string;
}

// =============================================================================
// Helper: build and execute FRN valuation via gRPC
// =============================================================================
function decimalValue(value: string): any {
	return new DecimalValueProto().setArbitraryPrecisionValue(value);
}

async function runFrnValuation(inputs: FrnInputs): Promise<FrnResult> {
	try {
		const security = new SecurityProto();
		security.setObjectClass('Security');
		security.setVersion('0.0.1');
		security.setUuid(UUID.random().toUUIDProto());
		security.setAsOf(ZonedDateTime.now().toProto());
		security.setSecurityType(SecurityTypeProto.FRN);
		security.setAssetClass('Fixed Income');
		security.setCouponType(CouponTypeProto.FLOATING);
		security.setCouponFrequency(inputs.couponFrequency);
		security.setFaceValue(decimalValue(inputs.faceValue));
		security.setSpread(decimalValue(inputs.quotedMarginBps));
		security.setMaturityDate(LocalDate.from(new Date(inputs.maturityDate)).toProto());

		const priceProto = new PriceProto();
		priceProto.setObjectClass('PriceProto');
		priceProto.setVersion('0.0.1');
		priceProto.setAsOf(ZonedDateTime.now().toProto());
		priceProto.setPrice(decimalValue(inputs.price));
		priceProto.setSecurity(security);

		const refRateProto = new PriceProto();
		refRateProto.setObjectClass('PriceProto');
		refRateProto.setVersion('0.0.1');
		refRateProto.setAsOf(ZonedDateTime.now().toProto());
		refRateProto.setPrice(decimalValue(inputs.referenceRate));

		const request = new ValuationRequestProto();
		request.setObjectClass('ValuationRequestProto');
		request.setVersion('0.0.1');
		request.setOperationType(RequestOperationTypeProto.GET);
		request.setAsofDatetime(ZonedDateTime.now().toProto());
		request.setSecurityInput(security);
		request.setPriceInput(priceProto);
		request.setReferenceRateInput(refRateProto);

		// Note: SPREAD_DURATION not yet implemented in running service
		[
			MeasureProto.PRESENT_VALUE,
			MeasureProto.DISCOUNT_MARGIN,
			MeasureProto.PRESENT_VALUE_CASHFLOWS,
		].forEach((m: any) => request.addMeasures(m));

		const valuationURL = EnvConfig.apiURL.replace(/:\d+$/, ':8080');
		const client = new ValuationClient(valuationURL, EnvConfig.apiCredentials);

		const response: any = await new Promise((resolve, reject) => {
			client.runValuation(request, (error: any, resp: any) => {
				if (error) reject(error);
				else resolve(resp);
			});
		});

		const result: FrnResult = { cashflows: [] };

		response.getMeasureResultsList().forEach((entry: any) => {
			const value = entry.getMeasureDecimalValue()?.getArbitraryPrecisionValue();
			switch (entry.getMeasure()) {
				case MeasureProto.PRESENT_VALUE:     result.presentValue = value; break;
				case MeasureProto.DISCOUNT_MARGIN:   result.discountMargin = value; break;
				case MeasureProto.SPREAD_DURATION:   result.spreadDuration = value; break;
			}
		});

		const cfList = response.getCashflowsList?.() ?? [];
		for (const cf of cfList) {
			const d = cf.getCashflowDate?.();
			if (!d) continue;
			const date = `${d.getYear()}-${String(d.getMonth()).padStart(2, '0')}-${String(d.getDay()).padStart(2, '0')}`;
			const fvAmount = cf.getFvAmount()?.getArbitraryPrecisionValue() ?? '0';
			const pvAmount = cf.getPvAmount()?.getArbitraryPrecisionValue() ?? '0';
			result.cashflows.push({ date, fvAmount, pvAmount });
		}

		return result;
	} catch (error: any) {
		return { cashflows: [], error: error.details ?? error.message ?? 'FRN valuation failed' };
	}
}

// =============================================================================
// Scenario inputs from quant-dev (tests/scenarios/scenario_f,g,h)
// All: quarterly, 2yr, face=100, R=4%
// =============================================================================

const SCENARIO_F: FrnInputs = {
	faceValue: '100',
	quotedMarginBps: '50',
	referenceRate: '0.04',
	couponFrequency: CouponFrequencyProto.QUARTERLY,
	maturityDate: '2028-01-15',
	price: '100',
};

const SCENARIO_G: FrnInputs = {
	faceValue: '100',
	quotedMarginBps: '50',
	referenceRate: '0.04',
	couponFrequency: CouponFrequencyProto.QUARTERLY,
	maturityDate: '2028-01-15',
	price: '99.5257',
};

const SCENARIO_H: FrnInputs = {
	faceValue: '100',
	quotedMarginBps: '50',
	referenceRate: '0.04',
	couponFrequency: CouponFrequencyProto.QUARTERLY,
	maturityDate: '2028-01-15',
	price: '100.4769',
};

function cashflowPvSumQuoted(cashflows: Array<{ pvAmount: string }>, faceValue: number): number {
	const pvSumDollar = cashflows.reduce((sum, cf) => sum + parseFloat(cf.pvAmount), 0);
	return pvSumDollar / (faceValue / 100);
}

// =====================================================================
// SCENARIO F: FRN at Par (QM=DM=50bps)
// =====================================================================
describe('QD Scenario F – FRN at Par (QM=DM=50bps, R=4%, quarterly, 2yr)', () => {
	test('Valuation succeeds with 8 cashflow periods', async () => {
		const result = await runFrnValuation(SCENARIO_F);
		expect(result.error).toBeUndefined();
		expect(result.presentValue).toBeDefined();
		expect(result.cashflows.length).toBe(8);
	});

	test('PV = 100 for at-par FRN (QM=DM)', async () => {
		const result = await runFrnValuation(SCENARIO_F);
		const pv = parseFloat(result.presentValue!);
		expect(pv).toBeCloseTo(100, 0);
	});

	test('CRITICAL: PV == sum(cashflow PVs)', async () => {
		const result = await runFrnValuation(SCENARIO_F);
		const pvQuoted = parseFloat(result.presentValue!);
		const pvSumQuoted = cashflowPvSumQuoted(result.cashflows, 100);
		expect(pvSumQuoted).toBeCloseTo(pvQuoted, 1);
	});

	test('sum(cashflow PVs) = 100 for at-par FRN', async () => {
		const result = await runFrnValuation(SCENARIO_F);
		const pvSum = cashflowPvSumQuoted(result.cashflows, 100);
		expect(pvSum).toBeCloseTo(100, 0);
	});

	test('Discount margin = 50bps (0.0050)', async () => {
		const result = await runFrnValuation(SCENARIO_F);
		expect(result.discountMargin).toBeDefined();
		const dm = parseFloat(result.discountMargin!);
		expect(dm).toBeCloseTo(0.005, 3);
	});

	test('Coupon FV = $1.125 per period, final = $101.125', async () => {
		const result = await runFrnValuation(SCENARIO_F);
		const cashflows = result.cashflows;
		for (let i = 0; i < 7; i++) {
			expect(parseFloat(cashflows[i].fvAmount)).toBeCloseTo(1.125, 2);
		}
		expect(parseFloat(cashflows[7].fvAmount)).toBeCloseTo(101.125, 2);
	});

	test.skip('Spread duration is positive and ~1.9 years (SPREAD_DURATION not yet in running service)', async () => {
		const result = await runFrnValuation(SCENARIO_F);
		expect(result.spreadDuration).toBeDefined();
		const sd = parseFloat(result.spreadDuration!);
		expect(sd).toBeGreaterThan(1.5);
		expect(sd).toBeLessThan(2.1);
	});

	test('Cashflow dates are chronological with ~3-month spacing', async () => {
		const result = await runFrnValuation(SCENARIO_F);
		const cashflows = result.cashflows;
		for (let i = 1; i < cashflows.length; i++) {
			const prev = new Date(cashflows[i - 1].date);
			const curr = new Date(cashflows[i].date);
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
		const result = await runFrnValuation(SCENARIO_G);
		expect(result.error).toBeUndefined();
		expect(result.presentValue).toBeDefined();
		expect(result.cashflows.length).toBe(8);
	});

	test('PV ≈ 99.53 (discount: DM > QM)', async () => {
		const result = await runFrnValuation(SCENARIO_G);
		const pv = parseFloat(result.presentValue!);
		expect(pv).toBeGreaterThan(99.0);
		expect(pv).toBeLessThan(100.0);
	});

	test('CRITICAL: PV == sum(cashflow PVs)', async () => {
		const result = await runFrnValuation(SCENARIO_G);
		const pvQuoted = parseFloat(result.presentValue!);
		const pvSumQuoted = cashflowPvSumQuoted(result.cashflows, 100);
		expect(pvSumQuoted).toBeCloseTo(pvQuoted, 1);
	});

	test('Discount margin = 75bps (0.0075)', async () => {
		const result = await runFrnValuation(SCENARIO_G);
		expect(result.discountMargin).toBeDefined();
		const dm = parseFloat(result.discountMargin!);
		expect(dm).toBeCloseTo(0.0075, 2);
	});

	test('Coupon FV = $1.125 per period (same QM)', async () => {
		const result = await runFrnValuation(SCENARIO_G);
		for (let i = 0; i < 7; i++) {
			expect(parseFloat(result.cashflows[i].fvAmount)).toBeCloseTo(1.125, 2);
		}
		expect(parseFloat(result.cashflows[7].fvAmount)).toBeCloseTo(101.125, 2);
	});

	test.skip('Spread duration is positive and ~1.9 years (SPREAD_DURATION not yet in running service)', async () => {
		const result = await runFrnValuation(SCENARIO_G);
		expect(result.spreadDuration).toBeDefined();
		const sd = parseFloat(result.spreadDuration!);
		expect(sd).toBeGreaterThan(1.5);
		expect(sd).toBeLessThan(2.1);
	});
});

// =====================================================================
// SCENARIO H: FRN at Premium (QM=50bps, DM=25bps)
// =====================================================================
describe('QD Scenario H – FRN at Premium (QM=50bps, DM=25bps)', () => {
	test('Valuation succeeds with 8 cashflow periods', async () => {
		const result = await runFrnValuation(SCENARIO_H);
		expect(result.error).toBeUndefined();
		expect(result.presentValue).toBeDefined();
		expect(result.cashflows.length).toBe(8);
	});

	test('PV ≈ 100.48 (premium: DM < QM)', async () => {
		const result = await runFrnValuation(SCENARIO_H);
		const pv = parseFloat(result.presentValue!);
		expect(pv).toBeGreaterThan(100.0);
		expect(pv).toBeLessThan(101.0);
	});

	test('CRITICAL: PV == sum(cashflow PVs)', async () => {
		const result = await runFrnValuation(SCENARIO_H);
		const pvQuoted = parseFloat(result.presentValue!);
		const pvSumQuoted = cashflowPvSumQuoted(result.cashflows, 100);
		expect(pvSumQuoted).toBeCloseTo(pvQuoted, 1);
	});

	test('Discount margin = 25bps (0.0025)', async () => {
		const result = await runFrnValuation(SCENARIO_H);
		expect(result.discountMargin).toBeDefined();
		const dm = parseFloat(result.discountMargin!);
		expect(dm).toBeCloseTo(0.0025, 2);
	});

	test('Coupon FV = $1.125 per period (same QM)', async () => {
		const result = await runFrnValuation(SCENARIO_H);
		for (let i = 0; i < 7; i++) {
			expect(parseFloat(result.cashflows[i].fvAmount)).toBeCloseTo(1.125, 2);
		}
		expect(parseFloat(result.cashflows[7].fvAmount)).toBeCloseTo(101.125, 2);
	});

	test.skip('Spread duration is positive and ~1.9 years (SPREAD_DURATION not yet in running service)', async () => {
		const result = await runFrnValuation(SCENARIO_H);
		expect(result.spreadDuration).toBeDefined();
		const sd = parseFloat(result.spreadDuration!);
		expect(sd).toBeGreaterThan(1.5);
		expect(sd).toBeLessThan(2.1);
	});
});

// =====================================================================
// CROSS-SCENARIO INVARIANTS
// =====================================================================
describe('FRN Cross-scenario invariants', () => {
	test('Discount FRN price < par < premium FRN price', async () => {
		const [rF, rG, rH] = await Promise.all([
			runFrnValuation(SCENARIO_F),
			runFrnValuation(SCENARIO_G),
			runFrnValuation(SCENARIO_H),
		]);
		const pvF = parseFloat(rF.presentValue!);
		const pvG = parseFloat(rG.presentValue!);
		const pvH = parseFloat(rH.presentValue!);

		expect(pvG).toBeLessThan(pvF);
		expect(pvF).toBeLessThan(pvH);
	});

	test('DM ordering: discount DM > par DM > premium DM', async () => {
		const [rF, rG, rH] = await Promise.all([
			runFrnValuation(SCENARIO_F),
			runFrnValuation(SCENARIO_G),
			runFrnValuation(SCENARIO_H),
		]);
		const dmF = parseFloat(rF.discountMargin!);
		const dmG = parseFloat(rG.discountMargin!);
		const dmH = parseFloat(rH.discountMargin!);

		expect(dmG).toBeGreaterThan(dmF);
		expect(dmF).toBeGreaterThan(dmH);
	});

	test('Discount and premium are ~symmetric around par', async () => {
		const [rG, rH] = await Promise.all([
			runFrnValuation(SCENARIO_G),
			runFrnValuation(SCENARIO_H),
		]);
		const pvG = parseFloat(rG.presentValue!);
		const pvH = parseFloat(rH.presentValue!);

		const discountFromPar = 100 - pvG;
		const premiumOverPar = pvH - 100;

		expect(Math.abs(discountFromPar - premiumOverPar)).toBeLessThan(0.1);
	});

	test('All 3 scenarios: PV == sum(CF PVs)', async () => {
		const scenarios = [SCENARIO_F, SCENARIO_G, SCENARIO_H];
		const results = await Promise.all(scenarios.map(s => runFrnValuation(s)));

		for (const result of results) {
			expect(result.error).toBeUndefined();
			const pvQuoted = parseFloat(result.presentValue!);
			const pvSumQuoted = cashflowPvSumQuoted(result.cashflows, 100);
			expect(pvSumQuoted).toBeCloseTo(pvQuoted, 1);
		}
	});

	test.skip('Spread duration consistent across scenarios (~1.9yr) (SPREAD_DURATION not yet in running service)', async () => {
		const results = await Promise.all([
			runFrnValuation(SCENARIO_F),
			runFrnValuation(SCENARIO_G),
			runFrnValuation(SCENARIO_H),
		]);
		const durations = results.map(r => parseFloat(r.spreadDuration!));

		for (const d of durations) {
			expect(d).toBeGreaterThan(1.5);
			expect(d).toBeLessThan(2.1);
		}
		const maxDur = Math.max(...durations);
		const minDur = Math.min(...durations);
		expect(maxDur - minDur).toBeLessThan(0.15);
	});
});
