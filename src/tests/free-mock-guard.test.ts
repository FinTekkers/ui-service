/**
 * US-251: the Free data explorer (/free/*) is mock-only. Its routes,
 * components and lib code may read src/lib/free/mock/ but never call the
 * backend: no server load or endpoint files, no fetch(), and imports only
 * from an allow-list. Anything else ($lib/valuation, $lib/positions, a
 * ledger-models service client, ...) fails this test.
 *
 * Files are read with node:fs, not `?raw`: Vite rewrites process.env inside
 * ?raw imports, and fixtures here live outside the source tree.
 */
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, test } from "vitest";

const FREE_ROOTS = ["src/routes/free", "src/lib/free", "src/components/free"];

// Exact paths, relative to the repo root, of server files allowed under the
// free roots. The /free redirect to /treasuries stays until US-254 removes
// it; delete this entry with that file.
const ALLOWED_SERVER_FILES = new Set(["src/routes/free/+page.server.ts"]);

const SERVER_FILE = /^\+(page\.server|layout\.server|server)\.(ts|js)$/;
const SOURCE_FILE = /\.(ts|js|svelte)$/;

// Places a relative import may resolve into.
const ALLOWED_DIRS = [...FREE_ROOTS, "src/lib/styles"];

const LEDGER_MODELS_TYPES = "@fintekkers/ledger-models/node/fintekkers/models/";

