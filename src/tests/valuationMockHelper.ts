/**
 * Shared mock helper for ValuationClient tests.
 * Implements a simple bond pricer so tests work without a running service.
 */
import { vi } from 'vitest';

// MeasureProto enum values (from ledger-models)
const MP = {
	PRESENT_VALUE: 9,
	CURRENT_YIELD: 5,
	YIELD_TO_MATURITY: 7,
	MACAULAY_DURATION: 8,
	REAL_YIELD: 10,
	INFLATION_ADJUSTED_PRINCIPAL: 11,
	PRESENT_VALUE_CASHFLOWS: 12,
	DISCOUNT_MARGIN: 13,
	SPREAD_DURATION: 14,
};

// M5 / #260: ProductTypeProto enum values. TIPS = 4 in both the old
// SecurityTypeProto and the new ProductTypeProto (numeric stability
// across rename); TREASURY_FRN = 5 (was FRN).
const TIPS_PRODUCT_TYPE = 4;
const TREASURY_FRN_PRODUCT_TYPE = 5;

// CouponFrequencyProto values
const COUPON_FREQ = {
	ANNUALLY: 1,
	SEMIANNUALLY: 2,
	QUARTERLY: 3,
	MONTHLY: 4,
};

function periodsPerYear(freq: number): number {
	if (freq === COUPON_FREQ.ANNUALLY) return 1;
	if (freq === COUPON_FREQ.QUARTERLY) return 4;
	if (freq === COUPON_FREQ.MONTHLY) return 12;
	return 2; // semiannual default
}

// ---- Bond pricing ----

function bondPv(face: number, couponRate: number, periods: number, ytm: number): number {
	const c = face * couponRate / 2;
	const y = ytm / 2;
	let pv = 0;
	for (let i = 1; i <= periods; i++) pv += c / Math.pow(1 + y, i);
	pv += face / Math.pow(1 + y, periods);
	return pv;
}

function solveYtm(face: number, couponRate: number, periods: number, priceAbs: number): number {
	let lo = 0.0001, hi = 5;
	for (let k = 0; k < 200; k++) {
		const mid = (lo + hi) / 2;
		if (bondPv(face, couponRate, periods, mid) > priceAbs) lo = mid;
		else hi = mid;
	}
	return (lo + hi) / 2;
}

function macaulayDuration(face: number, couponRate: number, periods: number, ytm: number): number {
	const c = face * couponRate / 2;
	const y = ytm / 2;
	let weighted = 0, totalPv = 0;
	for (let i = 1; i <= periods; i++) {
		const fv = i === periods ? c + face : c;
		const pv = fv / Math.pow(1 + y, i);
		weighted += (i / 2) * pv;
		totalPv += pv;
	}
	return totalPv > 0 ? weighted / totalPv : 0;
}

function buildCashflowDates(periods: number, matDate: Date, monthsPerPeriod: number = 6): Date[] {
	const dates: Date[] = [];
	let d = new Date(matDate);
	for (let i = 0; i < periods; i++) {
		dates.unshift(new Date(d));
		d = new Date(d.getFullYear(), d.getMonth() - monthsPerPeriod, d.getDate());
	}
	return dates;
}

function buildCashflows(
	face: number, couponRate: number, periods: number, ytm: number, matDate: Date
): { date: string; fvAmount: string; pvAmount: string }[] {
	const c = face * couponRate / 2;
	const y = ytm / 2;
	const dates = buildCashflowDates(periods, matDate);
	return dates.map((date, i) => {
		const fv = i === periods - 1 ? c + face : c;
		const pv = fv / Math.pow(1 + y, i + 1);
		return {
			date: date.toISOString().slice(0, 10),
			fvAmount: fv.toFixed(8),
			pvAmount: pv.toFixed(8),
		};
	});
}

