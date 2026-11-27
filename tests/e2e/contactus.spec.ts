/**
 * US-356: /contactus in the public-site look, as /free/request (US-352).
 * Reached from the homepage nav, it renders in the shell (.ft-free, FreeNav,
 * FreeFooter, no app Navbar) with four labelled, required fields; empty or
 * invalid fields show field errors under the field; and its form card,
 * labels, fields, focus ring and errors measure the same as /free/request,
 * whose values are pinned to what origin/main rendered before the form
 * styles moved to src/lib/styles/ft-form.css.
 */
import { test, expect, type Page } from "@playwright/test";

test.use({ storageState: { cookies: [], origins: [] } });

// Third-party requests (gtag, Google Fonts) could hold off "networkidle".
test.beforeEach(async ({ page, baseURL }) => {
  const origin = new URL(baseURL ?? "http://127.0.0.1").origin;
  await page.route(
    (url) => url.origin !== origin,
    (route) => route.abort()
  );
});

const LABELS = ["First name", "Last name", "Email", "Message"];
const VALID = {
  "First name": "Ada",
  "Last name": "Lovelace",
  Email: "e2e-visitor@example.com",
  Message: "Hello from the e2e suite.",
};

async function fill(page: Page, fields: Record<string, string>) {
  for (const [label, value] of Object.entries(fields)) {
    await page.getByLabel(label, { exact: true }).fill(value);
  }
}

