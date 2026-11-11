/**
 * US-309: /free/soma's Positions by CUSIP, on the broker's Position/Search
 * responses for the week of 2026-11-04, recorded in one run
 * (fixtures/soma-2026-11-04.ts): one row per Treasury CUSIP held, par
 * descending, each par equal to soma.prove_positions' ledger par; weights
 * that sum to 100%; and the other sections' figures unchanged from the
 * search before US-309. Then search and paging in SomaPositions, and the
 * rows it never shows: no CUSIP, a non-CUSIP identifier, a repeated CUSIP.
 */
import { fireEvent, render, screen, within } from "@testing-library/svelte";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import Decimal from "decimal.js";
import { IdentifierTypeProto } from "@fintekkers/ledger-models/node/fintekkers/models/security/identifier/identifier_type_pb.js";
import {
  SOMA_PAGE_SIZE,
  filterPositions,
  pageOf,
  showingLabel,
  type SomaPosition,
  type SomaPositionsView,
} from "$lib/free/soma";
import {
  somaPositions,
  somaRowOf,
  somaRowsToView,
  somaTotals,
  type SomaRow,
} from "$lib/server/free-soma";
import SomaPositions from "../components/free/soma/SomaPositions.svelte";
import {
  AS_OF,
  COARSE_ROWS,
  FINE_ROWS,
  LEDGER_PAR,
  PRIOR_ROWS,
  VIEW_BEFORE,
} from "./fixtures/soma-2026-11-04";
import {
  ROWS as SYNTHETIC_ROWS,
  identifierEntry,
  positionOf,
} from "./fixtures/soma-2026-10-14";

const TREASURY = new Set([
  "TBILL",
  "TREASURY_NOTE",
  "TREASURY_BOND",
  "TREASURY_FRN",
  "STRIPS",
  "TIPS",
]);

