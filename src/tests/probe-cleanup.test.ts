/**
 * US-211 stub tests: e2e probe portfolios are deleted again, even when the
 * test fails, and the stale-probe sweep only ever touches `qa-*-probe-*`
 * rows older than one hour with no linked transactions.
 *
 * Every case runs against `FakeProbeLedger` (no services). The live
 * broker path (`127.0.0.1:8085`) is asserted statically below, and the
 * one live purge of the 11 legacy probes is a Manual check on the item.
 */
import { describe, expect, it, vi } from "vitest";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import {
  BROKER_URL,
  apiKeyFromStorageState,
  brokerMetadata,
  createProbe,
  deleteProbe,
  isProbeName,
  makeProbeName,
  probeAgeMs,
  probeTimestampMs,
  sweepStaleProbes,
} from "./probe-cleanup";
import type { ProbeLedger, ProbePortfolio } from "./probe-cleanup";

// The metric 1 cases run the real e2e hooks and fixture teardown. This
// stand-in for @playwright/test records hooks/tests instead of running a
// browser, and `extend` hands back the fixture definitions.
const pw = vi.hoisted(() => {
  type Fn = (...args: any[]) => any;
  const hooks = {
    beforeAll: [] as Fn[],
    afterEach: [] as Fn[],
    afterAll: [] as Fn[],
    tests: [] as { name: string; fn: Fn }[],
  };
  const test: any = (name: string, fn: Fn) => hooks.tests.push({ name, fn });
  test.describe = (_name: string, fn: Fn) => fn();
  test.beforeAll = (fn: Fn) => hooks.beforeAll.push(fn);
  test.afterEach = (fn: Fn) => hooks.afterEach.push(fn);
  test.afterAll = (fn: Fn) => hooks.afterAll.push(fn);
  test.extend = (fixtures: unknown) => fixtures;
  return { hooks, test, ledger: { current: null as unknown } };
});
vi.mock("@playwright/test", () => ({ test: pw.test, expect: vi.fn() }));
vi.mock("../../tests/e2e/fixtures/auth", () => ({
  STORAGE_STATE_PATH: "/nonexistent/user.json",
}));
vi.mock("./probe-cleanup", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./probe-cleanup")>()),
  createGrpcProbeLedger: () => pw.ledger.current,
}));

interface RecordedCall {
  op: string;
  name?: string;
}

class FakeProbeLedger implements ProbeLedger {
  calls: RecordedCall[] = [];
  portfolios: ProbePortfolio[] = [];
  linked = new Map<string, boolean>();
  failingChecks = new Set<string>();
  created: string[] = [];
  deleted: string[] = [];

  async createOrUpdatePortfolio(name: string): Promise<void> {
    this.calls.push({ op: "createOrUpdatePortfolio", name });
    this.created.push(name);
  }

  async searchPortfolios(): Promise<ProbePortfolio[]> {
    this.calls.push({ op: "searchPortfolios" });
    return this.portfolios.map((p) => ({ ...p }));
  }

  async hasLinkedTransactions(name: string): Promise<boolean> {
    this.calls.push({ op: "hasLinkedTransactions", name });
    if (this.failingChecks.has(name)) {
      throw new Error("transaction search unavailable");
    }
    return this.linked.get(name) ?? false;
  }

  async deletePortfolio(name: string): Promise<void> {
    this.calls.push({ op: "deletePortfolio", name });
    this.deleted.push(name);
  }
}

const NOW = 1_790_000_000_000;
const MIN = 60_000;

function probeAt(ageMs: number): ProbePortfolio {
  return {
    name: `qa-221-probe-${(NOW - ageMs).toString(36)}`,
    asOfMs: NOW - ageMs,
    uuidHex: "ab".repeat(16),
  };
}

function ops(ledger: FakeProbeLedger): string[] {
  return ledger.calls.map((c) => c.op);
}

