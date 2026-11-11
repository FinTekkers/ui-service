/**
 * US-253 / US-298: the /free/tips calculator is display only. Its 7 inputs
 * are disabled and default to the live figures (the inflation assumption
 * stays a labelled 2.30), its tiles show the live measures and the FedInvest
 * price, the nominal yield and cashflows say they are unavailable, and an
 * input event recalculates nothing.
 */
import { fireEvent, render, screen } from "@testing-library/svelte";
import { describe, expect, test } from "vitest";
import {
  NEXT_COUPON_NOTE,
  UNAVAILABLE,
  type TipsPageData,
} from "$lib/free/tips";
import TipsCalculatorDisplay from "../components/free/TipsCalculatorDisplay.svelte";
import {
  LIVE,
  LIVE_ACCRUED,
  LIVE_COUPON_DATE,
  liveWithout,
  mockFiguresIn,
} from "./fixtures/free-tips-live";

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
  ["Next coupon (April 15, 2027), at today's index ratio", "$10.92"],
  ["Real clean price (FedInvest, 2026-10-23)", "98.4375"],
  ["Clean value", "$1,011.53"],
  ["Accrued interest", "$7.43"],
  ["Full value (clean + accrued)", "$1,018.96"],
  ["Nominal YTM", UNAVAILABLE.value],
];

function renderCalculator(data: TipsPageData = LIVE) {
  return render(TipsCalculatorDisplay, { props: { data } });
}

/** The value of the tile labelled `label`. */
function tileValue(container: HTMLElement, label: string): string | undefined {
  return tileTexts(container).find(([dt]) => dt === label)?.[1];
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

  test("shows the 8 output tiles from the live load", () => {
    const { container } = renderCalculator();
    expect(tileTexts(container)).toEqual(TILES);
    expect(mockFiguresIn(container.innerHTML)).toEqual([]);
  });

  test("the next coupon says it's an estimate at today's index ratio", () => {
    const { container } = renderCalculator();
    expect(container).toHaveTextContent(
      "The amount paid uses the index ratio on the payment date, so it will differ if CPI keeps changing."
    );
    expect(NEXT_COUPON_NOTE).toBe(
      "The amount paid uses the index ratio on the payment date, so it will differ if CPI keeps changing."
    );
  });

  test("with no next coupon date, the label drops the date", () => {
    const data = structuredClone(LIVE);
    if (data.valuation.ok) {
      data.valuation.data.nextCoupon = null;
      data.valuation.data.nextCouponDate = null;
    }
    const { container } = renderCalculator(data);
    expect(tileTexts(container)[2]).toEqual([
      "Next coupon, at today's index ratio",
      UNAVAILABLE.value,
    ]);
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
      ["Next coupon, at today's index ratio", UNAVAILABLE.value],
      ["Real clean price (FedInvest, 2026-10-23)", "98.4375"],
      ["Clean value", UNAVAILABLE.value],
      ["Accrued interest", UNAVAILABLE.value],
      ["Full value (clean + accrued)", UNAVAILABLE.value],
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

  test("US-311: shows the clean value, accrued interest and full value", () => {
    const { container } = renderCalculator(LIVE_ACCRUED);
    expect(tileValue(container, "Clean value")).toBe("$969.36");
    expect(tileValue(container, "Accrued interest")).toBe("$5.99");
    expect(tileValue(container, "Full value (clean + accrued)")).toBe(
      "$975.35"
    );
    expect(tileTexts(container).map(([label]) => label)).not.toContain(
      "Position value"
    );
    expect(mockFiguresIn(container.innerHTML)).toEqual([]);
  });

  test("US-311: on a coupon date, accrued is $0.00 and full equals clean", () => {
    const { container } = renderCalculator(LIVE_COUPON_DATE);
    expect(tileValue(container, "Accrued interest")).toBe("$0.00");
    expect(tileValue(container, "Full value (clean + accrued)")).toBe(
      tileValue(container, "Clean value")
    );
    expect(tileValue(container, "Clean value")).toBe("$969.36");
    expect(mockFiguresIn(container.innerHTML)).toEqual([]);
  });

  test("US-311: the coupon-date assumption no longer renders", () => {
    const { container } = renderCalculator();
    expect(container.textContent).not.toContain(
      "Assumes valuation on a coupon date"
    );
    expect(container.textContent).not.toContain("no accrued interest");
    expect(container).toHaveTextContent(
      "Future CPI grows at the assumed rate."
    );
  });

  test("US-311: without ACCRUED_INTEREST, accrued and full are unavailable and clean still shows", () => {
    const data = structuredClone(LIVE_ACCRUED);
    if (data.valuation.ok) {
      data.valuation.data.accruedInterest = null;
      data.valuation.data.fullValue = null;
    }
    const { container } = renderCalculator(data);
    expect(tileValue(container, "Clean value")).toBe("$969.36");
    expect(tileValue(container, "Accrued interest")).toBe(UNAVAILABLE.value);
    expect(tileValue(container, "Full value (clean + accrued)")).toBe(
      UNAVAILABLE.value
    );
    expect(container).not.toHaveTextContent(UNAVAILABLE.valuation);
  });

  test("has no buttons", () => {
    renderCalculator();
    expect(screen.queryAllByRole("button")).toHaveLength(0);
  });
});
