/**
 * US-253 / US-298: /free/tips renders the 5 DataExplorerTIPS.dc.html
 * sections with the live figures its server load returns (fixtures/
 * free-tips-live.ts, every figure unlike the mock), and the code cards
 * showing the sample files verbatim. No mock figure and no fixed as-of
 * appear.
 */
import { render, screen, within } from "@testing-library/svelte";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, test } from "vitest";
import TipsPage from "../routes/free/tips/+page.svelte";
import { UNAVAILABLE, type TipsPageData } from "$lib/free/tips";
import {
  LIVE,
  MOCK_FIGURES,
  liveWithout,
  mockFiguresIn,
} from "./fixtures/free-tips-live";

const H2S = [
  "What are Treasury Inflation-Protected Securities?",
  "TII 2⅛ 04/15/35 stub",
  "How this bond tracks inflation",
  "Value a TIPS position",
  "Pull TIPS data from the API",
];

function renderPage(data: TipsPageData = LIVE) {
  return render(TipsPage, { props: { data } });
}

/** The security panel's [label, value] rows. */
function securityRows(widget: HTMLElement): (string | null | undefined)[][] {
  return [...widget.querySelectorAll("dl > div")].map((row) => [
    row.querySelector("dt")?.textContent,
    row.querySelector("dd")?.textContent,
  ]);
}

function exampleFigures(example: HTMLElement): (string | null | undefined)[] {
  return [...example.querySelectorAll("ol > li")].map(
    (li) => li.lastElementChild?.textContent
  );
}

describe("/free/tips page", () => {
  test("renders the 5 artboard h2 headings in order", () => {
    renderPage();
    expect(
      screen
        .getAllByRole("heading", { level: 2 })
        .map((h) => h.textContent?.trim())
    ).toEqual(H2S);
  });

  test("the security widget shows the live fields, price date and CPI-U months", () => {
    renderPage();
    const widget = screen.getByRole("region", { name: H2S[1] });
    expect(securityRows(widget)).toEqual([
      ["CUSIP", "91282CPU9"],
      ["Issuer", "United States Treasury"],
      ["Product", "TIPS"],
      ["Coupon (real)", "2.125%"],
      ["Frequency", "Semiannual"],
      ["Pay dates", "Apr 15 / Oct 15"],
      ["Dated date", "2025-04-15"],
      ["Maturity", "2035-04-15"],
      ["Index", "CPI-U NSA"],
      ["Base ref CPI", "319.12345"],
      ["Ref CPI (2026-10-23)", "327.92281"],
      ["Index ratio", "1.02759"],
    ]);
    expect(widget).toHaveTextContent(
      "As of 2026-10-23 · CPI-U Jul 2026 and Aug 2026"
    );
  });

  test("the worked example shows the live figures and CPI-U readings", () => {
    renderPage();
    const example = screen.getByRole("article", { name: H2S[2] });
    expect(exampleFigures(example)).toEqual([
      "319.12345",
      "327.92281",
      "1.02759",
      "$1,027.59",
      "$10.92",
      "max(adj., par)",
    ]);
    expect(example).toHaveTextContent(
      "October 1 takes July's CPI-U (327.111). November 1 takes August's (328.222)."
    );
    expect(example).toHaveTextContent(
      "327.92281 ÷ 319.12345. Prices rose about 2.76% between the dated date and October 23, 2026"
    );
    expect(example).toHaveTextContent(
      "A $1,000 position is now worth $1,000 × 1.02759 in principal terms."
    );
    expect(example).toHaveTextContent("On April 15, 2035 the holder receives");
    expect(
      within(example).getByRole("link", {
        name: "TreasuryDirect CPI table, October 2026",
      })
    ).toBeInTheDocument();
  });

  test("the calculator shows the FedInvest price, live measures and unavailable projections", () => {
    renderPage();
    const calc = screen.getByRole("region", { name: H2S[3] });
    expect(calc).toHaveTextContent("Real clean price (FedInvest, 2026-10-23)");
    expect(calc).toHaveTextContent("98.4375");
    expect(calc).toHaveTextContent("$1,011.53");
    expect(
      (within(calc).getByLabelText("Real yield (%)") as HTMLInputElement).value
    ).toBe("1.987");
    const nominal = [...calc.querySelectorAll(".tiles > div")].find(
      (tile) => tile.querySelector("dt")?.textContent === "Nominal YTM"
    );
    expect(nominal?.querySelector("dd")?.textContent).toBe(UNAVAILABLE.value);
    expect(calc).toHaveTextContent(UNAVAILABLE.projection);
  });

  test("the mock scan holds the mock's figures (negative control)", () => {
    expect(MOCK_FIGURES).toEqual(
      expect.arrayContaining([
        "324.93471",
        "332.92643",
        "1.02459",
        "$10,245.90",
        "96.8086",
        "$9,918.91",
        "4.563%",
        "9.5",
        "2.25",
        "$96.06",
        "TII 1⅞ 01/15/36 · 10-Year TIPS, Series A-2036",
        "2026-06-30",
        "Jun 30",
        "June 2026",
      ])
    );
  });

  test("no mock figure and no fixed as-of appear", () => {
    const { container } = renderPage();
    expect(mockFiguresIn(container.innerHTML)).toEqual([]);
    expect(container.innerHTML).not.toContain("2026-06-30");
  });

  test("the calculator intro says the inputs are locked", () => {
    renderPage();
    const calc = screen.getByRole("region", { name: H2S[3] });
    expect(calc).toHaveTextContent(
      "Pre-filled with the January 2036 bond. This preview shows the default result; sign in to change the real yield and inflation."
    );
    expect(calc).not.toHaveTextContent("Change the real yield and your");
    expect(within(calc).getAllByRole("textbox")).toHaveLength(7);
  });

  test("each code card shows its sample file verbatim", () => {
    renderPage();
    for (const [name, file] of [
      ["One bond by CUSIP, TypeScript sample", "tips.ts"],
      ["One bond by CUSIP, Python sample", "tips.py"],
    ]) {
      const source = readFileSync(
        path.resolve("src/lib/free/samples", file),
        "utf8"
      );
      expect(screen.getByLabelText(name).textContent).toBe(source.trimEnd());
    }
  });
});

