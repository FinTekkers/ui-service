/**
 * US-253 guardrails for /free/tips, on the files that ship to the browser:
 * - no pricing or CPI arithmetic: every figure arrives formatted from the
 *   server load;
 * - nothing from the signed-in TIPS calculator ($lib/valuation,
 *   RunTipsValuation, TipsCalculator.svelte);
 * - nothing fetches, tracks, or imports ledger-models at runtime.
 * US-298: the route's figures are live, so it holds +page.server.ts too;
 * its service calls live in src/lib/server/free-tips.ts, which SvelteKit
 * keeps out of the client. src/lib/free/mock/tips.ts is test-only: no file
 * under src/routes, src/lib or src/components imports it.
 * src/tests/free-mock-guard.test.ts covers the whole free tree's imports.
 */
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, test } from "vitest";

const ROUTE = "src/routes/free/tips";
const SHIPPED = [
  "src/lib/free/tips.ts",
  "src/components/free/TipsCalculatorDisplay.svelte",
  `${ROUTE}/+page.svelte`,
];

const SOURCE_ROOTS = ["src/routes", "src/lib", "src/components"];
const MOCK_TIPS = "src/lib/free/mock/tips.ts";
const MOCK_TIPS_IMPORT = /["'][^"']*free\/mock\/tips(\.ts)?["']/;

const FORBIDDEN_IMPORTS = [
  /["'][^"']*lib\/valuation[^"']*["']/,
  /\bRunTipsValuation\b/,
  /\bTipsCalculator(\.svelte)?["']/,
  /import\s+TipsCalculator\b/,
];
const ARITHMETIC = [
  /\bMath\./,
  /\bparseFloat\b/,
  /\bNumber\(/,
  /\.toFixed\(/,
  /\.toLocaleString\(/,
];
const TRACKING = [/\bfetch\s*\(/, /\bgtag\b/, /analytics/i, /posthog/i];

function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

/** The patterns `text` matches, as strings. */
function hits(text: string, patterns: RegExp[]): string[] {
  return patterns.filter((p) => p.test(text)).map(String);
}

/** ledger-models imports that are not `import type`. */
function runtimeLedgerModelsImports(text: string): string[] {
  return [
    ...text.matchAll(
      /\bimport\s+(type\s+)?[^;]*?from\s*["'](@fintekkers\/ledger-models[^"']*)["']/g
    ),
  ]
    .filter((m) => !m[1])
    .map((m) => m[2]);
}

describe("/free/tips guardrails", () => {
  test.each(SHIPPED)("%s has no arithmetic or valuation import", (file) => {
    const text = readFileSync(path.resolve(file), "utf8");
    expect(hits(text, FORBIDDEN_IMPORTS)).toEqual([]);
    expect(hits(text, ARITHMETIC)).toEqual([]);
  });

  test.each(SHIPPED)(
    "%s has no fetch, tracking or runtime ledger-models",
    (file) => {
      const text = readFileSync(path.resolve(file), "utf8");
      expect(hits(text, TRACKING)).toEqual([]);
      expect(runtimeLedgerModelsImports(text)).toEqual([]);
    }
  );

  test("the route holds +page.svelte and its server load only", () => {
    expect(readdirSync(path.resolve(ROUTE)).sort()).toEqual([
      "+page.server.ts",
      "+page.svelte",
    ]);
  });

  test("no page, component or lib file imports the mock", () => {
    const importers = SOURCE_ROOTS.flatMap((root) =>
      walk(path.resolve(root))
    ).filter(
      (file) =>
        path.relative(process.cwd(), file).split(path.sep).join("/") !==
          MOCK_TIPS &&
        /\.(ts|js|svelte)$/.test(file) &&
        MOCK_TIPS_IMPORT.test(readFileSync(file, "utf8"))
    );
    expect(importers).toEqual([]);
  });

  test("the patterns catch what they forbid (negative controls)", () => {
    expect(
      hits(`import { x } from "$lib/valuation";`, FORBIDDEN_IMPORTS)
    ).not.toEqual([]);
    expect(
      hits(`import { x } from '../../lib/valuation/tips';`, FORBIDDEN_IMPORTS)
    ).not.toEqual([]);
    expect(
      hits(`import C from "../TipsCalculator.svelte";`, FORBIDDEN_IMPORTS)
    ).not.toEqual([]);
    expect(hits(`RunTipsValuation(req)`, FORBIDDEN_IMPORTS)).not.toEqual([]);
    expect(hits(`TipsCalculatorDisplay.svelte"`, FORBIDDEN_IMPORTS)).toEqual(
      []
    );
    for (const snippet of [
      "Math.pow(1, 2)",
      "parseFloat(x)",
      "Number(x)",
      "x.toFixed(2)",
      "x.toLocaleString()",
    ]) {
      expect(hits(snippet, ARITHMETIC), snippet).not.toEqual([]);
    }
    expect(hits(`fetch("/api")`, TRACKING)).not.toEqual([]);
    for (const snippet of [
      `import { tips } from "$lib/free/mock/tips";`,
      `import { tips } from '../../lib/free/mock/tips.ts';`,
    ]) {
      expect(MOCK_TIPS_IMPORT.test(snippet), snippet).toBe(true);
    }
    expect(MOCK_TIPS_IMPORT.test(`from "$lib/free/tips";`)).toBe(false);
    expect(
      runtimeLedgerModelsImports(
        `import { A } from "@fintekkers/ledger-models/node/x";`
      )
    ).toEqual(["@fintekkers/ledger-models/node/x"]);
    expect(
      runtimeLedgerModelsImports(
        `import type { A } from '@fintekkers/ledger-models/node/x';`
      )
    ).toEqual([]);
  });
});
