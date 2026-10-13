/**
 * /data/curves returned 500 once a curve was buildable: forward points carry
 * the tenor label "0-10", which the compact decoder rejects (LM-313).
 *
 * @vitest-environment node
 */
import { describe, expect, test } from "vitest";
import { DecimalValueProto } from "@fintekkers/ledger-models/node/fintekkers/models/util/decimal_value_pb.js";
import { toDecimalProto } from "$lib/decimal";
import { curvePointYears } from "$lib/curveTenor";

const label = (s: string) =>
  new DecimalValueProto().setArbitraryPrecisionValue(s);

describe("curvePointYears", () => {
  test("numeric tenors decode in both forms", () => {
    expect(curvePointYears(toDecimalProto("9.95"))).toBe(9.95);
    expect(curvePointYears(label("2.5"))).toBe(2.5);
  });

  test("a forward label gives its start year instead of throwing", () => {
    expect(curvePointYears(label("0-10"))).toBe(0);
    expect(curvePointYears(label("1.5-2"))).toBe(1.5);
  });

  test("missing or unreadable tenors are null", () => {
    expect(curvePointYears(undefined)).toBeNull();
    expect(curvePointYears(new DecimalValueProto())).toBeNull();
    expect(curvePointYears(label("ten years"))).toBeNull();
  });
});
