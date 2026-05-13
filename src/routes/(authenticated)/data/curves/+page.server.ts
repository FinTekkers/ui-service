/**
 * Live yield curves on /data/curves (Phase 3 of #203 + term-forward view #264).
 *
 * Pipeline:
 *   1. Pick on-the-run bonds via SecurityService for the selected as-of date.
 *   2. Fetch the latest clean price ≤ as-of for each bond from PriceService.
 *   3. Build CurveRequestProto with `asof_datetime`, the three curve types,
 *      and (if a term is selected) `forward_term_years = T`. With the term set,
 *      the FORWARD_YIELD result is the term-forward series f(t, t+T) at annual
 *      starting points t ∈ [0, T_max − T] rather than the legacy single-line
 *      forward curve.
 *   4. Call ValuationClient.runCurve via the broker.
 *   5. Map CurveResultProto[] → {par, spot, forward}. Tenor labels are
 *      decimal years (e.g. "9.95Y") — no bucket snapping, the chart axis
 *      is the source of truth.
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
import {
  formatYears,
  parseForwardTerm,
  type ForwardTermYears,
} from '$lib/curveForwardTerm';

const { MeasureProto } = measure_pkg;

export interface CurvePoint {
  tenor: string;   // decimal-year display label (e.g. "9.95Y")
  years: number;   // numeric (decimal years). For the term-forward trace this is
                   //   the *starting* year t, not the maturity tenor.
  yield: number;   // percent (e.g. 4.25 means 4.25%)
}

interface PageData {
  par: CurvePoint[];
  spot: CurvePoint[];
  forward: CurvePoint[];
  curveDate: string;
  termYears: ForwardTermYears;
  warnings: string[];
  error: string | null;
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
  termYears: ForwardTermYears,
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
  // With forward_term_years set, the FORWARD_YIELD result is the term-forward
  // series f(t, t+T) at annual t — replaces the legacy single-line forward
  // curve. Added on ledger-models@0.2.4 (valuation-service PR #50).
  request.setForwardTermYears(termYears);

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
      const cp: CurvePoint = { tenor: formatYears(years), years, yield: yieldPct };
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
  const termYears = parseForwardTerm(url.searchParams.get('term'));

  let picks: CurveBondPick[] = [];
  try {
    picks = await selectOnTheRunBonds(asOf, apiKey);
  } catch (e: any) {
    return {
      par: [], spot: [], forward: [], curveDate, termYears,
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

  const { request, warnings } = buildCurveRequest(picks, pricesByCusip, asOf, termYears);

  if (request.getCurveInputsList().length < 2) {
    return {
      par: [], spot: [], forward: [], curveDate, termYears,
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
      par: [], spot: [], forward: [], curveDate, termYears, warnings,
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

  return { par, spot, forward, curveDate, termYears, warnings, error: null };
}
