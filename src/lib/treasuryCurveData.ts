/**
 * Treasury curve constituent assembly + latest-buildable-date scan.
 *
 * Wraps {@link fetchIndexConstituentUuids} + {@link fetchSecuritiesByUuids}
 * + {@link fetchPricesForSecurity} into a single async call per asOf, plus
 * a server-side scan helper that walks asOf backward until a fully-priced
 * curve is found.
 *
 * The 11-bucket count comes from the registered TreasuryCurveResolver
 * (ledger-service PR #43): {1M, 3M, 6M, 1Y, 2Y, 3Y, 5Y, 7Y, 10Y, 20Y, 30Y}.
 * "Fully priced" = all returned constituents have a clean price ≤ asOf AND
 * the count equals {@link EXPECTED_CONSTITUENT_COUNT}. Partial days are
 * still rendered when a user picks them explicitly, just with warnings.
 */
import {
  TREASURY_CURVE_INDEX_UUID,
  fetchIndexConstituentUuids,
  fetchSecuritiesByUuids,
} from '$lib/indexLookthrough';
import { fetchPricesForSecurity, priceAsOf } from '$lib/curvePrices';
import { couponRateOf, productTypeNameOf } from '$lib/security';
import type Security from '@fintekkers/ledger-models/node/wrappers/models/security/security';
import type BondSecurity from '@fintekkers/ledger-models/node/wrappers/models/security/BondSecurity';

export const EXPECTED_CONSTITUENT_COUNT = 11;

/** Canonical UST par-yield tenor buckets (months). Display order. */
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

export interface CurveConstituent {
  tenor: string;             // bucket label derived from months-to-maturity
  bucketMonths: number;      // bucket size in months
  bond: Security;            // narrowable via .isBond()
  cusip: string;             // primary identifier value
  issueDate: Date | null;
  maturityDate: Date | null;
  couponRate: number;        // % — 0 for TBILL
  productType: string;       // leaf product type name (TBILL/TREASURY_NOTE/...)
  cleanPrice: number | null; // latest price ≤ asOf; null when none found
}

export interface ConstituentBundle {
  asOf: Date;
  constituents: CurveConstituent[]; // in TENOR_BUCKETS order (1M → 30Y)
  pricedCount: number;
  fullyPriced: boolean;
}

/** Pick the closest TENOR_BUCKETS entry by absolute month delta. Exported for tests. */
export function bucketForMonths(monthsToMaturity: number): { label: string; months: number } {
  let best = TENOR_BUCKETS[0];
  let bestDelta = Math.abs(monthsToMaturity - best.months);
  for (const b of TENOR_BUCKETS.slice(1)) {
    const d = Math.abs(monthsToMaturity - b.months);
    if (d < bestDelta) {
      best = b;
      bestDelta = d;
    }
  }
  return best;
}

function monthsBetween(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24 * 30.4375));
}

/**
 * Build a CurveConstituent row from a Security wrapper. Tolerates missing
 * issue/maturity dates by stamping null on the relevant fields — caller's
 * downstream code (RunCurve input build / display row) can skip those.
 */
function toCurveConstituent(security: Security, asOf: Date): CurveConstituent {
  let issueDate: Date | null = null;
  let maturityDate: Date | null = null;
  try { issueDate = security.getIssueDate()?.toDate() ?? null; } catch { /* non-bond */ }
  try { maturityDate = security.getMaturityDate()?.toDate() ?? null; } catch { /* non-bond */ }

  // Security.getSecurityID() throws "Identifier is required" when the
  // underlying proto has no identifier (singular tag 40) and no
  // identifiers[] (tag 42) populated. The TreasuryCurveResolver currently
  // returns at least some constituents in that state — see second-brain#268
  // for the upstream backfill task. Fall back to the bare UUID rather
  // than blowing up the whole curve render.
  let cusip: string;
  try {
    cusip = security.getSecurityID().getIdentifierValue();
  } catch {
    cusip = security.getID().toString();
  }

  const monthsToMaturity = maturityDate ? monthsBetween(asOf, maturityDate) : 0;
  const bucket = bucketForMonths(monthsToMaturity);

  return {
    tenor: bucket.label,
    bucketMonths: bucket.months,
    bond: security as BondSecurity,
    cusip,
    issueDate,
    maturityDate,
    couponRate: Math.round(couponRateOf(security) * 1000) / 1000,
    productType: productTypeNameOf(security),
    cleanPrice: null,
  };
}

