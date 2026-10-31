/**
 * US-303 metric 4: src/lib/valuation.ts never builds a ProductInput arm
 * itself. Only ledger-models' forSecurity maps a product type to an arm, so
 * the file has no setBond(, setTips( or setFrn( call. Reading the file
 * throws if it is renamed or missing, so the scan cannot pass on nothing.
 */
import fs from "fs";
import path from "path";
import { describe, expect, test } from "vitest";

const FILE = "src/lib/valuation.ts";

describe("metric 4: valuation.ts sets no ProductInput arm by hand", () => {
  const src = fs.readFileSync(path.resolve(FILE), "utf-8");

  test(`${FILE} is read and builds through forSecurity`, () => {
    expect(src.length).toBeGreaterThan(0);
    expect(src).toContain("forSecurity(");
  });

  test.each(["setBond(", "setTips(", "setFrn("])(
    `${FILE} has 0 matches for %s`,
    (setter) => {
      expect(src.split(setter).length - 1).toBe(0);
    }
  );
});