describe("/free/tips when a live source fails", () => {
  test("price: the worked example and calculator result are unavailable; the security panel renders", () => {
    const data = liveWithout("price", "cpi", "valuation");
    data.asOf = { priceDate: null, cpiMonths: null };
    data.calculator.years = null;
    const { container } = renderPage(data);

    const widget = screen.getByRole("region", { name: H2S[1] });
    expect(securityRows(widget)).toContainEqual(["CUSIP", "91282CPU9"]);
    expect(securityRows(widget)).toContainEqual(["Ref CPI", "Unavailable"]);
    expect(widget).toHaveTextContent("Live price unavailable");

    const example = screen.getByRole("article", { name: H2S[2] });
    expect(example).toHaveTextContent(UNAVAILABLE.price);
    expect(example.querySelector("ol")).toBeNull();

    const calc = screen.getByRole("region", { name: H2S[3] });
    expect(calc).toHaveTextContent(UNAVAILABLE.valuation);
    expect(calc).toHaveTextContent("Real clean price (FedInvest)");
    expect(within(calc).getAllByRole("textbox")).toHaveLength(7);
    expect(mockFiguresIn(container.innerHTML)).toEqual([]);
    expect(container.innerHTML).not.toContain("NaN");
  });

  test("security: the security panel is unavailable", () => {
    const data = liveWithout("security", "price", "cpi", "valuation");
    data.asOf = { priceDate: null, cpiMonths: null };
    const { container } = renderPage(data);
    const widget = screen.getByRole("region", { name: "91282CPU9" });
    expect(widget).toHaveTextContent(UNAVAILABLE.security);
    expect(widget.querySelector("dl")).toBeNull();
    expect(screen.getByRole("article", { name: H2S[2] })).toHaveTextContent(
      UNAVAILABLE.security
    );
    expect(mockFiguresIn(container.innerHTML)).toEqual([]);
  });

  test("CPI-U: the valuation sections are unavailable; security and price render", () => {
    const data = liveWithout("cpi", "valuation");
    data.asOf.cpiMonths = null;
    const { container } = renderPage(data);
    expect(screen.getByRole("article", { name: H2S[2] })).toHaveTextContent(
      UNAVAILABLE.cpi
    );
    const calc = screen.getByRole("region", { name: H2S[3] });
    expect(calc).toHaveTextContent(UNAVAILABLE.valuation);
    expect(calc).toHaveTextContent("Real clean price (FedInvest, 2026-10-23)");
    expect(screen.getByRole("region", { name: H2S[1] })).toHaveTextContent(
      "As of 2026-10-23"
    );
    expect(mockFiguresIn(container.innerHTML)).toEqual([]);
  });

  test("valuation: the valuation sections are unavailable, with no NaN", () => {
    const { container } = renderPage(liveWithout("valuation"));
    expect(screen.getByRole("article", { name: H2S[2] })).toHaveTextContent(
      UNAVAILABLE.valuation
    );
    expect(screen.getByRole("region", { name: H2S[3] })).toHaveTextContent(
      UNAVAILABLE.valuation
    );
    expect(container.innerHTML).not.toContain("NaN");
    expect(mockFiguresIn(container.innerHTML)).toEqual([]);
  });
});
