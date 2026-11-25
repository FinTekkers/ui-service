/**
 * US-251: the Free data explorer (/free/*) never calls the backend from its
 * pages, components or lib code: no server load or endpoint files, no
 * fetch(), and imports only from an allow-list. Anything else
 * ($lib/valuation, $lib/positions, a ledger-models service client, ...)
 * fails this test. US-298: /free/tips's live figures come from one allowed
 * server load, src/routes/free/tips/+page.server.ts. US-307: /free/soma's
 * and /free's live SOMA holdings come from their own two. US-334: /free/spy's
 * SPY series come from its own one; US-338 moved it to /free/etf/[ticker],
 * and /free/spy is a redirect-only +server.ts. US-337: one component,
 * PlotlyChart.svelte, may load plotly.js-dist, and only with a dynamic
 * import() (a chart library, not a backend call).
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
// free roots. US-254 deleted the /free redirect; US-298 added /free/tips's
// live load; US-307 added /free/soma's and /free's; US-334 /free/spy's,
// which US-338 moved to /free/etf/[ticker], leaving /free/spy's redirect.
const ALLOWED_SERVER_FILES = new Set<string>([
  "src/routes/free/tips/+page.server.ts",
  "src/routes/free/soma/+page.server.ts",
  "src/routes/free/+page.server.ts",
  "src/routes/free/etf/[ticker=etf]/+page.server.ts",
  "src/routes/free/spy/+server.ts",
]);

const SERVER_FILE = /^\+(page\.server|layout\.server|server)\.(ts|js)$/;
const SOURCE_FILE = /\.(ts|js|svelte)$/;

// Places a relative import may resolve into.
const ALLOWED_DIRS = [...FREE_ROOTS, "src/lib/styles"];

const LEDGER_MODELS_TYPES = "@fintekkers/ledger-models/node/fintekkers/models/";

// US-252: code samples the pages show as text. A page may import one only
// through ?raw, so it never runs; the sample itself may import ledger-models
// (that is what it demonstrates) and nothing else.
const SAMPLES_DIR = "src/lib/free/samples";
const LEDGER_MODELS = "@fintekkers/ledger-models/";

// US-337: the one file that may import plotly.js-dist, lazily.
const PLOTLY_IMPORTER = "src/components/free/PlotlyChart.svelte";

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

function isSampleImport(
  specifier: string,
  fromFile: string,
  repoRoot: string
): boolean {
  const target = specifier.startsWith("$lib/")
    ? path.join(repoRoot, "src/lib", specifier.slice("$lib/".length))
    : specifier.startsWith(".")
    ? path.resolve(path.dirname(fromFile), specifier)
    : null;
  return target !== null && isInside(target, path.join(repoRoot, SAMPLES_DIR));
}

function isAllowedImport(
  specifier: string,
  typeOnly: boolean,
  fromFile: string,
  repoRoot: string
): boolean {
  if (isSampleImport(specifier, fromFile, repoRoot)) {
    return specifier.endsWith("?raw");
  }
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
  /** An import() call or require(), not an import statement. */
  dynamic?: boolean;
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
    refs.push({
      specifier: m[1] ? m[2] : "<dynamic>",
      typeOnly: false,
      dynamic: true,
    });
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
      const isSample = isInside(file, path.join(repoRoot, SAMPLES_DIR));
      for (const { specifier, typeOnly, dynamic } of importsOf(source)) {
        const allowed = isSample
          ? specifier.startsWith(LEDGER_MODELS)
          : isAllowedImport(specifier, typeOnly, file, repoRoot) ||
            (rel === PLOTLY_IMPORTER &&
              specifier === "plotly.js-dist" &&
              dynamic === true);
        if (!allowed) {
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

    test("only the /free/tips, /free/soma, /free/etf/[ticker] and /free +page.server.ts, and /free/spy's redirect, are allowed server files", () => {
      expect(
        fixture({
          "src/routes/free/tips/+page.server.ts": `import { fetchFreeTips } from "$lib/server/free-tips";`,
          "src/routes/free/soma/+page.server.ts": `import { fetchFreeSoma } from "$lib/server/free-soma";`,
          "src/routes/free/+page.server.ts": `import { fetchFreeSoma } from "$lib/server/free-soma";`,
          "src/routes/free/etf/[ticker=etf]/+page.server.ts": `import { loadFreeEtf } from "$lib/server/free-etf";`,
          "src/routes/free/spy/+server.ts": `import { redirect } from "@sveltejs/kit";`,
        })
      ).toEqual([]);
    });

    test("US-307 adds exactly two allowed server files to US-298's one, US-334 one more (moved by US-338), and US-338 the redirect", () => {
      expect([...ALLOWED_SERVER_FILES].sort()).toEqual(
        [
          "src/routes/free/tips/+page.server.ts",
          "src/routes/free/soma/+page.server.ts",
          "src/routes/free/+page.server.ts",
          "src/routes/free/etf/[ticker=etf]/+page.server.ts",
          "src/routes/free/spy/+server.ts",
        ].sort()
      );
    });

    afterEach(() => {
      if (repoRoot) rmSync(repoRoot, { recursive: true, force: true });
      repoRoot = "";
    });

    test("a clean fixture passes", () => {
      expect(
        fixture({
          "src/routes/free/+page.ts": `import { load as loadSoma } from "./soma/+page";`,
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
          "src/routes/free/tips/+page.svelte": `<script>import sample from "$lib/free/samples/tips.ts?raw";</script>`,
          "src/lib/free/samples/tips.ts": `import { PortfolioService } from "@fintekkers/ledger-models/node/wrappers/services/portfolio-service/PortfolioService";`,
          "src/components/free/PlotlyChart.svelte": `<script>const mod = await import("plotly.js-dist");</script>`,
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
      [
        "a sample imported as code, not ?raw",
        "src/routes/free/soma/+page.svelte",
        `<script>import "$lib/free/samples/soma.ts";</script>`,
      ],
      [
        "a sample imported by relative path, not ?raw",
        "src/lib/free/load.ts",
        `import * as sample from "./samples/soma";`,
      ],
      [
        "a sample importing a package other than ledger-models",
        "src/lib/free/samples/soma.ts",
        `import { Chart } from "chart.js";`,
      ],
      [
        "a +page.server.ts on another page",
        "src/routes/free/other/+page.server.ts",
        "",
      ],
      [
        "a +page.server.js beside the allowed .ts",
        "src/routes/free/soma/+page.server.js",
        "",
      ],
      [
        "a static plotly.js-dist import in PlotlyChart.svelte",
        "src/components/free/PlotlyChart.svelte",
        `<script>import Plotly from "plotly.js-dist";</script>`,
      ],
      [
        "a lazy plotly.js-dist import in another component",
        "src/components/free/etf/EtfShares.svelte",
        `<script>const P = await import("plotly.js-dist");</script>`,
      ],
      ["a +layout.server.ts", "src/routes/free/+layout.server.ts", ""],
      ["a +server.ts", "src/routes/free/data/+server.ts", ""],
      [
        "a +page.server.ts back at /free/spy",
        "src/routes/free/spy/+page.server.ts",
        "",
      ],
    ])("fails on %s", (_name, rel, content) => {
      const violations = fixture({ [rel]: content });
      expect(violations).toHaveLength(1);
      expect(violations[0]).toMatch(
        new RegExp(`^${rel.replace(/[+.$]/g, "\\$&")}:`)
      );
    });
  });
});