function countPeriods(matDateProto: any): { periods: number; matDate: Date } {
	if (!matDateProto) return { periods: 8, matDate: new Date('2030-01-15') };
	const year = matDateProto.getYear?.() ?? 2030;
	const month = matDateProto.getMonth?.() ?? 1;
	const day = matDateProto.getDay?.() ?? 15;
	const matDate = new Date(`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`);
	const today = new Date('2026-03-19');
	const daysDiff = (matDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
	const periods = Math.max(1, Math.round(daysDiff / 182.5));
	return { periods, matDate };
}

// ---- Fake response ----

function makeMeasureEntry(measure: number, value: string) {
	return {
		getMeasure: () => measure,
		getMeasureDecimalValue: () => ({ getArbitraryPrecisionValue: () => value }),
	};
}

function makeCfEntry(date: string, fvAmount: string, pvAmount: string) {
	const parts = date.split('-').map(Number);
	return {
		getCashflowDate: () => ({
			getYear: () => parts[0],
			getMonth: () => parts[1],
			getDay: () => parts[2],
		}),
		getFvAmount: () => ({ getArbitraryPrecisionValue: () => fvAmount }),
		getPvAmount: () => ({ getArbitraryPrecisionValue: () => pvAmount }),
		getCouponRate: () => null,
	};
}

function buildResponse(
	measures: { measure: number; value: string }[],
	cashflows: { date: string; fvAmount: string; pvAmount: string }[]
) {
	return {
		getMeasureResultsList: () => measures.map(m => makeMeasureEntry(m.measure, m.value)),
		getCashflowsList: () => cashflows.map(cf => makeCfEntry(cf.date, cf.fvAmount, cf.pvAmount)),
	};
}

// ---- Main mock ----

export function createValuationClientMock() {
	return vi.fn().mockImplementation(() => ({
		runValuation: vi.fn().mockImplementation((request: any, callback: Function) => {
			try {
				// Three input shapes live in this codebase:
				//   - Engine path bond (#182): product_input.bond → BondInput
				//   - Engine path TIPS (#207): product_input.tips → TipsInput
				//   - Legacy flat fields (FRN today, bond/TIPS pre-migration):
				//       security_input + price_input (+ cpi_price_input for TIPS)
				// Read security + price + cpi from whichever shape is set so the
				// mock works against all current and post-migration callers.
				const bondInput = request.getProductInput?.()?.getBond?.();
				const tipsInput = request.getProductInput?.()?.getTips?.();
				const frnInput = request.getProductInput?.()?.getFrn?.();
				const sec = bondInput?.getSecurity?.()
					?? tipsInput?.getSecurity?.()
					?? frnInput?.getSecurity?.()
					?? request.getSecurityInput?.();
				const priceProto = bondInput?.getCleanPrice?.()
					?? tipsInput?.getCleanPrice?.()
					?? frnInput?.getCleanPrice?.()
					?? request.getPriceInput?.()?.getPrice?.();
				const priceStr = priceProto?.getArbitraryPrecisionValue?.() ?? '100';
				const price = parseFloat(priceStr);

				const faceValue = parseFloat(sec?.getFaceValue?.()?.getArbitraryPrecisionValue?.() ?? '1000');
				const couponRatePct = parseFloat(sec?.getCouponRate?.()?.getArbitraryPrecisionValue?.() ?? '5');
				const couponRate = couponRatePct / 100;
				const productType = sec?.getProductType?.();
				const isTips = productType === TIPS_PRODUCT_TYPE;
				const isFrn = productType === TREASURY_FRN_PRODUCT_TYPE;

				const { periods: bondPeriods, matDate } = countPeriods(sec?.getMaturityDate?.());
				const priceAbs = price * faceValue / 100;

				if (isFrn) {
					// FRN scenarios (F/G/H): 2yr quarterly, R=4%, QM=50bps, varying price.
					// Coupon per period = face × (refRate + spread/10000) / freq.
					// Final period adds principal. Periods derived from maturity date
					// using the security's coupon frequency (quarterly = 4/yr).
					const freqEnum = sec?.getCouponFrequency?.() ?? COUPON_FREQ.QUARTERLY;
					const ppy = periodsPerYear(freqEnum);
					// Use ceil — a 2yr quarterly FRN with maturity 2028-01-15 from
					// "today" 2026-03-19 has 7.34 raw periods; the convention is to
					// emit a coupon at every coupon date including the final one,
					// which produces 8 cashflows for what scenarios call a 2yr FRN.
					const today = new Date('2026-03-19');
					const daysDiff = (matDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
					const periods = Math.max(1, Math.ceil((daysDiff / 365) * ppy));
					const monthsPerPeriod = Math.round(12 / ppy);

					// Pre-engine-path tests passed the reference rate via request.referenceRateInput.
					// Engine-path inputs no longer carry it on the request — the rate is sourced
					// from the security's reference_rate_index (or implied by quoted_margin /
					// at-coupon-reset assumption). The mock falls back to a sensible default
					// when neither is set so legacy tests continue to work.
					const refRateLegacy = parseFloat(
						request.getReferenceRateInput?.()?.getPrice?.()?.getArbitraryPrecisionValue?.() ?? '0.04',
					);
					const spreadBps = parseFloat(sec?.getSpread?.()?.getArbitraryPrecisionValue?.() ?? '50');
					const couponPerPeriod = faceValue * (refRateLegacy + spreadBps / 10000) / ppy;

					// At-coupon-reset valuation: PV ≈ price (the FRN identity at par).
					// Per-period discount derived so cashflow PVs sum to PV.
					// Discount per period = (refRate + DM) / freq — solve DM so sum matches price.
					// Simplification: use ytm = refRate + (spread / 10000) + (par - price)/par/years
					// rough approximation; for the scenarios this lands within tolerance and
					// preserves the sum(CF PVs) == PV invariant.
					const yearsToMat = periods / ppy;
					const dmDecimal = (spreadBps / 10000) + (faceValue - priceAbs) / faceValue / Math.max(yearsToMat, 0.01);
					const ytmPerPeriod = (refRateLegacy + dmDecimal) / ppy;

					const pvBeforeNorm = (() => {
						let s = 0;
						for (let i = 1; i <= periods; i++) {
							const fv = i === periods ? couponPerPeriod + faceValue : couponPerPeriod;
							s += fv / Math.pow(1 + ytmPerPeriod, i);
						}
						return s;
					})();
					// Normalise so sum(cf PVs) == priceAbs exactly (preserves the CRITICAL
					// invariant the tests check).
					const norm = priceAbs / pvBeforeNorm;
					const dates = buildCashflowDates(periods, matDate, monthsPerPeriod);
					const frnCfs = dates.map((date, i) => {
						const fv = i === periods - 1 ? couponPerPeriod + faceValue : couponPerPeriod;
						const pvCf = fv / Math.pow(1 + ytmPerPeriod, i + 1) * norm;
						return {
							date: date.toISOString().slice(0, 10),
							fvAmount: fv.toFixed(8),
							pvAmount: pvCf.toFixed(8),
						};
					});

					const pvQuoted = price; // % of par
					const dmBps = dmDecimal * 10000;
					const cy = couponPerPeriod * ppy / priceAbs;

					callback(null, buildResponse([
						{ measure: MP.PRESENT_VALUE, value: pvQuoted.toFixed(8) },
						{ measure: MP.CURRENT_YIELD, value: cy.toFixed(8) },
						{ measure: MP.DISCOUNT_MARGIN, value: dmBps.toFixed(4) },
					], frnCfs));
					return;
				}

				const periods = bondPeriods;
				if (isTips) {
					const referenceCpi = parseFloat(
						sec?.getBaseCpi?.()?.getArbitraryPrecisionValue?.() ?? '256.394'
					);
					// Engine-path TIPS carries current_cpi on the TipsInput; legacy
					// path used a separate cpi_price_input PriceProto. Read from
					// whichever is set.
					const currentCpiStr = tipsInput?.getCurrentCpi?.()?.getArbitraryPrecisionValue?.()
						?? request.getCpiPriceInput?.()?.getPrice?.()?.getArbitraryPrecisionValue?.()
						?? '314.175';
					const currentCpi = parseFloat(currentCpiStr);
					const indexRatio = referenceCpi > 0 ? currentCpi / referenceCpi : 1;
					const adjustedPrincipal = faceValue * indexRatio;
					const adjustedCouponPeriodic = adjustedPrincipal * couponRate / 2;

					// For TIPS: ytm is solved against adjusted-principal price
					// PV is returned as % of original face (deflated by indexRatio)
					const adjustedPriceAbs = priceAbs * indexRatio;
					const ytm = solveYtm(adjustedPrincipal, couponRate, periods, adjustedPriceAbs);
					const pvAdjusted = bondPv(adjustedPrincipal, couponRate, periods, ytm);
					// Return PV as % of original face (real price)
					const pvQuoted = pvAdjusted / indexRatio / faceValue * 100;
					const dur = macaulayDuration(adjustedPrincipal, couponRate, periods, ytm);
					const cy = (adjustedPrincipal * couponRate) / (priceAbs * indexRatio);
					const realYield = Math.max(0.001, ytm - 0.02);

					const dates = buildCashflowDates(periods, matDate);
					const tipsCfs = dates.map((date, i) => {
						const fv = i === periods - 1
							? adjustedCouponPeriodic + adjustedPrincipal
							: adjustedCouponPeriodic;
						// Deflate PV by indexRatio so sum(pvCf) == pvQuoted * (faceValue/100)
						const pvCf = fv / Math.pow(1 + ytm / 2, i + 1) / indexRatio;
						return {
							date: date.toISOString().slice(0, 10),
							fvAmount: fv.toFixed(8),
							pvAmount: pvCf.toFixed(8),
						};
					});

					callback(null, buildResponse([
						{ measure: MP.PRESENT_VALUE, value: pvQuoted.toFixed(8) },
						{ measure: MP.CURRENT_YIELD, value: cy.toFixed(8) },
						{ measure: MP.YIELD_TO_MATURITY, value: ytm.toFixed(8) },
						{ measure: MP.MACAULAY_DURATION, value: dur.toFixed(8) },
						{ measure: MP.REAL_YIELD, value: realYield.toFixed(8) },
						{ measure: MP.INFLATION_ADJUSTED_PRINCIPAL, value: adjustedPrincipal.toFixed(8) },
					], tipsCfs));
				} else {
					const ytm = solveYtm(faceValue, couponRate, periods, priceAbs);
					const pv = bondPv(faceValue, couponRate, periods, ytm);
					const pvQuoted = pv / faceValue * 100;
					const dur = macaulayDuration(faceValue, couponRate, periods, ytm);
					const cy = (faceValue * couponRate) / priceAbs;
					const cashflows = buildCashflows(faceValue, couponRate, periods, ytm, matDate);

					callback(null, buildResponse([
						{ measure: MP.PRESENT_VALUE, value: pvQuoted.toFixed(8) },
						{ measure: MP.CURRENT_YIELD, value: cy.toFixed(8) },
						{ measure: MP.YIELD_TO_MATURITY, value: ytm.toFixed(8) },
						{ measure: MP.MACAULAY_DURATION, value: dur.toFixed(8) },
					], cashflows));
				}
			} catch (err) {
				callback(err, null);
			}
		}),
	}));
}
