import type { CurvePointProto } from "@fintekkers/ledger-models/node/fintekkers/requests/valuation/curve_response_pb.js";
import measure_pkg from "@fintekkers/ledger-models/node/fintekkers/models/position/measure_pb.js";
import { fromDecimalProto } from "$lib/decimal";

const { MeasureProto } = measure_pkg;

// LM-313: par and spot points carry their tenor in `tenor`; forward points
// carry the forward period in `from_tenor` / `to_tenor` and their `tenor` must
// not be read. The page plots a forward point at its start year.

/** Decimal years for a curve point's tenor, or null if it has none. */
export function curvePointYears(
  point: CurvePointProto,
  curveType: number
): number | null {
  const tenor =
    curveType === MeasureProto.FORWARD_YIELD
      ? point.getFromTenor()
      : point.getTenor();
  const s = fromDecimalProto(tenor);
  if (!s) return null;
  const years = parseFloat(s);
  return Number.isFinite(years) ? years : null;
}
