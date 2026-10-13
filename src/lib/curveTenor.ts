import type { DecimalValueProto } from "@fintekkers/ledger-models/node/fintekkers/models/util/decimal_value_pb.js";
import { fromDecimalProto } from "$lib/decimal";

// Forward-curve points carry their tenor as the text label "from-to" (e.g.
// "0-10") in the decimal's string form, which the compact decoder rejects as
// "not a finite decimal". Until ledger-models gives CurvePointProto numeric
// from/to tenors (LM-313), read the label's start year, as the page did
// before US-212 (parseFloat("0-10") === 0).
const FORWARD_LABEL = /^\s*(-?\d+(?:\.\d+)?)\s*-\s*-?\d+(?:\.\d+)?\s*$/;

/** Decimal years for a curve point's tenor, or null if it has none. */
export function curvePointYears(
  tenor: DecimalValueProto | null | undefined
): number | null {
  if (!tenor) return null;
  try {
    const s = fromDecimalProto(tenor);
    if (!s) return null;
    const years = parseFloat(s);
    return Number.isFinite(years) ? years : null;
  } catch {
    // The deprecated string form, read only for the forward label.
    const label = tenor.getArbitraryPrecisionValue?.() ?? "";
    const m = FORWARD_LABEL.exec(label);
    return m ? parseFloat(m[1]) : null;
  }
}
