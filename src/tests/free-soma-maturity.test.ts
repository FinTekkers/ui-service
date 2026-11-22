/**
 * US-327: /free/soma's maturity profile stacks each bucket's bar by Holdings
 * over time's groups (bills, notes & bonds, TIPS with inflation
 * compensation, FRNs), in its order and colours, with the same legend. Each
 * segment is labelled with its group, $ amount and share of the bucket. The
 * buckets' "$X · Y%" figures and the within-a-year sentence are as before.
 * Fixed data: the 2026-10-14 fixture rows, and the recorded 2026-11-04
 * history for the Holdings over time legend.
 */
import { render, screen, within } from "@testing-library/svelte";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import {
  SOMA_BUCKET_LABELS,
  type Section,
  type SomaMaturityView,
} from "$lib/free/soma";
import { somaHistory, somaRowsToView } from "$lib/server/free-soma";
import SomaMaturity from "../components/free/soma/SomaMaturity.svelte";
import SomaHistory from "../components/free/soma/SomaHistory.svelte";
import { AS_OF, PRIOR_ROWS, ROWS } from "./fixtures/soma-2026-10-14";
import {
  AS_OF as HISTORY_AS_OF,
  HISTORY_ROWS,
} from "./fixtures/soma-2026-11-04";

const WEEK = "Oct 14, 2026";

/** Copied from the page rendered on main before US-327, same fixture. */
const VALUES_BEFORE = [
  "$106.9B · 2.3%",
  "$390.8B · 8.6%",
  "$529.1B · 11.6%",
  "$1,436.2B · 31.4%",
  "$482.2B · 10.5%",
  "$1,625.3B · 35.6%",
];
const NOTE_BEFORE =
  "Treasuries are spread across the curve. About $1.03T, or 22%, matures within a year.";

/** Each bucket's non-zero groups, bottom-of-stack first. */
const EXPECTED_STACKS = [
  ["bills", "notesBonds"],
  ["bills", "notesBonds", "frns"],
  ["bills", "notesBonds", "tips"],
  ["notesBonds", "tips"],
  ["notesBonds", "tips"],
  ["notesBonds", "tips"],
];

const LABEL =
  /^(Bills|Notes & bonds|TIPS|FRNs): \$[\d,.]+B, \d+\.\d% of bucket$/;

beforeEach(() => {
  vi.spyOn(console, "log").mockImplementation(() => undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

function maturity(): Section<SomaMaturityView> {
  return somaRowsToView(ROWS, AS_OF, PRIOR_ROWS).maturity;
}

function renderMaturity(m: Section<SomaMaturityView> = maturity()) {
  return render(SomaMaturity, { props: { maturity: m, asOfLabel: WEEK } });
}

/** A legend's entries: name and swatch colour. */
function legendOf(root: Element) {
  return [...root.querySelectorAll(".legend li")].map((li) => ({
    name: li.textContent?.trim(),
    color: (li.querySelector(".swatch") as HTMLElement).style.background,
  }));
}

describe("SomaMaturity stacked bars", () => {
  test("metric 2: one segment per non-zero group, in Holdings over time's order", () => {
    const { container } = renderMaturity();
    const fills = [...container.querySelectorAll(".fill")];
    expect(fills).toHaveLength(SOMA_BUCKET_LABELS.length);
    expect(
      fills.map((fill) =>
        [...fill.querySelectorAll("[data-stack]")].map((s) =>
          s.getAttribute("data-stack")
        )
      )
    ).toEqual(EXPECTED_STACKS);
    // Within 15 days holds no TIPS or FRN, so draws no segment for them.
    expect(fills[0].querySelector('[data-stack="tips"]')).toBeNull();
    expect(fills[0].querySelector('[data-stack="frns"]')).toBeNull();
  });

  test("metric 2: segments use the group colours, and the legend matches Holdings over time's", () => {
    const { container } = renderMaturity();
    const history = render(SomaHistory, {
      props: {
        history: {
          ok: true,
          data: somaHistory(HISTORY_ROWS, HISTORY_AS_OF) as NonNullable<
            ReturnType<typeof somaHistory>
          >,
        },
        asOf: HISTORY_AS_OF,
        asOfLabel: "Nov 4, 2026",
      },
    });
    const historyLegend = legendOf(
      history.container.querySelector(
        'section[aria-labelledby="hist-title"]'
      ) as HTMLElement
    );
    expect(historyLegend.map((e) => e.name)).toEqual([
      "Bills",
      "Notes & bonds",
      "TIPS",
      "FRNs",
    ]);
    const maturitySection = container.querySelector(
      'section[aria-labelledby="mat-title"]'
    ) as HTMLElement;
    expect(legendOf(maturitySection)).toEqual(historyLegend);

    const colorOf = new Map(
      ["bills", "notesBonds", "tips", "frns"].map((s, i) => [
        s,
        historyLegend[i].color,
      ])
    );
    for (const seg of container.querySelectorAll<HTMLElement>(
      ".fill [data-stack]"
    )) {
      expect(seg.style.background).toBe(
        colorOf.get(seg.getAttribute("data-stack") as string)
      );
    }
  });

  test("metric 3: each segment is labelled with its group, $ amount and share of the bucket", () => {
    const { container } = renderMaturity();
    expect(
      screen.getByRole("img", { name: "TIPS: $10.0B, 1.9% of bucket" })
    ).toHaveAttribute("data-stack", "tips");
    expect(
      screen.getByRole("img", { name: "FRNs: $20.0B, 5.1% of bucket" })
    ).toHaveAttribute("data-stack", "frns");
    const segments = [...container.querySelectorAll(".fill [data-stack]")];
    expect(segments).toHaveLength(EXPECTED_STACKS.flat().length);
    for (const seg of segments) {
      expect(seg).toHaveAttribute("role", "img");
      expect(seg.getAttribute("aria-label")).toMatch(LABEL);
    }
  });

  test("metric 4: the bucket figures and the within-a-year sentence are as before", () => {
    const { container } = renderMaturity();
    expect(
      [...container.querySelectorAll(".value")].map((v) =>
        v.textContent?.replace(/\s+/g, " ").trim()
      )
    ).toEqual(VALUES_BEFORE);
    const section = screen.getByRole("region", {
      name: "When the holdings come due",
    });
    expect(within(section).getByText(NOTE_BEFORE)).toHaveClass("note");
  });

  test("guardrail: unavailable renders the message, no segments and no legend", () => {
    const message = `Unavailable for ${WEEK}: the live SOMA holdings could not be loaded.`;
    const { container } = renderMaturity({ ok: false, message });
    expect(container.querySelectorAll("[data-stack]")).toHaveLength(0);
    expect(container.querySelector(".legend")).toBeNull();
    expect(container.textContent).toContain(message);
  });
});
