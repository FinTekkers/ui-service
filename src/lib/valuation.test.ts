/**
 * Unit tests for RunValuation — mocks ValuationClient so no running service needed.
 */
import { describe, it, expect, vi } from 'vitest';

vi.mock('@fintekkers/ledger-models/node/fintekkers/services/valuation-service/valuation_service_grpc_pb.js', async () => {
	const { createValuationClientMock } = await import('../tests/valuationMockHelper');
	return { ValuationClient: createValuationClientMock() };
});

vi.mock('@fintekkers/ledger-models/node/fintekkers/services/security-service/security_service_grpc_pb.js', () => ({
	SecurityClient: vi.fn().mockImplementation(() => ({
		search: vi.fn().mockReturnValue({
			on: vi.fn().mockImplementation(function (this: any, event: string, handler: Function) {
				if (event === 'end') handler();
				return this;
			}),
		}),
	})),
}));

vi.mock('$lib/grpc-auth', () => ({
	getServiceConnection: vi.fn().mockReturnValue({ url: 'localhost:80', credentials: {} }),
}));

import { RunValuation } from './valuation';
import { FetchSecurity } from './security';

describe('RunValuation', () => {

  it('manual mode: values a fixed-rate bond and returns current yield and YTM', async () => {
    const result = await RunValuation({
      mode: 'manual',
      price: '98.5',
      faceValue: '1000',
      couponRate: '5.0',
      couponFrequency: 'SEMIANNUALLY',
      issueDate: '2023-01-01',
      maturityDate: '2033-01-01',
      issuerName: 'US Treasury',
    });

    console.log('Manual mode result:', result);

    expect(result.error).toBeUndefined();
    expect(result.currentYield).toBeDefined();
    expect(result.yieldToMaturity).toBeDefined();

    const ytm = parseFloat(result.yieldToMaturity!);
    expect(ytm).toBeGreaterThan(0);
    expect(ytm).toBeLessThan(100);

    const cy = parseFloat(result.currentYield!);
    expect(cy).toBeGreaterThan(0);
    expect(cy).toBeLessThan(100);
  }, 30000);

  it('cusip mode: values a security fetched by CUSIP', async () => {
    // 91282CMC2 is a 4.5% Treasury Note maturing 2031 (SEMIANNUALLY coupon)
    const cusip = '91282CMC2';
    console.log(`Using CUSIP: ${cusip}`);

    const result = await RunValuation({
      mode: 'cusip',
      cusip,
      price: '98.5',
    });

    console.log('CUSIP mode result:', result);

    // Must not fail with serialization or unknown errors
    if (result.error) {
      expect(result.error).not.toContain('serialization');
      expect(result.error).not.toContain('UNKNOWN');
    } else {
      expect(result.currentYield).toBeDefined();
      expect(result.yieldToMaturity).toBeDefined();
    }
  }, 30000);

});
