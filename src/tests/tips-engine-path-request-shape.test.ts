/**
 * ISSUE #207 — regression test for the TIPS engine-path request shape.
 *
 * Asserts that RunTipsValuation builds a ValuationRequestProto with
 * product_input.tips set (carrying security + clean_price + current_cpi)
 * and the legacy flat fields NOT set. Mirrors the bond engine-path
 * regression test introduced for #182.
 */
import { describe, expect, test, vi } from 'vitest';

const capturedRequests: any[] = [];

vi.mock('@fintekkers/ledger-models/node/fintekkers/services/valuation-service/valuation_service_grpc_pb.js', () => ({
  ValuationClient: vi.fn().mockImplementation(() => ({
    runValuation: vi.fn().mockImplementation((request: any, callback: Function) => {
      capturedRequests.push(request);
      callback(null, {
        getMeasureResultsList: () => [],
        getCashflowsList: () => [],
      });
    }),
  })),
}));

vi.mock('$lib/grpc-auth', () => ({
  getServiceConnection: vi.fn().mockReturnValue({ url: 'localhost:80', credentials: {} }),
}));

import { RunTipsValuation } from '$lib/valuation';
import type { TipsCalculatorInputs } from '$lib/valuation';

const MANUAL_TIPS: TipsCalculatorInputs = {
  mode: 'manual',
  price: '98.5',
  currentCpi: '314.175',
  settlementDate: '2026-03-19',
  faceValue: '1000',
  realCouponRate: '0.625',
  couponFrequency: 'SEMIANNUALLY',
  referenceCpi: '256.394',
  maturityDate: '2030-01-15',
};

describe('TIPS engine-path request shape (#207)', () => {
  test('RunTipsValuation sets product_input.tips, not security_input / price_input / cpi_price_input', async () => {
    capturedRequests.length = 0;
    await RunTipsValuation(MANUAL_TIPS);
    expect(capturedRequests.length).toBe(1);
    const req = capturedRequests[0];

    // Engine path is set: product_input.tips carries security + clean_price + current_cpi.
    expect(req.hasProductInput()).toBe(true);
    const tipsInput = req.getProductInput()?.getTips();
    expect(tipsInput).toBeDefined();
    expect(tipsInput.getSecurity()).toBeDefined();
    expect(tipsInput.getCleanPrice()).toBeDefined();
    expect(tipsInput.getCleanPrice().getArbitraryPrecisionValue()).toBe('98.5');
    expect(tipsInput.getCurrentCpi()).toBeDefined();
    expect(tipsInput.getCurrentCpi().getArbitraryPrecisionValue()).toBe('314.175');

    // Legacy flat fields are NOT set on TIPS requests.
    expect(req.hasSecurityInput()).toBe(false);
    expect(req.hasPriceInput()).toBe(false);
    expect(req.hasCpiPriceInput()).toBe(false);

    // BOND oneof case is NOT chosen.
    expect(req.getProductInput()?.getBond()).toBeUndefined();
  });

  test('RunTipsValuation still preserves the standard request envelope', async () => {
    capturedRequests.length = 0;
    await RunTipsValuation(MANUAL_TIPS);
    const req = capturedRequests[0];

    expect(req.hasAsofDatetime()).toBe(true);
    expect(req.getMeasuresList().length).toBeGreaterThan(0);
    expect(req.getOperationType()).toBeGreaterThan(0);
  });
});