function walk(dir: string): string[] {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  return entries.flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

function isInside(file: string, dir: string): boolean {
  const rel = path.relative(dir, file);
  return rel === "" || (!rel.startsWith("..") && !path.isAbsolute(rel));
}

function isAllowedImport(
  specifier: string,
  typeOnly: boolean,
  fromFile: string,
  repoRoot: string
): boolean {
  if (specifier === "svelte" || specifier.startsWith("svelte/")) return true;
  if (specifier.startsWith("$app/")) return true;
  if (specifier.startsWith("$lib/free/")) return true;
  if (specifier.startsWith("$lib/styles/")) return true;
  if (specifier.startsWith(".")) {
    const target = path.resolve(path.dirname(fromFile), specifier);
    return ALLOWED_DIRS.some((dir) =>
      isInside(target, path.join(repoRoot, dir))
    );
  }
  return typeOnly && specifier.startsWith(LEDGER_MODELS_TYPES);
}

interface ImportRef {
  specifier: string;
  typeOnly: boolean;
}

function importsOf(source: string): ImportRef[] {
  const refs: ImportRef[] = [];
  const fromClause =
    /\b(?:import|export)\s+(type\s+)?[^;"'`]*?\bfrom\s*["']([^"']+)["']/g;
  for (const m of source.matchAll(fromClause)) {
    refs.push({ specifier: m[2], typeOnly: Boolean(m[1]) });
  }
  for (const m of source.matchAll(/\bimport\s*["']([^"']+)["']/g)) {
    refs.push({ specifier: m[1], typeOnly: false });
  }
  for (const m of source.matchAll(
    /\b(?:import|require)\s*\(\s*(["'`]?)([^"'`)]*)/g
  )) {
    // A computed dynamic import can't be checked, so it never passes.
    refs.push({ specifier: m[1] ? m[2] : "<dynamic>", typeOnly: false });
  }
  return refs;
}

/** Every rule break under the free roots of repoRoot, as readable lines. */
function scanFreeTree(repoRoot: string): string[] {
  const violations: string[] = [];
  for (const root of FREE_ROOTS) {
    for (const file of walk(path.join(repoRoot, root))) {
      const rel = path.relative(repoRoot, file).split(path.sep).join("/");
      if (SERVER_FILE.test(path.basename(file))) {
        if (!ALLOWED_SERVER_FILES.has(rel)) {
          violations.push(`${rel}: server file`);
        }
        continue;
      }
      if (!SOURCE_FILE.test(file)) continue;
      const source = readFileSync(file, "utf8");
      if (/\bfetch\s*\(/.test(source)) violations.push(`${rel}: fetch(`);
      for (const { specifier, typeOnly } of importsOf(source)) {
        if (!isAllowedImport(specifier, typeOnly, file, repoRoot)) {
          violations.push(`${rel}: imports ${specifier}`);
        }
      }
    }
  }
  return violations;
}

describe("Free data explorer stays mock-only", () => {
  test("the real tree has no violations", () => {
    expect(scanFreeTree(process.cwd())).toEqual([]);
  });

  describe("fixtures", () => {
    let repoRoot = "";

    function fixture(files: Record<string, string>): string[] {
      repoRoot = mkdtempSync(path.join(os.tmpdir(), "free-guard-"));
      for (const [rel, content] of Object.entries(files)) {
        const file = path.join(repoRoot, rel);
        mkdirSync(path.dirname(file), { recursive: true });
        writeFileSync(file, content);
      }
      return scanFreeTree(repoRoot);
    }

    afterEach(() => {
      if (repoRoot) rmSync(repoRoot, { recursive: true, force: true });
      repoRoot = "";
    });

    test("a clean fixture passes", () => {
      expect(
        fixture({
          "src/routes/free/+page.server.ts": `import { redirect } from "@sveltejs/kit";`,
          "src/routes/free/soma/+page.svelte": [
            `<script lang="ts">`,
            `  import { page } from "$app/stores";`,
            `  import { onMount } from "svelte";`,
            `  import Picker from "../../../components/free/DatasetPicker.svelte";`,
            `  import { FREE_DATASETS } from "$lib/free/datasets";`,
            `  import "$lib/styles/ft-theme.css";`,
            `</script>`,
          ].join("\n"),
          "src/lib/free/mock/types.ts": `import type { MeasureProto } from "@fintekkers/ledger-models/node/fintekkers/models/position/measure_pb";`,
        })
      ).toEqual([]);
    });

    test.each([
      [
        "a $lib/valuation import",
        "src/routes/free/soma/+page.svelte",
        `<script>import { getValuation } from "$lib/valuation";</script>`,
      ],
      [
        "a ledger-models service import",
        "src/lib/free/load.ts",
        `import { PositionClient } from "@fintekkers/ledger-models/node/fintekkers/services/position-service/position_service_grpc_pb.js";`,
      ],
      [
        "a ledger-models wrapper service import",
        "src/lib/free/load.ts",
        `import { SecurityService } from "@fintekkers/ledger-models/node/wrappers/services/security-service/SecurityService";`,
      ],
      [
        "a component importing $lib/positions",
        "src/components/free/Positions.svelte",
        `<script lang="ts">\n  import { getPositions } from "$lib/positions";\n</script>`,
      ],
      [
        "a relative import out of the free roots",
        "src/lib/free/load.ts",
        `import { getPositions } from "../positions";`,
      ],
      [
        "a non-type ledger-models models import",
        "src/lib/free/mock/data.ts",
        `import { MeasureProto } from "@fintekkers/ledger-models/node/fintekkers/models/position/measure_pb";`,
      ],
      [
        "a fetch( call",
        "src/routes/free/soma/+page.svelte",
        `<script>const res = fetch("/api/positions");</script>`,
      ],
      [
        "a computed dynamic import",
        "src/lib/free/load.ts",
        `const mod = await import(name);`,
      ],
      ["a +page.server.ts", "src/routes/free/soma/+page.server.ts", ""],
      ["a +layout.server.ts", "src/routes/free/+layout.server.ts", ""],
      ["a +server.ts", "src/routes/free/data/+server.ts", ""],
    ])("fails on %s", (_name, rel, content) => {
      const violations = fixture({ [rel]: content });
      expect(violations).toHaveLength(1);
      expect(violations[0]).toMatch(
        new RegExp(`^${rel.replace(/[+.$]/g, "\\$&")}:`)
      );
    });
  });
});
