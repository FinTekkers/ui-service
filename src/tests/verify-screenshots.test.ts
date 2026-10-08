// US-205: the key-screen file list, its verifier and the API key guard
// (scripts/checks/verify-screenshots.mjs).
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { spawnSync } from "child_process";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import {
  expectedNames,
  isSafeToCapture,
  verify,
} from "../../scripts/checks/verify-screenshots.mjs";

const SCRIPT = path.resolve("scripts/checks/verify-screenshots.mjs");
// The 8-byte signature plus an IHDR chunk header for a 1x1 image.
const PNG = Buffer.concat([
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13]),
  Buffer.from("IHDR", "ascii"),
  Buffer.from([0, 0, 0, 1, 0, 0, 0, 1, 8, 6, 0, 0, 0]),
]);

const run = (...args: string[]) =>
  spawnSync(process.execPath, [SCRIPT, ...args], { encoding: "utf-8" });

describe("expectedNames", () => {
  test("lists 6 screens x 3 variants", () => {
    const names = expectedNames();
    expect(names).toHaveLength(18);
    expect(new Set(names).size).toBe(18);
    expect(names).toContain("portfolios--dark--phone.png");
    for (const screen of [
      "login",
      "portfolios",
      "positions",
      "securities",
      "transactions",
      "profile",
    ]) {
      for (const variant of [
        "light--desktop",
        "dark--desktop",
        "dark--phone",
      ]) {
        expect(names).toContain(`${screen}--${variant}.png`);
      }
    }
  });
});

describe("verify", () => {
  let dir: string;
  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "us205-shots-"));
    for (const name of expectedNames()) {
      fs.writeFileSync(path.join(dir, name), PNG);
    }
  });
  afterEach(() => fs.rmSync(dir, { recursive: true, force: true }));

  test("passes a complete set, in strict mode too", () => {
    const result = verify(dir);
    expect(result.found).toHaveLength(18);
    expect(result.missing).toEqual([]);
    expect(result.invalid).toEqual([]);
    expect(run("--strict", dir).status).toBe(0);
  });

  test("reports a missing file", () => {
    fs.rmSync(path.join(dir, "profile--dark--phone.png"));
    expect(verify(dir).missing).toEqual(["profile--dark--phone.png"]);
    const strict = run("--strict", dir);
    expect(strict.status).toBe(1);
    expect(strict.stderr).toContain("missing: profile--dark--phone.png");
  });

  test("reports an empty or non-PNG file", () => {
    fs.writeFileSync(path.join(dir, "login--light--desktop.png"), "");
    fs.writeFileSync(path.join(dir, "login--dark--desktop.png"), "<html>");
    expect(verify(dir).invalid).toEqual([
      "login--light--desktop.png",
      "login--dark--desktop.png",
    ]);
    expect(run("--strict", dir).status).toBe(1);
  });

  test("reports an unexpected file", () => {
    fs.writeFileSync(path.join(dir, "helper-selftest.png"), PNG);
    expect(verify(dir).extra).toEqual(["helper-selftest.png"]);
    expect(run("--strict", dir).status).toBe(1);
  });

  test("never fails without --strict, even with no folder", () => {
    const empty = path.join(dir, "absent");
    expect(verify(empty).missing).toHaveLength(18);
    const result = run(empty);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain("0/18 valid PNGs");
  });
});

describe("isSafeToCapture", () => {
  const key = "ft_abcdefgh1234567890wxyz";

  test("a masked key is safe", () => {
    expect(isSafeToCapture("Email ft_abcde••••••••••••wxyz Show", key)).toBe(
      true
    );
  });

  test("the full key is not", () => {
    expect(isSafeToCapture(`API Key ${key} Hide`, key)).toBe(false);
  });

  test("the full key with extra whitespace is not", () => {
    expect(
      isSafeToCapture(`\n  ${key.slice(0, 10)}\n ${key.slice(10)}  \n`, key)
    ).toBe(false);
  });

  test("no key set is safe", () => {
    expect(
      isSafeToCapture("No API key available. Register with an email", "")
    ).toBe(true);
    expect(isSafeToCapture("anything", undefined)).toBe(true);
  });
});
