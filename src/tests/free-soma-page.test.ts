/**
 * US-252: /free/soma renders the 7 DataExplorer.dc.html sections from the
 * mock in src/lib/free/mock/soma.ts, and its load reads that mock only.
 * US-305: SOMA is Treasury holdings only; the mock, type, route and these
 * tests carry no data on the excluded securities beyond the total label and
 * the exclusion note.
 */
import { render, screen, within } from "@testing-library/svelte";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, test } from "vitest";
import { soma } from "$lib/free/mock/soma";
import SomaPage from "../routes/free/soma/+page.svelte";
import { load } from "../routes/free/soma/+page";

const ROUTE = "src/routes/free/soma";

// The item's H.4.1 Table 2 buckets, $ millions, as of 2026-10-14.
const TSY_BUCKETS = [106926, 390845, 529071, 1436242, 482152, 1625316];

// The only wording on the excluded securities allowed (US-305 metric 1),
// each one whole literal.
const TOTAL_LABEL = "Total held outright, excluding MBS";
const NOTE = "Excludes SOMA's mortgage-backed securities (MBS).";
// Bracketed so the pattern does not match its own source line.
const EXCLUDED_WORDS = /m[b]s|mor[t]gage/i;

// The Treasury and agency rows as on main before US-305.
const ROWS = [
  { label: "Treasury bills", current: 566.0, prior: 196.0, change: 370.0 },
  {
    label: "Notes & bonds, nominal",
    current: 3618.0,
    prior: 3579.0,
    change: 39.0,
  },
  { label: "TIPS principal", current: 280.0, prior: 310.2, change: -30.2 },
  {
    label: "Inflation compensation",
    current: 106.6,
    prior: 112.2,
    change: -5.6,
  },
  { label: "Agency debt", current: 2.3, prior: 2.3, change: 0.0 },
];
const MATURITY_LABELS = [
  "Within 15 days",
  "16–90 days",
  "91 days–1 yr",
  "1–5 yrs",
  "5–10 yrs",
  "Over 10 yrs",
];

// Each composition slice and the table rows it sums (the artboard's rule:
// a slice is its rows' share of Total held outright; agency debt is not
// sliced).
const SLICE_ROWS: Record<string, string[]> = {
  "Notes & bonds": ["Notes & bonds, nominal"],
  Bills: ["Treasury bills"],
  "TIPS incl. inflation comp.": ["TIPS principal", "Inflation compensation"],
};