/** Sweep may only read and delete portfolios — never write anything. */
function expectSweepOnly(ledger: FakeProbeLedger, allowed: string[]): void {
  for (const call of ledger.calls) {
    expect(allowed).toContain(call.op);
  }
  expect(ledger.created).toEqual([]);
}

describe("metric 1: owned probe deleted even on failure", () => {
  it("forced failure in the spec: afterEach/afterAll Delete every Create", async () => {
    const ledger = new FakeProbeLedger();
    pw.ledger.current = ledger;
    await import("../../tests/e2e/portfolios-show-all.spec");
    for (const hook of pw.hooks.beforeAll) await hook();
    const failingPage = {
      goto: async () => {
        throw new Error("forced failure");
      },
    };
    await expect(pw.hooks.tests[0].fn({ page: failingPage })).rejects.toThrow(
      "forced failure"
    );
    for (const hook of pw.hooks.afterEach) await hook();
    for (const hook of pw.hooks.afterAll) await hook();
    expect(ledger.created).toHaveLength(2);
    expect([...ledger.deleted].sort()).toEqual([...ledger.created].sort());
  });

  it("forced failure under the probePortfolio fixture still Deletes", async () => {
    const ledger = new FakeProbeLedger();
    pw.ledger.current = ledger;
    const { test: fixtures } = (await import(
      "../../tests/e2e/fixtures/probe"
    )) as any;
    const [probePortfolio] = fixtures.probePortfolio;
    await expect(
      probePortfolio({}, async () => {
        throw new Error("forced failure");
      })
    ).rejects.toThrow("forced failure");
    expect(ledger.created).toHaveLength(1);
    expect(ledger.deleted).toEqual(ledger.created);
  });

  it("success path: two Creates then two Deletes", async () => {
    const ledger = new FakeProbeLedger();
    const first = makeProbeName(NOW);
    const second = makeProbeName(NOW + 1);
    await createProbe(ledger, first);
    await createProbe(ledger, second);
    await deleteProbe(ledger, first);
    await deleteProbe(ledger, second);
    expect(ledger.created).toEqual([first, second]);
    expect(ledger.deleted).toEqual([first, second]);
  });
});

describe("metric 2: stale-probe sweep", () => {
  it("deletes only the 2-hour-old probe out of four rows", async () => {
    const ledger = new FakeProbeLedger();
    const stale = probeAt(2 * 60 * MIN);
    const fresh = probeAt(10 * MIN);
    const seed: ProbePortfolio = {
      name: "RandomPortfolio 0",
      asOfMs: NOW - 2 * 60 * MIN,
      uuidHex: "cd".repeat(16),
    };
    const other: ProbePortfolio = {
      name: "qa-221-other",
      asOfMs: NOW - 2 * 60 * MIN,
      uuidHex: "ef".repeat(16),
    };
    ledger.portfolios = [stale, fresh, seed, other];
    const deleted = await sweepStaleProbes(ledger, { nowMs: NOW });
    expect(deleted).toEqual([stale.name]);
    expect(ledger.deleted).toEqual([stale.name]);
    const checked = ledger.calls
      .filter((c) => c.op === "hasLinkedTransactions")
      .map((c) => c.name);
    expect(checked).toEqual([stale.name]);
    expectSweepOnly(ledger, [
      "searchPortfolios",
      "hasLinkedTransactions",
      "deletePortfolio",
    ]);
  });

  it("retention boundary: 61-minute probe deleted, 59 kept", async () => {
    const ledger = new FakeProbeLedger();
    const old = probeAt(61 * MIN);
    const young = probeAt(59 * MIN);
    ledger.portfolios = [old, young];
    const deleted = await sweepStaleProbes(ledger, { nowMs: NOW });
    expect(deleted).toEqual([old.name]);
    expect(ledger.deleted).toEqual([old.name]);
  });

  it("unparsable suffix is skipped: no Delete, no crash", async () => {
    const ledger = new FakeProbeLedger();
    ledger.portfolios = [
      { name: "qa-221-probe-latest", asOfMs: NOW, uuidHex: "ab".repeat(16) },
      { name: "qa-221-probe-latest", asOfMs: null, uuidHex: "ab".repeat(16) },
    ];
    const deleted = await sweepStaleProbes(ledger, { nowMs: NOW });
    expect(deleted).toEqual([]);
    expect(ledger.deleted).toEqual([]);
  });
});

