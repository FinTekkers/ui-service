/**
 * US-247 — package.json declares @fintekkers/ledger-models as a minimum
 * version only (owner rule, 22 Oct): no upper bound and no exact version.
 * package-lock.json agrees and resolves a release at or above that minimum.
 * US-242 raised the minimum to 1.1.1, the first release that ships
 * amortisation_elections_pb (AmortisationElectionsProto).
 *
 * @vitest-environment node
 */
import fs from "fs";
import path from "path";
import { describe, expect, test } from "vitest";
import { LEDGER_MODELS_RANGE, versionAtLeast } from "./ledgerModelsPin";

const ROOT = path.resolve(__dirname, "../..");
const PKG = "@fintekkers/ledger-models";

function readJson(rel: string) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, rel), "utf-8"));
}

/** True only for a bare minimum such as ">=1.1.0". */
function isMinimumOnly(range: string): boolean {
  return /^>=\d+\.\d+\.\d+$/.test(range);
}

describe("ledger-models is declared as a minimum version only", () => {
  test("package.json declares exactly >=1.1.1", () => {
    const range = readJson("package.json").dependencies[PKG];
    expect(range).toBe(">=1.1.1");
    expect(range).toBe(LEDGER_MODELS_RANGE);
    expect(isMinimumOnly(range)).toBe(true);
  });

  test.each([
    ["1.1.0", false],
    ["~1.1.0", false],
    ["^1.1.0", false],
    [">=1.1.0 <2", false],
    ["1.1.x", false],
    [">=1.1.0", true],
  ])("isMinimumOnly(%j) is %s", (range, expected) => {
    expect(isMinimumOnly(range)).toBe(expected);
  });

  test("package-lock.json declares >=1.1.1 and resolves 1.1.1 or later", () => {
    const lock = readJson("package-lock.json");
    expect(lock.packages[""].dependencies[PKG]).toBe(">=1.1.1");
    const locked = lock.packages[`node_modules/${PKG}`].version;
    expect(locked).toMatch(/^\d+\.\d+\.\d+$/);
    expect(
      versionAtLeast(locked, "1.1.1"),
      `ledger-models ${locked} is below 1.1.1`
    ).toBe(true);
  });
});
