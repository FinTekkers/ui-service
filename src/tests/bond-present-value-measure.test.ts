/**
 * Issue #209 regression test — bond RunValuation must request and map the
 * PRESENT_VALUE measure.
 *
 * Tight-scoped guard: any future PR that drops PRESENT_VALUE from the bond
 * measure list or removes the switch-case mapping will fail here directly,
 * rather than via downstream invariant assertions in
 * bond-pricing-consistency.test.ts that were dependent on this for their
 * pre-fix failures.
 */
import { describe, expect, test, vi } from 'vitest';

const capturedRequests: any[] = [];

vi.mock('@fintekkers/ledger-models/node/fintekkers/services/valuation-service/valuation_service_grpc_pb.js', () => ({
  ValuationClient: vi.fn().mockImplementation(() => ({
    runValuation: vi.fn().mockImplementation((request: any, callback: Function) => {
      capturedRequests.push(request);
      // Return a stub response that includes a PRESENT_VALUE measure result —
      // proves the switch-case in RunValuation maps it onto result.presentValue.
      callback(null, {
        getMeasureResultsList: () => [
          {
            getMeasure: () => 9, // MeasureProto.PRESENT_VALUE
            getMeasureDecimalValue: () => ({ getArbitraryPrecisionValue: () => '99.875' }),
          },
        ],
        getCashflowsList: () => [],
      });
    }),
  })),
}));

vi.mock('$lib/grpc-auth', () => ({
  getServiceConnection: vi.fn().mockReturnValue({ url: 'localhost:80', credentials: {} }),
}));

import { RunValuation } from '$lib/valuation';
import type { BondCalculatorInputs } from '$lib/valuation';

const MANUAL_BOND: BondCalculatorInputs = {
  mode: 'manual',
  price: '99.875',
  faceValue: '100',
  couponRate: '5',
  couponFrequency: 'SEMIANNUALLY',
  maturityDate: '2030-01-15',
};

describe('Bond PRESENT_VALUE measure (#209)', () => {
  test('RunValuation includes PRESENT_VALUE in the requested measure list', async () => {
    capturedRequests.length = 0;
    await RunValuation(MANUAL_BOND);
    expect(capturedRequests.length).toBe(1);
    const measures = capturedRequests[0].getMeasuresList();
    // MeasureProto.PRESENT_VALUE is enum value 9.
    expect(measures).toContain(9);
  });

  test('RunValuation maps a PRESENT_VALUE response to result.presentValue', async () => {
    const result = await RunValuation(MANUAL_BOND);
    expect(result.error).toBeUndefined();
    expect(result.presentValue).toBe('99.875');
  });
});