/**
 * Resolve the Treasury Curve index for one asOf and decorate each
 * constituent with its latest price ≤ asOf. Returns the bundle ordered
 * by TENOR_BUCKETS — a constituent assigned to a bucket already present
 * resolves to the most-recently-issued one (resolver-side rule, mirrored
 * here just to keep the display deterministic).
 */
export async function loadTreasuryCurveBundle(
  asOf: Date,
  apiKey?: string,
): Promise<ConstituentBundle> {
  const uuids = await fetchIndexConstituentUuids(
    TREASURY_CURVE_INDEX_UUID,
    asOf,
    apiKey,
  );
  if (uuids.length === 0) {
    return { asOf, constituents: [], pricedCount: 0, fullyPriced: false };
  }

  const securities = await fetchSecuritiesByUuids(uuids, asOf, apiKey);

  // Decorate with prices in parallel.
  const priceLookups = await Promise.all(
    securities.map(async (s) => {
      try {
        const prices = await fetchPricesForSecurity(s.getID().toString(), apiKey);
        return priceAsOf(prices, asOf)?.price ?? null;
      } catch { return null; }
    }),
  );

  // Build per-security rows, then sort to TENOR_BUCKETS order. If the
  // resolver returned more than one candidate for the same bucket, keep
  // the most-recently-issued (matches the on-the-run pick rule).
  const rows = securities.map((s, i) => {
    const row = toCurveConstituent(s, asOf);
    row.cleanPrice = priceLookups[i];
    return row;
  });

  const byBucket = new Map<string, CurveConstituent>();
  for (const row of rows) {
    const existing = byBucket.get(row.tenor);
    if (!existing) { byBucket.set(row.tenor, row); continue; }
    const a = existing.issueDate?.getTime() ?? 0;
    const b = row.issueDate?.getTime() ?? 0;
    if (b > a) byBucket.set(row.tenor, row);
  }

  const ordered: CurveConstituent[] = [];
  for (const bucket of TENOR_BUCKETS) {
    const row = byBucket.get(bucket.label);
    if (row) ordered.push(row);
  }

  const pricedCount = ordered.filter((c) => c.cleanPrice !== null).length;
  return {
    asOf,
    constituents: ordered,
    pricedCount,
    fullyPriced:
      ordered.length >= EXPECTED_CONSTITUENT_COUNT &&
      pricedCount >= EXPECTED_CONSTITUENT_COUNT,
  };
}

export interface LatestBuildable {
  /** First date scanned where the bundle is fullyPriced; null if none in window. */
  date: Date | null;
  /** The bundle for `date`, returned to avoid a second round-trip on the same day. */
  bundle: ConstituentBundle | null;
  /** Number of days scanned (1 = seed only). */
  scannedDays: number;
}

/**
 * Walk asOf backward from `seed` (inclusive) up to `maxDaysBack` days, the
 * first hit returning a fully-priced bundle. Used to default `/data/curves`
 * + `/data/treasury_curve` to a date that actually renders when the user
 * lands on the page without `?asof=` (Bug 4 from #263).
 *
 * Cap is 30 days by default: production data lag is typically T+0–T+1, and
 * the cap protects against pathological cases (data outage) without
 * unbounded scanning. When no fully-priced date is found in the window,
 * returns the latest bundle that had any constituents at all — partial is
 * still better than blank.
 */
export async function findLatestBuildableDate(
  seed: Date,
  maxDaysBack: number,
  apiKey?: string,
): Promise<LatestBuildable> {
  let bestPartial: ConstituentBundle | null = null;
  for (let i = 0; i <= maxDaysBack; i++) {
    const probe = new Date(seed);
    probe.setUTCDate(probe.getUTCDate() - i);
    const bundle = await loadTreasuryCurveBundle(probe, apiKey);
    if (bundle.fullyPriced) {
      return { date: probe, bundle, scannedDays: i + 1 };
    }
    if (!bestPartial || bundle.pricedCount > bestPartial.pricedCount) {
      bestPartial = bundle;
    }
  }
  return {
    date: bestPartial?.asOf ?? null,
    bundle: bestPartial,
    scannedDays: maxDaysBack + 1,
  };
}
