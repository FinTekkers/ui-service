/**
 * US-233: the e2e auth fixture reads the e2e user's session from the
 * environment only (FT_E2E_EMAIL, FT_E2E_API_KEY), skips naming the
 * missing variable, and never puts a value in a message.
 */
import { describe, expect, test, vi } from "vitest";
import { test as playwrightTest } from "@playwright/test";

vi.mock("@playwright/test", () => ({ test: { skip: vi.fn() } }));

import {
  E2E_KEY_MISSING_OR_EXPIRED,
  e2eSessionOrSkip,
  e2eSessionRejection,
  e2eSkipReason,
  e2eStorageState,
  ensureTestUserSession,
  getE2ECredentials,
  missingE2EVariables,
  skipUnlessE2ECredentials,
} from "../../tests/e2e/fixtures/auth";

const EMAIL_SENTINEL = "leak-sentinel-7f3a@example.invalid";
const KEY_SENTINEL = "key-sentinel-9c41";
const BOTH = { FT_E2E_EMAIL: EMAIL_SENTINEL, FT_E2E_API_KEY: KEY_SENTINEL };

describe("e2e credentials from the environment", () => {
  test("both unset: the reason names both variables", () => {
    expect(missingE2EVariables({})).toEqual(["FT_E2E_EMAIL", "FT_E2E_API_KEY"]);
    const reason = e2eSkipReason({});
    expect(reason).toContain(E2E_KEY_MISSING_OR_EXPIRED);
    expect(reason).toContain("FT_E2E_EMAIL");
    expect(reason).toContain("FT_E2E_API_KEY");
  });

  test.each(["FT_E2E_EMAIL", "FT_E2E_API_KEY"])(
    "%s unset or empty: the reason names only it",
    (name) => {
      const other = name === "FT_E2E_EMAIL" ? "FT_E2E_API_KEY" : "FT_E2E_EMAIL";
      for (const env of [
        { ...BOTH, [name]: undefined },
        { ...BOTH, [name]: "" },
      ]) {
        expect(missingE2EVariables(env)).toEqual([name]);
        const reason = e2eSkipReason(env)!;
        expect(reason).toContain(`${name} is not set`);
        expect(reason).not.toContain(other);
        expect(() => getE2ECredentials(env)).toThrow(name);
      }
    }
  );

  test("both set: no reason, and the credentials are returned", () => {
    expect(e2eSkipReason(BOTH)).toBeNull();
    expect(getE2ECredentials(BOTH)).toEqual({
      email: EMAIL_SENTINEL,
      apiKey: KEY_SENTINEL,
    });
  });

  test("no message ever contains a value", () => {
    for (const env of [
      { FT_E2E_EMAIL: EMAIL_SENTINEL },
      { FT_E2E_API_KEY: KEY_SENTINEL },
    ]) {
      const reason = e2eSkipReason(env)!;
      let thrown = "";
      try {
        getE2ECredentials(env);
      } catch (err) {
        thrown = (err as Error).message;
      }
      for (const message of [reason, thrown]) {
        expect(message).not.toContain(EMAIL_SENTINEL);
        expect(message).not.toContain(KEY_SENTINEL);
      }
    }
  });

  test("other env keys don't count as credentials", () => {
    const env = {
      TEST_USER_EMAIL: EMAIL_SENTINEL,
      FT_E2E_PASSWORD: "password-sentinel",
      FT_API_KEY: KEY_SENTINEL,
    };
    expect(missingE2EVariables(env)).toEqual([
      "FT_E2E_EMAIL",
      "FT_E2E_API_KEY",
    ]);
    expect(() => getE2ECredentials(env)).toThrow(E2E_KEY_MISSING_OR_EXPIRED);
  });

  test("skipUnlessE2ECredentials skips with the reason", () => {
    const saved = process.env.FT_E2E_API_KEY;
    delete process.env.FT_E2E_API_KEY;
    try {
      const t = { skip: vi.fn() };
      skipUnlessE2ECredentials(t as any);
      expect(t.skip).toHaveBeenCalledWith(
        true,
        expect.stringContaining("FT_E2E_API_KEY")
      );
    } finally {
      if (saved !== undefined) process.env.FT_E2E_API_KEY = saved;
    }
  });
});

