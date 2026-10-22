/**
 * US-220 metric 1 — scripts/checks/ledger-models-cutover.sh must fail on a
 * wrong ledger-models pin or on the old wire form, and pass on a clean tree.
 * Each case runs the check against a temp fixture tree.
 *
 * The old-form strings are built by concatenation so this file does not trip
 * the check it tests.
 *
 * @vitest-environment node
 */
import { execFileSync } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, describe, expect, test } from "vitest";

const CHECK = path.resolve(
  __dirname,
  "../../scripts/checks/ledger-models-cutover.sh"
);

const OLD_TYPE_SETTER = "setObject" + "Class";
const OLD_DECIMAL_GETTER = "getArbitrary" + "PrecisionValue";
const SET_TYPE = "setObject" + "Type";
const SET_VERSION = "set" + "Version";

const trees: string[] = [];

afterEach(() => {
  for (const dir of trees.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

/**
 * A temp tree with a lockfile at `version` (no ledger-models entry when null)
 * and the given files.
 */
function tree(
  version: string | null,
  files: Record<string, string> = {}
): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "lm-cutover-"));
  trees.push(root);
  const lock = {
    packages:
      version === null
        ? {}
        : { "node_modules/@fintekkers/ledger-models": { version } },
  };
  fs.writeFileSync(path.join(root, "package-lock.json"), JSON.stringify(lock));
  fs.mkdirSync(path.join(root, "src"));
  fs.writeFileSync(
    path.join(root, "src/clean.ts"),
    "stampOwn(new CurveRequestProto());\n"
  );
  for (const [rel, body] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
    fs.writeFileSync(path.join(root, rel), body);
  }
  return root;
}

/** The check's exit code against `root`. */
function runCheck(root: string): number {
  return runCheckWithOutput(root).status;
}

/** The check's exit code and stdout against `root`. */
function runCheckWithOutput(root: string): { status: number; out: string } {
  try {
    const out = execFileSync("bash", [CHECK, root], { stdio: "pipe" });
    return { status: 0, out: out.toString() };
  } catch (e: any) {
    return { status: e.status ?? 1, out: String(e.stdout ?? "") };
  }
}

const PIN_MESSAGE = "not x.y.z at or above 1.1.0";

describe("ledger-models-cutover.sh", () => {
  test("passes on a clean tree pinned to 1.1.0", () => {
    expect(runCheck(tree("1.1.0"))).toBe(0);
  });

  test("passes on this repo", () => {
    expect(runCheck(path.resolve(__dirname, "../.."))).toBe(0);
  });

  // US-247: package.json declares a minimum only, so any later minor, patch
  // or major passes. 1.10.0 catches a string comparison.
  test("passes on a later version, any major", () => {
    expect(runCheck(tree("1.1.7"))).toBe(0);
    expect(runCheck(tree("1.10.0"))).toBe(0);
    expect(runCheck(tree("2.0.0"))).toBe(0);
  });

  // 1.0.2 is the stray Maven Central release (LM-370). 1.0.10 has a patch
  // above the floor's but a lower minor.
  test.each(["1.0.2", "1.0.10", "0.10.0", "0.4.61", "0.4.45"])(
    "fails when the lockfile resolves %s, below 1.1.0",
    (version) => {
      const { status, out } = runCheckWithOutput(tree(version));
      expect(status).not.toBe(0);
      expect(out).toContain(PIN_MESSAGE);
    }
  );

  test("fails with its message on a prerelease version", () => {
    const { status, out } = runCheckWithOutput(tree("1.1.0-rc.1"));
    expect(status).not.toBe(0);
    expect(out).toContain(PIN_MESSAGE);
  });

  test("fails with its message when the lockfile has no ledger-models", () => {
    const { status, out } = runCheckWithOutput(tree(null));
    expect(status).not.toBe(0);
    expect(out).toContain("resolves @fintekkers/ledger-models to 'nothing'");
  });

  test("fails on the old type setter in a .ts file", () => {
    const root = tree("1.1.0", {
      "src/lib/a.ts": `req.${OLD_TYPE_SETTER}("CurveRequestProto");\n`,
    });
    expect(runCheck(root)).not.toBe(0);
  });

  test("fails on a string version in a .cjs file", () => {
    const root = tree("1.1.0", {
      "src/scripts/a.cjs": `req.${SET_VERSION}("0.0.1");\n`,
    });
    expect(runCheck(root)).not.toBe(0);
  });

  test("fails on the decimal string getter in a .svelte file", () => {
    const root = tree("1.1.0", {
      "src/routes/A.svelte": `<script>p.${OLD_DECIMAL_GETTER}();</script>\n`,
    });
    expect(runCheck(root)).not.toBe(0);
  });

  test("fails on a hand-set object_type or VersionProto", () => {
    const typed = tree("1.1.0", {
      "src/lib/a.ts": `req.${SET_TYPE}(ObjectTypeProto.OBJECT_TYPE_CURVE_REQUEST);\n`,
    });
    expect(runCheck(typed)).not.toBe(0);
    const versioned = tree("1.1.0", {
      "src/lib/a.ts": `req.${SET_VERSION}(new VersionProto().setPatch(1));\n`,
    });
    expect(runCheck(versioned)).not.toBe(0);
  });

  test("skips node_modules", () => {
    const root = tree("1.1.0", {
      "src/node_modules/lib/a.js": `req.${OLD_TYPE_SETTER}("X");\n`,
    });
    expect(runCheck(root)).toBe(0);
  });
});
