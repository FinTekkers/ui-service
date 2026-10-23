/**
 * US-220 metric 1 — scripts/checks/ledger-models-cutover.sh must fail on the
 * old wire form, and pass on a clean tree.
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
 * A temp tree declaring ledger-models >=1.1.0, with a lockfile at `version`
 * and the given files.
 */
function tree(version: string, files: Record<string, string> = {}): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "lm-cutover-"));
  trees.push(root);
  const pkg = { dependencies: { "@fintekkers/ledger-models": ">=1.1.0" } };
  fs.writeFileSync(path.join(root, "package.json"), JSON.stringify(pkg));
  const lock = {
    packages: { "node_modules/@fintekkers/ledger-models": { version } },
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
  try {
    execFileSync("bash", [CHECK, root], { stdio: "pipe" });
    return 0;
  } catch (e: any) {
    return e.status ?? 1;
  }
}

describe("ledger-models-cutover.sh", () => {
  test("passes on a clean tree at 1.1.0", () => {
    expect(runCheck(tree("1.1.0"))).toBe(0);
  });

  test("passes on this repo", () => {
    expect(runCheck(path.resolve(__dirname, "../.."))).toBe(0);
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
