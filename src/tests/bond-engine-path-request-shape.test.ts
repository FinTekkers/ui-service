/**
 * ISSUE #182 — regression test for the bond engine-path request shape.
 *
 * Asserts that RunValuation builds a ValuationRequestProto with the new
 * product_input.bond field set, and the legacy security_input / price_input
 * flat fields NOT set. Catches accidental reverts to the legacy path.
 *
 * RunTipsValuation and RunFrnValuation stay on the legacy path (out of scope
 * for #182) — covered by the negative assertion in their own e2e tests.
 */
import { describe, expect, test, vi } from 'vitest';

// Capture every ValuationRequestProto sent through the gRPC client so we can
// assert on its shape after RunValuation runs.
const capturedRequests: any[] = [];

vi.mock('@fintekkers/ledger-models/node/fintekkers/services/valuation-service/valuation_service_grpc_pb.js', () => {
  return {
    ValuationClient: vi.fn().mockImplementation(() => ({
      runValuation: vi.fn().mockImplementation((request: any, callback: Function) => {
        capturedRequests.push(request);
        // Return a minimally-shaped response so RunValuation doesn't throw
        // while parsing it.
        callback(null, {
          getMeasureResultsList: () => [],
          getCashflowsList: () => [],
        });
      }),
    })),
  };
});

vi.mock('$lib/grpc-auth', () => ({
  getServiceConnection: vi.fn().mockReturnValue({ url: 'localhost:80', credentials: {} }),
}));

import { RunValuation } from '$lib/valuation';
import type { BondCalculatorInputs } from '$lib/valuation';

const MANUAL_BOND: BondCalculatorInputs = {
  mode: 'manual',
  price: '98.5',
  faceValue: '100',
  couponRate: '5',
  couponFrequency: 'SEMIANNUALLY',
  maturityDate: '2030-01-15',
};

describe('Bond engine-path request shape (#182)', () => {
  test('RunValuation sets product_input.bond, not security_input / price_input', async () => {
    capturedRequests.length = 0;
    await RunValuation(MANUAL_BOND);
    expect(capturedRequests.length).toBe(1);
    const req = capturedRequests[0];

    // Engine path is set: product_input.bond carries the security + clean_price.
    expect(req.hasProductInput()).toBe(true);
    const bondInput = req.getProductInput()?.getBond();
    expect(bondInput).toBeDefined();
    expect(bondInput.getSecurity()).toBeDefined();
    expect(bondInput.getCleanPrice()).toBeDefined();
    expect(bondInput.getCleanPrice().getArbitraryPrecisionValue()).toBe('98.5');

    // Legacy flat fields are NOT set on bond requests.
    expect(req.hasSecurityInput()).toBe(false);
    expect(req.hasPriceInput()).toBe(false);
  });

  test('RunValuation still sets the standard request envelope (asof, measures, operation)', async () => {
    capturedRequests.length = 0;
    await RunValuation(MANUAL_BOND);
    const req = capturedRequests[0];

    expect(req.hasAsofDatetime()).toBe(true);
    expect(req.getMeasuresList().length).toBeGreaterThan(0);
    expect(req.getOperationType()).toBeGreaterThan(0); // GET = 1, anything truthy
  });
});
