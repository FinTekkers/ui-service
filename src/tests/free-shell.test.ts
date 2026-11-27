/**
 * US-251: every /free/* page renders the Free data explorer shell
 * (src/routes/free/+layout.svelte): the artboard nav, header and footer,
 * with site-relative links, inside a .ft-free root that hides the app's
 * own Navbar and SidebarNav. US-352: the footer and a "Missing a chart or
 * dataset?" band above it link to /free/request; the band is on every free
 * page but that one.
 */
import { render, screen, within } from "@testing-library/svelte";
import { readFileSync } from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, test } from "vitest";
import type { Writable } from "svelte/store";
import { page as appPage } from "$app/stores";
import FreeLayout from "../routes/free/+layout.svelte";
import { FREE_DATASETS } from "$lib/free/datasets";

// The test stub ($app/stores in vitest.config.js) is a writable.
const page = appPage as unknown as Writable<{ url: URL }>;

const GITHUB = "https://github.com/FinTekkers/ledger-models";

describe("Free data explorer shell", () => {
  test("nav and footer links go to the site-relative pages", () => {
    render(FreeLayout);

    const nav = screen.getByRole("navigation", { name: "Primary" });
    for (const [name, href] of [
      ["Free data explorer", "/free"],
      ["Pro register/login", "/login"],
      ["Contact", "/contactus"],
    ]) {
      expect(within(nav).getByRole("link", { name })).toHaveAttribute(
        "href",
        href
      );
    }

    const footer = screen.getByRole("contentinfo");
    for (const [name, href] of [
      ["Home", "/"],
      ["GitHub", GITHUB],
      ["Contact", "/contactus"],
      ["Request an analysis", "/free/request"],
    ]) {
      expect(within(footer).getByRole("link", { name })).toHaveAttribute(
        "href",
        href
      );
    }
  });

  describe("US-352 request band", () => {
    afterEach(() => {
      page.set({ url: new URL("http://localhost/free/soma") });
    });

    test.each(["/free", ...FREE_DATASETS.map((d) => d.href)])(
      "%s shows the band, linking to /free/request, above the footer",
      (pathname) => {
        page.set({ url: new URL(`http://localhost${pathname}`) });
        render(FreeLayout);
        const band = screen.getByRole("region", {
          name: "Missing a chart or dataset?",
        });
        expect(
          within(band).getByRole("link", { name: "Request a free analysis" })
        ).toHaveAttribute("href", "/free/request");
        expect(band.nextElementSibling).toBe(screen.getByRole("contentinfo"));
      }
    );

    test("/free/request has no band", () => {
      page.set({ url: new URL("http://localhost/free/request") });
      render(FreeLayout);
      expect(
        screen.queryByRole("region", { name: "Missing a chart or dataset?" })
      ).toBeNull();
    });
  });

  test("no link in the shell points at www.fintekkers.org", () => {
    const { container } = render(FreeLayout);
    const hrefs = [...container.querySelectorAll("a[href]")].map(
      (link) => link.getAttribute("href") ?? ""
    );
    expect(hrefs.length).toBeGreaterThan(0);
    for (const href of hrefs) {
      expect(href).not.toContain("www.fintekkers.org");
      if (href !== GITHUB) expect(href).toMatch(/^\//);
    }
  });

  test("renders a .ft-free root with the header text", () => {
    const { container } = render(FreeLayout);
    const root = container.querySelector(".ft-free");
    expect(root).not.toBeNull();
    expect(root).toHaveTextContent("Free data explorer");
    expect(root).toHaveTextContent("Free data · no sign-up");
    expect(
      within(root as HTMLElement).getByRole("heading", { level: 1 })
    ).toHaveTextContent("Free data explorer");
  });

  test("the layout CSS hides Navbar and SidebarNav only under .ft-free", () => {
    // Read from disk (not ?raw) and match whitespace-tolerantly, so a
    // Prettier reformat of the layout doesn't break the test.
    const source = readFileSync(
      path.resolve("src/routes/free/+layout.svelte"),
      "utf8"
    );
    const style = source.slice(source.indexOf("<style"));
    expect(style).toMatch(
      /:global\(\s*body:has\(\s*\.ft-free\s*\)\s+\.navigation_bar\s*\)/
    );
    expect(style).toMatch(
      /:global\(\s*body:has\(\s*\.ft-free\s*\)\s+\.mobile-nav\s*\)\s*\{\s*display:\s*none;?\s*\}/
    );
  });
});
