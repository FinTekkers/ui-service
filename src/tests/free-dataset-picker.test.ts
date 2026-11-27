/**
 * US-251: the Free data explorer's dataset picker lists exactly the
 * public datasets (US-334 added SPY as the third; US-338 lists one entry per
 * fund in ETF_FUNDS, SPY and TQQQ, at /free/etf/<slug>; US-339 adds the tech
 * vs S&P 500 drawdown after them, and US-341 sigma moves last), reports its open state with aria-expanded and marks the
 * current dataset with aria-current. US-352: after the datasets, a last
 * item links to /free/request.
 */
import { fireEvent, render, screen, within } from "@testing-library/svelte";
import { describe, expect, test } from "vitest";
import DatasetPicker from "../components/free/DatasetPicker.svelte";
import { FREE_DATASETS, isCurrentDataset } from "$lib/free/datasets";
import { ETF_FUNDS } from "$lib/free/etf/funds";

const SOMA = "Federal Reserve SOMA Holdings";
const TIPS = "Treasury Inflation Protected Securities";
const SPY = "SPDR S&P 500 ETF Trust (SPY)";
const TQQQ = "ProShares UltraPro QQQ (TQQQ)";
const TECH = "Tech's drawdown relative to the S&P 500";
const SIGMA = "Sigma moves: daily returns in standard deviations";
const REQUEST = "+ Request a free analysis";

describe("DatasetPicker", () => {
  test("opening it lists exactly SOMA, TIPS, SPY, TQQQ, tech vs S&P 500 and sigma moves, then the request link, and sets aria-expanded", async () => {
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
      [SPY, "/free/etf/spy"],
      [TQQQ, "/free/etf/tqqq"],
      [TECH, "/free/tech-vs-sp500"],
      [SIGMA, "/free/sigma-moves"],
      [REQUEST, "/free/request"],
    ]);
  });

  test("US-352: the request link is the last item, current only on /free/request, where the button asks to choose a dataset", async () => {
    render(DatasetPicker, { props: { currentPath: "/free/request" } });
    const toggle = screen.getByRole("button");
    expect(toggle).toHaveTextContent("Choose a dataset");
    await fireEvent.click(toggle);
    const links = within(screen.getByRole("list")).getAllByRole("link");
    const last = links[links.length - 1];
    expect(last).toHaveTextContent(REQUEST);
    expect(last).toHaveAttribute("href", "/free/request");
    expect(last).toHaveAttribute("aria-current", "page");
    expect(links.filter((link) => link.hasAttribute("aria-current"))).toEqual([
      last,
    ]);
  });

  test("US-338: the fund entries are built from ETF_FUNDS", () => {
    expect(FREE_DATASETS.filter((d) => d.id.startsWith("etf-"))).toEqual(
      ETF_FUNDS.map((f) => ({
        id: `etf-${f.slug}`,
        label: `${f.name} (${f.ticker})`,
        href: `/free/etf/${f.slug}`,
      }))
    );
  });

  test("US-338: on /free/etf/tqqq only TQQQ is current", async () => {
    render(DatasetPicker, { props: { currentPath: "/free/etf/tqqq" } });
    await fireEvent.click(screen.getByRole("button"));
    expect(screen.getByRole("link", { name: TQQQ })).toHaveAttribute(
      "aria-current",
      "page"
    );
    expect(screen.getByRole("link", { name: SPY })).not.toHaveAttribute(
      "aria-current"
    );
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
