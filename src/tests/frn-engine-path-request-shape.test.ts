/**
 * ISSUE #208 — regression test for the FRN engine-path request shape.
 *
 * Asserts that RunFrnValuation builds a ValuationRequestProto with
 * product_input.frn set (carrying security + clean_price) and the legacy
 * security_input / price_input / reference_rate_input flat fields NOT
 * set. Mirrors the bond and TIPS engine-path regression tests.
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

import { RunFrnValuation } from '$lib/valuation';
import type { FrnCalculatorInputs } from '$lib/valuation';

const MANUAL_FRN: FrnCalculatorInputs = {
  mode: 'manual',
  price: '100',
  referenceRate: '4',
  spread: '50',
  faceValue: '100',
  couponFrequency: 'QUARTERLY',
  maturityDate: '2028-01-15',
};

describe('FRN engine-path request shape (#208)', () => {
  test('RunFrnValuation sets product_input.frn, not security_input / price_input / reference_rate_input', async () => {
    capturedRequests.length = 0;
    await RunFrnValuation(MANUAL_FRN);
    expect(capturedRequests.length).toBe(1);
    const req = capturedRequests[0];

    // Engine path: product_input.frn carries security + clean_price.
    expect(req.hasProductInput()).toBe(true);
    const frnInput = req.getProductInput()?.getFrn();
    expect(frnInput).toBeDefined();
    expect(frnInput.getSecurity()).toBeDefined();
    expect(frnInput.getCleanPrice()).toBeDefined();
    expect(frnInput.getCleanPrice().getArbitraryPrecisionValue()).toBe('100');

    // Legacy flat fields are NOT set on FRN requests.
    expect(req.hasSecurityInput()).toBe(false);
    expect(req.hasPriceInput()).toBe(false);
    expect(req.hasReferenceRateInput?.()).toBeFalsy();

    // BOND / TIPS oneof cases are NOT chosen.
    expect(req.getProductInput()?.getBond()).toBeUndefined();
    expect(req.getProductInput()?.getTips()).toBeUndefined();
  });

  test('Default price is 100 when only discount_margin is provided', async () => {
    capturedRequests.length = 0;
    await RunFrnValuation({ ...MANUAL_FRN, price: '', discountMargin: '50' });
    expect(capturedRequests.length).toBe(1);
    const req = capturedRequests[0];
    expect(req.getProductInput()?.getFrn()?.getCleanPrice()?.getArbitraryPrecisionValue()).toBe('100');
  });

  test('Standard request envelope preserved', async () => {
    capturedRequests.length = 0;
    await RunFrnValuation(MANUAL_FRN);
    const req = capturedRequests[0];
    expect(req.hasAsofDatetime()).toBe(true);
    expect(req.getMeasuresList().length).toBeGreaterThan(0);
    expect(req.getOperationType()).toBeGreaterThan(0);
  });
});
