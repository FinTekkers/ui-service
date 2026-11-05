/**
 * US-252: /free/soma renders the 7 DataExplorer.dc.html sections.
 * US-305: SOMA is Treasury holdings only.
 * US-307: the snapshot, findings and maturity profile are the ledger's SOMA
 * Treasury holdings, summed and bucketed by the server load
 * (src/lib/server/free-soma.ts) from the 2026-10-14 fixture rows. The only
 * wording on the excluded securities is the total label and the scope note.
 */
import { render, screen, within } from "@testing-library/svelte";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, test } from "vitest";
import Decimal from "decimal.js";
import {
  SOMA_BUCKET_LABELS,
  SOMA_SCOPE_NOTE,
  SOMA_TOTAL_LABEL,
  type SomaPageData,
} from "$lib/free/soma";
import { bucketOf, somaRowsToView, type SomaRow } from "$lib/server/free-soma";
import SomaPage from "../routes/free/soma/+page.svelte";
import FreePage from "../routes/free/+page.svelte";
import {
  AS_OF,
  OUT_OF_SCOPE_ROWS,
  PRIOR_ROWS,
  PUBLISHED_BUCKETS_M,
  PUBLISHED_TOTAL_M,
  ROWS,
} from "./fixtures/soma-2026-10-14";

const WEEK = "Oct 14, 2026";
// Bracketed so the pattern does not match its own source line.
const EXCLUDED_WORDS = /m[b]s|mor[t]gage|a[g]ency/i;

const H2S = [
  "What is the Federal Reserve SOMA?",
  "Federal Reserve SOMA Holdings",
  "What the portfolio is telling us",
  "When the holdings come due",
  "Holdings over time",
  "Positions by CUSIP",
  "Pull SOMA data from the API",
];

function pageData(
  rows: SomaRow[] | null = ROWS,
  prior: SomaRow[] | null = PRIOR_ROWS
): SomaPageData {
  return {
    asOf: AS_OF,
    asOfLabel: WEEK,
    today: "2026-11-05",
    ...somaRowsToView(rows, AS_OF, prior),
  };
}

/** Renders /free/soma's or /free's page; /free's data adds the dataset id. */
function renderRoute(
  Page: typeof SomaPage | typeof FreePage,
  data: SomaPageData
) {
  return render(Page as unknown as typeof FreePage, {
    props: { data: { ...data, dataset: "soma" } },
  });
}

function renderPage(data: SomaPageData = pageData()) {
  return render(SomaPage, { props: { data } });
}

function withoutAllowed(text: string): string {
  return text.split(SOMA_TOTAL_LABEL).join("").split(SOMA_SCOPE_NOTE).join("");
}

const millions = (dollars: string) =>
  new Decimal(dollars).dividedBy(1e6).toNumber();

