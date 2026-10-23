/**
 * US-253 guardrails for /free/tips, on the files that ship:
 * - no pricing or CPI arithmetic: every figure is a literal in mock/tips.ts
 *   (the test-only oracle in src/tests/fixtures/ is not scanned);
 * - nothing from the signed-in TIPS calculator ($lib/valuation,
 *   RunTipsValuation, TipsCalculator.svelte);
 * - mock only: the route holds +page.svelte alone, and nothing fetches,
 *   tracks, or imports ledger-models at runtime.
 * src/tests/free-mock-guard.test.ts covers the whole free tree's imports.
 */
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, test } from "vitest";

const ROUTE = "src/routes/free/tips";
const SHIPPED = [
  "src/lib/free/mock/tips.ts",
  "src/components/free/TipsCalculatorDisplay.svelte",
  `${ROUTE}/+page.svelte`,
];

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

  test("the route holds +page.svelte only: no load or server file", () => {
    expect(readdirSync(path.resolve(ROUTE))).toEqual(["+page.svelte"]);
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
