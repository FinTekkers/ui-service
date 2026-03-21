import pkg from '@fintekkers/ledger-models/node/fintekkers/models/position/field_pb.js';
import { PositionFilter } from '@fintekkers/ledger-models/node/wrappers/models/position/positionfilter';
import { SecurityService } from '@fintekkers/ledger-models/node/wrappers/services/security-service/SecurityService';
import { SecurityTypeProto } from '@fintekkers/ledger-models/node/fintekkers/models/security/security_type_pb';
import type Security from '@fintekkers/ledger-models/node/wrappers/models/security/security';
import type BondSecurity from '@fintekkers/ledger-models/node/wrappers/models/security/BondSecurity';

const { FieldProto } = pkg;

const TENOR_BUCKETS: { label: string; months: number }[] = [
  { label: '1M', months: 1 },
  { label: '3M', months: 3 },
  { label: '6M', months: 6 },
  { label: '1Y', months: 12 },
  { label: '2Y', months: 24 },
  { label: '3Y', months: 36 },
  { label: '5Y', months: 60 },
  { label: '7Y', months: 84 },
  { label: '10Y', months: 120 },
  { label: '20Y', months: 240 },
  { label: '30Y', months: 360 },
];

function getToleranceDays(tenorMonths: number): number {
  if (tenorMonths <= 6) return 45;
  if (tenorMonths <= 12) return 90;
  if (tenorMonths <= 36) return 180;
  return 365;
}

function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

/** @type {import('./$types').PageServerLoad} */
export async function load({ url }: { url: URL }) {
  const dateParam = url.searchParams.get('date');
  let asOfDate: Date;
  if (dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
    asOfDate = new Date(dateParam + 'T12:00:00');
  } else {
    asOfDate = new Date();
  }
  const selectedDate = asOfDate.toISOString().slice(0, 10);

  const securityService = new SecurityService();
  const filter = new PositionFilter();
  filter.addEqualsFilter(FieldProto.ASSET_CLASS, 'Fixed Income');
  filter.addEqualsFilter(FieldProto.SECURITY_ISSUER_NAME, 'US Government');

  let securities: Security[];
  try {
    securities = await securityService.searchSecurityAsOfNow(filter);
  } catch (error: any) {
    console.error('Error fetching securities for curve:', error.message);
    return { curveData: [], selectedDate };
  }

  const bonds = securities.filter((s) => {
    const secType = s.proto.getSecurityType();
    return secType === SecurityTypeProto.BOND_SECURITY;
  }) as BondSecurity[];

  const candidates = bonds
    .map((bond) => {
      try {
        const issueDate = bond.getIssueDate()?.toDate();
        const maturityDate = bond.getMaturityDate()?.toDate();
        if (!issueDate || !maturityDate) return null;

        const cusip = bond.getSecurityID()
          ? bond.getSecurityID().getIdentifierValue()
          : bond.getID().toString();

        let couponRate = 0;
        try {
          const cr = bond.getCouponRate();
          couponRate = cr ? parseFloat(cr.getArbitraryPrecisionValue()) : 0;
        } catch { /* no coupon rate */ }

        let productType = '';
        try { productType = bond.getProductType() || ''; } catch { /* */ }

        return { cusip, issueDate, maturityDate, couponRate, productType };
      } catch { return null; }
    })
    .filter((c): c is NonNullable<typeof c> => c !== null)
    // Only bonds issued on or before the as-of date and not yet matured as of that date
    .filter((c) => c.issueDate <= asOfDate && c.maturityDate > asOfDate);

  const curveData = TENOR_BUCKETS.map((bucket) => {
    const targetMaturity = addMonths(asOfDate, bucket.months);
    const toleranceDays = getToleranceDays(bucket.months);

    const matches = candidates
      .filter((c) => Math.abs(daysBetween(targetMaturity, c.maturityDate)) <= toleranceDays)
      .sort((a, b) => b.issueDate.getTime() - a.issueDate.getTime());

    if (matches.length === 0) {
      return {
        tenor: bucket.label, cusip: '', description: 'No matching bond',
        issueDate: '', maturityDate: '', couponRate: 0,
      };
    }

    const best = matches[0];
    const description = best.productType
      ? `${best.productType} ${best.couponRate}% ${best.maturityDate.toISOString().slice(0, 10)}`
      : `${best.cusip} ${best.couponRate}% ${best.maturityDate.toISOString().slice(0, 10)}`;

    return {
      tenor: bucket.label,
      cusip: best.cusip,
      description,
      issueDate: best.issueDate.toISOString().slice(0, 10),
      maturityDate: best.maturityDate.toISOString().slice(0, 10),
      couponRate: Math.round(best.couponRate * 1000) / 1000,
    };
  });

  return { curveData, selectedDate };
}
