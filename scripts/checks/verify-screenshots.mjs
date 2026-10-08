#!/usr/bin/env node
// Checks the key-screen PNGs that tests/e2e/key-screens.spec.ts writes to
// e2e/__screenshots__/ (Horizon publishes that folder on the PR).
//   node scripts/checks/verify-screenshots.mjs [--strict] [dir]
// Warn-only by default: screenshots never fail the e2e check by themselves.
// --strict (E2E_SCREENSHOTS_STRICT=1 in e2e.sh) exits 1 on any problem.
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

/** The key screens, in capture order. The spec imports this list. */
export const SCREENS = [
  { name: "login", path: "/login" },
  { name: "portfolios", path: "/data/portfolios" },
  { name: "positions", path: "/data/positions" },
  { name: "securities", path: "/data/securities" },
  { name: "transactions", path: "/data/transactions" },
  { name: "profile", path: "/data/profile" },
];

/** Theme and device variants; a file is `<screen>--<variant>.png`. */
export const VARIANTS = ["light--desktop", "dark--desktop", "dark--phone"];

export const DEFAULT_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../e2e/__screenshots__"
);

const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

/** @returns {string[]} */
export function expectedNames() {
  return SCREENS.flatMap((s) => VARIANTS.map((v) => `${s.name}--${v}.png`));
}

/**
 * Width and height from a PNG's IHDR chunk, or null if `buf` isn't a PNG.
 * @param {Buffer} buf
 * @returns {{ width: number, height: number } | null}
 */
export function pngSize(buf) {
  if (
    buf.length < 24 ||
    !buf.subarray(0, 8).equals(PNG_SIGNATURE) ||
    buf.toString("ascii", 12, 16) !== "IHDR"
  ) {
    return null;
  }
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

/**
 * False if `text` shows the full API key (whitespace ignored), so a
 * screenshot of it must not be written. A masked key (`ft_abcde••••1234`)
 * or no key at all is safe.
 * @param {string} text
 * @param {string | undefined} fullKey
 */
export function isSafeToCapture(text, fullKey) {
  if (!fullKey) return true;
  const compact = (/** @type {string} */ s) => s.replace(/\s+/g, "");
  return !compact(text).includes(compact(fullKey));
}

/**
 * @param {string} dir
 * @returns {{ found: string[], missing: string[], invalid: string[], extra: string[] }}
 */
export function verify(dir) {
  const expected = expectedNames();
  const present = fs.existsSync(dir) ? fs.readdirSync(dir) : [];
  /** @type {{ found: string[], missing: string[], invalid: string[], extra: string[] }} */
  const result = { found: [], missing: [], invalid: [], extra: [] };
  for (const name of expected) {
    const file = path.join(dir, name);
    if (!present.includes(name)) result.missing.push(name);
    else if (!pngSize(fs.readFileSync(file))) result.invalid.push(name);
    else result.found.push(name);
  }
  result.extra = present.filter((name) => !expected.includes(name));
  return result;
}

/** @param {string[]} argv */
function main(argv) {
  const strict = argv.includes("--strict");
  const dir = path.resolve(
    argv.find((a) => !a.startsWith("--")) ?? DEFAULT_DIR
  );
  const { found, missing, invalid, extra } = verify(dir);
  console.log(
    `screenshots: ${found.length}/${
      expectedNames().length
    } valid PNGs in ${dir}`
  );
  for (const name of missing) console.warn(`  missing: ${name}`);
  for (const name of invalid) console.warn(`  not a valid PNG: ${name}`);
  for (const name of extra) console.warn(`  unexpected file: ${name}`);
  const ok = !missing.length && !invalid.length && !extra.length;
  if (strict && !ok) return 1;
  return 0;
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  process.exitCode = main(process.argv.slice(2));
}
