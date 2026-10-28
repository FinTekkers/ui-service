/**
 * US-297: Data Catalog "By product type" view and measure detail panel.
 * Everything is read from the real @fintekkers/ledger-models catalog and
 * product_hierarchy (no mocks), so a coverage rule or field the package
 * gets wrong fails here.
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { render, screen, fireEvent, within } from "@testing-library/svelte";
import { describe, expect, test } from "vitest";
import fieldsData from "$lib/data/fields.json";
import {
  MEASURES,
  groupCount,
  measureByName,
  productGroups,
  type CatalogMeasure,
} from "$lib/measureCatalog";
import MeasureProductMatrix from "../components/catalog/MeasureProductMatrix.svelte";
import MeasureDetailPanel from "../components/catalog/MeasureDetailPanel.svelte";
import CatalogPage from "../routes/(authenticated)/data/catalog/+page.svelte";

// product_hierarchy node identifier for Government bonds (not its label).
const GOV_BOND_NODE = "GOV_BOND";

const groups = productGroups();
const allNodes = groups.map((g) => g.node);
const allProductTypes = groups.flatMap((g) => g.productTypes);

function renderPage() {
  return render(CatalogPage, { props: { data: { user: null } } });
}

async function openByProductType() {
  await fireEvent.click(
    screen.getByRole("button", { name: /By product type/ })
  );
}

function panel(): HTMLElement {
  return screen.getByRole("complementary", { name: "Measure detail" });
}

function panelHeading(): string {
  return within(panel()).getByRole("heading", { level: 3 }).textContent ?? "";
}

describe("product groups come from product_hierarchy", () => {
  test("Government bonds is a group with product types", () => {
    const gov = groups.find((g) => g.node === GOV_BOND_NODE);
    expect(gov?.productTypes.length).toBeGreaterThan(1);
  });
});

describe("metric 1: applies_to naming a hierarchy node", () => {
  // A node with 2+ product types, so coverage must come through the node.
  const g = groups.find((x) => x.productTypes.length >= 2)!;
  const fixture = {
    name: "FIXTURE_MEASURE",
    display_name: "Fixture measure",
    applies_to: [g.node],
  };

  test("applies_to holds the node, not a product type name", () => {
    expect(g).toBeDefined();
    for (const name of fixture.applies_to) {
      expect(allProductTypes).not.toContain(name);
    }
  });

  test("✓ for every product type under the node, — everywhere else", () => {
    const { container } = render(MeasureProductMatrix, {
      props: { measures: [fixture], initiallyExpanded: allNodes },
    });
    const cells = container.querySelectorAll<HTMLElement>(
      'tr[data-measure="FIXTURE_MEASURE"] td[data-product-type]'
    );
    expect(cells).toHaveLength(allProductTypes.length);
    for (const cell of cells) {
      const pt = cell.dataset.productType!;
      const glyph = cell.querySelector('[aria-hidden="true"]')?.textContent;
      if (g.productTypes.includes(pt)) {
        expect(glyph, pt).toBe("✓");
        expect(cell).toHaveTextContent("Defined");
      } else {
        expect(glyph, pt).toBe("—");
        expect(cell).toHaveTextContent("Excluded");
      }
    }
  });

  test("collapsed: the node reads n/n and every other group 0/total", () => {
    const { container } = render(MeasureProductMatrix, {
      props: { measures: [fixture], initiallyExpanded: [] },
    });
    for (const other of groups) {
      const cell = container.querySelector(
        `tr[data-measure="FIXTURE_MEASURE"] td[data-node="${other.node}"]`
      );
      const n = other.productTypes.length;
      expect(cell?.textContent?.trim(), other.node).toBe(
        other.node === g.node ? `${n}/${n}` : `0/${n}`
      );
    }
  });
});

describe("metric 3: first render of By product type", () => {
  test("Government bonds is expanded, other groups show defined/total", async () => {
    const { container } = renderPage();
    await openByProductType();

    const headers =
      container.querySelectorAll<HTMLButtonElement>("button[data-node]");
    expect(headers).toHaveLength(groups.length);
    for (const h of headers) {
      expect(h, h.dataset.node).toHaveAttribute(
        "aria-expanded",
        h.dataset.node === GOV_BOND_NODE ? "true" : "false"
      );
    }

    const gov = groups.find((g) => g.node === GOV_BOND_NODE)!;
    for (const m of MEASURES) {
      const row = container.querySelector(`tr[data-measure="${m.name}"]`)!;
      expect(row, m.name).not.toBeNull();
      expect(row.querySelectorAll("td[data-product-type]")).toHaveLength(
        gov.productTypes.length
      );
      for (const g of groups) {
        if (g.node === GOV_BOND_NODE) continue;
        const { defined, total } = groupCount(m, g);
        const cell = row.querySelector(`td[data-node="${g.node}"]`);
        expect(cell?.textContent?.trim(), `${m.name} ${g.node}`).toBe(
          `${defined}/${total}`
        );
      }
    }
  });

  test("the legend explains the two cell states", async () => {
    renderPage();
    await openByProductType();
    const legend = screen.getByRole("list", { name: "Legend" });
    expect(within(legend).getAllByRole("listitem")).toHaveLength(2);
    expect(legend).toHaveTextContent("✓ Defined");
    expect(legend).toHaveTextContent("— Excluded");
  });
});

describe("metric 2: depends_on chips", () => {
  test("clicking a chip that names a measure selects it", async () => {
    const { container } = renderPage();
    await openByProductType();

    const mv = measureByName("MARKET_VALUE")!;
    await fireEvent.click(
      screen.getByRole("button", { name: mv.display_name })
    );
    expect(panelHeading()).toContain(mv.display_name);

    const dep = mv.depends_on.find((d) => measureByName(d))!;
    expect(dep).toBeDefined();
    const target = measureByName(dep)!;
    await fireEvent.click(within(panel()).getByRole("button", { name: dep }));

    expect(panelHeading()).toContain(target.display_name);
    expect(container.querySelector(`tr[data-measure="${dep}"]`)).toHaveClass(
      "selected"
    );
    expect(
      container.querySelector('tr[data-measure="MARKET_VALUE"]')
    ).not.toHaveClass("selected");
    expect(
      screen.getByRole("button", { name: target.display_name })
    ).toHaveAttribute("aria-pressed", "true");
  });

  test("a chip that names no measure is inert text", async () => {
    const realDep = MEASURES[0].name;
    const fixture: CatalogMeasure = {
      ...measureByName("MARKET_VALUE")!,
      depends_on: ["NOT_A_CATALOG_MEASURE", realDep],
    };
    const { component } = render(MeasureDetailPanel, {
      props: { measure: fixture },
    });
    const selected: string[] = [];
    component.$on("select", (e: CustomEvent<{ name: string }>) =>
      selected.push(e.detail.name)
    );

    expect(
      screen.queryByRole("button", { name: "NOT_A_CATALOG_MEASURE" })
    ).toBeNull();
    const inert = screen.getByText("NOT_A_CATALOG_MEASURE");
    expect(inert.tagName).not.toBe("BUTTON");
    await fireEvent.click(inert);
    expect(selected).toEqual([]);
    expect(panelHeading()).toContain(fixture.display_name);

    await fireEvent.click(screen.getByRole("button", { name: realDep }));
    expect(selected).toEqual([realDep]);
  });
});

describe("metric 5: the MARKET_VALUE detail panel", () => {
  test("renders every listed field from the catalog", () => {
    const mv = measureByName("MARKET_VALUE")!;
    render(MeasureDetailPanel, { props: { measure: mv } });
    const p = panel();
    expect(panelHeading()).toContain(mv.display_name);
    expect(p).toHaveTextContent(mv.name);
    expect(p).toHaveTextContent(mv.description);
    expect(p).toHaveTextContent(new RegExp(mv.category, "i"));
    expect(p).toHaveTextContent(mv.units!);
    expect(p).toHaveTextContent(mv.formula!);
    for (const a of mv.model_assumptions) expect(p).toHaveTextContent(a);
    expect(p).toHaveTextContent(mv.computed_by!);
    for (const d of mv.depends_on) expect(p).toHaveTextContent(d);
    expect(within(p).queryByText("Planned")).toBeNull();
  });

  test("shows Planned for an implemented: false measure", () => {
    const planned = MEASURES.find((m) => !m.implemented)!;
    expect(planned).toBeDefined();
    render(MeasureDetailPanel, { props: { measure: planned } });
    expect(within(panel()).getByText("Planned")).toBeInTheDocument();
  });

  test("with no measure picked, the panel shows a prompt", () => {
    render(MeasureDetailPanel, { props: { measure: null } });
    expect(panel()).toHaveTextContent("Select a measure to see its details.");
  });
});

describe("guardrail: List view and Fields tab unchanged", () => {
  test("opens on List, with the measure count from the package catalog", () => {
    const { container } = renderPage();
    expect(screen.getByRole("button", { name: "List" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    expect(
      screen.getByRole("button", { name: `Measures (${MEASURES.length})` })
    ).toBeInTheDocument();
    expect(container.querySelector("button[data-node]")).toBeNull();
  });

  test("a List row still expands to its formula", async () => {
    const { container } = renderPage();
    const mv = measureByName("MARKET_VALUE")!;
    const row = screen.getByText(mv.display_name).closest("tr")!;
    await fireEvent.click(row);
    const detail = container.querySelector(".detail-row");
    expect(detail).toHaveTextContent(mv.formula!);
  });

  test("the Fields tab lists the fields.json rows", async () => {
    renderPage();
    await fireEvent.click(screen.getByRole("button", { name: /^Fields/ }));
    for (const f of fieldsData.fields.filter(
      (x) => x.category !== "sentinel"
    )) {
      expect(screen.getAllByText(f.display_name).length).toBeGreaterThan(0);
    }
    expect(
      screen.queryByRole("button", { name: /By product type/ })
    ).toBeNull();
  });
});

describe("guardrail: the catalog comes from @fintekkers/ledger-models", () => {
  test("nothing under src/ imports a vendored measures.json", () => {
    // Built from fragments so this file does not match its own grep.
    const vendored = "lib/data/" + "measures" + "\\.json";
    const result = spawnSync("git", ["grep", "-nE", vendored, "--", "src"], {
      encoding: "utf8",
    });
    expect(result.status, result.stdout).toBe(1);
    expect(existsSync("src/lib/data/" + "measures.json")).toBe(false);
  });

  test("ledger-models is a >= minimum that the lockfile satisfies", () => {
    const pkg = JSON.parse(readFileSync("package.json", "utf8"));
    const lock = JSON.parse(readFileSync("package-lock.json", "utf8"));
    const range: string = pkg.dependencies["@fintekkers/ledger-models"];
    expect(range).toMatch(/^>=\d+\.\d+\.\d+$/);
    expect(lock.packages[""].dependencies["@fintekkers/ledger-models"]).toBe(
      range
    );

    const locked: string =
      lock.packages["node_modules/@fintekkers/ledger-models"].version;
    const parts = (v: string) => v.split(".").map(Number);
    const [min, have] = [parts(range.slice(2)), parts(locked)];
    const cmp = have[0] - min[0] || have[1] - min[1] || have[2] - min[2];
    expect(cmp, `${locked} vs ${range}`).toBeGreaterThanOrEqual(0);
  });
});
