/**
 * US-259: .horizon/screenshots.json, the shared Horizon runner's config
 * (schema v1, farm/screenshots_config.py in FinTekkers/horizon; mask and
 * loginCookies from HZ-557). Six phone screens, dark only. The logged-in
 * screens get the e2e session through loginCookies, which names HZ-494's
 * test-login variables and never holds a value.
 *
 * Literals only: nothing here reads the bespoke capture (MAX_HEIGHT,
 * SCREENS), which US-262 removes.
 */
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, test } from "vitest";

const CONFIG_PATH = ".horizon/screenshots.json";
const raw = readFileSync(resolve(CONFIG_PATH), "utf8");
const cfg = JSON.parse(raw);

// Schema v1's top-level fields; loginCookies is HZ-557's cookie session.
const CONTRACT_KEYS = [
  "version",
  "serve",
  "ready",
  "outputDir",
  "themes",
  "viewports",
  "defaults",
  "screens",
  "diff",
  "loginCookies",
];
const SCREEN_NAMES = [
  "login",
  "portfolios",
  "positions",
  "securities",
  "transactions",
  "profile",
];
const LOGGED_IN = SCREEN_NAMES.filter((name) => name !== "login");
// HZ-494's test-login variables for this repo (scripts/checks/e2e.sh).
const E2E_VARS = ["FT_E2E_API_KEY", "FT_E2E_EMAIL", "FT_E2E_PASSWORD"];

type Screen = Record<string, unknown> & { name: string };
const screen = (name: string): Screen => {
  const found = (cfg.screens as Screen[]).find((s) => s.name === name);
  if (!found) throw new Error(`no screen named ${name}`);
  return found;
};

/** The JSON path of every string that looks like a secret. Paths only: a
 * finding never carries the value it found. */
function secretFindings(doc: unknown): string[] {
  const found: string[] = [];
  const walk = (value: unknown, path: string) => {
    if (typeof value === "string") {
      if (/[^\s@]+@[^\s@]+\.[^\s@]+/.test(value)) found.push(`${path}: email`);
      if (/(^|[^A-Za-z0-9])ft_[A-Za-z0-9]{8,}/.test(value))
        found.push(`${path}: ft_ key`);
      if (/[A-Za-z0-9_-]{32,}/.test(value)) found.push(`${path}: token`);
      if (/<[^<>]*>/.test(value)) found.push(`${path}: placeholder`);
    } else if (Array.isArray(value)) {
      value.forEach((item, i) => walk(item, `${path}[${i}]`));
    } else if (value && typeof value === "object") {
      for (const [key, item] of Object.entries(value)) {
        const at = `${path}.${key}`;
        if (path === "$.loginCookies") {
          // Cookie names (ft_api_key) map to variable names, never values.
          if (typeof item !== "string" || !/^[A-Z][A-Z0-9_]*$/.test(item))
            found.push(`${at}: not a variable name`);
          continue;
        }
        if (/pass(word)?|api_?key|e_?mail|token|secret/i.test(key))
          found.push(`${at}: secret-named key`);
        walk(item, at);
      }
    }
  };
  walk(doc, "$");
  return found;
}

const gitCheckIgnore = (path: string) =>
  spawnSync("git", ["check-ignore", "-q", path], { encoding: "utf8" }).status;

describe(".horizon/screenshots.json shape", () => {
  test("has only the contract keys", () => {
    expect(Object.keys(cfg).sort()).toEqual([...CONTRACT_KEYS].sort());
    expect(cfg.version).toBe(1);
  });

  test("serves build/index.js on 127.0.0.1:4203 through adapter-node's env", () => {
    // adapter-node reads PORT and HOST from the env and ignores CLI flags.
    expect(cfg.serve).toMatch(/(^|\s)PORT=4203\s/);
    expect(cfg.serve).toMatch(/(^|\s)HOST=127\.0\.0\.1\s/);
    expect(cfg.serve).toMatch(/\bnode build\/index\.js$/);
  });

  test("is ready on /login, dark only", () => {
    expect(cfg.ready).toBe("http://127.0.0.1:4203/login");
    expect(cfg.themes).toEqual(["dark"]);
  });

  test("lists the 6 core screens, in order", () => {
    expect((cfg.screens as Screen[]).map((s) => s.name)).toEqual(SCREEN_NAMES);
    expect(screen("login").path).toBe("/login");
    for (const name of LOGGED_IN)
      expect(screen(name).path).toBe(`/data/${name}`);
  });

  test("has one phone viewport at the bespoke iPhone 13 size", () => {
    // devices["iPhone 13"] in Playwright, as the removed bespoke capture
    // used it; the runner renders every shot at deviceScaleFactor 1.
    expect(cfg.viewports).toEqual([{ name: "phone", width: 390, height: 664 }]);
    for (const s of cfg.screens as Screen[]) {
      expect(s.viewports, s.name).toBeUndefined();
      expect(s.themes, s.name).toBeUndefined();
    }
  });
});

