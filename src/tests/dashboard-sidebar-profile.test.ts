/**
 * US-201: Profile is the first sidebar menu item, and the "Hi <name>"
 * greeting is a real link to /data/profile that selects the PROFILE menu.
 */
import { fireEvent, render, screen } from "@testing-library/svelte";
import { get } from "svelte/store";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import DashboardSideBar from "../components/DashboardSideBar.svelte";
import { dashboardMenuData } from "$lib/uidata";
import { selectedDashboardMenu } from "../store/store";

const renderSidebar = () =>
  render(DashboardSideBar, {
    props: { data: { user: { name: "Ada", picture: "" } } },
  });

describe("dashboardMenuData order", () => {
  test("profile is the first menu item", () => {
    expect(Object.keys(dashboardMenuData)[0]).toBe("profile");
  });

  test("other items keep their relative order", () => {
    expect(Object.keys(dashboardMenuData).slice(1)).toEqual([
      "portfolio",
      "security",
      "transaction",
      "position",
      "calculators",
      "prices",
      "treasuries",
      "curves",
      "cpiIndex",
      "catalog",
    ]);
  });
});

// jsdom can't navigate; stop link clicks from trying (the handlers still run).
const preventNavigation = (e: Event) => e.preventDefault();

describe("DashboardSideBar greeting", () => {
  beforeEach(() => {
    selectedDashboardMenu.set("home");
    document.addEventListener("click", preventNavigation);
  });

  afterEach(() => {
    document.removeEventListener("click", preventNavigation);
  });

  test("greeting is a link to /data/profile", () => {
    renderSidebar();
    const link = screen.getByRole("link", { name: /Hi Ada/ });
    expect(link).toHaveAttribute("href", "/data/profile");
    expect(link.tabIndex).toBeGreaterThanOrEqual(0);
  });

  test("clicking the greeting selects the PROFILE menu", async () => {
    renderSidebar();
    await fireEvent.click(screen.getByRole("link", { name: /Hi Ada/ }));
    expect(get(selectedDashboardMenu)).toBe("PROFILE");
  });

  test("clicking the first menu link selects the PROFILE menu", async () => {
    renderSidebar();
    // The greeting links to /data/profile too; the menu link is the one
    // named just "Profile".
    const menuLinks = screen
      .getAllByRole("link", { name: "Profile" })
      .filter((a) => a.getAttribute("href") === "/data/profile");
    expect(menuLinks).toHaveLength(1);
    expect(menuLinks[0]).toHaveTextContent("Profile");
    await fireEvent.click(menuLinks[0]);
    expect(get(selectedDashboardMenu)).toBe("PROFILE");
  });
});
