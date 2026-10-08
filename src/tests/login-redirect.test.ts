/**
 * US-203: after login (or registration) the redirect target is a clean,
 * same-site path: no trailing slash, no doubled segment, no external URL.
 */
import { beforeEach, describe, expect, test, vi } from "vitest";

const auth = vi.hoisted(() => ({
  brokerLogin: vi.fn(),
  brokerRegister: vi.fn(),
  setApiKeyCookie: vi.fn(),
}));
const forms = vi.hoisted(() => ({ superValidate: vi.fn() }));

vi.mock("$lib/grpc-auth", () => auth);
vi.mock("sveltekit-superforms/server", () => forms);
vi.mock("sveltekit-superforms/adapters", () => ({ yup: vi.fn() }));

import { actions as loginActions } from "../routes/login/+page.server";
import { actions as registerActions } from "../routes/register/+page.server";
import { safeRedirectTarget } from "$lib/redirectTarget";

const VALID_FORM = {
  valid: true,
  data: {
    email: "ada@example.com",
    password: "password1",
    confirmpassword: "password1",
    signupcode: "CODE",
  },
};

const event = (redirectTo?: string) => {
  const url = new URL("https://www.fintekkers.org/login");
  if (redirectTo !== undefined) url.searchParams.set("redirectTo", redirectTo);
  return {
    request: new Request(url, { method: "POST" }),
    cookies: { set: vi.fn() },
    url,
  } as any;
};

/** Runs an action and returns the redirect it throws. */
async function redirectOf(
  action: (e: any) => Promise<unknown>,
  redirectTo?: string
) {
  try {
    await action(event(redirectTo));
  } catch (thrown: any) {
    return { status: thrown.status, location: thrown.location };
  }
  throw new Error("action did not redirect");
}

beforeEach(() => {
  vi.clearAllMocks();
  forms.superValidate.mockResolvedValue(VALID_FORM);
  auth.brokerLogin.mockResolvedValue({ success: true, apiKey: "k" });
  auth.brokerRegister.mockResolvedValue({ success: true });
});

const CASES: [string | undefined, string][] = [
  ["/data/portfolios/", "/data/portfolios"],
  [undefined, "/data/portfolios"],
  ["", "/data/portfolios"],
  ["https://evil.com", "/data/portfolios"],
  ["//evil.com", "/data/portfolios"],
  ["/data/securities?x=1", "/data/securities?x=1"],
  ["/", "/"],
  ["/data/portfolios/portfolios", "/data/portfolios"],
  ["/data/portfolios/abc/portfolios", "/data/portfolios/abc/portfolios"],
];

describe("login action redirect", () => {
  test.each(CASES)("redirectTo=%s goes to %s", async (raw, expected) => {
    expect(await redirectOf(loginActions.login, raw)).toEqual({
      status: 303,
      location: expected,
    });
  });

  test("sets the API key cookie once on success", async () => {
    const e = event("/data/portfolios/");
    await expect(loginActions.login(e)).rejects.toMatchObject({ status: 303 });
    expect(auth.setApiKeyCookie).toHaveBeenCalledTimes(1);
    expect(auth.setApiKeyCookie).toHaveBeenCalledWith(e.cookies, "k");
  });

  test("failed login returns the error and does not redirect", async () => {
    auth.brokerLogin.mockResolvedValue({ success: false, error: "Nope" });
    await expect(
      loginActions.login(event("/data/portfolios/"))
    ).resolves.toEqual({ formError: { message: "Nope" } });
    expect(auth.setApiKeyCookie).not.toHaveBeenCalled();
  });

  test("invalid form never calls the broker", async () => {
    forms.superValidate.mockResolvedValue({
      valid: false,
      errors: { email: ["x"] },
    });
    await expect(loginActions.login(event())).resolves.toMatchObject({
      formError: { message: "Please fix the errors below" },
    });
    expect(auth.brokerLogin).not.toHaveBeenCalled();
  });
});

describe("register action redirect", () => {
  test.each([
    ["/data/portfolios/", "/data/portfolios"],
    ["https://evil.com", "/data/portfolios"],
  ])("redirectTo=%s goes to %s", async (raw, expected) => {
    expect(await redirectOf(registerActions.register, raw)).toEqual({
      status: 303,
      location: expected,
    });
  });
});

describe("safeRedirectTarget", () => {
  test.each([
    ["/\\evil.com", "/data/portfolios"],
    ["javascript:alert(1)", "/data/portfolios"],
    ["/data//positions", "/data/positions"],
  ])("%s -> %s", (raw, expected) => {
    expect(safeRedirectTarget(raw)).toBe(expected);
  });
});
