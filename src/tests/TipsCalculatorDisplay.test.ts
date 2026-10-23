/**
 * US-253: the /free/tips calculator is display only. Its 7 inputs show the
 * artboard's defaults and are disabled, its 19 cashflow rows come from
 * src/lib/free/mock/tips.ts, and an input event recalculates nothing.
 */
import { fireEvent, render, screen, within } from "@testing-library/svelte";
import { describe, expect, test } from "vitest";
import { tips } from "$lib/free/mock/tips";
import TipsCalculatorDisplay from "../components/free/TipsCalculatorDisplay.svelte";

const DEFAULTS: [string, string][] = [
  ["Face value ($)", "10000"],
  ["Real coupon (%)", "1.875"],
  ["Base ref CPI", "324.93471"],
  ["Current ref CPI", "332.92643"],
  ["Years to maturity", "9.5"],
  ["Real yield (%)", "2.25"],
  ["Assumed annual inflation (%)", "2.30"],
];

const TILES: [string, string][] = [
  ["Index ratio", "1.02459"],
  ["Adjusted principal", "$10,245.90"],
  ["Next coupon", "$96.06"],
  ["Real price (per 100)", "96.8086"],
  ["Position value", "$9,918.91"],
  ["Nominal YTM", "4.563%"],
];

function renderCalculator() {
  return render(TipsCalculatorDisplay, { props: { data: tips } });
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
  test("shows exactly 7 disabled textboxes with the artboard defaults", () => {
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

  test("shows the 6 output tiles and the total from the mock", () => {
    const { container } = renderCalculator();
    expect(tileTexts(container)).toEqual(TILES);
    expect(container).toHaveTextContent("Total received: $14,765.31");
  });

  test("lists 19 cashflow rows, the last one repaying principal", () => {
    const { container } = renderCalculator();
    const rows = bodyRows(container);
    expect(rows).toHaveLength(19);
    expect(
      within(rows[0])
        .getAllByRole("cell")
        .map((cell) => cell.textContent)
    ).toEqual(["0.5 yr", "1.03631", "$97.15", "—", "$97.15"]);
    expect(
      within(rows[18])
        .getAllByRole("cell")
        .map((cell) => cell.textContent)
    ).toEqual(["9.5 yr", "1.27165", "$119.22", "$12,716.53", "$12,835.75"]);
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