describe("metric 4: transaction-linked probes are kept", () => {
  it("no Delete, cleanup throws, log names the portfolio", async () => {
    const ledger = new FakeProbeLedger();
    const blocked = probeAt(2 * 60 * MIN);
    ledger.portfolios = [blocked];
    ledger.linked.set(blocked.name, true);
    const logs: string[] = [];
    await expect(
      sweepStaleProbes(ledger, { nowMs: NOW, log: (m) => logs.push(m) })
    ).rejects.toThrow(blocked.name);
    expect(ledger.deleted).toEqual([]);
    expect(logs.join("\n")).toContain(blocked.name);
  });

  it("deleteProbe refuses a linked probe without deleting", async () => {
    const ledger = new FakeProbeLedger();
    const logs: string[] = [];
    const blocked = probeAt(2 * 60 * MIN).name;
    ledger.linked.set(blocked, true);
    await expect(
      deleteProbe(ledger, blocked, { log: (m) => logs.push(m) })
    ).rejects.toThrow(blocked);
    expect(ledger.deleted).toEqual([]);
    expect(logs.join("\n")).toContain(blocked);
  });

  it("unverifiable transactions fail closed, naming the probe", async () => {
    const ledger = new FakeProbeLedger();
    const unknown = probeAt(2 * 60 * MIN);
    ledger.portfolios = [unknown];
    ledger.failingChecks.add(unknown.name);
    const logs: string[] = [];
    await expect(
      sweepStaleProbes(ledger, { nowMs: NOW, log: (m) => logs.push(m) })
    ).rejects.toThrow(unknown.name);
    expect(ledger.deleted).toEqual([]);
    expect(logs.join("\n")).toContain(unknown.name);
  });
});

describe("guardrail 1: anchored qa-*-probe-* match", () => {
  it("matches full probe names only", () => {
    expect(isProbeName("qa-221-probe-abc123")).toBe(true);
    expect(isProbeName("qa-a-probe-b")).toBe(true);
    expect(isProbeName(makeProbeName(NOW))).toBe(true);
    expect(isProbeName("RandomPortfolio 0")).toBe(false);
    expect(isProbeName("qa-221-other")).toBe(false);
    expect(isProbeName("xqa-221-probe-y")).toBe(false);
    expect(isProbeName("qa-221-probe-")).toBe(false);
    expect(isProbeName("")).toBe(false);
    expect(isProbeName(undefined)).toBe(false);
    expect(isProbeName("QA-221-PROBE-X")).toBe(false);
  });

  it("word suffixes like -latest never parse as timestamps", () => {
    expect(probeTimestampMs("qa-221-probe-latest", NOW)).toBeNull();
    expect(probeAgeMs("qa-221-probe-latest", null, NOW)).toBeNull();
    expect(probeAgeMs("qa-221-probe-latest", NOW, NOW)).toBe(0);
  });

  it("sweep never deletes a stale near-miss name", async () => {
    const ledger = new FakeProbeLedger();
    const oldSuffix = (NOW - 2 * 60 * MIN).toString(36);
    ledger.portfolios = [
      {
        name: `xqa-221-probe-${oldSuffix}`,
        asOfMs: NOW - 2 * 60 * MIN,
        uuidHex: "ab".repeat(16),
      },
      {
        name: "qa-221-other",
        asOfMs: NOW - 2 * 60 * MIN,
        uuidHex: "cd".repeat(16),
      },
      {
        name: "RandomPortfolio 0",
        asOfMs: NOW - 2 * 60 * MIN,
        uuidHex: "ef".repeat(16),
      },
    ];
    const deleted = await sweepStaleProbes(ledger, { nowMs: NOW });
    expect(deleted).toEqual([]);
    expect(ledger.deleted).toEqual([]);
    expect(ops(ledger)).toEqual(["searchPortfolios"]);
  });

  it("deleteProbe refuses a non-probe name untouched", async () => {
    const ledger = new FakeProbeLedger();
    await expect(deleteProbe(ledger, "RandomPortfolio 0")).rejects.toThrow(
      "RandomPortfolio 0"
    );
    expect(ledger.calls).toEqual([]);
  });

  it("createProbe rejects a non-probe name before any write", async () => {
    const ledger = new FakeProbeLedger();
    await expect(createProbe(ledger, "RandomPortfolio 0")).rejects.toThrow(
      "RandomPortfolio 0"
    );
    expect(ledger.created).toEqual([]);
  });

  it("sweep issues no transaction or security writes", async () => {
    const ledger = new FakeProbeLedger();
    const stale = probeAt(2 * 60 * MIN);
    ledger.portfolios = [stale];
    await sweepStaleProbes(ledger, { nowMs: NOW });
    expect(ops(ledger)).toEqual([
      "searchPortfolios",
      "hasLinkedTransactions",
      "deletePortfolio",
    ]);
    for (const call of ledger.calls) {
      if (call.op === "deletePortfolio") {
        expect(isProbeName(call.name)).toBe(true);
      }
    }
  });
});