describe("/free/soma page", () => {
  test("renders the 7 artboard h2 headings in order", () => {
    renderPage();
    expect(
      screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent)
    ).toEqual(H2S);
  });

  test("metric 3: the bills share renders 12.4% on the 2026-10-14 fixture", () => {
    renderPage();
    const snapshot = screen.getByRole("region", {
      name: "Federal Reserve SOMA Holdings",
    });
    expect(
      within(snapshot).getByRole("img", { name: /^Composition: / })
    ).toHaveAccessibleName(
      "Composition: notes and bonds 79.2%, bills 12.4%, TIPS including inflation compensation 8.5%"
    );
    expect(snapshot).toHaveTextContent("Bills 12.4%");
  });

  test("metric 3: the six buckets sum to the Treasury total, which matches the published H.4.1, within $1M", () => {
    const view = pageData().maturity;
    if (!view.ok) throw new Error(view.message);
    const buckets = view.data.buckets.map((b) => b.valueM);
    expect(buckets).toHaveLength(6);
    const sum = buckets.reduce((a, b) => a + b, 0);
    expect(Math.abs(sum - view.data.totalM)).toBeLessThanOrEqual(1);
    expect(Math.abs(view.data.totalM - PUBLISHED_TOTAL_M)).toBeLessThanOrEqual(
      1
    );
    buckets.forEach((b, i) =>
      expect(Math.abs(b - PUBLISHED_BUCKETS_M[i])).toBeLessThanOrEqual(1)
    );
  });

  test("metric 3: a TIPS bucket is DIRECTED_QUANTITY plus INFLATION_COMPENSATION of its rows", () => {
    const tips = ROWS.filter((r) => r.productType === "TIPS");
    const view = somaRowsToView(tips, AS_OF, null).maturity;
    if (!view.ok) throw new Error(view.message);
    // Oracle: the raw fixture rows maturing over 1 to 5 years after the
    // week, summed here, not by the module.
    const oneToFive = tips.filter(
      (r) =>
        (r.maturityDate as string) > "2027-10-14" &&
        (r.maturityDate as string) <= "2031-10-14"
    );
    expect(oneToFive.length).toBeGreaterThan(0);
    const expected = oneToFive.reduce(
      (sum, r) =>
        sum +
        millions(r.directedQuantity as string) +
        millions(r.inflationCompensation as string),
      0
    );
    expect(view.data.buckets[3].valueM).toBe(expected);
    const faceOnly = oneToFive.reduce(
      (sum, r) => sum + millions(r.directedQuantity as string),
      0
    );
    expect(view.data.buckets[3].valueM).not.toBe(faceOnly);
  });

  test("the snapshot shows the live headline and table, naming the week", () => {
    renderPage();
    const snapshot = screen.getByRole("region", {
      name: "Federal Reserve SOMA Holdings",
    });
    expect(snapshot).toHaveTextContent("$4.57T");
    expect(snapshot).toHaveTextContent("+$373.2B vs a year ago");
    expect(snapshot).toHaveTextContent(`As of ${WEEK}`);
    expect(
      within(snapshot)
        .getAllByRole("columnheader")
        .map((th) => th.textContent)
    ).toEqual(["$ billions", WEEK, "Oct 15, 2025", "Change"]);

    const total = within(snapshot)
      .getByRole("cell", { name: SOMA_TOTAL_LABEL })
      .closest("tr") as HTMLElement;
    expect(
      within(total)
        .getAllByRole("cell")
        .map((cell) => cell.textContent)
    ).toEqual([SOMA_TOTAL_LABEL, "4,570.6", "4,197.4", "+373.2"]);

    // A U+2212 minus on a fall.
    const tips = within(snapshot)
      .getByRole("cell", { name: "TIPS principal" })
      .closest("tr") as HTMLElement;
    expect(within(tips).getAllByRole("cell")[3]).toHaveTextContent("−30.2");
  });

  test("without the year-ago week, the prior column shows — and the year-ago cards are left out", () => {
    renderPage(pageData(ROWS, null));
    const snapshot = screen.getByRole("region", {
      name: "Federal Reserve SOMA Holdings",
    });
    expect(snapshot).toHaveTextContent("$4.57T");
    expect(snapshot).not.toHaveTextContent("vs a year ago");
    const total = within(snapshot)
      .getByRole("cell", { name: SOMA_TOTAL_LABEL })
      .closest("tr") as HTMLElement;
    expect(
      within(total)
        .getAllByRole("cell")
        .map((cell) => cell.textContent)
    ).toEqual([SOMA_TOTAL_LABEL, "4,570.6", "—", "—"]);
    expect(
      screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent)
    ).toEqual(["A large TIPS holder"]);
  });

  test("the findings come from the ledger rows and name the week", () => {
    renderPage();
    const findings = screen
      .getByRole("heading", {
        level: 2,
        name: "What the portfolio is telling us",
      })
      .closest("article") as HTMLElement;
    expect(findings).toHaveTextContent(`As of ${WEEK}`);
    const cards = within(findings)
      .getAllByRole("heading", { level: 3 })
      .map((h) => h.parentElement as HTMLElement);
    expect(cards.map((c) => c.querySelector(".figure")?.textContent)).toEqual([
      "+$373.2B",
      "2.9×",
      "$386.6B",
    ]);
    expect(cards[0]).toHaveTextContent("from $4.20T to $4.57T");
    expect(cards[1]).toHaveTextContent("From $196.0B to $566.0B.");
    const link = within(findings).getByRole("link", {
      name: "See how TIPS work",
    });
    expect(link).toHaveAttribute("href", "/free/tips");
    expect(link.parentElement?.textContent).toBe(
      "$280.0B of TIPS principal plus $106.6B of accrued inflation compensation. See how TIPS work"
    );
  });

  test("the maturity bars render the live shares and name the week", () => {
    const { container } = renderPage();
    const maturity = screen.getByRole("region", {
      name: "When the holdings come due",
    });
    const view = pageData().maturity;
    if (!view.ok) throw new Error(view.message);
    const fills = [...container.querySelectorAll<HTMLElement>(".fill")];
    expect(fills.map((fill) => fill.style.width)).toEqual(
      view.data.buckets.map((b) => `${b.sharePct}%`)
    );
    expect(
      [...maturity.querySelectorAll(".label")].map((l) => l.textContent)
    ).toEqual([...SOMA_BUCKET_LABELS]);
    expect(maturity).toHaveTextContent("$1,625.3B · 35.6%");
    expect(maturity).toHaveTextContent(
      "About $1.03T, or 22%, matures within a year."
    );
    expect(maturity).toHaveTextContent(`as of ${WEEK}`);
    expect(
      within(maturity).queryByRole("group", { name: "Asset type" })
    ).toBeNull();
    expect(within(maturity).queryAllByRole("button")).toHaveLength(0);
  });

  test("guardrail 2: a TIPS row with no INFLATION_COMPENSATION makes the sections unavailable, never face alone", () => {
    const rows = ROWS.map((r) =>
      r.maturityDate === "2029-01-15"
        ? { ...r, inflationCompensation: null }
        : r
    );
    const data = pageData(rows);
    expect(data.snapshot.ok).toBe(false);
    expect(data.findings.ok).toBe(false);
    expect(data.maturity.ok).toBe(false);
    const { container } = renderPage(data);
    expect(container.querySelectorAll(".fill")).toHaveLength(0);
    expect(container.textContent).not.toMatch(/\$[\d,.]+[BT]/);
    expect(container.textContent).toContain(`Unavailable for ${WEEK}`);
  });

  test("guardrail 3: out-of-scope rows are left out of totals, shares, buckets and text", () => {
    const withExtra = pageData(
      [...ROWS, ...OUT_OF_SCOPE_ROWS],
      [...PRIOR_ROWS, ...OUT_OF_SCOPE_ROWS]
    );
    expect(withExtra).toEqual(pageData());
    const { container } = renderPage(withExtra);
    expect(withoutAllowed(container.innerHTML)).not.toMatch(EXCLUDED_WORDS);
  });

  test("metric 5: /free/soma and /free show no excluded-securities text or toggle; the headline states the exclusion", () => {
    for (const Page of [SomaPage, FreePage]) {
      const { container, unmount } = renderRoute(Page, pageData());
      const html = container.innerHTML;
      expect(html).toContain(SOMA_SCOPE_NOTE);
      // Negative control: the scan sees the allowed note before stripping.
      expect(html).toMatch(EXCLUDED_WORDS);
      expect(withoutAllowed(html)).not.toMatch(EXCLUDED_WORDS);
      expect(
        within(container).queryByRole("group", { name: "Asset type" })
      ).toBeNull();
      const note = within(container).getByText(SOMA_SCOPE_NOTE);
      expect(note.closest(".headline")).not.toBeNull();
      expect(note.closest("section")?.getAttribute("aria-labelledby")).toBe(
        "snap-title"
      );
      expect(html.split(SOMA_SCOPE_NOTE)).toHaveLength(2);
      unmount();
    }
  });

  test("metric 5: no excluded-securities wording in the SOMA routes, components or modules", () => {
    const files = [
      "src/lib/free/soma.ts",
      "src/lib/server/free-soma.ts",
      "src/routes/free/+page.server.ts",
      "src/routes/free/+page.svelte",
    ];
    for (const dir of ["src/routes/free/soma", "src/components/free/soma"]) {
      const entries = readdirSync(path.resolve(dir));
      expect(entries.length).toBeGreaterThan(0);
      files.push(...entries.map((entry) => `${dir}/${entry}`));
    }
    for (const file of files) {
      expect(existsSync(path.resolve(file))).toBe(true);
      const source = readFileSync(path.resolve(file), "utf8");
      expect({
        file,
        hit: withoutAllowed(source).match(EXCLUDED_WORDS)?.[0],
      }).toEqual({ file, hit: undefined });
    }
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
});

describe("bucketOf: H.4.1 Table 2 edges, from MATURITY_DATE and the week", () => {
  test.each([
    ["2026-10-14", 0],
    ["2026-10-29", 0], // 15 days
    ["2026-10-30", 1], // 16 days
    ["2027-01-12", 1], // 90 days
    ["2027-01-13", 2], // 91 days
    ["2027-10-14", 2], // 1 year
    ["2027-10-15", 3], // 1 year and a day
    ["2031-10-14", 3], // 5 years
    ["2031-10-15", 4],
    ["2036-10-14", 4], // 10 years
    ["2036-10-15", 5],
  ])("matures %s → bucket %i", (maturity, bucket) => {
    expect(bucketOf(maturity, AS_OF)).toBe(bucket);
  });

  test("the same row moves bucket with the selected week", () => {
    expect(bucketOf("2026-11-20", "2026-10-14")).toBe(1);
    expect(bucketOf("2026-11-20", "2026-11-11")).toBe(0);
  });
});
