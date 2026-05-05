/**
 * Live yield curves on /data/curves (Phase 3 of #203).
 *
 * Pipeline:
 *   1. Pick on-the-run bonds via SecurityService for the selected as-of date.
 *      (Same selection logic /data/treasury_curve uses — lifted to
 *      $lib/treasuryCurveSelection.)
 *   2. Fetch the latest clean price ≤ as-of for each bond from PriceService.
 *   3. Build CurveRequestProto with `asof_datetime = asOf 23:59:59.9999Z`,
 *      `curve_types = [PAR_YIELD, SPOT_YIELD, FORWARD_YIELD]`, and one
 *      CurveInputProto per bond carrying `security` (issue + maturity dates
 *      populated) and `clean_price` — server runs YTM internally and
 *      computes tenor from `(maturity − asof)`. No tenor override sent.
 *   4. Call ValuationClient.runCurve via the broker.
 *   5. Map CurveResultProto[] → {par, spot, forward}: each is
 *      Array<{tenor, years, yield}> where `tenor` is a UI label like "1Y".
 */
import { ValuationClient } from '@fintekkers/ledger-models/node/fintekkers/services/valuation-service/valuation_service_grpc_pb.js';
import { CurveRequestProto, CurveInputProto } from '@fintekkers/ledger-models/node/fintekkers/requests/valuation/curve_request_pb.js';
import type { CurveResponseProto } from '@fintekkers/ledger-models/node/fintekkers/requests/valuation/curve_response_pb.js';
import { DecimalValueProto } from '@fintekkers/ledger-models/node/fintekkers/models/util/decimal_value_pb.js';
import { PriceProto } from '@fintekkers/ledger-models/node/fintekkers/models/price/price_pb.js';
import measure_pkg from '@fintekkers/ledger-models/node/fintekkers/models/position/measure_pb.js';
import { ZonedDateTime } from '@fintekkers/ledger-models/node/wrappers/models/utils/datetime';
import { getServiceConnection } from '$lib/grpc-auth';
import { selectOnTheRunBonds, type CurveBondPick } from '$lib/treasuryCurveSelection';
import { fetchPricesForSecurity, priceAsOf } from '$lib/curvePrices';

const { MeasureProto } = measure_pkg;

export interface CurvePoint {
  tenor: string;   // UI label — derived from years
  years: number;   // numeric (decimal years)
  yield: number;   // percent (e.g. 4.25 means 4.25%)
}

interface PageData {
  par: CurvePoint[];
  spot: CurvePoint[];
  forward: CurvePoint[];
  curveDate: string;
  warnings: string[];
  error: string | null;
}

/**
 * Format decimal years as a UI tenor label. Server-derived tenors don't snap
 * exactly to "10Y" — a 10Y on-the-run bond has ~9.95Y to maturity by the time
 * it's traded — so we round to the nearest standard bucket within tolerance.
 */
function tenorLabel(years: number): string {
  const months = years * 12;
  if (months <= 1.5) return '1M';
  if (months <= 4) return '3M';
  if (months <= 9) return '6M';
  if (months <= 18) return '1Y';
  if (months <= 30) return '2Y';
  if (months <= 48) return '3Y';
  if (months <= 72) return '5Y';
  if (months <= 102) return '7Y';
  if (months <= 168) return '10Y';
  if (months <= 300) return '20Y';
  return '30Y';
}

function decimal(value: string): DecimalValueProto {
  return new DecimalValueProto().setArbitraryPrecisionValue(value);
}

/**
 * End-of-day timestamp at 23:59:59.999 UTC for the given calendar date.
 * Per #203 decision table: as-of semantics are end-of-day.
 */
function endOfDayProto(asOf: Date) {
  const eod = new Date(Date.UTC(
    asOf.getUTCFullYear(), asOf.getUTCMonth(), asOf.getUTCDate(),
    23, 59, 59, 999,
  ));
  return ZonedDateTime.from(eod).toProto();
}

function buildCurveRequest(
  picks: CurveBondPick[],
  pricesByCusip: Map<string, number>,
  asOf: Date,
): { request: CurveRequestProto; warnings: string[] } {
  const warnings: string[] = [];
  const request = new CurveRequestProto();
  request.setObjectClass('CurveRequestProto');
  request.setVersion('0.0.1');
  request.setAsofDatetime(endOfDayProto(asOf));
  request.setCurveTypesList([
    MeasureProto.PAR_YIELD,
    MeasureProto.SPOT_YIELD,
    MeasureProto.FORWARD_YIELD,
  ]);

  for (const pick of picks) {
    if (!pick.bond) {
      warnings.push(`No on-the-run bond found for ${pick.tenor} bucket`);
      continue;
    }
    const price = pricesByCusip.get(pick.cusip);
    if (price === undefined) {
      warnings.push(`No price available for ${pick.cusip} (${pick.tenor})`);
      continue;
    }

    // Each input carries the SecurityProto (with issue + maturity dates that
    // the server uses for tenor) and the clean price (the server runs YTM
    // internally to convert it to a yield). No `tenor` override — that's the
    // entire point of Phase 2.
    const input = new CurveInputProto();
    input.setSecurity(pick.bond.proto);

    // Server expects clean_price either directly on CurveInputProto.clean_price
    // (Phase 2 server reads this preferentially) or wrapped in a PriceProto on
    // the legacy `price` field. Use the new direct field.
    input.setCleanPrice(decimal(price.toString()));

    request.addCurveInputs(input);
  }

  return { request, warnings };
}

