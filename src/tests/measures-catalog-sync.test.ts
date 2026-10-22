/**
 * US-249: src/lib/data/measures.json is a byte-for-byte copy of the
 * ledger-models measure catalog (ledger-models-protos/catalog/measures.json
 * at LM-372, commit cf99e711). The published npm package still ships the
 * pre-LM-372 catalog, so the file is vendored and pinned by hash here.
 *
 * To re-sync: copy the upstream file unchanged (it is in .prettierignore),
 * then update UPSTREAM_SHA256 and the commit above.
 */
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import measuresData from "$lib/data/measures.json";

// sha256 of ledger-models-protos/catalog/measures.json at cf99e711 (LM-372).
const UPSTREAM_SHA256 =
  "1c9130613b6d2ec61a291f063a0064994ccb9569eaa955ab4913c205e862c4de";

// SecurityTypeProto names retired in ledger-models M1.4.
const RETIRED_NAMES = [
  "BOND_SECURITY",
  "FRN",
  "EQUITY_SECURITY",
  "CASH_SECURITY",
  "INDEX_SECURITY",
  "EQUITY_INDEX_SECURITY",
  "STRIPS_SECURITY",
  "T_BILL",
  "UNKNOWN_SECURITY_TYPE",
];

describe("measures.json – synced with the ledger-models catalog", () => {
  test("is byte-equal to the ledger-models catalog", () => {
    const bytes = readFileSync(resolve("src/lib/data/measures.json"));
    const hash = createHash("sha256").update(bytes).digest("hex");
    expect(hash).toBe(UPSTREAM_SHA256);
  });

  test("applies_to uses no retired SecurityTypeProto names", () => {
    const used = measuresData.measures.flatMap((m) => m.applies_to ?? []);
    expect(used.filter((name) => RETIRED_NAMES.includes(name))).toEqual([]);
  });

  test("has exactly one sentinel entry (the page counts length - 1)", () => {
    const sentinels = measuresData.measures.filter(
      (m) => m.category === "sentinel"
    );
    expect(sentinels).toHaveLength(1);
  });
});
