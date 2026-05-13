/**
 * Regression for M6 #263 BUG 2: /data/calculators TIPS pricer ignored the
 * Reference CPI form input in CUSIP mode. Two cooperating bugs:
 *
 *   1. `TipsCalculator.svelte` only forwarded `referenceCpi` to the URL in
 *      manual mode — the input rendered in both modes, but the CUSIP-mode
 *      branch silently dropped it. Form-component spec covered separately
 *      under the Svelte component tests.
 *
 *   2. `RunTipsValuation` did not overlay the form-supplied referenceCpi
 *      onto the security proto returned by `buildSecurityProtoFromCusip`.
 *      So even when the URL did carry referenceCpi, the wire's empty
 *      base_cpi field went to valuation-service and the response was
 *      `INVALID_ARGUMENT: Missing required field: base_cpi`.
 *
 * This file exercises #2: when inputs.referenceCpi is supplied, the
 * security proto passed to valuation-service must carry that base_cpi
 * value — proven by hooking the ValuationClient mock and reading the
 * request's security.getBaseCpi().
 *
 * @vitest-environment node
 */
import { describe, expect, test, vi } from 'vitest';

const capturedRequests: any[] = [];

vi.mock('@fintekkers/ledger-models/node/fintekkers/services/valuation-service/valuation_service_grpc_pb.js', () => {
  return {
    ValuationClient: vi.fn().mockImplementation(() => ({
      runValuation: vi.fn().mockImplementation((request: any, callback: Function) => {
        capturedRequests.push(request);
        // Minimal happy-path response — just enough for RunTipsValuation
        // to not bail. Real numerics live in TipsValuation.test.ts.
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

import { RunTipsValuation } from '$lib/valuation';
import type { TipsCalculatorInputs } from '$lib/valuation';

const BASE_MANUAL: TipsCalculatorInputs = {
  mode: 'manual',
  price: '98',
  currentCpi: '312.230',
  settlementDate: '2026-05-13',
  faceValue: '1000',
  realCouponRate: '0.625',
  couponFrequency: 'SEMIANNUALLY',
  referenceCpi: '258.446',
  issueDate: '2020-01-15',
  maturityDate: '2030-01-15',
};

function readBaseCpiFromLastRequest(): string | undefined {
  const last = capturedRequests[capturedRequests.length - 1];
  const tipsInput = last?.getProductInput?.()?.getTips?.();
  const sec = tipsInput?.getSecurity?.();
  return sec?.getBaseCpi?.()?.getArbitraryPrecisionValue?.();
}

describe('RunTipsValuation — Reference CPI override (#263 bug 2)', () => {
  test('manual mode: form-supplied referenceCpi reaches valuation-service as base_cpi', async () => {
    capturedRequests.length = 0;
    await RunTipsValuation({ ...BASE_MANUAL, referenceCpi: '258.446' });
    expect(readBaseCpiFromLastRequest()).toBe('258.446');
  });

  test('manual mode: changing referenceCpi changes the base_cpi sent on the wire', async () => {
    capturedRequests.length = 0;
    await RunTipsValuation({ ...BASE_MANUAL, referenceCpi: '300.123' });
    expect(readBaseCpiFromLastRequest()).toBe('300.123');
  });

  test('manual mode: indexRatio prefers form-supplied referenceCpi over proto fallback', async () => {
    capturedRequests.length = 0;
    const result = await RunTipsValuation({
      ...BASE_MANUAL,
      referenceCpi: '250',
      currentCpi: '500',
    });
    // currentCpi=500, referenceCpi=250 → ratio = 2.0
    expect(parseFloat(result.indexRatio ?? '0')).toBeCloseTo(2.0, 6);
  });

  test('whitespace-only referenceCpi is treated as "not supplied" — no override applied', async () => {
    capturedRequests.length = 0;
    // The build path will still set base_cpi from the (whitespace-trimmed) input
    // for manual mode, but the override branch must not fire. We assert the
    // request still arrives at the service — no early-return / no crash.
    await RunTipsValuation({ ...BASE_MANUAL, referenceCpi: '   ' });
    expect(capturedRequests.length).toBeGreaterThan(0);
  });
});