describe("guardrail 4: broker-only routing", () => {
  // Built at runtime so this file never contains the legacy host literal.
  const legacyHost = ["local", "host"].join("") + ":" + [80, 82].join("");

  it("helper targets the broker for every RPC", () => {
    const src = fs.readFileSync(
      path.resolve("src/tests/probe-cleanup.ts"),
      "utf-8"
    );
    expect(src).toContain(BROKER_URL);
    expect(src).not.toContain(legacyHost);
  });

  it("spec targets the broker and keeps no legacy host", () => {
    const src = fs.readFileSync(
      path.resolve("tests/e2e/portfolios-show-all.spec.ts"),
      "utf-8"
    );
    expect(src).toContain(BROKER_URL);
    expect(src).not.toContain(legacyHost);
  });

  it("live client sends the app's tenant routing header and API key", () => {
    const metadata = brokerMetadata("key-123");
    expect(metadata.get("x-fintekkers-tenant")).toEqual([
      process.env.FINTEKKERS_TENANT ?? "production",
    ]);
    expect(metadata.get("x-api-key")).toEqual(["key-123"]);
    expect(brokerMetadata(undefined).get("x-api-key")).toEqual([]);
  });
});

describe("broker API key from the Playwright session", () => {
  const writeState = (state: unknown): string => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "probe-cleanup-"));
    const file = path.join(dir, "user.json");
    fs.writeFileSync(file, JSON.stringify(state));
    return file;
  };

  it("reads the ft_api_key cookie", () => {
    const file = writeState({
      cookies: [
        { name: "other", value: "x" },
        { name: "ft_api_key", value: "key-abc" },
      ],
    });
    try {
      expect(apiKeyFromStorageState(file)).toBe("key-abc");
    } finally {
      fs.rmSync(path.dirname(file), { recursive: true, force: true });
    }
  });

  it("returns undefined when the file or cookie is missing", () => {
    const file = writeState({ cookies: [] });
    try {
      expect(apiKeyFromStorageState(file)).toBeUndefined();
      expect(
        apiKeyFromStorageState(path.join(path.dirname(file), "missing.json"))
      ).toBeUndefined();
    } finally {
      fs.rmSync(path.dirname(file), { recursive: true, force: true });
    }
  });
});
