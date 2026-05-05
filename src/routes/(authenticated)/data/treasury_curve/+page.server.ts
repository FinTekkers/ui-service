/**
 * /data/treasury_curve — on-the-run UST curve display.
 *
 * Foundation step for #203 Phase 3: in addition to the per-tenor bond
 * selection, fetch the latest clean price ≤ as-of for each bond and surface
 * it as `cleanPrice` on each row. The downstream /data/curves page consumes
 * the same data through `selectOnTheRunBonds` + `fetchPricesForSecurity`.
 */
import { selectOnTheRunBonds, type CurveBondPick } from '$lib/treasuryCurveSelection';
import { fetchPricesForSecurity, priceAsOf } from '$lib/curvePrices';

export interface TreasuryCurveRow {
  tenor: string;
  cusip: string;
  description: string;
  issueDate: string;
  maturityDate: string;
  couponRate: number;
  cleanPrice: number | null;  // null = no price found at/before as-of
}

/** @type {import('./$types').PageServerLoad} */
export async function load({ url, locals }: { url: URL; locals: App.Locals }) {
  const apiKey = locals.user?.apiKey;
  const dateParam = url.searchParams.get('date');
  const asOfDate = dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)
    ? new Date(dateParam + 'T12:00:00')
    : new Date();
  const selectedDate = asOfDate.toISOString().slice(0, 10);

  let picks: CurveBondPick[];
  try {
    picks = await selectOnTheRunBonds(asOfDate, apiKey);
  } catch (e: any) {
    console.error('Error fetching securities for curve:', e?.message ?? e);
    return { curveData: [] as TreasuryCurveRow[], selectedDate };
  }

  // Fetch latest price (≤ asOf) for each pick that has a bond.
  const priceLookups = await Promise.all(
    picks.map(async (pick) => {
      if (!pick.bond) return [pick.tenor, null] as const;
      try {
        const uuidStr = pick.bond.getID().toString();
        const prices = await fetchPricesForSecurity(uuidStr, apiKey);
        const latest = priceAsOf(prices, asOfDate);
        return [pick.tenor, latest?.price ?? null] as const;
      } catch {
        return [pick.tenor, null] as const;
      }
    }),
  );
  const priceByTenor = new Map<string, number | null>(priceLookups);

  const curveData: TreasuryCurveRow[] = picks.map((pick) => {
    if (!pick.bond) {
      return {
        tenor: pick.tenor, cusip: '', description: 'No matching bond',
        issueDate: '', maturityDate: '', couponRate: 0, cleanPrice: null,
      };
    }
    const description = pick.productType
      ? `${pick.productType} ${pick.couponRate}% ${pick.maturityDate!.toISOString().slice(0, 10)}`
      : `${pick.cusip} ${pick.couponRate}% ${pick.maturityDate!.toISOString().slice(0, 10)}`;
    return {
      tenor: pick.tenor,
      cusip: pick.cusip,
      description,
      issueDate: pick.issueDate!.toISOString().slice(0, 10),
      maturityDate: pick.maturityDate!.toISOString().slice(0, 10),
      couponRate: pick.couponRate,
      cleanPrice: priceByTenor.get(pick.tenor) ?? null,
    };
  });

  return { curveData, selectedDate };
}
