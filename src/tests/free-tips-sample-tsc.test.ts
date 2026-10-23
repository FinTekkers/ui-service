/**
 * US-253: /free/tips shows src/lib/free/samples/tips.ts verbatim, so it must
 * compile against the installed @fintekkers/ledger-models and use only real
 * method names (searchSecurity, FieldProto.IDENTIFIER, getCouponRate,
 * getMaturityDate). The mock src/lib/free/mock/tips.ts compiles too, so its
 * MeasureProto and SecurityProto enum names are real. Both reuse the
 * compiler options of src/tests/tsconfig.first-call.json.
 */
import { spawnSync } from "child_process";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "fs";
import { join, resolve } from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

const ROOT = resolve(__dirname, "../..");
const SAMPLE = join(ROOT, "src/lib/free/samples/tips.ts");
const MOCK_DIR = join(ROOT, "src/lib/free/mock");
const TSCONFIG = join(ROOT, "src/tests/tsconfig.first-call.json");
const TSC = join(ROOT, "node_modules/typescript/bin/tsc");

function tsc(project: string) {
  const run = spawnSync(process.execPath, [TSC, "--noEmit", "-p", project], {
    cwd: ROOT,
    encoding: "utf8",
  });
  return { status: run.status, output: `${run.stdout}${run.stderr}` };
}

describe("TIPS samples compile against ledger-models", () => {
  let dir = "";

  // Under node_modules/ so the copies resolve the same packages.
  beforeEach(() => {
    const cache = join(ROOT, "node_modules/.cache");
    mkdirSync(cache, { recursive: true });
    dir = mkdtempSync(join(cache, "us253-tips-"));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  /** Writes `files` into the temp dir next to a tsconfig with the shared
   * options, compiling the first of them. */
  function project(files: Record<string, string>): string {
    for (const [name, source] of Object.entries(files)) {
      writeFileSync(join(dir, name), source);
    }
    const config = JSON.parse(
      readFileSync(TSCONFIG, "utf8").replace(/^\s*\/\/.*$/gm, "")
    );
    config.files = [Object.keys(files)[0]];
    writeFileSync(join(dir, "tsconfig.json"), JSON.stringify(config));
    return join(dir, "tsconfig.json");
  }

  function mockFiles(tipsSource: string): Record<string, string> {
    return {
      "tips.ts": tipsSource,
      "types.ts": readFileSync(join(MOCK_DIR, "types.ts"), "utf8"),
    };
  }

  it("samples/tips.ts compiles with tsc --noEmit", () => {
    const { status, output } = tsc(
      project({ "tips.ts": readFileSync(SAMPLE, "utf8") })
    );
    expect(output).toBe("");
    expect(status).toBe(0);
  }, 60_000);

  it("fails tsc when a method name is not real (negative control)", () => {
    const source = readFileSync(SAMPLE, "utf8");
    const broken = source.replace("searchSecurity(", "searchSecurityX(");
    expect(broken).not.toBe(source);

    const { status, output } = tsc(project({ "tips.ts": broken }));
    expect(status).not.toBe(0);
    expect(output).toContain("searchSecurityX");
  }, 60_000);

  it("mock/tips.ts compiles with tsc --noEmit", () => {
    const source = readFileSync(join(MOCK_DIR, "tips.ts"), "utf8");
    const { status, output } = tsc(project(mockFiles(source)));
    expect(output).toBe("");
    expect(status).toBe(0);
  }, 60_000);

  it("fails tsc when a mock measure name is not real (negative control)", () => {
    const source = readFileSync(join(MOCK_DIR, "tips.ts"), "utf8");
    const broken = source.replace('"CLEAN_PRICE"', '"CLEAN_PRICEX"');
    expect(broken).not.toBe(source);

    const { status, output } = tsc(project(mockFiles(broken)));
    expect(status).not.toBe(0);
    expect(output).toContain("CLEAN_PRICEX");
  }, 60_000);
});
