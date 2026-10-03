import { describe, it, expect } from "vitest";
import {
  GMAIL_READONLY_SCOPE,
  REQUIRED_ENV,
  assertReadonlyScopes,
  makeMarker,
  requireEnv,
  resolveEmailTimeoutMs,
  subjectHasMarker,
} from "../../tests/smoke/checks";

// Unit coverage for the pure helpers behind `npm run test:smoke:prod`.
// The smoke spec itself (tests/smoke/*.spec.ts) is never collected here.

describe("assertReadonlyScopes", () => {
  it("accepts gmail.readonly alone", () => {
    expect(() => assertReadonlyScopes([GMAIL_READONLY_SCOPE])).not.toThrow();
  });

  it("rejects gmail.readonly plus gmail.modify", () => {
    expect(() =>
      assertReadonlyScopes([
        GMAIL_READONLY_SCOPE,
        "https://www.googleapis.com/auth/gmail.modify",
      ])
    ).toThrow(/gmail\.modify/);
  });

  it("rejects an empty scope list", () => {
    expect(() => assertReadonlyScopes([])).toThrow(/no scopes/);
  });
});

describe("requireEnv", () => {
  const full = {
    GMAIL_CLIENT_ID: "id",
    GMAIL_CLIENT_SECRET: "secret",
    GMAIL_REFRESH_TOKEN: "refresh",
  };

  it("returns the values when all are set", () => {
    expect(requireEnv(REQUIRED_ENV, full)).toEqual(full);
  });

  it("names every missing variable", () => {
    expect(() => requireEnv(REQUIRED_ENV, {})).toThrow(
      "Missing required env var(s): GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN"
    );
  });

  it("treats empty and whitespace-only values as missing", () => {
    expect(() =>
      requireEnv(REQUIRED_ENV, {
        ...full,
        GMAIL_CLIENT_SECRET: "  ",
        GMAIL_REFRESH_TOKEN: "",
      })
    ).toThrow(
      "Missing required env var(s): GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN"
    );
  });

  it("ignores inherited keys", () => {
    const inherited = Object.create({ GMAIL_REFRESH_TOKEN: "x" });
    Object.assign(inherited, {
      GMAIL_CLIENT_ID: "id",
      GMAIL_CLIENT_SECRET: "s",
    });
    expect(() => requireEnv(REQUIRED_ENV, inherited)).toThrow(
      "Missing required env var(s): GMAIL_REFRESH_TOKEN"
    );
  });
});

describe("makeMarker", () => {
  it("is FTSMOKE + UTC timestamp + 8 hex chars", () => {
    const marker = makeMarker(new Date("2026-10-03T14:15:02.123Z"));
    expect(marker).toMatch(/^FTSMOKE20261003141502[0-9a-f]{8}$/);
    expect(makeMarker()).toMatch(/^FTSMOKE\d{14}[0-9a-f]{8}$/);
  });

  it("differs between calls", () => {
    expect(makeMarker()).not.toBe(makeMarker());
  });
});

describe("resolveEmailTimeoutMs", () => {
  it("defaults to and is capped at 5 minutes", () => {
    expect(resolveEmailTimeoutMs(undefined)).toBe(300_000);
    expect(resolveEmailTimeoutMs("900000")).toBe(300_000);
    expect(resolveEmailTimeoutMs("60000")).toBe(60_000);
  });

  it("rejects invalid values", () => {
    expect(() => resolveEmailTimeoutMs("5m")).toThrow(/SMOKE_EMAIL_TIMEOUT_MS/);
    expect(() => resolveEmailTimeoutMs("0")).toThrow(/SMOKE_EMAIL_TIMEOUT_MS/);
  });
});

describe("subjectHasMarker", () => {
  it("requires the exact marker in the subject", () => {
    const m = "FTSMOKE20261003141502a1b2c3d4";
    expect(subjectHasMarker(`New message from Smoke ${m}`, m)).toBe(true);
    expect(subjectHasMarker(`New message from Smoke ${m}`, `${m}X`)).toBe(
      false
    );
    expect(subjectHasMarker("New message from Smoke FTSMOKE", m)).toBe(false);
    expect(subjectHasMarker(undefined, m)).toBe(false);
  });
});
