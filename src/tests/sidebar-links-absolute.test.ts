/**
 * US-203: sidebar and top-bar links go to one fixed page whatever page you
 * are on. They used to be relative ("portfolios"), so from
 * /data/portfolios/ the Portfolio link went to /data/portfolios/portfolios.
 */
import { render, screen, within } from "@testing-library/svelte";
import { afterEach, describe, expect, test } from "vitest";
import DashboardSideBar from "../components/DashboardSideBar.svelte";
import SidebarNav from "../components/SidebarNav.svelte";
import Navbar from "../components/Navbar.svelte";
import { setBase } from "./stubs/app-paths";

const ORIGIN = "https://www.fintekkers.org";
const DOCS_URL = "https://github.com/FinTekkers/ledger-models";

const PAGES = [
  "/",
  "/data/portfolios", // post-login landing URL
  "/data/portfolios/",
  "/data/portfolios/abc",
  "/data/positions",
  "/treasuries",
  "/login",
];

// Menu order and names, by hand: not derived from dashboardMenuData.
const EXPECTED_MENU: [string, string][] = [
  ["Profile", "/data/profile"],
  ["Portfolio", "/data/portfolios"],
  ["Security", "/data/securities"],
  ["Transaction", "/data/transactions"],
  ["Position", "/data/positions"],
  ["Calculators", "/data/calculators"],
  ["Prices", "/data/prices"],
  ["Treasuries", "/data/treasury_curve"],
  ["Curves", "/data/curves"],
  ["CPI Index", "/data/cpi_index"],
  ["Data Catalog", "/data/catalog"],
];

/** Pathname the browser navigates to when `href` is clicked on `page`. */
const resolveFrom = (page: string, href: string) =>
  new URL(href, ORIGIN + page).pathname;

const hasDoubledSegment = (pathname: string) =>
  pathname
    .split("/")
    .filter(Boolean)
    .some((segment, i, all) => i > 0 && segment === all[i - 1]);

const renderSidebar = () =>
  render(DashboardSideBar, {
    props: { data: { user: { name: "Ada", picture: "" } } },
  });

const menuLinks = (container: HTMLElement) =>
  within(
    container.querySelector(".dashboard_user_menu_options") as HTMLElement
  ).getAllByRole("link");

const hrefOf = (name: string) =>
  screen.getByRole("link", { name }).getAttribute("href") as string;

afterEach(() => setBase(""));

describe("DashboardSideBar menu links", () => {
  test("has exactly the 11 menu links, in order", () => {
    const { container } = renderSidebar();
    const links = menuLinks(container);
    expect(links).toHaveLength(11);
    expect(links.map((a) => a.textContent?.trim())).toEqual(
      EXPECTED_MENU.map(([name]) => name)
    );
  });

  test.each(PAGES)("from %s every link goes to its fixed path", (page) => {
    renderSidebar();
    for (const [name, path] of EXPECTED_MENU) {
      const resolved = resolveFrom(page, hrefOf(name));
      expect(resolved, `${name} from ${page}`).toBe(path);
      expect(hasDoubledSegment(resolved)).toBe(false);
    }
  });

  test.each(PAGES)("from %s the greeting goes to /data/profile", (page) => {
    renderSidebar();
    const greeting = screen.getByRole("link", { name: /Hi Ada/ });
    expect(resolveFrom(page, greeting.getAttribute("href") as string)).toBe(
      "/data/profile"
    );
  });
});

describe("SidebarNav and Navbar links", () => {
  for (const [label, component] of [
    ["SidebarNav", SidebarNav],
    ["Navbar", Navbar],
  ] as const) {
    test.each(PAGES)(
      `${label}: from %s "Look at data now" goes to /data/portfolios`,
      (page) => {
        render(component);
        const resolved = resolveFrom(page, hrefOf("Look at data now"));
        expect(resolved).toBe("/data/portfolios");
        expect(hasDoubledSegment(resolved)).toBe(false);
      }
    );

    test(`${label}: Docs link is unchanged`, () => {
      render(component);
      expect(hrefOf("Docs")).toBe(DOCS_URL);
    });
  }
});

describe("under a base path", () => {
  test("every internal link is prefixed once with the base path", () => {
    setBase("/app");
    const { container } = renderSidebar();
    const sidebarHrefs = [
      ...menuLinks(container),
      screen.getByRole("link", { name: /Hi Ada/ }),
    ].map((a) => a.getAttribute("href") as string);
    expect(sidebarHrefs).toHaveLength(12);
    expect(sidebarHrefs.slice(0, 11)).toEqual(
      EXPECTED_MENU.map(([, path]) => "/app" + path)
    );
    expect(sidebarHrefs[11]).toBe("/app/data/profile");

    for (const component of [SidebarNav, Navbar]) {
      const { unmount } = render(component);
      expect(hrefOf("Look at data now")).toBe("/app/data/portfolios");
      expect(hrefOf("Docs")).toBe(DOCS_URL);
      unmount();
    }

    for (const href of sidebarHrefs) {
      expect(href.startsWith("/app/data/")).toBe(true);
      expect(href.startsWith("/app/app/")).toBe(false);
    }
  });
});
