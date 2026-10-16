/**
 * Shared pin check for @fintekkers/ledger-models: the lockfile, package.json
 * and node_modules must agree, at or above the release a feature needs.
 */
import fs from "fs";
import path from "path";
import { expect } from "vitest";

const ROOT = path.resolve(__dirname, "../..");

function readJson(rel: string) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, rel), "utf-8"));
}

/** True when `version` (x.y.z) is at or above `floor` (x.y.z). */
export function versionAtLeast(version: string, floor: string): boolean {
  const a = version.split(".").map(Number);
  const b = floor.split(".").map(Number);
  for (let i = 0; i < 3; i++) {
    if (a[i] !== b[i]) return a[i] > b[i];
  }
  return true;
}

/**
 * package.json's range for ledger-models: floats within 0.4 from 0.4.57,
 * the first release with TipsInput.cpi / InflationIndexInput (US-229).
 */
export const LEDGER_MODELS_RANGE = "^0.4.57";

/**
 * Asserts package-lock pins ledger-models to a 0.4.x at or above both `floor`
 * and 0.4.45, package.json's range is LEDGER_MODELS_RANGE, and node_modules
 * has the pinned version installed.
 */
export function expectLedgerModelsAtLeast(floor: string) {
  const lock = readJson("package-lock.json");
  const pkg = readJson("package.json");
  const locked =
    lock.packages["node_modules/@fintekkers/ledger-models"].version;
  expect(locked).toMatch(/^0\.4\.\d+$/);
  expect(
    versionAtLeast(locked, floor),
    `ledger-models ${locked} is below ${floor}`
  ).toBe(true);
  expect(
    versionAtLeast(locked, "0.4.45"),
    `ledger-models ${locked} is below 0.4.45`
  ).toBe(true);
  expect(lock.packages[""].dependencies["@fintekkers/ledger-models"]).toBe(
    pkg.dependencies["@fintekkers/ledger-models"]
  );
  expect(pkg.dependencies["@fintekkers/ledger-models"]).toBe(
    LEDGER_MODELS_RANGE
  );
  const installed = readJson(
    "node_modules/@fintekkers/ledger-models/package.json"
  );
  expect(installed.version).toBe(locked);
}
