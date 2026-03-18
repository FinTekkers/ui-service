import { RunValuation } from '$lib/valuation';
import type { BondCalculatorInputs } from '$lib/valuation';
import { FetchSecurity } from '$lib/security';

/** @type {import('../../../../../.svelte-kit/types/src/routes').PageServerLoad} */
export async function load({ locals, request }) {
  const searchParams = new URLSearchParams(request.url.split('?')[1]);

  // Load available securities for CUSIP autocomplete
  let securities: { cusip: string; issuerName: string; couponRate?: string; maturityDate: string }[] = [];
  try {
    const allSecurities = await FetchSecurity('Fixed Income', 'US Government');
    securities = allSecurities.map(s => ({
      cusip: s.cusip,
      issuerName: s.issuerName,
      couponRate: s.couponRate,
      maturityDate: s.maturityDate,
    }));
  } catch (e) {
    console.error('Failed to load securities for autocomplete:', e);
  }

  const mode = searchParams.get('mode') as 'cusip' | 'manual' | null;
  const price = searchParams.get('price');

  if (!mode || !price) {
    return { result: null, securities, user: locals.user };
  }

  const inputs: BondCalculatorInputs = {
    mode,
    price,
    cusip: searchParams.get('cusip') ?? undefined,
    faceValue: searchParams.get('faceValue') ?? undefined,
    couponRate: searchParams.get('couponRate') ?? undefined,
    couponFrequency: (searchParams.get('couponFrequency') as BondCalculatorInputs['couponFrequency']) ?? undefined,
    issueDate: searchParams.get('issueDate') ?? undefined,
    maturityDate: searchParams.get('maturityDate') ?? undefined,
    issuerName: searchParams.get('issuerName') ?? undefined,
  };

  const result = await RunValuation(inputs);
  return { result, securities, user: locals.user };
}
