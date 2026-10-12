/**
 * DecimalValueProto in and out of the service (US-212), over the
 * ledger-models LM-306 codec. Encode writes both the compact form
 * (unscaled bytes + scale) and the deprecated string, so older readers keep
 * working; decode prefers the compact form and falls back to the string for
 * data written before ledger-models 0.4.34. Values stay decimal strings, with
 * their scale, end to end: no Number on this path.
 */
import type { DecimalValueProto } from "@fintekkers/ledger-models/node/fintekkers/models/util/decimal_value_pb.js";
import {
  decodeDecimal,
  encodeDecimal,
  isUnsetDecimal,
  parseDecimalString,
  toCanonicalString,
} from "@fintekkers/ledger-models/node/wrappers/models/utils/decimal";

/** `"1.50"` becomes unscaled 150, scale 2, plus the string `"1.50"`. */
export function toDecimalProto(value: string): DecimalValueProto {
  return encodeDecimal(parseDecimalString(value));
}

/**
 * The exact decimal string, trailing zeros kept, or `undefined` when there
 * is no proto. A proto with neither form set reads as `""`, as it did
 * before the compact form.
 */
export function fromDecimalProto(
  proto: DecimalValueProto | null | undefined
): string | undefined {
  if (!proto) return undefined;
  if (isUnsetDecimal(proto)) return "";
  return toCanonicalString(decodeDecimal(proto));
}