beforeEach(() => {
  vi.spyOn(console, "log").mockImplementation(() => undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

const VIEW = somaPositions(FINE_ROWS) as SomaPositionsView;
const ROWS = VIEW.rows;

const sum = (values: string[]) =>
  values.reduce((s, v) => s.plus(v), new Decimal(0));

const treasuryPar = (rows: SomaRow[]) =>
  sum(
    rows
      .filter((r) => TREASURY.has(r.productType))
      .map((r) => r.directedQuantity ?? "0")
  );

describe("Positions by CUSIP on the recorded 2026-11-04 week", () => {
  test("metric 1: all 434 CUSIPs, each with soma.prove_positions' par, par descending then CUSIP", () => {
    expect(ROWS).toHaveLength(434);
    expect(Object.keys(LEDGER_PAR)).toHaveLength(434);
    expect(ROWS.map((r) => r.cusip).sort()).toEqual(
      Object.keys(LEDGER_PAR).sort()
    );
    for (const row of ROWS) {
      expect(row.par, row.cusip).toBe(LEDGER_PAR[row.cusip]);
      expect(row.cusip).toMatch(/^[0-9A-Z]{9}$/);
      expect(["Bill", "Note", "Bond", "TIPS", "FRN"]).toContain(row.type);
      expect(row.maturity).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
    for (let i = 1; i < ROWS.length; i++) {
      const [a, b] = [new Decimal(ROWS[i - 1].par), new Decimal(ROWS[i].par)];
      expect(a.greaterThanOrEqualTo(b), `${i}`).toBe(true);
      if (a.equals(b)) expect(ROWS[i - 1].cusip < ROWS[i].cusip).toBe(true);
    }
  });

  test("metric 1: equal par sorts by CUSIP ascending", () => {
    const tied = (cusip: string): SomaRow => ({
      cusip,
      productType: "TBILL",
      maturityDate: "2027-01-01",
      directedQuantity: "1000",
      inflationCompensation: null,
    });
    const rows = somaPositions([tied("912797ZZ9"), tied("912797AA1")]);
    expect(rows?.rows.map((r) => r.cusip)).toEqual(["912797AA1", "912797ZZ9"]);
  });

  test("metric 2: the coarse and fine searches saw the same ledger", () => {
    expect(treasuryPar(FINE_ROWS).toFixed()).toBe(
      treasuryPar(COARSE_ROWS).toFixed()
    );
  });

  test("metric 2: snapshot, findings and maturity equal the view before US-309", () => {
    const view = somaRowsToView(FINE_ROWS, AS_OF, PRIOR_ROWS);
    expect(view.snapshot).toEqual(VIEW_BEFORE.snapshot);
    expect(view.findings).toEqual(VIEW_BEFORE.findings);
    expect(view.maturity).toEqual(VIEW_BEFORE.maturity);
    expect(view.positions).toEqual({ ok: true, data: VIEW });
  });

  test("metric 2: the shown weights sum to 100%, and par is the total less inflation compensation", () => {
    const weights = ROWS.reduce((s, r) => s + r.weightPct, 0);
    expect(Math.abs(weights - 100)).toBeLessThanOrEqual(0.1);

    const t = somaTotals(FINE_ROWS, AS_OF);
    const tablePar = sum(ROWS.map((r) => r.par));
    expect(tablePar.toFixed()).toBe(
      t?.total.minus(t.inflationCompensation).toFixed()
    );
    expect(tablePar.toFixed()).toBe("4471748294200");

    // The same in the snapshot's $ billions, to its rounding.
    const snapshot = somaRowsToView(FINE_ROWS, AS_OF, null).snapshot;
    if (!snapshot.ok) throw new Error(snapshot.message);
    const ic = snapshot.data.rows.find(
      (r) => r.label === "Inflation compensation"
    );
    expect(
      Math.abs(
        snapshot.data.totalRow.current -
          (ic?.current ?? NaN) -
          tablePar.dividedBy(1e9).toNumber()
      )
    ).toBeLessThanOrEqual(0.1);
  });
});

describe("guardrail 4: rows Positions by CUSIP can't show", () => {
  const usable = SYNTHETIC_ROWS.map((r, i) => ({
    ...r,
    cusip: `91282C${String(i).padStart(3, "0")}`,
  }));

  test.each([
    ["no CUSIP", { cusip: null }],
    ["no maturity", { maturityDate: null }],
    ["no quantity", { directedQuantity: null }],
    ["a CUSIP twice", { cusip: "91282C001" }],
  ])("%s makes the section unavailable, never a patched row", (_, change) => {
    const rows = usable.map((r, i) => (i === 0 ? { ...r, ...change } : r));
    expect(somaPositions(rows)).toBeNull();
    const view = somaRowsToView(rows, "2026-10-14", null);
    expect(view.positions).toEqual({
      ok: false,
      message:
        "Unavailable for Oct 14, 2026: the live SOMA holdings could not be loaded.",
    });
  });

  test("a row with no CUSIP leaves the other sections live", () => {
    const rows = usable.map((r, i) => (i === 0 ? { ...r, cusip: null } : r));
    const view = somaRowsToView(rows, "2026-10-14", null);
    expect([view.snapshot.ok, view.findings.ok, view.maturity.ok]).toEqual([
      true,
      true,
      true,
    ]);
    expect(view.positions.ok).toBe(false);
  });

  test("an IDENTIFIER that is not a CUSIP gives no CUSIP", () => {
    const position = positionOf(SYNTHETIC_ROWS[0]);
    position.proto.setFieldsList([
      ...position.getFields(),
      identifierEntry("US912797SU26", IdentifierTypeProto.ISIN),
    ]);
    expect(somaRowOf(position).cusip).toBeNull();
    const cusip = positionOf({ ...SYNTHETIC_ROWS[0], cusip: "912797SU2" });
    expect(somaRowOf(cusip).cusip).toBe("912797SU2");
  });

  test("matured (zero-par) and cash rows are left out", () => {
    expect(FINE_ROWS.length).toBeGreaterThan(ROWS.length);
    const zero = {
      ...usable[0],
      cusip: "912797XX0",
      directedQuantity: "0",
    };
    const cash: SomaRow = {
      cusip: null,
      productType: "CURRENCY",
      maturityDate: null,
      directedQuantity: "-5",
      inflationCompensation: null,
    };
    const rows = somaPositions([...usable, zero, cash])?.rows ?? [];
    expect(rows.map((r) => r.cusip)).not.toContain("912797XX0");
    expect(rows).toHaveLength(usable.length);
  });
});

describe("pageOf and showingLabel", () => {
  test.each([
    [0, 25, "Showing 1–25 of 434 positions"],
    [17, 25, "Showing 426–434 of 434 positions"],
    [99, 25, "Showing 426–434 of 434 positions"], // clamped to the last page
    [-3, 25, "Showing 1–25 of 434 positions"],
    [0, Infinity, "Showing 1–434 of 434 positions"],
  ])("page %i of %s: %s", (page, size, label) => {
    const p = pageOf(ROWS, page, size);
    expect(showingLabel(p.from, p.to, ROWS.length)).toBe(label);
    expect(p.rows).toHaveLength(p.to - p.from + 1);
  });

  test("no rows: page 1 of 1, showing 0 of 0", () => {
    const p = pageOf([], 4, 25);
    expect([p.page, p.pages, p.from, p.to]).toEqual([0, 1, 0, 0]);
    expect(showingLabel(p.from, p.to, 0)).toBe("Showing 0 of 0 positions");
  });

  test("showingLabel never passes N", () => {
    expect(showingLabel(101, 125, 110)).toBe(
      "Showing 101–110 of 110 positions"
    );
  });
});

describe("SomaPositions: metric 3, search and paging", () => {
  const ok = (rows: SomaPosition[]) => ({ ok: true as const, data: { rows } });

  // Paging at 25 a page; the page's default, 100 a page, is tested last.
  function renderTable(rows = ROWS, pageSize = 25) {
    return render(SomaPositions, {
      props: { positions: ok(rows), asOfLabel: "Nov 4, 2026", pageSize },
    });
  }

  const search = () =>
    screen.getByRole("searchbox", { name: "Search positions" });
  const next = () => screen.getByRole("button", { name: "Next" });
  const previous = () => screen.getByRole("button", { name: "Previous" });
  const shown = () =>
    within(screen.getByRole("table"))
      .getAllByRole("row")
      .slice(1)
      .map((tr) => tr.querySelector("td")?.textContent);
  const showing = () => screen.getByText(/^Showing /).textContent;

  test("the first page: the 25 biggest, Previous disabled", () => {
    renderTable();
    expect(screen.getByText("As of Nov 4, 2026")).toBeTruthy();
    expect(shown()).toEqual(ROWS.slice(0, 25).map((r) => r.cusip));
    expect(showing()).toBe("Showing 1–25 of 434 positions");
    expect((previous() as HTMLButtonElement).disabled).toBe(true);
    expect((next() as HTMLButtonElement).disabled).toBe(false);
  });

  test("a full CUSIP, in any case, finds its one row", async () => {
    renderTable();
    const cusip = ROWS[30].cusip;
    for (const q of [cusip, cusip.toLowerCase()]) {
      await fireEvent.input(search(), { target: { value: q } });
      expect(shown()).toEqual([cusip]);
      expect(showing()).toBe("Showing 1–1 of 1 positions");
    }
    await fireEvent.input(search(), { target: { value: "" } });
    expect(showing()).toBe("Showing 1–25 of 434 positions");
  });

  test("a CUSIP fragment narrows to filterPositions' rows", async () => {
    renderTable();
    // 912810: the Treasury's bond CUSIPs.
    const matches = filterPositions(ROWS, "912810");
    expect(matches.length).toBeGreaterThan(25);
    expect(matches.length).toBeLessThan(434);
    await fireEvent.input(search(), { target: { value: "912810" } });
    expect(shown()).toEqual(matches.slice(0, 25).map((r) => r.cusip));
    expect(showing()).toBe(`Showing 1–25 of ${matches.length} positions`);
  });

  test("Next and Previous page through; the last page is partial, Next disabled", async () => {
    renderTable();
    await fireEvent.click(next());
    expect(showing()).toBe("Showing 26–50 of 434 positions");
    expect(shown()).toEqual(ROWS.slice(25, 50).map((r) => r.cusip));
    await fireEvent.click(previous());
    expect(showing()).toBe("Showing 1–25 of 434 positions");
    for (let i = 0; i < 17; i++) await fireEvent.click(next());
    expect(showing()).toBe("Showing 426–434 of 434 positions");
    expect(shown()).toHaveLength(9);
    expect((next() as HTMLButtonElement).disabled).toBe(true);
  });

  test("a search from page 3 starts at page 1; no match shows no rows", async () => {
    renderTable();
    await fireEvent.click(next());
    await fireEvent.click(next());
    expect(showing()).toBe("Showing 51–75 of 434 positions");
    await fireEvent.input(search(), { target: { value: "9128" } });
    expect(showing()).toMatch(/^Showing 1–25 of \d+ positions$/);

    await fireEvent.input(search(), { target: { value: "NOSUCHCUSIP" } });
    expect(shown()).toEqual([]);
    expect(showing()).toBe("Showing 0 of 0 positions");
    expect((previous() as HTMLButtonElement).disabled).toBe(true);
    expect((next() as HTMLButtonElement).disabled).toBe(true);
  });

  test("a smaller week while on page 5 starts at page 1, never past N", async () => {
    const { component } = renderTable();
    for (let i = 0; i < 4; i++) await fireEvent.click(next());
    expect(showing()).toBe("Showing 101–125 of 434 positions");
    await component.$set({ positions: ok(ROWS.slice(0, 40)) });
    expect(showing()).toBe("Showing 1–25 of 40 positions");
    expect(shown()).toEqual(ROWS.slice(0, 25).map((r) => r.cusip));
  });

  test("US-316: the default is 100 a page, biggest first; the last page shows the remainder", async () => {
    expect(SOMA_PAGE_SIZE).toBe(100);
    render(SomaPositions, {
      props: { positions: ok(ROWS), asOfLabel: "Nov 4, 2026" },
    });
    expect(shown()).toEqual(ROWS.slice(0, 100).map((r) => r.cusip));
    expect(showing()).toBe("Showing 1–100 of 434 positions");
    expect((previous() as HTMLButtonElement).disabled).toBe(true);
    expect((next() as HTMLButtonElement).disabled).toBe(false);
    for (let i = 0; i < 4; i++) await fireEvent.click(next());
    expect(showing()).toBe("Showing 401–434 of 434 positions");
    expect(shown()).toEqual(ROWS.slice(400).map((r) => r.cusip));
    expect((next() as HTMLButtonElement).disabled).toBe(true);

    // A search from the last page starts at page 1, on the narrowed rows.
    await fireEvent.input(search(), { target: { value: "912810" } });
    const matches = filterPositions(ROWS, "912810");
    const first = Math.min(100, matches.length);
    expect(shown()).toEqual(matches.slice(0, first).map((r) => r.cusip));
    expect(showing()).toBe(`Showing 1–${first} of ${matches.length} positions`);
    expect((previous() as HTMLButtonElement).disabled).toBe(true);
  });

  test("a row shows its CUSIP, type, maturity, par in $B and weight", () => {
    renderTable();
    const first = ROWS[0];
    const cells = within(screen.getAllByRole("row")[1])
      .getAllByRole("cell")
      .map((c) => c.textContent);
    expect(cells[0]).toBe(first.cusip);
    expect(cells[1]).toBe(first.type);
    expect(cells[2]).toMatch(/^[A-Z][a-z]{2} \d{1,2}, \d{4}$/);
    expect(cells[3]).toMatch(/^\$\d{1,3}(,\d{3})*\.\d{2}B$/);
    expect(cells[4]).toBe(`${first.weightPct.toFixed(2)}%`);
  });
});
