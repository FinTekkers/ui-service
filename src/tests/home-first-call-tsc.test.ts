/**
 * US-243: the homepage hero shows src/lib/home/first-call.ts verbatim, so
 * that file must compile against the installed @fintekkers/ledger-models
 * and use only real method names.
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
import { describe, expect, it } from "vitest";

const ROOT = resolve(__dirname, "../..");
const SAMPLE = join(ROOT, "src/lib/home/first-call.ts");
const TSCONFIG = join(ROOT, "src/tests/tsconfig.first-call.json");
const TSC = join(ROOT, "node_modules/typescript/bin/tsc");

function tsc(project: string) {
  const run = spawnSync(process.execPath, [TSC, "--noEmit", "-p", project], {
    cwd: ROOT,
    encoding: "utf8",
  });
  return { status: run.status, output: `${run.stdout}${run.stderr}` };
}

describe("homepage hero sample (first-call.ts)", () => {
  it("compiles with tsc --noEmit against the installed ledger-models", () => {
    const { status, output } = tsc(TSCONFIG);
    expect(output).toBe("");
    expect(status).toBe(0);
  }, 60_000);

  it("fails tsc when a method name is not real (negative control)", () => {
    // Under node_modules/ so the copy resolves the same packages.
    const cache = join(ROOT, "node_modules/.cache");
    mkdirSync(cache, { recursive: true });
    const dir = mkdtempSync(join(cache, "us243-first-call-"));
    try {
      const source = readFileSync(SAMPLE, "utf8");
      const broken = source.replace("searchPortfolio(", "searchPortfolioX(");
      expect(broken).not.toBe(source);
      writeFileSync(join(dir, "first-call.ts"), broken);
      const config = JSON.parse(
        readFileSync(TSCONFIG, "utf8").replace(/^\s*\/\/.*$/gm, "")
      );
      config.files = ["first-call.ts"];
      writeFileSync(join(dir, "tsconfig.json"), JSON.stringify(config));

      const { status, output } = tsc(join(dir, "tsconfig.json"));
      expect(status).not.toBe(0);
      expect(output).toContain("searchPortfolioX");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }, 60_000);
});
