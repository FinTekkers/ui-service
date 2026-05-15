/**
 * Shared RunCurve plumbing — extracted from /data/curves/+page.server.ts
 * so /data/treasury_curve can plot real par yields per tenor instead of
 * the bond's coupon rate (#305 part B).
 *
 * Same wire shape as the live-curves page: build a CurveRequestProto
 * carrying the constituent SecurityProtos + clean prices, ask the
 * valuation service for PAR_YIELD (and SPOT/FORWARD if the caller
 * wants), and return par-yields keyed by the constituent's tenor label
 * so per-row joins on `tenor` work.
 */
import { ValuationClient } from '@fintekkers/ledger-models/node/fintekkers/services/valuation-service/valuation_service_grpc_pb.js';
import { CurveRequestProto, CurveInputProto } from '@fintekkers/ledger-models/node/fintekkers/requests/valuation/curve_request_pb.js';
import type { CurveResponseProto } from '@fintekkers/ledger-models/node/fintekkers/requests/valuation/curve_response_pb.js';
import { DecimalValueProto } from '@fintekkers/ledger-models/node/fintekkers/models/util/decimal_value_pb.js';
import measure_pkg from '@fintekkers/ledger-models/node/fintekkers/models/position/measure_pb.js';
import { ZonedDateTime } from '@fintekkers/ledger-models/node/wrappers/models/utils/datetime';
import { getServiceConnection } from '$lib/grpc-auth';
import type { CurveConstituent } from '$lib/treasuryCurveData';

const { MeasureProto } = measure_pkg;

function decimal(value: string): DecimalValueProto {
  return new DecimalValueProto().setArbitraryPrecisionValue(value);
}

function endOfDayProto(asOf: Date) {
  const eod = new Date(Date.UTC(
    asOf.getUTCFullYear(), asOf.getUTCMonth(), asOf.getUTCDate(),
    23, 59, 59, 999,
  ));
  return ZonedDateTime.from(eod).toProto();
}

/**
 * Build the par-yields-only CurveRequest. /data/treasury_curve doesn't
 * need spot/forward — the per-row table just needs PAR_YIELD per
 * tenor. Skipping spot/forward keeps the response small and the
 * client→server payload tighter.
 */
function buildParYieldRequest(constituents: CurveConstituent[], asOf: Date): CurveRequestProto {
  const request = new CurveRequestProto();
  request.setObjectClass('CurveRequestProto');
  request.setVersion('0.0.1');
  request.setAsofDatetime(endOfDayProto(asOf));
  request.setCurveTypesList([MeasureProto.PAR_YIELD]);
  for (const c of constituents) {
    if (c.cleanPrice === null) continue;
    const input = new CurveInputProto();
    input.setSecurity((c.bond as any).proto);
    input.setCleanPrice(decimal(c.cleanPrice.toString()));
    request.addCurveInputs(input);
  }
  return request;
}

/**
 * Map RunCurve par-yield points back to the input constituents by
 * matching on years-to-maturity. The fitter emits at each bond's
 * ACTUAL years-to-maturity (e.g. 0.2055 for a 1M bill that's 75 days
 * out, 29.76 for a 30Y bond auctioned ~3 months ago), NOT at the
 * canonical bucket year (1/12, 30, …). Joining by `bucketMonths/12`
 * with a tight window left 4 of 9 priced constituents unmapped on
 * 2026-05-14 (#305 reopen): 1M (delta 0.12), 3Y (0.08), 20Y (0.24),
 * 30Y (0.24).
 *
 * Fix: compute each constituent's maturityYears from the actual
 * maturityDate field and asOf, then pair to the closest fitter point.
 * Tolerance widened to 0.5y — well under the smallest inter-bucket
 * gap (1Y → 2Y, 6M → 1Y) so cross-matching adjacent buckets stays
 * impossible, but loose enough to absorb day-count / end-of-day
 * conventions on either side.
 */
function joinByMaturityYears(
  constituents: CurveConstituent[],
  parPoints: Array<{ years: number; yieldPct: number }>,
  asOf: Date,
): Map<string, number> {
  const out = new Map<string, number>();
  const MS_PER_YEAR = 365.25 * 86400 * 1000;
  for (const c of constituents) {
    if (!c.maturityDate) continue;
    const cYears = (c.maturityDate.getTime() - asOf.getTime()) / MS_PER_YEAR;
    if (!Number.isFinite(cYears) || cYears <= 0) continue;
    let best: { years: number; yieldPct: number } | null = null;
    let bestDelta = Number.POSITIVE_INFINITY;
    for (const p of parPoints) {
      const d = Math.abs(p.years - cYears);
      if (d < bestDelta) { bestDelta = d; best = p; }
    }
    // 0.5y tolerance: smallest inter-bucket gap is 0.5y (6M → 1Y)
    // so cross-matching adjacent buckets is impossible. Day-count /
    // end-of-day conventions account for ~0.01y; a real fitter
    // mismatch would be ≫ 0.5y.
    if (best && bestDelta <= 0.5) out.set(c.tenor, best.yieldPct);
  }
  return out;
}

/**
 * Compute par-yield-per-tenor for the given constituents at the given
 * asOf. Returns an empty map if RunCurve fails or if fewer than 2
 * constituents have prices (curve fitter needs ≥2 to bootstrap).
 *
 * Caller is responsible for deciding what to do with missing tenors;
 * the /data/treasury_curve page renders `—` in the column for any
 * row whose tenor isn't in the map.
 */
export async function runCurveParYieldsByTenor(
  constituents: CurveConstituent[],
  asOf: Date,
  apiKey?: string,
): Promise<Map<string, number>> {
  const priced = constituents.filter((c) => c.cleanPrice !== null);
  if (priced.length < 2) return new Map();

  const request = buildParYieldRequest(priced, asOf);
  if (request.getCurveInputsList().length < 2) return new Map();

  let response: CurveResponseProto;
  try {
    const conn = getServiceConnection(apiKey);
    const client = new ValuationClient(conn.url, conn.credentials, { interceptors: conn.interceptors });
    response = await new Promise<CurveResponseProto>((resolve, reject) => {
      client.runCurve(request, (err, resp) => (err ? reject(err) : resolve(resp)));
    });
  } catch (e: any) {
    console.warn(`runCurveParYieldsByTenor — RunCurve failed: ${e?.details ?? e?.message ?? e}`);
    return new Map();
  }

  const parPoints: Array<{ years: number; yieldPct: number }> = [];
  for (const result of response.getCurveResultsList()) {
    if (result.getCurveType() !== MeasureProto.PAR_YIELD) continue;
    for (const point of result.getPointsList()) {
      const tenorStr = point.getTenor()?.getArbitraryPrecisionValue();
      const yieldStr = point.getYield()?.getArbitraryPrecisionValue();
      if (!tenorStr || !yieldStr) continue;
      const years = parseFloat(tenorStr);
      const yieldPct = parseFloat(yieldStr) * 100;
      if (Number.isFinite(years) && Number.isFinite(yieldPct)) {
        parPoints.push({ years, yieldPct });
      }
    }
  }

  return joinByMaturityYears(constituents, parPoints, asOf);
}
