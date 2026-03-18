/**
 * Integration tests for the valuation service (running locally on port 8080).
 */
import { describe, it, expect } from 'vitest';
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
    expect(ytm).toBeLessThan(1); // decimal format, e.g. 0.0526

    const cy = parseFloat(result.currentYield!);
    expect(cy).toBeGreaterThan(0);
    expect(cy).toBeLessThan(1);
  }, 30000);

  it('cusip mode: values a security fetched by CUSIP', async () => {
    const securities = await FetchSecurity('Fixed Income', 'US Government');
    expect(securities.length).toBeGreaterThan(0);

    // Pick a note or bond with semiannual coupon and at least 1 year to maturity
    const oneYearOut = new Date();
    oneYearOut.setFullYear(oneYearOut.getFullYear() + 1);
    const activeSecurity = securities.find(s =>
      new Date(s.maturityDate) > oneYearOut && s.couponFrequency === 'SEMIANNUALLY'
    );
    expect(activeSecurity).toBeDefined();

    const cusip = activeSecurity!.cusip;
    console.log(`Using CUSIP: ${cusip} (matures ${activeSecurity!.maturityDate})`);

    const result = await RunValuation({
      mode: 'cusip',
      cusip,
      price: '98.5',
    });

    console.log('CUSIP mode result:', result);

    expect(result.error).toBeUndefined();
    expect(result.currentYield).toBeDefined();
    expect(result.yieldToMaturity).toBeDefined();

    const ytm = parseFloat(result.yieldToMaturity!);
    expect(ytm).toBeGreaterThan(0);
    expect(ytm).toBeLessThan(1);
  }, 30000);

});
