/**
 * US-354: the CoreWeave 2030 seed (scripts/lib/seed-crwv-2030.ts), run
 * against an in-memory ledger.
 * - Run 1 creates the security; run 2 writes nothing and reports noop.
 * - It matches on the ISIN only: another CoreWeave 9.25% security with a
 *   different ISIN is never written.
 * - A changed field updates it, keeping its UUID; two matches abort with
 *   no write.
 * - A missing FT_SEED_API_KEY or BROKER_HOST exits 2 before any client is
 *   made, and the key never reaches the output.
 * - No credential is written in the scripts.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, test, vi } from "vitest";
import {
  CashDetailsProto,
  SecurityProto,
} from "@fintekkers/ledger-models/node/fintekkers/models/security/security_pb.js";
import { IdentifierProto } from "@fintekkers/ledger-models/node/fintekkers/models/security/identifier/identifier_pb.js";
import { IdentifierTypeProto } from "@fintekkers/ledger-models/node/fintekkers/models/security/identifier/identifier_type_pb.js";
import { UUID } from "@fintekkers/ledger-models/node/wrappers/models/utils/uuid";
import { toDecimalProto } from "$lib/decimal";
import {
  CRWV_ISIN,
  crwvSecurityProto,
  main,
  seedAction,
  type SeedDeps,
} from "../../scripts/lib/seed-crwv-2030";

const KEY = "seed-key-not-a-real-one-7f3a";
const ENV = { FT_SEED_API_KEY: KEY, BROKER_HOST: "127.0.0.1:0" };

const USD = new SecurityProto()
  .setAssetClass("Cash")
  .setIssuerName("USD")
  .setCashDetails(new CashDetailsProto().setCashId("USD"));

const uuidOf = (s: SecurityProto) =>
  UUID.fromUUIDProto(s.getUuid())?.toString();

/** A ledger keyed by UUID; search matches on any identifier value, as a
 * loose ledger search might. */
function memoryLedger(initial: SecurityProto[] = []) {
  const store = new Map<string, SecurityProto>();
  for (const s of initial) store.set(uuidOf(s) ?? "", s);
  const writes: SecurityProto[] = [];
  const lines: string[] = [];
  const deps: SeedDeps = {
    usd: async () => USD,
    search: vi.fn(async (value: string) =>
      [...store.values()]
        .filter((s) =>
          s.getIdentifiersList().some((id) => id.getIdentifierValue() === value)
        )
        .map((s) => SecurityProto.deserializeBinary(s.serializeBinary()))
    ),
    write: vi.fn(async (s: SecurityProto) => {
      writes.push(s);
      store.set(uuidOf(s) ?? "", s);
    }),
    log: (line) => lines.push(line),
    error: (line) => lines.push(line),
  };
  return { store, writes, lines, deps };
}

/** The same CoreWeave coupon and issuer, another ISIN. */
function lookalike(): SecurityProto {
  return crwvSecurityProto().setIdentifiersList([
    new IdentifierProto()
      .setIdentifierType(IdentifierTypeProto.ISIN)
      .setIdentifierValue("US21873SAA67"),
  ]);
}

