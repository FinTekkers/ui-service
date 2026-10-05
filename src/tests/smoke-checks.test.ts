import { describe, it, expect } from "vitest";
import {
  REQUIRED_ENV,
  assertReadOnlyMailbox,
  makeMarker,
  requireEnv,
  resolveEmailTimeoutMs,
  subjectHasMarker,
} from "../../tests/smoke/checks";

// Unit coverage for the pure helpers behind `npm run test:smoke:prod`.
// The smoke spec itself (tests/smoke/*.spec.ts) is never collected here.

describe("assertReadOnlyMailbox", () => {
  it("accepts a mailbox opened read-only (EXAMINE)", () => {
    expect(() =>
      assertReadOnlyMailbox({ path: "INBOX", readOnly: true })
    ).not.toThrow();
  });

  it("rejects a mailbox opened read-write", () => {
    expect(() =>
      assertReadOnlyMailbox({ path: "INBOX", readOnly: false })
    ).toThrow(/INBOX was not opened read-only/);
  });

  it("rejects a mailbox with no read-only confirmation", () => {
    expect(() => assertReadOnlyMailbox({ path: "INBOX" })).toThrow(
      /not opened read-only/
    );
  });
});

describe("requireEnv", () => {
  const full = {
    CONTACT_GMAIL_USER: "user",
    CONTACT_GMAIL_APP_PASSWORD: "password",
  };

  it("returns the values when all are set", () => {
    expect(requireEnv(REQUIRED_ENV, full)).toEqual(full);
  });

  it("names every missing variable", () => {
    expect(() => requireEnv(REQUIRED_ENV, {})).toThrow(
      "Missing required env var(s): CONTACT_GMAIL_USER, CONTACT_GMAIL_APP_PASSWORD"
    );
  });

  it("treats empty and whitespace-only values as missing", () => {
    expect(() =>
      requireEnv(REQUIRED_ENV, {
        ...full,
        CONTACT_GMAIL_USER: "  ",
        CONTACT_GMAIL_APP_PASSWORD: "",
      })
    ).toThrow(
      "Missing required env var(s): CONTACT_GMAIL_USER, CONTACT_GMAIL_APP_PASSWORD"
    );
  });

  it("ignores inherited keys", () => {
    const inherited = Object.create({ CONTACT_GMAIL_APP_PASSWORD: "x" });
    Object.assign(inherited, { CONTACT_GMAIL_USER: "user" });
    expect(() => requireEnv(REQUIRED_ENV, inherited)).toThrow(
      "Missing required env var(s): CONTACT_GMAIL_APP_PASSWORD"
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
