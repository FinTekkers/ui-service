/**
 * US-252: /free/soma renders the 7 DataExplorer.dc.html sections from the
 * mock in src/lib/free/mock/soma.ts, and its load reads that mock only.
 */
import { render, screen, within } from "@testing-library/svelte";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, test } from "vitest";
import { soma } from "$lib/free/mock/soma";
import SomaPage from "../routes/free/soma/+page.svelte";
import { load } from "../routes/free/soma/+page";

const ROUTE = "src/routes/free/soma";

// The item's H.4.1 Table 2 buckets, $ millions, as of 2026-10-14.
const TSY_BUCKETS = [106926, 390845, 529071, 1436242, 482152, 1625316];
const MBS_BUCKETS = [0, 8, 163, 5093, 113674, 1779222];

const H2S = [
  "What is the Federal Reserve SOMA?",
  "Federal Reserve SOMA Holdings",
  "What the portfolio is telling us",
  "When the holdings come due",
  "Holdings over time",
  "Positions by CUSIP",
  "Pull SOMA data from the API",
];

function renderPage() {
  return render(SomaPage, { props: { data: soma } });
}

describe("/free/soma page", () => {
  test("load returns the soma mock", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(load({} as any)).toBe(soma);
  });

  test("renders the 7 artboard h2 headings in order", () => {
    renderPage();
    expect(
      screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent)
    ).toEqual(H2S);
  });

  test("the snapshot shows the headline and the total row", () => {
    renderPage();
    const snapshot = screen.getByRole("region", {
      name: "Federal Reserve SOMA Holdings",
    });
    expect(snapshot).toHaveTextContent("$6.47T");
    expect(snapshot).toHaveTextContent("+$185.3B vs a year ago");
    expect(snapshot).toHaveTextContent("As of 2026-10-14");

    const total = within(snapshot)
      .getByRole("cell", { name: "Total held outright" })
      .closest("tr") as HTMLElement;
    expect(
      within(total)
        .getAllByRole("cell")
        .map((cell) => cell.textContent)
    ).toEqual(["Total held outright", "6,471.1", "6,285.8", "+185.3"]);

    // The stored change, with a U+2212 minus, not 1898.2 − 2086.0.
    const mbs = within(snapshot)
      .getByRole("cell", { name: "Mortgage-backed securities" })
      .closest("tr") as HTMLElement;
    expect(within(mbs).getAllByRole("cell")[3]).toHaveTextContent("−187.9");
  });

  test("the TIPS finding links to /free/tips after its sentence", () => {
    renderPage();
    const link = screen.getByRole("link", { name: "See how TIPS work" });
    expect(link).toHaveAttribute("href", "/free/tips");
    expect(link.parentElement?.textContent).toBe(
      "$280.0B of TIPS principal plus $106.6B of accrued inflation compensation. See how TIPS work"
    );
  });

  test("soma.ts holds the item's maturity buckets exactly", () => {
    expect(soma.asOf).toBe("2026-10-14");
    expect(soma.maturity.tsy.buckets.map((b) => b.valueM)).toEqual(TSY_BUCKETS);
    expect(soma.maturity.mbs.buckets.map((b) => b.valueM)).toEqual(MBS_BUCKETS);
  });

  test.each(["tsy", "mbs"] as const)(
    "stored %s shares are each bucket's share of the total",
    (view) => {
      const buckets = soma.maturity[view].buckets;
      const values = buckets.map((b) => b.valueM);
      const total = values.reduce((a, b) => a + b, 0);
      for (const b of buckets) {
        expect(b.sharePct.toFixed(1)).toBe(
          ((b.valueM / total) * 100).toFixed(1)
        );
      }
    }
  );

  test("the maturity bars render the stored widths and labels", () => {
    const { container } = renderPage();
    const fills = [...container.querySelectorAll<HTMLElement>(".fill")];
    expect(fills.map((fill) => fill.style.width)).toEqual(
      soma.maturity.tsy.buckets.map((b) => `${b.sharePct}%`)
    );
    const maturity = screen.getByRole("region", {
      name: "When the holdings come due",
    });
    expect(maturity).toHaveTextContent("$1,625.3B · 35.6%");
    expect(maturity).toHaveTextContent(soma.maturity.tsy.note);
  });

  test("each code card shows its sample file verbatim", () => {
    renderPage();
    for (const [name, file] of [
      ["Find the portfolio, TypeScript sample", "soma.ts"],
      ["Find the portfolio, Python sample", "soma.py"],
    ]) {
      const source = readFileSync(
        path.resolve("src/lib/free/samples", file),
        "utf8"
      );
      expect(screen.getByLabelText(name).textContent).toBe(source.trimEnd());
    }
  });

  test("the route is mock-only: no server load, +page.ts imports the mock", () => {
    expect(existsSync(path.resolve(ROUTE, "+page.server.ts"))).toBe(false);
    expect(existsSync(path.resolve(ROUTE, "+page.server.js"))).toBe(false);
    const source = readFileSync(path.resolve(ROUTE, "+page.ts"), "utf8");
    const imports = [
      ...source.matchAll(/^import\s+(type\s+)?[^;]*?from\s*"([^"]+)"/gm),
    ];
    expect(imports.length).toBeGreaterThan(0);
    for (const [, typeOnly, specifier] of imports) {
      if (typeOnly && specifier === "./$types") continue;
      expect(specifier).toMatch(/^\$lib\/free\/mock\//);
    }
  });
});