function withoutAllowed(text: string): string {
  return text.split(TOTAL_LABEL).join("").split(NOTE).join("");
}

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
    expect(snapshot).toHaveTextContent("$4.57T");
    expect(snapshot).toHaveTextContent("+$373.1B vs a year ago");
    expect(snapshot).toHaveTextContent("As of 2026-10-14");

    const total = within(snapshot)
      .getByRole("cell", { name: TOTAL_LABEL })
      .closest("tr") as HTMLElement;
    expect(
      within(total)
        .getAllByRole("cell")
        .map((cell) => cell.textContent)
    ).toEqual([TOTAL_LABEL, "4,572.9", "4,199.8", "+373.1"]);

    // The stored change, with a U+2212 minus.
    const tips = within(snapshot)
      .getByRole("cell", { name: "TIPS principal" })
      .closest("tr") as HTMLElement;
    expect(within(tips).getAllByRole("cell")[3]).toHaveTextContent("−30.2");
  });

  test("the growth finding uses the new totals; no runoff card", () => {
    renderPage();
    const findings = screen
      .getByRole("heading", {
        level: 2,
        name: "What the portfolio is telling us",
      })
      .closest("article") as HTMLElement;
    const card = within(findings).getByRole("heading", {
      level: 3,
      name: "The portfolio is growing again",
    }).parentElement as HTMLElement;
    expect(card).toHaveTextContent("+$373.1B");
    expect(card).toHaveTextContent("from $4.20T to $4.57T");
    expect(
      within(findings).queryByRole("heading", {
        name: "Mor" + "tgages keep running off",
      })
    ).toBeNull();
    expect(within(findings).getAllByRole("heading", { level: 3 })).toHaveLength(
      3
    );
  });

  test("the scope note shows once, inside the headline", () => {
    const { container } = renderPage();
    const count = (text: string) => text.split(NOTE).length - 1;
    const labels = [...container.querySelectorAll("[aria-label]")].map(
      (el) => el.getAttribute("aria-label") ?? ""
    );
    expect(
      count(document.body.textContent ?? "") +
        labels.reduce((n, label) => n + count(label), 0)
    ).toBe(1);
    const note = screen.getByText(NOTE);
    expect(note.closest(".headline")).not.toBeNull();
    expect(note.closest("section")?.getAttribute("aria-labelledby")).toBe(
      "snap-title"
    );
  });

  test("the composition has the 3 Treasury slices, each its rows' share of the total", () => {
    expect(soma.composition.map((slice) => slice.label)).toEqual(
      Object.keys(SLICE_ROWS)
    );
    const current = new Map(
      soma.table.rows.map((row) => [row.label, row.current])
    );
    for (const slice of soma.composition) {
      const rows = SLICE_ROWS[slice.label];
      const sum = rows.reduce((total, label) => {
        expect(current.has(label)).toBe(true);
        return total + (current.get(label) as number);
      }, 0);
      expect(slice.pct.toFixed(1)).toBe(
        ((sum / soma.table.total.current) * 100).toFixed(1)
      );
    }
    renderPage();
    expect(
      screen.getByRole("img", { name: /^Composition: / })
    ).toHaveAccessibleName(
      "Composition: notes and bonds 79.1%, bills 12.4%, TIPS including inflation compensation 8.5%"
    );
  });

  test("the Treasury and agency rows and maturity labels are unchanged", () => {
    expect(soma.table.rows).toEqual(ROWS);
    expect(soma.maturity.labels).toEqual(MATURITY_LABELS);
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
  });

  test("stored tsy shares are each bucket's share of the total", () => {
    const buckets = soma.maturity.tsy.buckets;
    const values = buckets.map((b) => b.valueM);
    const total = values.reduce((a, b) => a + b, 0);
    for (const b of buckets) {
      expect(b.sharePct.toFixed(1)).toBe(((b.valueM / total) * 100).toFixed(1));
    }
  });

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

  test("the maturity section shows Treasuries only, with no toggle", () => {
    renderPage();
    const maturity = screen.getByRole("region", {
      name: "When the holdings come due",
    });
    expect(
      within(maturity).queryByRole("group", { name: "Asset type" })
    ).toBeNull();
    expect(within(maturity).queryAllByRole("button")).toHaveLength(0);
    expect(Object.keys(soma.maturity)).toEqual(["labels", "tsy"]);
    expect(maturity.querySelectorAll(".bucket")).toHaveLength(
      TSY_BUCKETS.length
    );
  });

  test("no excluded-securities data in the mock, its type, the route or its tests", () => {
    const files = [
      "src/lib/free/mock/soma.ts",
      "src/tests/free-soma-page.test.ts",
      "tests/e2e/free-pages.spec.ts",
    ];
    for (const dir of ["src/routes/free/soma", "src/components/free/soma"]) {
      const entries = readdirSync(path.resolve(dir));
      expect(entries.length).toBeGreaterThan(0);
      files.push(...entries.map((entry) => `${dir}/${entry}`));
    }
    const sources = files.map((file) => {
      expect(existsSync(path.resolve(file))).toBe(true);
      return [file, readFileSync(path.resolve(file), "utf8")];
    });

    const types = readFileSync(
      path.resolve("src/lib/free/mock/types.ts"),
      "utf8"
    );
    const block =
      types.match(/^export interface SomaResponse \{[\s\S]*?^\}/m)?.[0] ?? "";
    expect(block).toContain("headline");
    expect(block).toContain("maturity");
    sources.push(["SomaResponse", block]);

    // The allowed strings are really there, once each in the mock.
    const mock = sources[0][1];
    expect(mock.split(TOTAL_LABEL)).toHaveLength(2);
    expect(mock.split(NOTE)).toHaveLength(2);

    for (const [file, source] of sources) {
      expect({
        file,
        hit: withoutAllowed(source).match(EXCLUDED_WORDS)?.[0],
      }).toEqual({ file, hit: undefined });
    }

    // Negative control: a stray excluded word is caught.
    expect(withoutAllowed("M" + "BS paydowns")).toMatch(EXCLUDED_WORDS);
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
