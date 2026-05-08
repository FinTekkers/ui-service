/**
 * Shared on-the-run treasury bond selection used by /data/treasury_curve
 * (display) and /data/curves (live yield-curve fitting via RunCurve).
 *
 * Picks one bond per tenor bucket — the most recently issued whose maturity
 * is closest to (asOf + bucket.months). Mirrors the methodology behind the
 * Treasury par yield curve.
 */
import pkg from '@fintekkers/ledger-models/node/fintekkers/models/position/field_pb.js';
import { PositionFilter } from '@fintekkers/ledger-models/node/wrappers/models/position/positionfilter';
import { SecurityClient } from '@fintekkers/ledger-models/node/fintekkers/services/security-service/security_service_grpc_pb.js';
import { QuerySecurityRequestProto } from '@fintekkers/ledger-models/node/fintekkers/requests/security/query_security_request_pb.js';
import { ZonedDateTime } from '@fintekkers/ledger-models/node/wrappers/models/utils/datetime';
import { SecurityTypeProto } from '@fintekkers/ledger-models/node/fintekkers/models/security/security_type_pb';
import Security from '@fintekkers/ledger-models/node/wrappers/models/security/security';
import type BondSecurity from '@fintekkers/ledger-models/node/wrappers/models/security/BondSecurity';
import { getServiceConnection } from '$lib/grpc-auth';

const { FieldProto } = pkg;

export const TENOR_BUCKETS: { label: string; months: number }[] = [
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

/**
 * One on-the-run candidate per tenor bucket. `bond` is null when no bond
 * within tolerance was found (sparse universe — caller decides whether to
 * skip the tenor or render a "no data" cell).
 */
export interface CurveBondPick {
  tenor: string;        // bucket label
  months: number;       // bucket size
  bond: BondSecurity | null;
  cusip: string;
  issueDate: Date | null;
  maturityDate: Date | null;
  couponRate: number;
  productType: string;
}

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

/**
 * Per-bucket candidate matcher — extracted as a pure helper so the
 * bucket-aware zero-coupon rule (#232) can be unit-tested without
 * mocking the gRPC stack. Generic on the candidate shape: only
 * issueDate / maturityDate / couponRate are read here.
 *
 * Bucket-aware zero-coupon rule (#232 amend after review feedback):
 * T-bills (bucket ≤ 12 months) are LEGITIMATELY zero-coupon —
 * they're discount instruments, not coupon-bearing. The original
 * universal couponRate > 0 filter wrongly excluded them. Notes /
 * bonds (bucket > 12 months) should always have a coupon, so a
 * zero-coupon candidate there is a Treasury STRIP slipping in via
 * the BOND_SECURITY type. Stopgap maturity-bucket heuristic; the
 * long-term fix is a proper STRIPS_SECURITY / T_BILL distinction
 * in ledger-models, tracked upstream alongside this issue.
 */
export function pickBestForBucket<C extends { issueDate: Date; maturityDate: Date; couponRate: number }>(
  candidates: readonly C[],
  bucket: { label: string; months: number },
  asOfDate: Date,
): C | null {
  const targetMaturity = addMonths(asOfDate, bucket.months);
  const toleranceDays = getToleranceDays(bucket.months);

  const matches = candidates
    .filter((c) => Math.abs(daysBetween(targetMaturity, c.maturityDate)) <= toleranceDays)
    .filter((c) => bucket.months <= 12 || c.couponRate > 0)
    .sort((a, b) => b.issueDate.getTime() - a.issueDate.getTime());

  return matches[0] ?? null;
}

/**
 * Fetch all Fixed Income / US Government securities and pick one on-the-run
 * bond per tenor bucket. Returns one entry per bucket; entries with `bond=null`
 * mean no candidate within tolerance.
 */
export async function selectOnTheRunBonds(asOfDate: Date, apiKey?: string): Promise<CurveBondPick[]> {
  const filter = new PositionFilter();
  filter.addEqualsFilter(FieldProto.ASSET_CLASS, 'Fixed Income');

  const conn = getServiceConnection(apiKey);
  const client = new SecurityClient(conn.url, conn.credentials, { interceptors: conn.interceptors });
  const searchRequest = new QuerySecurityRequestProto();
  searchRequest.setObjectClass('SecurityRequest');
  searchRequest.setVersion('0.0.1');
  searchRequest.setAsOf(ZonedDateTime.now().toProto());
  searchRequest.setSearchSecurityInput(filter.toProto());

  // Skip-with-warn on stream errors so a single bad record doesn't kill the
  // whole batch (same pattern as src/lib/security.ts).
  const securities: Security[] = await new Promise((resolve) => {
    const list: Security[] = [];
    const stream = client.search(searchRequest);
    stream.on('data', (response: any) => {
      response.getSecurityResponseList().forEach((proto: any) => {
        try { list.push(Security.create(proto)); } catch { /* skip malformed */ }
      });
    });
    stream.on('end', () => resolve(list));
    stream.on('error', (err: any) => {
      console.warn(`Security stream error after ${list.length} records: ${err.details ?? err.message}`);
      resolve(list);
    });
  });

  const candidates = (securities.filter((s) =>
    s.proto.getSecurityType() === SecurityTypeProto.BOND_SECURITY,
  ) as BondSecurity[])
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

        return { bond, cusip, issueDate, maturityDate, couponRate, productType };
      } catch { return null; }
    })
    .filter((c): c is NonNullable<typeof c> => c !== null)
    // Issued on/before as-of and not yet matured
    .filter((c) => c.issueDate <= asOfDate && c.maturityDate > asOfDate);

  return TENOR_BUCKETS.map((bucket) => {
    const best = pickBestForBucket(candidates, bucket, asOfDate);

    if (!best) {
      return {
        tenor: bucket.label, months: bucket.months,
        bond: null, cusip: '', issueDate: null, maturityDate: null,
        couponRate: 0, productType: '',
      };
    }
    return {
      tenor: bucket.label,
      months: bucket.months,
      bond: best.bond,
      cusip: best.cusip,
      issueDate: best.issueDate,
      maturityDate: best.maturityDate,
      couponRate: Math.round(best.couponRate * 1000) / 1000,
      productType: best.productType,
    };
  });
}
