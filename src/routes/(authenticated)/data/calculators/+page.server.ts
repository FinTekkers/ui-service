import { RunValuation, RunTipsValuation, RunFrnValuation } from '$lib/valuation';
import type { BondCalculatorInputs, TipsCalculatorInputs, FrnCalculatorInputs } from '$lib/valuation';
import { FetchSecurity } from '$lib/security';

type SecurityItem = {
  cusip: string;
  issuerName: string;
  couponRate?: string;
  maturityDate: string;
  // #266: TIPS-only — auto-populates the Reference CPI input on CUSIP
  // pick. Undefined for non-TIPS items.
  baseCpi?: string;
};

/** @type {import('../../../../../.svelte-kit/types/src/routes').PageServerLoad} */
export async function load({ locals, request }) {
  const apiKey = locals.user?.apiKey;
  const searchParams = new URLSearchParams(request.url.split('?')[1]);

  // Stream securities in the background — page renders immediately,
  // autocomplete dropdowns populate when the fetch completes.
  // M5 / #260: scope to asset_class=RATES (GOV_BOND leaves all
  // carry RATES per hierarchy.json), issuer=US Government. The
  // tree-aware AssetClassFilter would let FIXED_INCOME widen to
  // {RATES, CREDIT}, but for the calculator's Treasury-specific
  // dropdowns the narrower RATES is correct.
  const securitiesPromise = FetchSecurity('RATES', 'US Government', undefined, undefined, undefined, undefined, apiKey)
    .then(allSecurities => {
      const today = new Date().toISOString().slice(0, 10).replace(/-/g, '/');
      const bondSecurities: SecurityItem[] = [];
      const tipsSecurities: SecurityItem[] = [];
      const frnSecurities: SecurityItem[] = [];

      for (const s of allSecurities) {
        if (s.maturityDate < today) continue;
        const item: SecurityItem = {
          cusip: s.cusip,
          issuerName: s.issuerName,
          couponRate: s.couponRate,
          maturityDate: s.maturityDate,
          baseCpi: s.baseCpi,
        };
        // M5 / #260: dispatch by productType *name* (proto enum name
        // string) so we don't have to import ProductTypeProto here.
        // 'FRN' became 'TREASURY_FRN' in the v0.2.1 product registry.
        if (s.productType === 'TIPS') tipsSecurities.push(item);
        else if (s.productType === 'TREASURY_FRN') frnSecurities.push(item);
        else bondSecurities.push(item);
      }
      return { bondSecurities, tipsSecurities, frnSecurities };
    })
    .catch(e => {
      console.error('Failed to load securities for autocomplete:', e);
      return { bondSecurities: [] as SecurityItem[], tipsSecurities: [] as SecurityItem[], frnSecurities: [] as SecurityItem[] };
    });

  const tab = searchParams.get('tab');
  const emptyResults = { result: null, tipsResult: null, frnResult: null };

  // --- TIPS Calculator ---
  if (tab === 'tips') {
    const tipsMode = searchParams.get('tipsMode') as 'cusip' | 'manual' | null;
    const tipsPrice = searchParams.get('tipsPrice');

    if (!tipsMode || !tipsPrice) {
      return { ...emptyResults, streamed: { securities: securitiesPromise }, activeTab: 'tips', user: locals.user };
    }

    const tipsInputs: TipsCalculatorInputs = {
      mode: tipsMode,
      price: tipsPrice,
      currentCpi: searchParams.get('currentCpi') ?? undefined,
      settlementDate: searchParams.get('settlementDate') ?? undefined,
      cusip: searchParams.get('tipsCusip') ?? undefined,
      faceValue: searchParams.get('tipsFaceValue') ?? undefined,
      realCouponRate: searchParams.get('realCouponRate') ?? undefined,
      couponFrequency: (searchParams.get('tipsCouponFrequency') as TipsCalculatorInputs['couponFrequency']) ?? undefined,
      referenceCpi: searchParams.get('referenceCpi') ?? undefined,
      issueDate: searchParams.get('tipsIssueDate') ?? undefined,
      maturityDate: searchParams.get('tipsMaturityDate') ?? undefined,
    };

    const tipsResult = await RunTipsValuation(tipsInputs, apiKey);
    return { ...emptyResults, tipsResult, streamed: { securities: securitiesPromise }, activeTab: 'tips', user: locals.user };
  }

  // --- FRN Calculator ---
  if (tab === 'frn') {
    const frnMode = searchParams.get('frnMode') as 'cusip' | 'manual' | null;

    if (!frnMode) {
      return { ...emptyResults, streamed: { securities: securitiesPromise }, activeTab: 'frn', user: locals.user };
    }

    const frnInputs: FrnCalculatorInputs = {
      mode: frnMode,
      price: searchParams.get('frnPrice') ?? undefined,
      referenceRate: searchParams.get('referenceRate') ?? '',
      spread: searchParams.get('frnSpread') ?? '',
      cusip: searchParams.get('frnCusip') ?? undefined,
      faceValue: searchParams.get('frnFaceValue') ?? undefined,
      couponFrequency: (searchParams.get('frnCouponFrequency') as FrnCalculatorInputs['couponFrequency']) ?? undefined,
      maturityDate: searchParams.get('frnMaturityDate') ?? undefined,
      referenceRateIndex: (searchParams.get('referenceRateIndex') as FrnCalculatorInputs['referenceRateIndex']) ?? undefined,
    };

    const frnResult = await RunFrnValuation(frnInputs, apiKey);
    return { ...emptyResults, frnResult, streamed: { securities: securitiesPromise }, activeTab: 'frn', user: locals.user };
  }

  // --- Bond Calculator ---
  const mode = searchParams.get('mode') as 'cusip' | 'manual' | null;
  const price = searchParams.get('price');

  if (!mode || !price) {
    return { ...emptyResults, streamed: { securities: securitiesPromise }, activeTab: 'bond', user: locals.user };
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

  const result = await RunValuation(inputs, apiKey);
  return { ...emptyResults, result, streamed: { securities: securitiesPromise }, activeTab: 'bond', user: locals.user };
}
