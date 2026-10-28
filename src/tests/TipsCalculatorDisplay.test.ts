/**
 * US-253 / US-298: the /free/tips calculator is display only. Its 7 inputs
 * are disabled and default to the live figures (the inflation assumption
 * stays a labelled 2.30), its tiles show the live measures and the FedInvest
 * price, the nominal yield and cashflows say they are unavailable, and an
 * input event recalculates nothing.
 */
import { fireEvent, render, screen } from "@testing-library/svelte";
import { describe, expect, test } from "vitest";
import { UNAVAILABLE, type TipsPageData } from "$lib/free/tips";
import TipsCalculatorDisplay from "../components/free/TipsCalculatorDisplay.svelte";
import { LIVE, liveWithout, mockFiguresIn } from "./fixtures/free-tips-live";

const DEFAULTS: [string, string][] = [
  ["Face value ($)", "1000"],
  ["Real coupon (%)", "2.125"],
  ["Base ref CPI", "319.12345"],
  ["Current ref CPI", "327.92281"],
  ["Years to maturity", "8.48"],
  ["Real yield (%)", "1.987"],
  ["Assumed annual inflation (%)", "2.30"],
];

const TILES: [string, string][] = [
  ["Index ratio", "1.02759"],
  ["Adjusted principal", "$1,027.59"],
  ["Next coupon", "$10.92"],
  ["Real clean price (FedInvest, 2026-10-23)", "98.4375"],
  ["Position value", "$1,011.53"],
  ["Nominal YTM", UNAVAILABLE.value],
];

function renderCalculator(data: TipsPageData = LIVE) {
  return render(TipsCalculatorDisplay, { props: { data } });
}

/** Each tile's [label, value]. */
function tileTexts(container: HTMLElement): string[][] {
  return [...container.querySelectorAll(".tiles > div")].map((tile) => [
    tile.querySelector("dt")?.textContent ?? "",
    tile.querySelector("dd")?.textContent ?? "",
  ]);
}

function bodyRows(container: HTMLElement): HTMLTableRowElement[] {
  return [...container.querySelectorAll<HTMLTableRowElement>("tbody tr")];
}

describe("TipsCalculatorDisplay", () => {
  test("shows exactly 7 disabled textboxes with the live defaults", () => {
    renderCalculator();
    const boxes = screen.getAllByRole("textbox");
    expect(boxes).toHaveLength(7);
    for (const box of boxes) expect(box).toBeDisabled();
    for (const [label, value] of DEFAULTS) {
      const input = screen.getByLabelText(label) as HTMLInputElement;
      expect(input).toBeDisabled();
      expect(input.value).toBe(value);
    }
  });

  test("shows the 6 output tiles from the live load", () => {
    const { container } = renderCalculator();
    expect(tileTexts(container)).toEqual(TILES);
    expect(mockFiguresIn(container.innerHTML)).toEqual([]);
  });

  test("the cashflow table and total say they are unavailable", () => {
    const { container } = renderCalculator();
    const rows = bodyRows(container);
    expect(rows).toHaveLength(1);
    expect(rows[0].textContent).toBe(UNAVAILABLE.projection);
    expect(container).toHaveTextContent(`Total received: ${UNAVAILABLE.value}`);
  });

  test("with no valuation, its tiles and inputs read unavailable", () => {
    const { container } = renderCalculator(liveWithout("valuation"));
    expect(container).toHaveTextContent(UNAVAILABLE.valuation);
    expect(tileTexts(container)).toEqual([
      ["Index ratio", UNAVAILABLE.value],
      ["Adjusted principal", UNAVAILABLE.value],
      ["Next coupon", UNAVAILABLE.value],
      ["Real clean price (FedInvest, 2026-10-23)", "98.4375"],
      ["Position value", UNAVAILABLE.value],
      ["Nominal YTM", UNAVAILABLE.value],
    ]);
    const realYield = screen.getByLabelText(
      "Real yield (%)"
    ) as HTMLInputElement;
    expect(realYield.value).toBe("");
    expect(realYield.placeholder).toBe(UNAVAILABLE.value);
    expect(
      (
        screen.getByLabelText(
          "Assumed annual inflation (%)"
        ) as HTMLInputElement
      ).value
    ).toBe("2.30");
  });

  test("an input event on the real yield recalculates nothing", async () => {
    const { container } = renderCalculator();
    const before = {
      tiles: tileTexts(container),
      first: bodyRows(container)[0].textContent,
      count: bodyRows(container).length,
    };
    const realYield = screen.getByLabelText("Real yield (%)");
    await fireEvent.input(realYield, { target: { value: "5" } });
    expect(tileTexts(container)).toEqual(before.tiles);
    expect(bodyRows(container)[0].textContent).toBe(before.first);
    expect(bodyRows(container)).toHaveLength(before.count);
  });

  test("has no buttons", () => {
    renderCalculator();
    expect(screen.queryAllByRole("button")).toHaveLength(0);
  });
});
