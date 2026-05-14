/**
 * /data/treasury_curve — on-the-run UST curve display.
 *
 * #268: switched to the server-side index resolver. The on-the-run pick
 * rule lives in ledger-service's TreasuryCurveResolver (PR #43); the UI
 * fetches constituents via `SecurityService.GetByIds(uuid, lookthrough=true)`
 * and a follow-up GetByIds for full bodies, then decorates with the latest
 * clean price ≤ as-of per constituent.
 *
 * Tenor labels are derived per-row by mapping the security's months-to-
 * maturity to the closest TENOR_BUCKETS entry (the resolver doesn't
 * carry the bucket label on the wire — the pick rule alone defines the
 * mapping).
 */
import {
  findLatestBuildableDate,
  loadTreasuryCurveBundle,
  type ConstituentBundle,
} from '$lib/treasuryCurveData';

const LATEST_DATE_SCAN_DAYS = 30;

export interface TreasuryCurveRow {
  tenor: string;
  cusip: string;
  description: string;
  issueDate: string;
  maturityDate: string;
  couponRate: number;
  cleanPrice: number | null;  // null = no price found at/before as-of
}

interface PageData {
  curveData: TreasuryCurveRow[];
  selectedDate: string;
  latestBuildableDate: string | null;
  asofWasDefaulted: boolean;
}

function bundleToRows(bundle: ConstituentBundle): TreasuryCurveRow[] {
  return bundle.constituents.map((c) => {
    const maturity = c.maturityDate ? c.maturityDate.toISOString().slice(0, 10) : '';
    const issue = c.issueDate ? c.issueDate.toISOString().slice(0, 10) : '';
    const description = c.productType
      ? `${c.productType} ${c.couponRate}% ${maturity}`
      : `${c.cusip} ${c.couponRate}% ${maturity}`;
    return {
      tenor: c.tenor,
      cusip: c.cusip,
      description,
      issueDate: issue,
      maturityDate: maturity,
      couponRate: c.couponRate,
      cleanPrice: c.cleanPrice,
    };
  });
}

/** @type {import('./$types').PageServerLoad} */
export async function load({ url, locals }: { url: URL; locals: App.Locals }): Promise<PageData> {
  const apiKey = locals.user?.apiKey;
  const dateParam = url.searchParams.get('date');

  let asOfDate: Date;
  let bundle: ConstituentBundle | null = null;
  let asofWasDefaulted: boolean;
  let latestBuildableDateStr: string | null = null;

  if (dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
    asOfDate = new Date(dateParam + 'T12:00:00');
    asofWasDefaulted = false;
    try {
      bundle = await loadTreasuryCurveBundle(asOfDate, apiKey);
    } catch (e: any) {
      console.error('Error fetching securities for curve:', e?.message ?? e);
      bundle = { asOf: asOfDate, constituents: [], pricedCount: 0, fullyPriced: false };
    }
    try {
      const latest = await findLatestBuildableDate(new Date(), LATEST_DATE_SCAN_DAYS, apiKey);
      latestBuildableDateStr = latest.date ? latest.date.toISOString().slice(0, 10) : null;
    } catch { /* hint is non-critical */ }
  } else {
    asofWasDefaulted = true;
    try {
      const latest = await findLatestBuildableDate(new Date(), LATEST_DATE_SCAN_DAYS, apiKey);
      asOfDate = latest.date ?? new Date();
      bundle = latest.bundle ?? await loadTreasuryCurveBundle(asOfDate, apiKey);
      latestBuildableDateStr = latest.date ? latest.date.toISOString().slice(0, 10) : null;
    } catch (e: any) {
      console.error('Error scanning for latest curve date:', e?.message ?? e);
      asOfDate = new Date();
      bundle = { asOf: asOfDate, constituents: [], pricedCount: 0, fullyPriced: false };
    }
  }

  const selectedDate = asOfDate.toISOString().slice(0, 10);

  return {
    curveData: bundleToRows(bundle),
    selectedDate,
    latestBuildableDate: latestBuildableDateStr,
    asofWasDefaulted,
  };
}
