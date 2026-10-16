/**
 * US-229: the TIPS Pricer's Current CPI field in CUSIP mode — the pill and
 * note for a price-service value or a manual one, a typed value that a
 * later lookup never overwrites, the lookup request, and the results rows
 * (service values shown as-is, `CPI source` last).
 */
import { render, fireEvent } from "@testing-library/svelte";
import { tick } from "svelte";
import { describe, expect, test, beforeEach, afterEach, vi } from "vitest";

import TipsCalculator from "../components/widgets/TipsCalculator.svelte";

const securities = [
  {
    cusip: "912810RL4",
    issuerName: "US Treasury",
    couponRate: "0.75",
    maturityDate: "2042/02/15",
  },
];

const READINGS = [
  { year: 2026, month: 7, label: "CPI-U Jul 2026", value: "322.132" },
  { year: 2026, month: 8, label: "CPI-U Aug 2026", value: "322.551" },
];

const AUTO = {
  source: "price-service" as const,
  value: "321.46512",
  readings: READINGS,
  note: null,
};

const NO_READING_NOTE =
  "No CPI-U reading for 2026-12-01 in the price service (latest loaded: Aug 2026). Enter it to calculate. It is not saved.";

let lastHref: string | undefined;
let search = "";

beforeEach(() => {
  lastHref = undefined;
  search = "";
  const stub: any = {};
  Object.defineProperty(stub, "href", {
    configurable: true,
    get: () => lastHref ?? "http://localhost/",
    set: (v: string) => {
      lastHref = v;
    },
  });
  Object.defineProperty(stub, "search", { get: () => search });
  stub.pathname = "/data/calculators";
  vi.stubGlobal("location", stub);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function currentCpiInput(getByLabelText: any): HTMLInputElement {
  return getByLabelText(/^Current CPI/) as HTMLInputElement;
}

describe("TipsCalculator — Current CPI from the price service (US-229)", () => {
  test("M1: shows the returned REFERENCE_CPI, the green pill and the month-only reading labels", async () => {
    const { getByLabelText, getByText } = render(TipsCalculator, {
      props: { securities, cpi: AUTO },
    });
    expect(currentCpiInput(getByLabelText).value).toBe("321.46512");
    const pill = getByText("from price service");
    expect(pill.classList.contains("cpi-source-auto")).toBe(true);
    expect(getByText(/CPI-U Jul 2026/).textContent).toContain("CPI-U Aug 2026");
  });

  test("M2: no reading — empty field, amber pill, the exact note", async () => {
    const { getByLabelText, getByText } = render(TipsCalculator, {
      props: {
        securities,
        cpi: {
          source: "manual",
          value: "",
          readings: [],
          note: NO_READING_NOTE,
        },
      },
    });
    const input = currentCpiInput(getByLabelText);
    expect(input.value).toBe("");
    expect(
      getByText("manual entry").classList.contains("cpi-source-manual")
    ).toBe(true);
    expect(getByText(NO_READING_NOTE)).toBeInTheDocument();
    expect(input.getAttribute("aria-describedby")).toBe("currentCpiNote");
  });

  test("M3: typing over the auto value flips the pill; a later lookup does not overwrite it; Calculate marks it manual", async () => {
    search = "?tab=tips&tipsMode=cusip&tipsCusip=912810RL4";
    const { getByLabelText, getByText, queryByText, getByRole, component } =
      render(TipsCalculator, { props: { securities, cpi: AUTO } });

    await fireEvent.input(currentCpiInput(getByLabelText), {
      target: { value: "330.5" },
    });
    expect(getByText("manual entry")).toBeInTheDocument();
    expect(queryByText("from price service")).toBeNull();

    // A lookup that was already in flight lands after the typing.
    component.$set({ cpi: { ...AUTO, value: "999.99999" } });
    await tick();
    expect(currentCpiInput(getByLabelText).value).toBe("330.5");

    await fireEvent.click(getByRole("button", { name: /Calculate/i }));
    const params = new URL(lastHref!, "http://localhost").searchParams;
    expect(params.get("currentCpi")).toBe("330.5");
    expect(params.get("currentCpiSource")).toBe("manual");
  });

  test("Calculate with a price-service value sends no currentCpi (load re-reads the readings)", async () => {
    search = "?tab=tips&tipsMode=cusip&tipsCusip=912810RL4";
    const { getByRole } = render(TipsCalculator, {
      props: { securities, cpi: AUTO },
    });
    await fireEvent.click(getByRole("button", { name: /Calculate/i }));
    const params = new URL(lastHref!, "http://localhost").searchParams;
    expect(params.has("currentCpi")).toBe(false);
    expect(params.has("currentCpiSource")).toBe(false);
  });

  test("a CUSIP and settlement date ask the page for a lookup; with a Price it is a REFERENCE_CPI preview", async () => {
    const { getByLabelText, component } = render(TipsCalculator, {
      props: { securities },
    });
    const lookups: URLSearchParams[] = [];
    component.$on("cpilookup", (e: CustomEvent<URLSearchParams>) =>
      lookups.push(e.detail)
    );

    await fireEvent.input(getByLabelText("CUSIP"), {
      target: { value: "912810RL4" },
    });
    await fireEvent.change(getByLabelText("CUSIP"));
    expect(lookups.length).toBe(0); // no settlement date yet

    await fireEvent.input(getByLabelText("Price (% of par)"), {
      target: { value: "98.5" },
    });
    await fireEvent.input(getByLabelText("Settlement Date"), {
      target: { value: "2026-10-15" },
    });
    await fireEvent.change(getByLabelText("Settlement Date"));
    expect(lookups.length).toBe(1);
    expect(Object.fromEntries(lookups[0])).toEqual({
      tab: "tips",
      tipsMode: "cusip",
      tipsCusip: "912810RL4",
      settlementDate: "2026-10-15",
      tipsPrice: "98.5",
      cpiPreview: "1",
    });
  });

  test("CUSIP mode field order and the coupon/maturity note", async () => {
    const { container, getByLabelText } = render(TipsCalculator, {
      props: { securities },
    });
    await fireEvent.input(getByLabelText("CUSIP"), {
      target: { value: "912810RL4" },
    });
    const labels = Array.from(
      container.querySelectorAll(".inputs-panel label")
    ).map((l) => l.getAttribute("for"));
    expect(labels).toEqual([
      "tipsCusip",
      "settlementDate",
      "tipsPrice",
      "referenceCpi",
      "currentCpi",
    ]);
    // The suggestion list repeats the text; the note is tied to the input.
    expect(container.querySelector("#tipsCusipNote")?.textContent?.trim()).toBe(
      "0.75% — matures 2042/02/15"
    );
    expect(getByLabelText("CUSIP").getAttribute("aria-describedby")).toBe(
      "tipsCusipNote"
    );
  });
});

describe("TipsCalculator — results rows (US-229)", () => {
  const RESULT = {
    inflationAdjustedPrincipal: "1074.86",
    presentValue: "98.5",
    currentYield: "0.0065",
    realYield: "0.0072",
    yieldToMaturity: "0.031",
    macaulayDuration: "3.2",
    indexRatio: "1.07486",
    cpiSource: "Price service" as const,
  };

  test("M4: the service's index ratio and principal are shown exactly", () => {
    const { container } = render(TipsCalculator, {
      props: { securities, result: RESULT },
    });
    const value = (label: string) =>
      Array.from(container.querySelectorAll(".results-table tr"))
        .find((tr) => tr.querySelector(".label")?.textContent === label)
        ?.querySelector(".value")?.textContent;
    expect(value("Index Ratio (CPI)")).toBe("1.07486");
    expect(value("Inflation-Adjusted Principal")).toBe("1,074.86");
  });

  test("M5: existing rows keep their labels and order; CPI source is the last row", () => {
    const { container } = render(TipsCalculator, {
      props: { securities, result: { ...RESULT, cpiSource: "Manual entry" } },
    });
    const rows = Array.from(container.querySelectorAll(".results-table tr"));
    expect(rows.map((tr) => tr.querySelector(".label")?.textContent)).toEqual([
      "Inflation-Adjusted Principal",
      "Present Value",
      "Current Yield",
      "Real Yield",
      "Yield to Maturity",
      "Macaulay Duration",
      "Index Ratio (CPI)",
      "CPI source",
    ]);
    expect(rows[rows.length - 1].querySelector(".value")?.textContent).toBe(
      "Manual entry"
    );
  });
});