function parseCurveResponse(response: CurveResponseProto): {
  par: CurvePoint[]; spot: CurvePoint[]; forward: CurvePoint[];
} {
  const par: CurvePoint[] = [];
  const spot: CurvePoint[] = [];
  const forward: CurvePoint[] = [];

  for (const result of response.getCurveResultsList()) {
    const curveType = result.getCurveType();
    for (const point of result.getPointsList()) {
      const tenorStr = point.getTenor()?.getArbitraryPrecisionValue();
      const yieldStr = point.getYield()?.getArbitraryPrecisionValue();
      if (!tenorStr || !yieldStr) continue;
      const years = parseFloat(tenorStr);
      // Backend returns yield in decimal (0-1 scale) per CurveResponseProto
      // doc: "decimal, 0-1 scale; e.g. 0.045 = 4.50%". UI displays percent.
      const yieldPct = parseFloat(yieldStr) * 100;
      const cp: CurvePoint = { tenor: tenorLabel(years), years, yield: yieldPct };
      if (curveType === MeasureProto.PAR_YIELD) par.push(cp);
      else if (curveType === MeasureProto.SPOT_YIELD) spot.push(cp);
      else if (curveType === MeasureProto.FORWARD_YIELD) forward.push(cp);
    }
  }

  return { par, spot, forward };
}

/** @type {import('./$types').PageServerLoad} */
export async function load({ url, locals }: { url: URL; locals: App.Locals }): Promise<PageData> {
  const apiKey = locals.user?.apiKey;
  const dateParam = url.searchParams.get('asof');
  const asOf: Date = dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)
    ? new Date(dateParam + 'T12:00:00Z')
    : new Date();
  const curveDate = asOf.toISOString().slice(0, 10);

  let picks: CurveBondPick[] = [];
  try {
    picks = await selectOnTheRunBonds(asOf, apiKey);
  } catch (e: any) {
    return {
      par: [], spot: [], forward: [], curveDate,
      warnings: [],
      error: `Failed to load on-the-run bonds: ${e.message ?? e}`,
    };
  }

  // Fetch prices in parallel — one per bond pick that has a UUID.
  const cusipToPriceEntries = await Promise.all(
    picks.map(async (pick) => {
      if (!pick.bond) return [pick.cusip, undefined] as const;
      try {
        const uuidStr = pick.bond.getID().toString();
        const prices = await fetchPricesForSecurity(uuidStr, apiKey);
        const latest = priceAsOf(prices, asOf);
        return [pick.cusip, latest?.price] as const;
      } catch {
        return [pick.cusip, undefined] as const;
      }
    }),
  );
  const pricesByCusip = new Map<string, number>();
  for (const [cusip, price] of cusipToPriceEntries) {
    if (price !== undefined) pricesByCusip.set(cusip, price);
  }

  const { request, warnings } = buildCurveRequest(picks, pricesByCusip, asOf);

  if (request.getCurveInputsList().length < 2) {
    return {
      par: [], spot: [], forward: [], curveDate,
      warnings,
      error: 'Insufficient curve inputs — need at least 2 bonds with prices to bootstrap a curve.',
    };
  }

  let response: CurveResponseProto;
  try {
    const conn = getServiceConnection(apiKey);
    const client = new ValuationClient(conn.url, conn.credentials, { interceptors: conn.interceptors });
    response = await new Promise<CurveResponseProto>((resolve, reject) => {
      client.runCurve(request, (err, resp) => (err ? reject(err) : resolve(resp)));
    });
  } catch (e: any) {
    return {
      par: [], spot: [], forward: [], curveDate, warnings,
      error: `RunCurve failed: ${e.details ?? e.message ?? e}`,
    };
  }

  const { par, spot, forward } = parseCurveResponse(response);

  // Surface backend warnings (e.g. "Tenor gap between 7Y and 20Y…") alongside
  // any client-side warnings (missing prices). WarningProto carries a
  // `Message` detail; we render it textually if available.
  const summary = response.getSummary?.();
  if (summary) {
    try {
      for (const w of summary.getWarningsList?.() ?? []) {
        // WarningProto has a `Message detail` field rather than a flat string.
        // Fall back to the type name + code when no detail is set.
        const detail = (w as any).getDetail?.();
        const text = detail?.toString?.() ?? `Warning code ${(w as any).getCode?.()}`;
        if (text) warnings.push(text);
      }
    } catch { /* summary shape varies */ }
  }

  return { par, spot, forward, curveDate, warnings, error: null };
}
