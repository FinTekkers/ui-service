#!/usr/bin/env node
// Judges one e2e.sh phase from its Playwright JSON report (US-283).
//   node scripts/checks/e2e-report.mjs <report.json> --phase <label> \
//     --expect <spec files...> [--strict <spec files...>]
// KNOWN_FAILING (newline-separated `<file> > <title>` ids) comes from the
// environment. Exits 1 when the phase fails. Each rule below applies only
// when its spec is in this phase's --expect list; the phases never share a
// spec, so judging them one by one is the same as judging one run.
//   - Any report error fails the phase, and so does an expected spec that
//     is missing from the report.
//   - A --strict spec (US-203's journey, securities-filters-ledger-models)
//     must not skip or fail, and the journey must have run and passed.
//   - Any other spec's failure fails the phase unless KNOWN_FAILING lists
//     it; a listed test that passes fails it too.
//   - The US-209 AAPL journey and US-262's TIPS Journeys A, B and C must run
//     and pass, never skip.
import { readFileSync } from "fs";
import { fileURLToPath } from "url";

export const JOURNEY = "sidebar-links-after-login.spec.ts";
const AAPL_SPEC = "prices.spec.ts";
const TIPS_SPEC = "tips-calculator-current-cpi.spec.ts";

// Report files are relative to Playwright's testDir, tests/e2e/.
const inTestDir = (file) => file.replace(/^tests\/e2e\//, "");

/** Returns whether the phase passed and the lines to log. */
export function evaluate(report, { phase, expected, strict = [], known = [] }) {
  const lines = [];
  const log = (line) => lines.push(`e2e: ${phase}: ${line}`);
  const expect = new Set(expected.map(inTestDir));
  const strictFiles = new Set(strict.map(inTestDir));
  const knownIds = new Set(known);
  const s = report.stats;
  log(
    `${s.expected} passed, ${s.skipped} skipped, ${s.unexpected} failed, ${s.flaky} flaky`
  );
  const specs = [];
  const walk = (suite) => {
    specs.push(...(suite.specs ?? []));
    (suite.suites ?? []).forEach(walk);
  };
  (report.suites ?? []).forEach(walk);
  // Duration and, for a skip, its reason, so the log shows a data skip
  // took under a second and why it skipped.
  const ms = (t) => t.results.reduce((sum, r) => sum + r.duration, 0);
  const skipReason = (t) => {
    const skip = (t.annotations ?? []).find((a) => a.type === "skip");
    return skip?.description
      ? ` (skip: ${skip.description})`
      : " (skip: no reason given)";
  };
  let ok = true;
  for (const e of report.errors ?? []) {
    log(`FAIL error: ${e.message}`);
    ok = false;
  }
  const files = new Set();
  for (const spec of specs) {
    files.add(spec.file);
    for (const t of spec.tests) {
      const id = `${spec.file} > ${spec.title}`;
      if (strictFiles.has(spec.file) && t.status !== "expected") {
        const reason = t.status === "skipped" ? skipReason(t) : "";
        lines.push(
          `e2e:   FAIL ${t.status} (strict) ${ms(t)}ms ${id}${reason}`
        );
        ok = false;
      } else if (t.status === "expected" && knownIds.has(id)) {
        lines.push(
          `e2e:   FAIL passed but listed in KNOWN_FAILING ${ms(t)}ms ${id}`
        );
        ok = false;
      } else if (t.status === "expected") {
        lines.push(`e2e:   ${t.status} ${ms(t)}ms ${id}`);
      } else if (t.status === "skipped") {
        lines.push(`e2e:   ${t.status} ${ms(t)}ms ${id}${skipReason(t)}`);
      } else if (knownIds.has(id)) {
        lines.push(`e2e:   known (host data) ${t.status} ${ms(t)}ms ${id}`);
      } else {
        lines.push(`e2e:   FAIL ${t.status} ${ms(t)}ms ${id}`);
        ok = false;
      }
    }
  }
  for (const file of expect) {
    if (!files.has(file)) {
      log(`FAIL ${file} not run`);
      ok = false;
    }
  }
  // The journey's tests must have run and passed, whatever the others did.
  if (expect.has(JOURNEY)) {
    const journey = specs
      .filter((spec) => spec.file === JOURNEY)
      .flatMap((spec) => spec.tests);
    const passed = journey.filter((t) => t.status === "expected").length;
    log(`${JOURNEY}: ${passed}/${journey.length} passed`);
    if (journey.length < 1 || passed < journey.length) ok = false;
  }
  if (expect.has(AAPL_SPEC)) {
    const aapl = specs.filter(
      (spec) =>
        spec.file === AAPL_SPEC && spec.title.includes("AAPL price rows")
    );
    if (
      aapl.length !== 1 ||
      aapl[0].tests.some((t) => t.status !== "expected")
    ) {
      log(`FAIL ${AAPL_SPEC} AAPL journey did not pass`);
      ok = false;
    }
  }
  // TIPS Journeys A, B and C skip when the price service holds no CPI-U
  // readings; here a skip fails.
  if (expect.has(TIPS_SPEC)) {
    const tips = specs
      .filter((spec) => spec.file === TIPS_SPEC)
      .flatMap((spec) => spec.tests);
    const tipsPassed = tips.filter((t) => t.status === "expected").length;
    log(`${TIPS_SPEC}: ${tipsPassed}/${tips.length} passed`);
    if (tips.length !== 3 || tipsPassed !== 3) {
      log(`FAIL ${TIPS_SPEC} Journeys A, B and C did not all pass`);
      ok = false;
    }
  }
  return { ok, lines };
}

/** Parses `<report> --phase <label> --expect <files...> --strict <files...>`. */
function parseArgs([reportPath, ...rest]) {
  const opts = { reportPath, phase: "", expected: [], strict: [] };
  let list = null;
  for (const arg of rest) {
    if (arg === "--phase") list = "phase";
    else if (arg === "--expect") list = opts.expected;
    else if (arg === "--strict") list = opts.strict;
    else if (list === "phase") {
      opts.phase = arg;
      list = null;
    } else if (Array.isArray(list)) list.push(arg);
    else throw new Error(`unexpected argument: ${arg}`);
  }
  return opts;
}

function main(argv) {
  const { reportPath, phase, expected, strict } = parseArgs(argv);
  let report;
  try {
    report = JSON.parse(readFileSync(reportPath, "utf8"));
  } catch (e) {
    console.log(`e2e: ${phase}: FAIL no readable report (${e.message})`);
    process.exit(1);
  }
  const known = (process.env.KNOWN_FAILING ?? "").split("\n").filter(Boolean);
  const { ok, lines } = evaluate(report, { phase, expected, strict, known });
  for (const line of lines) console.log(line);
  if (!ok) process.exit(1);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2));
}
