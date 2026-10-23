/**
 * US-249: src/lib/data/measures.json is a byte-for-byte copy of the
 * ledger-models measure catalog (ledger-models-protos/catalog/measures.json
 * at LM-372, commit cf99e711). The published npm package still ships the
 * pre-LM-372 catalog, so the file is vendored and checked by hash here.
 *
 * To re-sync: copy the upstream file unchanged (it is in .prettierignore),
 * then update UPSTREAM_SHA256 and the commit above.
 */
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import measuresData from "$lib/data/measures.json";

// sha256 of ledger-models-protos/catalog/measures.json at cf99e711 (LM-372).
const UPSTREAM_SHA256 =
  "1c9130613b6d2ec61a291f063a0064994ccb9569eaa955ab4913c205e862c4de";

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

describe("measures.json – synced with the ledger-models catalog", () => {
  test("is byte-equal to the ledger-models catalog", () => {
    const bytes = readFileSync(resolve("src/lib/data/measures.json"));
    const hash = createHash("sha256").update(bytes).digest("hex");
    expect(hash).toBe(UPSTREAM_SHA256);
  });

  test("applies_to uses no retired security-type names", () => {
    const used = measuresData.measures.flatMap((m) => m.applies_to ?? []);
    expect(used.filter((name) => RETIRED_NAMES.includes(name))).toEqual([]);
  });

  test("src/ contains no retired security-type names", () => {
    // Plain-English "FRN" (e.g. "FRN Pricer") is not the enum name, so FRN
    // is excluded here; the quoted enum token is checked in data only.
    const names = RETIRED_NAMES.filter((n) => n !== "FRN").map((n) =>
      n.startsWith("T_") ? `\\b${n}\\b` : n
    );
    expect(gitGrep([OLD_ENUM, ...names].join("|"), "src")).toBe("");
    expect(gitGrep('"FRN"', "src/lib/data")).toBe("");
  });

  test("has exactly one sentinel entry (the page counts length - 1)", () => {
    const sentinels = measuresData.measures.filter(
      (m) => m.category === "sentinel"
    );
    expect(sentinels).toHaveLength(1);
  });
});
