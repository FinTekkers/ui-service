/**
 * DecimalValueProto in and out of the service (US-212), over the
 * ledger-models LM-306 codec: the compact form (unscaled bytes + scale) is
 * the only form (LM-318). Values stay decimal strings, with their scale, end
 * to end: no Number on this path.
 */
import type { DecimalValueProto } from "@fintekkers/ledger-models/node/fintekkers/models/util/decimal_value_pb.js";
import {
  decodeDecimal,
  encodeDecimal,
  isUnsetDecimal,
  parseDecimalString,
  toCanonicalString,
} from "@fintekkers/ledger-models/node/wrappers/models/utils/decimal";

/** `"1.50"` becomes unscaled 150, scale 2. */
export function toDecimalProto(value: string): DecimalValueProto {
  return encodeDecimal(parseDecimalString(value));
}

/**
 * The exact decimal string, trailing zeros kept, or `undefined` when there
 * is no proto. An unset proto reads as `""`.
 */
export function fromDecimalProto(
  proto: DecimalValueProto | null | undefined
): string | undefined {
  if (!proto) return undefined;
  if (isUnsetDecimal(proto)) return "";
  return toCanonicalString(decodeDecimal(proto));
}
