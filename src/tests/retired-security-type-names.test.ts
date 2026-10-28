/**
 * Moved from measures-catalog-sync.test.ts (US-249) when US-297 dropped the
 * vendored measure catalog: the src/ grep guards more than the catalog.
 */
import { spawnSync } from "node:child_process";
import { describe, expect, test } from "vitest";

// Names of the old security-type enum, retired in ledger-models M1.4. Built
// from fragments so this file does not itself match the src/ grep below.
const SEC = "_SECURITY";
const OLD_ENUM = "Security" + "TypeProto";
const RETIRED_NAMES = [
  "BOND" + SEC,
  "FRN",
  "EQUITY" + SEC,
  "CASH" + SEC,
  "INDEX" + SEC,
  "EQUITY_INDEX" + SEC,
  "STRIPS" + SEC,
  "T" + "_BILL",
  "UNKNOWN" + SEC + "_TYPE",
];

// git grep exits 1 when nothing matches; return the matching lines otherwise.
function gitGrep(pattern: string, path: string): string {
  const result = spawnSync("git", ["grep", "-nE", pattern, "--", path], {
    encoding: "utf8",
  });
  if (result.status === 1) return "";
  if (result.status !== 0) {
    throw new Error(`git grep failed: ${result.stderr || result.error}`);
  }
  return result.stdout;
}

describe("retired security-type names", () => {
  test("src/ contains no retired security-type names", () => {
    // Plain-English "FRN" (e.g. "FRN Pricer") is not the enum name, so FRN
    // is excluded here; the quoted enum token is checked in data only.
    const names = RETIRED_NAMES.filter((n) => n !== "FRN").map((n) =>
      n.startsWith("T_") ? `\\b${n}\\b` : n
    );
    expect(gitGrep([OLD_ENUM, ...names].join("|"), "src")).toBe("");
    expect(gitGrep('"FRN"', "src/lib/data")).toBe("");
  });
});
