import { RunValuation, RunTipsValuation, RunFrnValuation } from '$lib/valuation';
import type { BondCalculatorInputs, TipsCalculatorInputs, FrnCalculatorInputs } from '$lib/valuation';
import { FetchSecurity } from '$lib/security';
import { SecurityTypeProto } from '@fintekkers/ledger-models/node/fintekkers/models/security/security_type_pb.js';

type SecurityItem = { cusip: string; issuerName: string; couponRate?: string; maturityDate: string };

/** @type {import('../../../../../.svelte-kit/types/src/routes').PageServerLoad} */
export async function load({ locals, request }) {
  const searchParams = new URLSearchParams(request.url.split('?')[1]);

  // Load available securities for CUSIP autocomplete
  let bondSecurities: SecurityItem[] = [];
  let tipsSecurities: SecurityItem[] = [];
  let frnSecurities: SecurityItem[] = [];
  try {
    const allSecurities = await FetchSecurity('Fixed Income', 'US Government');
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '/');

    for (const s of allSecurities) {
      // Filter out matured securities
      if (s.maturityDate < today) continue;

      const item: SecurityItem = {
        cusip: s.cusip,
        issuerName: s.issuerName,
        couponRate: s.couponRate,
        maturityDate: s.maturityDate,
      };

      if (s.securityType === SecurityTypeProto.TIPS) {
        tipsSecurities.push(item);
      } else if (s.securityType === SecurityTypeProto.FRN) {
        frnSecurities.push(item);
      } else {
        bondSecurities.push(item);
      }
    }
  } catch (e) {
    console.error('Failed to load securities for autocomplete:', e);
  }

  const tab = searchParams.get('tab');
  const emptyResults = { result: null, tipsResult: null, frnResult: null };

  // --- TIPS Calculator ---
  if (tab === 'tips') {
    const tipsMode = searchParams.get('tipsMode') as 'cusip' | 'manual' | null;
    const tipsPrice = searchParams.get('tipsPrice');

    if (!tipsMode || !tipsPrice) {
      return { ...emptyResults, bondSecurities, tipsSecurities, frnSecurities, activeTab: 'tips', user: locals.user };
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

    const tipsResult = await RunTipsValuation(tipsInputs);
    return { ...emptyResults, tipsResult, bondSecurities, tipsSecurities, frnSecurities, activeTab: 'tips', user: locals.user };
  }

  // --- FRN Calculator ---
  if (tab === 'frn') {
    const frnMode = searchParams.get('frnMode') as 'cusip' | 'manual' | null;

    if (!frnMode) {
      return { ...emptyResults, bondSecurities, tipsSecurities, frnSecurities, activeTab: 'frn', user: locals.user };
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

    const frnResult = await RunFrnValuation(frnInputs);
    return { ...emptyResults, frnResult, bondSecurities, tipsSecurities, frnSecurities, activeTab: 'frn', user: locals.user };
  }

  // --- Bond Calculator ---
  const mode = searchParams.get('mode') as 'cusip' | 'manual' | null;
  const price = searchParams.get('price');

  if (!mode || !price) {
    return { ...emptyResults, bondSecurities, tipsSecurities, frnSecurities, activeTab: 'bond', user: locals.user };
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
  return { ...emptyResults, result, bondSecurities, tipsSecurities, frnSecurities, activeTab: 'bond', user: locals.user };
}