describe(".horizon/screenshots.json logged-in screens", () => {
  test.each(LOGGED_IN)("%s logs in and has a waitFor", (name) => {
    const s = screen(name);
    expect(s.login).toBe(true);
    expect(typeof s.waitFor).toBe("string");
    expect((s.waitFor as string).trim()).not.toBe("");
  });

  test("the session is the e2e key's cookies, by variable name", () => {
    expect(cfg.loginCookies).toEqual({
      ft_api_key: "FT_E2E_API_KEY",
      ft_user_email: "FT_E2E_EMAIL",
    });
  });

  test("login takes no session and no screen logs in by form", () => {
    expect(cfg.defaults.login).toBe(false);
    const login = screen("login");
    expect(login.login).toBeUndefined();
    expect(login.waitFor).toBeUndefined();
    // A form login rotates the e2e key (scripts/checks/e2e.sh).
    for (const s of cfg.screens as Screen[]) {
      if (s.name !== "login") expect(s.path, s.name).not.toBe("/login");
    }
    expect(Object.keys(cfg.defaults)).toEqual(["login"]);
  });

  test("profile masks .api-key-display", () => {
    expect(screen("profile").mask).toEqual([".api-key-display"]);
  });

  test("securities clips its height", () => {
    const maxHeightPx = screen("securities").maxHeightPx;
    expect(Number.isInteger(maxHeightPx)).toBe(true);
    expect(maxHeightPx as number).toBeGreaterThan(0);
  });
});

describe(".horizon/screenshots.json holds no credentials", () => {
  test("no string or key looks like a secret", () => {
    expect(secretFindings(cfg)).toEqual([]);
  });

  test("no e2e credential value appears in the file", () => {
    const leaked = E2E_VARS.filter((name) => {
      const value = process.env[name]?.trim();
      return value && raw.includes(value);
    });
    // Names only, never the value.
    expect(leaked).toEqual([]);
  });

  test("the scanner finds each planted secret and reports no value", () => {
    const EMAIL = "leak-sentinel-7f3a@example.invalid";
    const TOKEN = "Z".repeat(40);
    const FT_KEY = "ft_sentinel9c41";
    const fixture = {
      screens: [{ name: EMAIL }, { name: TOKEN }, { name: FT_KEY }],
      auth: { apiKey: "FT_E2E_API_KEY" },
      loginCookies: { ft_api_key: FT_KEY },
      ref: "<HZ-494 setting name>",
    };
    const found = secretFindings(fixture);
    expect(found).toEqual([
      "$.screens[0].name: email",
      "$.screens[1].name: token",
      "$.screens[2].name: ft_ key",
      "$.auth.apiKey: secret-named key",
      "$.loginCookies.ft_api_key: not a variable name",
      "$.ref: placeholder",
    ]);
    const report = found.join("\n");
    for (const sentinel of [EMAIL, TOKEN, FT_KEY]) {
      expect(report).not.toContain(sentinel);
    }
  });
});

describe(".horizon/screenshots.json outputDir", () => {
  test("outputDir is gitignored", () => {
    expect(cfg.outputDir).toBe(".horizon/screenshots");
    expect(gitCheckIgnore(join(cfg.outputDir, "probe.png"))).toBe(0);
  });

  test("the ignore rule leaves the config itself tracked", () => {
    expect(gitCheckIgnore(CONFIG_PATH)).toBe(1);
  });
});