describe("e2e session", () => {
  test("sets ft_api_key and ft_user_email for the base URL's host, no login", () => {
    const state = e2eStorageState("https://www.fintekkers.org/", {
      email: EMAIL_SENTINEL,
      apiKey: KEY_SENTINEL,
    });
    expect(state.origins).toEqual([]);
    expect(
      state.cookies.map((c) => [c.name, decodeURIComponent(c.value)])
    ).toEqual([
      ["ft_api_key", KEY_SENTINEL],
      ["ft_user_email", EMAIL_SENTINEL],
    ]);
    for (const c of state.cookies) {
      expect(c.domain).toBe("www.fintekkers.org");
      expect(c.path).toBe("/");
      expect(c.secure).toBe(true);
    }
    expect(
      e2eStorageState("http://127.0.0.1:4203", {
        email: EMAIL_SENTINEL,
        apiKey: KEY_SENTINEL,
      }).cookies.every((c) => c.domain === "127.0.0.1" && !c.secure)
    ).toBe(true);
  });

  function fakePlaywright(status: number, body = "", location?: string) {
    const get = vi.fn(async () => ({
      status: () => status,
      ok: () => status >= 200 && status < 300,
      headers: () => (location ? { location } : {}),
      text: async () => body,
    }));
    const dispose = vi.fn(async () => {});
    return {
      get,
      dispose,
      playwright: {
        request: { newContext: vi.fn(async () => ({ get, dispose })) },
      } as any,
    };
  }

  const state = e2eStorageState("http://127.0.0.1:4203", {
    email: EMAIL_SENTINEL,
    apiKey: KEY_SENTINEL,
  });

  test("an accepted key: no rejection, and only a GET is sent", async () => {
    const fake = fakePlaywright(200, "<table>CPI rows</table>");
    expect(
      await e2eSessionRejection(fake.playwright, "http://127.0.0.1:4203", state)
    ).toBeNull();
    expect(fake.get).toHaveBeenCalledTimes(1);
    expect(fake.dispose).toHaveBeenCalled();
  });

  test.each([
    ["a redirect to /login", 302, "", "/login?redirectTo=%2Fdata%2Fcpi_index"],
    ["a 500", 500, "", undefined],
    [
      "the page's load failure",
      200,
      "Could not load CPI series — security service unavailable",
      undefined,
    ],
  ])(
    "a rejected key (%s): skip reason, no values",
    async (_, status, body, location) => {
      const fake = fakePlaywright(status, body, location);
      const reason = await e2eSessionRejection(
        fake.playwright,
        "http://127.0.0.1:4203",
        state
      );
      expect(reason).toContain(E2E_KEY_MISSING_OR_EXPIRED);
      expect(reason).toContain("FT_E2E_API_KEY");
      expect(reason).not.toContain(KEY_SENTINEL);
      expect(reason).not.toContain(EMAIL_SENTINEL);
      expect(fake.dispose).toHaveBeenCalled();
    }
  );

  function withEnv(
    env: Record<string, string | undefined>,
    fn: () => Promise<void>
  ) {
    const saved = {
      FT_E2E_EMAIL: process.env.FT_E2E_EMAIL,
      FT_E2E_API_KEY: process.env.FT_E2E_API_KEY,
    };
    const set = (vars: Record<string, string | undefined>) => {
      for (const [k, v] of Object.entries(vars)) {
        if (v === undefined) delete process.env[k];
        else process.env[k] = v;
      }
    };
    set(env);
    return fn().finally(() => set(saved));
  }

  test("ensureTestUserSession never calls test.skip (plain node, e2e.sh)", async () => {
    // Outside a test Playwright's test.skip throws, even with a false
    // condition; scripts/checks/e2e.sh calls this from plain node.
    const skip = vi.mocked(playwrightTest.skip);
    skip.mockClear();
    skip.mockImplementation(() => {
      throw new Error("test.skip() can only be called inside test");
    });
    try {
      await withEnv(BOTH, async () => {
        const fake = fakePlaywright(500);
        expect(
          await ensureTestUserSession(fake.playwright, "http://127.0.0.1:4203")
        ).toEqual(state);
        // No login, and no probe: it only builds the cookies.
        expect(fake.get).not.toHaveBeenCalled();
      });
      for (const name of ["FT_E2E_EMAIL", "FT_E2E_API_KEY"]) {
        await withEnv({ ...BOTH, [name]: undefined }, async () => {
          const err = await ensureTestUserSession(
            fakePlaywright(200).playwright,
            "http://127.0.0.1:4203"
          ).catch((e: Error) => e);
          expect(err).toBeInstanceOf(Error);
          expect((err as Error).message).toContain(`${name} is not set`);
          expect((err as Error).message).not.toContain(KEY_SENTINEL);
          expect((err as Error).message).not.toContain(EMAIL_SENTINEL);
        });
      }
      expect(skip).not.toHaveBeenCalled();
    } finally {
      skip.mockReset();
    }
  });

  test("e2eSessionOrSkip skips via the given test, naming the reason", async () => {
    const t = { skip: vi.fn() };
    await withEnv(BOTH, async () => {
      expect(
        await e2eSessionOrSkip(
          t as any,
          fakePlaywright(200, "<table>CPI rows</table>").playwright,
          "http://127.0.0.1:4203"
        )
      ).toEqual(state);
      expect(t.skip).toHaveBeenLastCalledWith(false, "");

      t.skip.mockClear();
      await e2eSessionOrSkip(
        t as any,
        fakePlaywright(500).playwright,
        "http://127.0.0.1:4203"
      );
      expect(t.skip).toHaveBeenLastCalledWith(
        true,
        expect.stringContaining(E2E_KEY_MISSING_OR_EXPIRED)
      );
    });
    // A missing variable: the real test.skip(true) throws to end the test
    // there, before the session is built.
    t.skip.mockReset();
    t.skip.mockImplementation((cond: boolean) => {
      if (cond) throw new Error("skipped");
    });
    await withEnv({ ...BOTH, FT_E2E_API_KEY: undefined }, async () => {
      await expect(
        e2eSessionOrSkip(
          t as any,
          fakePlaywright(200).playwright,
          "http://127.0.0.1:4203"
        )
      ).rejects.toThrow("skipped");
      expect(t.skip).toHaveBeenCalledWith(
        true,
        expect.stringContaining("FT_E2E_API_KEY is not set")
      );
    });
  });
});
