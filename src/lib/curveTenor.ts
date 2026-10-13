import type { CurvePointProto } from "@fintekkers/ledger-models/node/fintekkers/requests/valuation/curve_response_pb.js";
import type { DecimalValueProto } from "@fintekkers/ledger-models/node/fintekkers/models/util/decimal_value_pb.js";
import { fromDecimalProto } from "$lib/decimal";

/**
 * Decimal years for a curve point, or null if it has none. Par and spot
 * points carry `tenor`; forward points carry their period in `from_tenor` /
 * `to_tenor` (LM-313), and readers must not parse their `tenor`. A forward
 * point's years is its start, `from_tenor`.
 */
export function curvePointYears(
  point: CurvePointProto,
  forward: boolean
): number | null {
  return decimalYears(forward ? point.getFromTenor() : point.getTenor());
}

function decimalYears(
  tenor: DecimalValueProto | null | undefined
): number | null {
  const s = fromDecimalProto(tenor);
  if (!s) return null;
  const years = parseFloat(s);
  return Number.isFinite(years) ? years : null;
}
