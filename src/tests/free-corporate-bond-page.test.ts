/**
 * US-354: /free/corporate-bond/crwv-2030 renders what its server load
 * returns (server-side render: Vitest's svelte is the SSR build, so Plotly
 * never mounts and only the markup is checked).
 * - Each tile shows valuation-service's value verbatim in data-value and the
 *   server's display text; the cash-flow and sweep tables carry the raw
 *   values too.
 * - A missing DV01 tile says Unavailable.
 * - An unavailable calculator shows its message and no numbers.
 * - A field error is tied to its input and nothing is valued.
 * - The terms and call schedule are text.
 */
import { render, screen, within } from "@testing-library/svelte";
import { describe, expect, test } from "vitest";
import Page from "../routes/free/corporate-bond/crwv-2030/+page.svelte";
import {
  CRWV_CALL_SCHEDULE,
  CRWV_ISIN,
  PRICE_ERROR,
  UNAVAILABLE,
  type CalcView,
  type CorporateBondPageData,
  type SweepPoint,
} from "$lib/free/corporateBond";

const RAW = {
  accrued: "4.52222222222222222217",
  dirty: "85.89722222222222222213",
  ytm: "0.16439983077561642311",
  macaulay: "2.86271906426177853519",
  modified: "2.64527747928710399711",
  convexity: "9.30767467174402624419",
  dv01: "227.22198747776421367513",
};

const CALC: CalcView = {
  settlementDate: "2026-11-27",
  faceDisplay: "$1,000",
  accrued: { value: RAW.accrued, display: "4.522" },
  dirtyPrice: { value: RAW.dirty, display: "85.897" },
  ytm: { value: RAW.ytm, display: "16.44%" },
  macaulayDuration: { value: RAW.macaulay, display: "2.86" },
  modifiedDuration: { value: RAW.modified, display: "2.65" },
  convexity: { value: RAW.convexity, display: "9.31" },
  dv01: { value: RAW.dv01, display: "$227.22" },
  cashflows: [
    {
      date: "2026-12-01",
      kind: "coupon",
      fv: "46.2500",
      pv: "46.168880962274663202956056879",
      fvDisplay: "$46.25",
      pvDisplay: "$46.17",
    },
    {
      date: "2030-06-01",
      kind: "principal",
      fv: "1000",
      pv: "574.22902650896663824296036499",
      fvDisplay: "$1,000.00",
      pvDisplay: "$574.23",
    },
  ],
};

const POINTS: SweepPoint[] = [
  { price: "80", ytm: "0.1695", ytmPct: "16.95", marked: false },
  { price: "81.375", ytm: RAW.ytm, ytmPct: "16.44", marked: true },
  { price: "82.5", ytm: "0.1603", ytmPct: "16.03", marked: false },
];

const OK: CorporateBondPageData = {
  input: { price: "81.375", tradeDate: "2026-11-25" },
  fieldErrors: {},
  calc: { status: "ok", data: CALC },
  sweep: { status: "ok", points: POINTS },
};

function renderPage(data: CorporateBondPageData = OK) {
  return render(Page, { props: { data } });
}

function tile(id: string): HTMLElement {
  return screen.getByTestId(`tile-${id}`);
}

