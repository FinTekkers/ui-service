/**
 * US-303 guardrail 2: the ledger-models minimum is raised to the LM-427
 * release (1.1.27, first with ProductInputs.measuresForArm; LM-410's
 * forSecurity, checkProductInput, MissingMarketDataError and the mbs arm
 * shipped in 1.1.27), and no further. The lockfile resolves that release.
 */
import fs from "fs";
import path from "path";
import { describe, expect, test } from "vitest";

const readJson = (file: string) =>
  JSON.parse(fs.readFileSync(path.resolve(file), "utf-8"));

describe("guardrail 2: ledger-models minimum is the LM-427 release", () => {
  test('package.json declares exactly ">=1.1.27"', () => {
    expect(
      readJson("package.json").dependencies["@fintekkers/ledger-models"]
    ).toBe(">=1.1.27");
  });

  test("package-lock.json resolves 1.1.27", () => {
    const lock = readJson("package-lock.json");
    expect(lock.packages[""].dependencies["@fintekkers/ledger-models"]).toBe(
      ">=1.1.27"
    );
    expect(
      lock.packages["node_modules/@fintekkers/ledger-models"].version
    ).toBe("1.1.27");
  });
});