test("journey: / → Contact → /contactus in the public-site shell, four required fields", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("navigation", { name: "Primary" })
    .getByRole("link", { name: "Contact" })
    .click();
  // Client-side navigation lands on /contactus/ (as on main before US-356).
  await expect(page).toHaveURL(/\/contactus\/?$/);
  await expect(page.locator(".ft-free")).toHaveCount(1);
  await expect(page.locator(".navigation_bar")).toBeHidden();
  await expect(page.getByRole("navigation", { name: "Primary" })).toBeVisible();
  // FreeFooter: inside the app shell's <main>, so not a contentinfo
  // landmark in the browser; its nav is named.
  await expect(page.getByRole("navigation", { name: "Footer" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Contact us" })).toBeVisible();
  for (const label of LABELS) {
    const field = page.getByLabel(label, { exact: true });
    await expect(field).toBeVisible();
    await expect(field).toHaveAttribute("required", "");
  }
});

test("a spaces-only first name shows its field error; the other values are kept", async ({
  page,
}) => {
  await page.goto("/contactus");
  await page.waitForLoadState("networkidle");
  await fill(page, { ...VALID, "First name": "   " });
  await page.getByRole("button", { name: "Send message" }).click();

  const first = page.getByLabel("First name", { exact: true });
  await expect(page.locator("#firstname-error")).toHaveText(
    "Enter your first name"
  );
  await expect(first).toHaveAttribute("aria-invalid", "true");
  await expect(first).toHaveAttribute("aria-describedby", "firstname-error");
  await expect(page.getByLabel("Last name", { exact: true })).toHaveValue(
    VALID["Last name"]
  );
  await expect(page.getByLabel("Email", { exact: true })).toHaveValue(
    VALID.Email
  );
  await expect(page.getByLabel("Message", { exact: true })).toHaveValue(
    VALID.Message
  );
  await expect(
    page.getByRole("heading", { name: "Thanks, your message is sent" })
  ).toHaveCount(0);
});

test("an invalid email shows our field error, not the browser's (novalidate)", async ({
  page,
}) => {
  await page.goto("/contactus");
  await page.waitForLoadState("networkidle");
  await fill(page, { ...VALID, Email: "nope" });
  await page.getByRole("button", { name: "Send message" }).click();

  const email = page.getByLabel("Email", { exact: true });
  await expect(page.locator("#email-error")).toHaveText("Enter a valid email");
  await expect(email).toHaveAttribute("aria-invalid", "true");
  await expect(email).toHaveAttribute("aria-describedby", "email-error");
  await expect(email).toHaveValue("nope");
});

// Measured on origin/main's /free/request (production build, 1,280 px)
// before the move to ft-form.css. The input is 46 px tall: min-height
// 44 px, but the Tailwind forms plugin's 24 px line-height plus the 10 px
// padding and 1 px border make it 46. The focus box-shadow is that plugin's
// ring, which /free/request has always had.
const BASELINE = {
  inputHeight: 46,
  inputBorder: "rgb(201, 207, 216)",
  inputRadius: "8px",
  labelFont: "15px 600",
  focusOutline: "rgb(29, 78, 216) solid 2px",
  focusOffset: "1px",
  focusShadow:
    "rgb(255, 255, 255) 0px 0px 0px 0px, rgb(37, 99, 235) 0px 0px 0px 1px, rgba(0, 0, 0, 0) 0px 0px 0px 0px",
  cardBackground: "rgb(255, 255, 255)",
  cardBorder: "1px solid rgb(221, 225, 231)",
  cardRadius: "12px",
  cardPadding: "40px",
  error: "rgb(180, 35, 24) 14px 6px",
  button: "rgb(29, 78, 216) rgb(255, 255, 255) 8px 44",
};

interface FormUnderTest {
  route: string;
  emailId: string;
  submit: string;
  errorId: string;
  // Fills the form so the server answers with the error at errorId.
  fillInvalid: (page: Page) => Promise<void>;
}

// /free/request's email is type="email" without novalidate, so the browser
// blocks "nope" there; a spaces-only title brings back a server error with
// the same .error rule instead.
const REQUEST: FormUnderTest = {
  route: "/free/request",
  emailId: "request-email",
  submit: "Send request",
  errorId: "title-error",
  fillInvalid: async (page) => {
    await page.getByLabel("Short title").fill("   ");
    await page.getByLabel("Description").fill("Daily IG spreads.");
    await page.getByLabel("Email").fill("e2e-visitor@example.com");
  },
};

const CONTACT: FormUnderTest = {
  route: "/contactus",
  emailId: "email",
  submit: "Send message",
  errorId: "email-error",
  fillInvalid: (page) => fill(page, { ...VALID, Email: "nope" }),
};

/** The computed look of a form: card, email field, its label, focus ring,
 * a field error and the submit button. */
async function measure(page: Page, form: FormUnderTest) {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(form.route);
  await page.waitForLoadState("networkidle");
  // Off every control, so nothing is measured in its :hover state.
  await page.mouse.move(0, 0);
  const email = page.locator(`#${form.emailId}`);
  const field = await email.evaluate((el) => {
    const label = document.querySelector(`label[for="${el.id}"]`) as Element;
    const s = getComputedStyle(el);
    const l = getComputedStyle(label);
    return {
      inputHeight: el.getBoundingClientRect().height,
      labelAbove:
        label.getBoundingClientRect().bottom <= el.getBoundingClientRect().top,
      inputBorder: s.borderColor,
      inputRadius: s.borderRadius,
      labelFont: `${l.fontSize} ${l.fontWeight}`,
    };
  });
  const card = await page.locator(".form-card").evaluate((el) => {
    const s = getComputedStyle(el);
    return {
      cardBackground: s.backgroundColor,
      cardBorder: s.border,
      cardRadius: s.borderRadius,
      cardPadding: s.padding,
    };
  });
  const submit = page.getByRole("button", { name: form.submit });
  const button = await submit.evaluate((el) => {
    const s = getComputedStyle(el);
    const height = el.getBoundingClientRect().height;
    return `${s.backgroundColor} ${s.color} ${s.borderRadius} ${height}`;
  });
  // Reach the field by keyboard, so :focus-visible applies.
  await email.focus();
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("Tab");
  await expect(email).toBeFocused();
  const focus = await email.evaluate((el) => {
    const s = getComputedStyle(el);
    return {
      focusOutline: s.outline,
      focusOffset: s.outlineOffset,
      focusShadow: s.boxShadow,
    };
  });
  await form.fillInvalid(page);
  await submit.click();
  const errorEl = page.locator(`#${form.errorId}`);
  await expect(errorEl).toBeVisible();
  const error = await errorEl.evaluate((el) => {
    const s = getComputedStyle(el);
    return `${s.color} ${s.fontSize} ${s.marginTop}`;
  });
  return { ...field, ...card, ...focus, error, button };
}

test("/free/request's form looks as it did before US-356, and /contactus matches it", async ({
  page,
}) => {
  const { labelAbove: requestLabelAbove, ...request } = await measure(
    page,
    REQUEST
  );
  const { labelAbove: contactLabelAbove, ...contact } = await measure(
    page,
    CONTACT
  );
  expect(requestLabelAbove).toBe(true);
  expect(contactLabelAbove).toBe(true);
  expect(request).toEqual(BASELINE);
  expect(contact).toEqual(BASELINE);
});

// Metric 5's PR screenshots, on request only:
// CONTACT_SHOTS=<dir> npx playwright test contactus -g "screenshots"
test("US-356 screenshots: /contactus next to /free/request at 1,280 px", async ({
  page,
}) => {
  const dir = process.env.CONTACT_SHOTS;
  test.skip(!dir, "CONTACT_SHOTS not set: PR screenshots only");
  await page.setViewportSize({ width: 1280, height: 900 });
  for (const [route, name] of [
    ["/contactus", "contactus"],
    ["/free/request", "free-request"],
  ]) {
    await page.goto(route);
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: `${dir}/${name}-1280.png`, fullPage: true });
  }
});
