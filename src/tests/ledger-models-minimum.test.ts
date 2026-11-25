/**
 * US-336: the ledger-models minimum is raised to the LM-491 release
 * (1.1.55, first with SecurityMetricTypeProto.EXPENSE_RATIO, which /free/spy's
 * fee chart reads), and no further. US-334 had raised it to the LM-485
 * release (1.1.53, first with SecurityMetricService). US-307 had raised it to the LM-433 release (1.1.31, first with
 * MeasureProto.INFLATION_COMPENSATION, which /free/soma requests). US-303 had raised it to the LM-427
 * release (1.1.27, ProductInputs.measuresForArm). The lockfile resolves a
 * release at or above that minimum: the checks' install step refreshes
 * ledger-models to
 * the newest version in range, so no exact version is held (never a pin).
 */
import fs from "fs";
import path from "path";
import { describe, expect, test } from "vitest";

const MINIMUM = "1.1.55";

const readJson = (file: string) =>
  JSON.parse(fs.readFileSync(path.resolve(file), "utf-8"));

/** Compares dotted numeric versions, e.g. "1.1.32" vs "1.1.31". */
function compareVersions(a: string, b: string): number {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d !== 0) return d;
  }
  return 0;
}

describe("ledger-models minimum is the LM-491 release", () => {
  test(`package.json declares exactly ">=${MINIMUM}"`, () => {
    expect(
      readJson("package.json").dependencies["@fintekkers/ledger-models"]
    ).toBe(`>=${MINIMUM}`);
  });

  test(`package-lock.json declares ">=${MINIMUM}" and resolves a release at or above it`, () => {
    const lock = readJson("package-lock.json");
    expect(lock.packages[""].dependencies["@fintekkers/ledger-models"]).toBe(
      `>=${MINIMUM}`
    );
    const resolved: string =
      lock.packages["node_modules/@fintekkers/ledger-models"].version;
    expect(resolved).toMatch(/^\d+\.\d+\.\d+$/);
    expect(compareVersions(resolved, MINIMUM)).toBeGreaterThanOrEqual(0);
  });
});