describe("seed-crwv-2030 main", () => {
  test("run 1 creates, run 2 writes nothing and reports noop; a look-alike is never touched", async () => {
    const other = lookalike();
    const otherBytes = other.serializeBinary();
    const ledger = memoryLedger([other]);

    expect(await main(ENV, () => ledger.deps, ledger.deps)).toBe(0);
    expect(ledger.writes).toHaveLength(1);
    expect(ledger.lines).toEqual([`seed-crwv-2030: create ${CRWV_ISIN}`]);
    const created = ledger.writes[0];
    expect(created.getSettlementCurrency()?.getCashDetails()?.getCashId()).toBe(
      "USD"
    );
    expect(
      created.getIdentifiersList().map((id) => id.getIdentifierValue())
    ).toEqual([CRWV_ISIN]);

    expect(await main(ENV, () => ledger.deps, ledger.deps)).toBe(0);
    expect(ledger.writes).toHaveLength(1);
    expect(ledger.lines[1]).toBe(`seed-crwv-2030: noop ${CRWV_ISIN}`);

    expect(ledger.store.get(uuidOf(other) ?? "")?.serializeBinary()).toEqual(
      otherBytes
    );
    expect(ledger.writes.map(uuidOf)).not.toContain(uuidOf(other));
    expect(ledger.store.size).toBe(2);
  });

  test("a changed field updates the security under its existing UUID", async () => {
    const stale = crwvSecurityProto();
    stale.getBondDetails()?.setCouponRate(toDecimalProto("9.5"));
    const ledger = memoryLedger([stale]);

    expect(await main(ENV, () => ledger.deps, ledger.deps)).toBe(0);
    expect(ledger.writes).toHaveLength(1);
    expect(uuidOf(ledger.writes[0])).toBe(uuidOf(stale));
    expect(ledger.lines).toEqual([`seed-crwv-2030: update ${CRWV_ISIN}`]);
    expect(ledger.store.size).toBe(1);

    expect(await main(ENV, () => ledger.deps, ledger.deps)).toBe(0);
    expect(ledger.writes).toHaveLength(1);
  });

  test("two securities with the ISIN: abort, nothing written", async () => {
    const ledger = memoryLedger([crwvSecurityProto(), crwvSecurityProto()]);
    expect(await main(ENV, () => ledger.deps, ledger.deps)).toBe(1);
    expect(ledger.writes).toEqual([]);
    expect(ledger.lines[0]).toMatch(/abort/);
  });

  test("a failed write exits 1 without echoing the key", async () => {
    const ledger = memoryLedger();
    ledger.deps.write = vi.fn(async () => {
      throw new Error("7 PERMISSION_DENIED: write not allowed");
    });
    expect(await main(ENV, () => ledger.deps, ledger.deps)).toBe(1);
    expect(ledger.lines.join("\n")).toMatch(/PERMISSION_DENIED/);
    expect(ledger.lines.join("\n")).not.toContain(KEY);
  });

  test.each([
    [{ BROKER_HOST: "127.0.0.1:0" }, /FT_SEED_API_KEY/],
    [{ FT_SEED_API_KEY: KEY }, /BROKER_HOST/],
    [{ FT_SEED_API_KEY: "  ", BROKER_HOST: "127.0.0.1:0" }, /FT_SEED_API_KEY/],
    [{}, /FT_SEED_API_KEY and BROKER_HOST/],
  ])("exit 2 when a variable is missing (%j)", async (env, named) => {
    const lines: string[] = [];
    const makeDeps = vi.fn();
    const code = await main(env, makeDeps, {
      log: (l) => lines.push(l),
      error: (l) => lines.push(l),
    });
    expect(code).toBe(2);
    expect(makeDeps).not.toHaveBeenCalled();
    expect(lines.join("\n")).toMatch(named);
    expect(lines.join("\n")).not.toContain(KEY);
  });

  test("the key reaches the client factory only", async () => {
    const ledger = memoryLedger();
    const makeDeps = vi.fn(() => ledger.deps);
    await main(ENV, makeDeps, ledger.deps);
    expect(makeDeps).toHaveBeenCalledWith(KEY);
    expect(ledger.lines.join("\n")).not.toContain(KEY);
  });
});

describe("seedAction", () => {
  test("create, noop, update and abort", () => {
    const wanted = crwvSecurityProto();
    expect(seedAction([], wanted)).toBe("create");
    expect(seedAction([crwvSecurityProto()], wanted)).toBe("noop");
    const later = crwvSecurityProto();
    later.getBondDetails()?.setFaceValue(toDecimalProto("2000"));
    expect(seedAction([later], wanted)).toBe("update");
    expect(seedAction([crwvSecurityProto(), crwvSecurityProto()], wanted)).toBe(
      "abort"
    );
    expect(seedAction([lookalike()], wanted)).toBe("create");
  });

  test("the seeded security has no call or put input", () => {
    const bond = crwvSecurityProto().getBondDetails();
    expect(bond?.getCallable()).toBe(false);
    expect(bond?.hasCallDate()).toBe(false);
  });
});

describe("credentials", () => {
  test.each(["scripts/seed-crwv-2030.ts", "scripts/lib/seed-crwv-2030.ts"])(
    "%s reads the key from the environment and holds no literal",
    (file) => {
      const source = readFileSync(path.resolve(file), "utf8");
      expect(source).not.toMatch(/FT_SEED_API_KEY\s*[:=]\s*["'`][^"'`]/);
      expect(source).not.toMatch(/x-api-key/i);
      expect(source).not.toMatch(/["'`][A-Za-z0-9_-]{32,}["'`]/);
    }
  );
});
