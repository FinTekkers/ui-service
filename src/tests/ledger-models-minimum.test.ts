/**
 * US-303 guardrail 2: the ledger-models minimum is raised to the LM-410
 * release (1.1.25, first with forSecurity, checkProductInput,
 * MissingMarketDataError and the mbs arm), and no further. The lockfile
 * resolves that release.
 */
import fs from "fs";
import path from "path";
import { describe, expect, test } from "vitest";

const readJson = (file: string) =>
  JSON.parse(fs.readFileSync(path.resolve(file), "utf-8"));

describe("guardrail 2: ledger-models minimum is the LM-410 release", () => {
  test('package.json declares exactly ">=1.1.25"', () => {
    expect(
      readJson("package.json").dependencies["@fintekkers/ledger-models"]
    ).toBe(">=1.1.25");
  });

  test("package-lock.json resolves 1.1.25", () => {
    const lock = readJson("package-lock.json");
    expect(lock.packages[""].dependencies["@fintekkers/ledger-models"]).toBe(
      ">=1.1.25"
    );
    expect(
      lock.packages["node_modules/@fintekkers/ledger-models"].version
    ).toBe("1.1.25");
  });
});
