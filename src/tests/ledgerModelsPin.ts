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
 * Asserts package-lock pins ledger-models at or above `floor`, package.json's
 * range is a caret on that pinned version, and node_modules has it installed.
 */
export function expectLedgerModelsAtLeast(floor: string) {
  const lock = readJson("package-lock.json");
  const pkg = readJson("package.json");
  const locked =
    lock.packages["node_modules/@fintekkers/ledger-models"].version;
  expect(locked).toMatch(/^\d+\.\d+\.\d+$/);
  expect(
    versionAtLeast(locked, floor),
    `ledger-models ${locked} is below ${floor}`
  ).toBe(true);
  expect(lock.packages[""].dependencies["@fintekkers/ledger-models"]).toBe(
    pkg.dependencies["@fintekkers/ledger-models"]
  );
  expect(pkg.dependencies["@fintekkers/ledger-models"]).toBe(`^${locked}`);
  const installed = readJson(
    "node_modules/@fintekkers/ledger-models/package.json"
  );
  expect(installed.version).toBe(locked);
}