describe("/free/corporate-bond/crwv-2030 page", () => {
  test("shows the terms and the call schedule as text", () => {
    renderPage();
    const terms = screen.getByRole("region", {
      name: "CoreWeave, Inc. 9.25% 2030",
    });
    expect(terms).toHaveTextContent(CRWV_ISIN);
    expect(terms).toHaveTextContent("9.25% fixed");
    expect(terms).toHaveTextContent("June 1, 2030");
    const rows = within(terms)
      .getAllByRole("row")
      .slice(1)
      .map((r) =>
        within(r)
          .getAllByRole("cell")
          .map((c) => c.textContent?.trim())
      );
    expect(rows).toEqual(CRWV_CALL_SCHEDULE.map((c) => [c.from, c.price]));
    expect(terms).toHaveTextContent(/not pricing inputs/);
  });

  test("each tile carries the service's value verbatim and shows the server's text", () => {
    renderPage();
    const expected: [string, string, string][] = [
      ["settlement", "2026-11-27", "2026-11-27"],
      ["clean", "81.375", "81.375"],
      ["accrued", RAW.accrued, "4.522"],
      ["dirty", RAW.dirty, "85.897"],
      ["ytm", RAW.ytm, "16.44%"],
      ["macaulay", RAW.macaulay, "2.86"],
      ["modified", RAW.modified, "2.65"],
      ["convexity", RAW.convexity, "9.31"],
      ["dv01", RAW.dv01, "$227.22"],
    ];
    for (const [id, value, text] of expected) {
      expect(tile(id), id).toHaveAttribute("data-value", value);
      expect(tile(id).querySelector("dd")?.textContent, id).toContain(text);
    }
    expect(tile("dv01")).toHaveTextContent("per $1M face");
  });

  test("the cash-flow and sweep tables carry the raw values, one point marked", () => {
    renderPage();
    const rows = screen.getAllByTestId("cashflow-row");
    expect(
      rows.map((r) => [
        r.getAttribute("data-date"),
        r.getAttribute("data-kind"),
        r.getAttribute("data-pv"),
      ])
    ).toEqual(CALC.cashflows.map((c) => [c.date, c.kind, c.pv]));
    const points = screen.getAllByTestId("sweep-point");
    expect(points).toHaveLength(3);
    const marked = points.filter((p) => p.dataset.marked === "true");
    expect(marked).toHaveLength(1);
    expect(marked[0]).toHaveAttribute("data-price", "81.375");
    expect(marked[0]).toHaveAttribute("data-ytm", RAW.ytm);
    expect(screen.getByTestId("crwv-sweep-plot")).toHaveAccessibleName(
      /your price 81\.375 marked/
    );
  });

  test("a missing DV01 says Unavailable, with no figure", () => {
    renderPage({
      ...OK,
      calc: { status: "ok", data: { ...CALC, dv01: null } },
    });
    expect(tile("dv01")).toHaveAttribute("data-value", "");
    expect(tile("dv01").querySelector("dd")).toHaveTextContent(
      UNAVAILABLE.measure
    );
    expect(tile("dv01").querySelector("dd")).not.toHaveTextContent(/\d/);
  });

  test("an unavailable calculator shows its message and no numbers", () => {
    renderPage({
      ...OK,
      calc: { status: "unavailable", message: UNAVAILABLE.calc },
      sweep: { status: "unavailable", message: UNAVAILABLE.sweep },
    });
    const results = screen.getByTestId("crwv-results");
    expect(results).toHaveTextContent(UNAVAILABLE.calc);
    expect(results.textContent).not.toMatch(/\d/);
    expect(screen.queryAllByTestId(/^tile-/)).toEqual([]);
    for (const name of ["Cash flows to maturity", "Price and yield"]) {
      const region = screen.getByRole("region", { name });
      expect(region.textContent?.replace(name, "")).not.toMatch(/\d/);
      expect(region).toHaveTextContent(/^.*Unavailable: /);
    }
    expect(screen.queryAllByTestId("cashflow-row")).toEqual([]);
    expect(screen.queryAllByTestId("sweep-point")).toEqual([]);
  });

  test("a failed sweep keeps the calculator figures", () => {
    renderPage({
      ...OK,
      sweep: { status: "unavailable", message: UNAVAILABLE.sweep },
    });
    expect(tile("ytm")).toHaveAttribute("data-value", RAW.ytm);
    const sweep = screen.getByRole("region", { name: "Price and yield" });
    expect(sweep).toHaveTextContent(UNAVAILABLE.sweep);
    expect(within(sweep).queryByTestId("crwv-sweep-plot")).toBeNull();
    expect(screen.queryAllByTestId("sweep-point")).toEqual([]);
  });

  test("a price field error is tied to the input, and nothing is valued", () => {
    renderPage({
      input: { price: "200.01", tradeDate: "2026-11-25" },
      fieldErrors: { price: PRICE_ERROR },
      calc: { status: "not-run" },
      sweep: { status: "not-run" },
    });
    const input = screen.getByLabelText("Clean price");
    expect(input).toHaveValue("200.01");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription(PRICE_ERROR);
    expect(screen.queryAllByTestId(/^tile-/)).toEqual([]);
    expect(screen.queryByText(/^Unavailable/)).toBeNull();
    expect(screen.queryAllByTestId("cashflow-row")).toEqual([]);
  });

  test("the form is a GET with price, trade date and Calculate", () => {
    renderPage();
    const button = screen.getByRole("button", { name: "Calculate" });
    const form = button.closest("form");
    expect(form?.getAttribute("method")).toBe("GET");
    expect(screen.getByLabelText("Clean price")).toHaveAttribute(
      "name",
      "price"
    );
    expect(screen.getByLabelText("Trade date")).toHaveAttribute(
      "name",
      "tradeDate"
    );
    expect(screen.getByLabelText("Trade date")).toHaveValue("2026-11-25");
  });
});
