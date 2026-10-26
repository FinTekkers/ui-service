#!/usr/bin/env node
// Picks which tests a check runs first, from the files this branch changed
// against origin/main (US-283). The rules use only paths and file names,
// never a list of specs.
//   node scripts/checks/select-tests.mjs e2e <spec files...>
//   node scripts/checks/select-tests.mjs unit
// Prints tab-separated records for the calling script: `reason<TAB>text`
// (echo it), `first<TAB>spec` / `rest<TAB>spec` (e2e) and `mode<TAB>changed|all`
// (unit). When git can't give a diff, everything runs in one phase.
//
// The diff here is from `git merge-base origin/main HEAD`, while test.sh's
// `vitest run --changed origin/main` diffs against origin/main itself. If
// origin/main has moved on, vitest picks more files; that only adds tests.
import { execFileSync } from "child_process";
import * as path from "path";
import { fileURLToPath } from "url";

const ROUTE_AREA = /^src\/routes\/\(authenticated\)\/data\/([^/]+)\/./;
const SPEC_FILE = /^tests\/e2e\/[^/]+\.spec\.ts$/;
// Code or config every page uses: a change here selects every spec.
const SHARED_PREFIXES = [
  "src/lib/",
  "src/components/",
  "scripts/checks/",
  "tests/e2e/fixtures/",
];
const isShared = (file) =>
  SHARED_PREFIXES.some((prefix) => file.startsWith(prefix)) ||
  ["package.json", "package-lock.json"].includes(file) ||
  // Root config files: *.config.*, tsconfig*.json.
  /^[^/]+\.config\.[^/]+$/.test(file) ||
  /^tsconfig[^/]*\.json$/.test(file) ||
  // Files directly under src/: hooks*, app.html, app.d.ts, ...
  /^src\/[^/]+$/.test(file);
// Unit config: vitest reruns every test when one changes, so the
// changed-first run would already be the full run.
const isUnitConfig = (file) =>
  ["package.json", "package-lock.json", "src/setuptest.js"].includes(file) ||
  /^(vitest|vite|svelte)\.config\.[^/]+$/.test(file) ||
  /^tsconfig[^/]*\.json$/.test(file) ||
  file.startsWith("src/tests/stubs/");

const git = (...args) =>
  execFileSync("git", args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
const lines = (text) => text.split("\n").filter(Boolean);

/** The files changed since this branch left `base`, plus untracked files. */
export function changedFiles(base = "origin/main") {
  try {
    git("rev-parse", "--verify", "--quiet", `${base}^{commit}`);
  } catch {
    return { files: null, error: `${base} not found` };
  }
  let mergeBase;
  try {
    mergeBase = git("merge-base", base, "HEAD").trim();
  } catch {
    return { files: null, error: "merge-base failed" };
  }
  try {
    // --no-renames lists a renamed file under its old and its new path.
    const diff = lines(git("diff", "--name-only", "--no-renames", mergeBase));
    const untracked = lines(git("ls-files", "--others", "--exclude-standard"));
    return { files: [...new Set([...diff, ...untracked])], error: null };
  } catch {
    return { files: null, error: "git diff failed" };
  }
}

const allInOnePhase = (universe, why) => ({
  first: universe,
  rest: [],
  reasons: [`e2e: all specs, one phase: ${why}`],
});

/** Splits the check's specs into the changed area's (first) and the rest. */
export function selectE2e(files, universe, error = "no diff") {
  universe = [...new Set(universe)];
  if (files === null) return allInOnePhase(universe, `no diff (${error})`);
  const shared = files.find(isShared);
  if (shared) {
    return allInOnePhase(universe, `shared code changed (${shared})`);
  }

  const selected = new Set();
  const reasons = [];
  const base = (spec) => path.basename(spec);

  // src/routes/(authenticated)/data/<page>/ selects tests/e2e/<page>*.spec.ts;
  // `_` in <page> reads as `-`, the specs' spelling (cpi_index/ -> cpi-index-*).
  const areas = [];
  for (const dir of new Set(files.map((f) => f.match(ROUTE_AREA)?.[1]))) {
    if (!dir) continue;
    const page = dir.replace(/_/g, "-");
    const matches = universe.filter((spec) => base(spec).startsWith(page));
    matches.forEach((spec) => selected.add(spec));
    const patterns = new Set(
      matches.map((spec) =>
        base(spec) === `${page}.spec.ts`
          ? base(spec)
          : base(spec).startsWith(`${page}-`)
          ? `${page}-*.spec.ts`
          : `${page}*.spec.ts`
      )
    );
    const where = `src/routes/(authenticated)/data/${dir}/`;
    areas.push(
      matches.length
        ? `${[...patterns].join(", ")} (${where})`
        : `${page}*.spec.ts (${where}): no spec in the check's set`
    );
  }
  if (areas.length) reasons.push(`e2e: changed area: ${areas.join("; ")}`);

  const specs = files.filter((f) => SPEC_FILE.test(f));
  const inSet = specs.filter((f) => universe.includes(f));
  const outOfSet = specs.filter((f) => !universe.includes(f));
  inSet.forEach((spec) => selected.add(spec));
  if (inSet.length) reasons.push(`e2e: changed spec: ${inSet.join(", ")}`);
  if (outOfSet.length) {
    reasons.push(
      `e2e: changed spec not in the check's set, not run: ${outOfSet.join(
        ", "
      )}`
    );
  }

  if (selected.size === 0) {
    const all = allInOnePhase(universe, "no spec matches the changed files");
    return { ...all, reasons: [...reasons, ...all.reasons] };
  }
  if (selected.size === universe.length) {
    const all = allInOnePhase(universe, "the changed area covers every spec");
    return { ...all, reasons: [...reasons, ...all.reasons] };
  }
  return {
    first: universe.filter((spec) => selected.has(spec)),
    rest: universe.filter((spec) => !selected.has(spec)),
    reasons,
  };
}

/** `changed`: vitest's changed-first run, then the full run; `all`: one run. */
export function selectUnit(files, error = "no diff") {
  if (files === null) {
    return {
      mode: "all",
      reason: `unit: all tests, one run: no diff (${error})`,
    };
  }
  if (files.length === 0) {
    return {
      mode: "all",
      reason: "unit: all tests, one run: no changed files",
    };
  }
  const config = files.find(isUnitConfig);
  if (config) {
    return {
      mode: "all",
      reason: `unit: all tests, one run: config changed (${config})`,
    };
  }
  return {
    mode: "changed",
    reason:
      "unit: changed first: vitest run --changed origin/main, then full vitest run",
  };
}

function main([kind, ...universe]) {
  const { files, error } = changedFiles();
  const out = [];
  if (kind === "e2e") {
    const { first, rest, reasons } = selectE2e(
      files,
      universe,
      error ?? undefined
    );
    reasons.forEach((reason) => out.push(["reason", reason]));
    first.forEach((spec) => out.push(["first", spec]));
    rest.forEach((spec) => out.push(["rest", spec]));
  } else if (kind === "unit") {
    const { mode, reason } = selectUnit(files, error ?? undefined);
    out.push(["reason", reason], ["mode", mode]);
  } else {
    console.error("usage: select-tests.mjs e2e <spec files...> | unit");
    process.exit(2);
  }
  for (const record of out) console.log(record.join("\t"));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2));
}
