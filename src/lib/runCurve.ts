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
 * matching on years-to-maturity (the wire response carries `tenor` in
 * decimal years; constituents carry a `bucketMonths` we convert the
 * same way). We round both sides to two decimals so float-precision
 * artefacts don't cause spurious misses.
 */
function joinByTenor(
  constituents: CurveConstituent[],
  parPoints: Array<{ years: number; yieldPct: number }>,
): Map<string, number> {
  const out = new Map<string, number>();
  for (const c of constituents) {
    const cMonths = c.bucketMonths;
    const cYears = cMonths / 12;
    // Find the closest point within 0.05 years (~ 18 days). The
    // resolver's bucket labels (1M, 3M, 6M, 1Y, 2Y, 3Y, 5Y, 7Y, 10Y,
    // 20Y, 30Y) are coarse enough that the closest point is unambiguous.
    let best: { years: number; yieldPct: number } | null = null;
    let bestDelta = Number.POSITIVE_INFINITY;
    for (const p of parPoints) {
      const d = Math.abs(p.years - cYears);
      if (d < bestDelta) { bestDelta = d; best = p; }
    }
    if (best && bestDelta <= 0.05) out.set(c.tenor, best.yieldPct);
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

  return joinByTenor(constituents, parPoints);
}
