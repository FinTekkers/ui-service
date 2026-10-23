/**
 * US-251: the Free data explorer's dataset picker lists exactly the two
 * public datasets, reports its open state with aria-expanded and marks the
 * current dataset with aria-current.
 */
import { fireEvent, render, screen, within } from "@testing-library/svelte";
import { describe, expect, test } from "vitest";
import DatasetPicker from "../components/free/DatasetPicker.svelte";
import { FREE_DATASETS, isCurrentDataset } from "$lib/free/datasets";

const SOMA = "Federal Reserve SOMA Holdings";
const TIPS = "Treasury Inflation Protected Securities";

describe("DatasetPicker", () => {
  test("opening it lists exactly SOMA and TIPS and sets aria-expanded", async () => {
    render(DatasetPicker, { props: { currentPath: "/free/tips" } });
    const toggle = screen.getByRole("button");
    expect(toggle).toHaveAttribute("aria-expanded", "false");

    await fireEvent.click(toggle);

    expect(toggle).toHaveAttribute("aria-expanded", "true");
    const list = document.getElementById(
      toggle.getAttribute("aria-controls") ?? ""
    );
    expect(list).not.toBeNull();
    expect(list).toBeVisible();
    const links = within(list as HTMLElement).getAllByRole("link");
    expect(
      links.map((link) => [link.textContent?.trim(), link.getAttribute("href")])
    ).toEqual([
      [SOMA, "/free/soma"],
      [TIPS, "/free/tips"],
    ]);
  });

  test("only the current dataset has aria-current", async () => {
    render(DatasetPicker, { props: { currentPath: "/free/tips" } });
    await fireEvent.click(screen.getByRole("button"));

    expect(screen.getByRole("link", { name: TIPS })).toHaveAttribute(
      "aria-current",
      "page"
    );
    expect(screen.getByRole("link", { name: SOMA })).not.toHaveAttribute(
      "aria-current"
    );
    expect(screen.getByRole("button")).toHaveTextContent(TIPS);
  });

  test("a second click closes it again", async () => {
    render(DatasetPicker, { props: { currentPath: "/free/soma" } });
    const toggle = screen.getByRole("button");
    await fireEvent.click(toggle);
    await fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("link")).toBeNull();
  });

  test("Escape closes it and returns focus to the toggle", async () => {
    render(DatasetPicker, { props: { currentPath: "/free/soma" } });
    const toggle = screen.getByRole("button");
    await fireEvent.click(toggle);
    screen.getByRole("link", { name: TIPS }).focus();

    await fireEvent.keyDown(window, { key: "Escape" });

    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(document.activeElement).toBe(toggle);
  });

  test("no link is current on a path outside the datasets", async () => {
    render(DatasetPicker, { props: { currentPath: "/free" } });
    await fireEvent.click(screen.getByRole("button"));
    const list = screen.getByRole("list");
    for (const link of within(list).getAllByRole("link")) {
      expect(link).not.toHaveAttribute("aria-current");
    }
  });

  test("selectedId marks its dataset on a path outside the datasets", async () => {
    render(DatasetPicker, {
      props: { currentPath: "/free", selectedId: "soma" },
    });
    expect(screen.getByRole("button")).toHaveTextContent(SOMA);
    await fireEvent.click(screen.getByRole("button"));
    expect(screen.getByRole("link", { name: SOMA })).toHaveAttribute(
      "aria-current",
      "true"
    );
    expect(screen.getByRole("link", { name: TIPS })).not.toHaveAttribute(
      "aria-current"
    );
  });
});

describe("isCurrentDataset", () => {
  const tips = FREE_DATASETS.find((d) => d.id === "tips");

  test("matches the dataset page and pages below it, not a prefix sibling", () => {
    expect(tips).toBeDefined();
    if (!tips) return;
    expect(isCurrentDataset(tips, "/free/tips")).toBe(true);
    expect(isCurrentDataset(tips, "/free/tips/912810RL4")).toBe(true);
    expect(isCurrentDataset(tips, "/free/tipsx")).toBe(false);
    expect(isCurrentDataset(tips, "/free/soma")).toBe(false);
  });
});
