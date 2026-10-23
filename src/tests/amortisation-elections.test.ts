/**
 * US-242: the amortisation elections panel and its pure helpers.
 * Metric 1: all-UNSPECIFIED shows "Default (…)" for each election.
 * Metric 2: diffElections lists exactly the changed elections, old and new.
 * Metric 5: §171, §1278(b) and §1276(b)(2) each appear once, with the panel
 * alone and with the confirmation open.
 * Guardrail 1: defaults follow the proto comments' generated enum values.
 */
import { fireEvent, render, screen } from "@testing-library/svelte";
import { describe, expect, test } from "vitest";
import pkg from "@fintekkers/ledger-models/node/fintekkers/models/portfolio/amortisation_elections_pb.js";

import ElectionsPanel from "../components/widgets/ElectionsPanel.svelte";
import { ELECTION_FIELDS, electionLabel } from "$lib/electionText";
import { diffElections, isValidElection } from "$lib/electionValues";

const {
  PremiumAmortisationElectionProto,
  MarketDiscountInclusionProto,
  MarketDiscountAccrualMethodProto,
} = pkg;

const UNSPECIFIED = {
  bondPremium: 0,
  marketDiscountInclusion: 0,
  marketDiscountAccrual: 0,
};

function renderPanel(values = UNSPECIFIED) {
  return render(ElectionsPanel, {
    props: {
      portfolioId: "11111111-2222-3333-4444-555555555555",
      portfolioName: "qa-242-probe-x",
      elections: { asOf: "2026-10-23T10:00:00.000Z", elections: values },
    },
  });
}

function countIn(text: string, needle: string): number {
  return text.split(needle).length - 1;
}

describe("ElectionsPanel", () => {
  test("all UNSPECIFIED shows Default (…) for each election", () => {
    renderPanel();
    expect(
      screen.getByTestId("election-current-bondPremium").textContent?.trim()
    ).toBe("Default (Premium elected)");
    expect(
      screen
        .getByTestId("election-current-marketDiscountInclusion")
        .textContent?.trim()
    ).toBe("Default (At disposition)");
    expect(
      screen
        .getByTestId("election-current-marketDiscountAccrual")
        .textContent?.trim()
    ).toBe("Default (Ratable)");
    for (const label of [
      "Bond premium",
      "Market discount inclusion",
      "Market discount accrual",
    ]) {
      expect((screen.getByLabelText(label) as HTMLSelectElement).value).toBe(
        "0"
      );
    }
  });

  test("each IRC section appears exactly once, before and with the confirmation open", async () => {
    renderPanel();
    const sections = ["§171", "§1278(b)", "§1276(b)(2)"];
    for (const s of sections) {
      expect(countIn(document.body.textContent ?? "", s)).toBe(1);
    }

    await fireEvent.change(screen.getByLabelText("Bond premium"), {
      target: {
        value: String(PremiumAmortisationElectionProto.PREMIUM_NOT_ELECTED),
      },
    });
    await fireEvent.change(screen.getByLabelText("Market discount inclusion"), {
      target: { value: String(MarketDiscountInclusionProto.INCLUDE_CURRENTLY) },
    });
    await fireEvent.click(screen.getByRole("button", { name: "Save" }));

    const dialog = screen.getByRole("dialog");
    const dialogText = (dialog.textContent ?? "").replace(/\s+/g, " ");
    expect(dialogText).toContain(
      "Default (Premium elected) → Premium not elected"
    );
    expect(dialogText).toContain(
      "Default (At disposition) → Include currently"
    );
    expect(dialogText).not.toContain("Market discount accrual");
    for (const s of sections) {
      expect(countIn(document.body.textContent ?? "", s)).toBe(1);
    }
    // The confirmation's form carries only the changed elections.
    const hidden = Array.from(
      dialog.querySelectorAll<HTMLInputElement>("input[type=hidden]")
    ).map((i) => [i.name, i.value]);
    expect(hidden).toEqual([
      ["portfolioId", "11111111-2222-3333-4444-555555555555"],
      ["baseAsOf", "2026-10-23T10:00:00.000Z"],
      ["bondPremium", "2"],
      ["marketDiscountInclusion", "2"],
    ]);

    await fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  test("Save is disabled until an election changes", () => {
    renderPanel();
    expect(
      (screen.getByRole("button", { name: "Save" }) as HTMLButtonElement)
        .disabled
    ).toBe(true);
  });

  test("an elections read error shows instead of the form", () => {
    render(ElectionsPanel, {
      props: { portfolioId: "x", error: "Could not load elections: down" },
    });
    expect(screen.getByRole("alert").textContent).toContain(
      "Could not load elections: down"
    );
    expect(screen.queryByRole("button", { name: "Save" })).toBeNull();
  });
});

describe("electionText", () => {
  test("defaults follow the proto comments", () => {
    const byKey = Object.fromEntries(
      ELECTION_FIELDS.map((f) => [f.key, f.defaultValue])
    );
    expect(byKey).toEqual({
      bondPremium: PremiumAmortisationElectionProto.PREMIUM_ELECTED,
      marketDiscountInclusion: MarketDiscountInclusionProto.AT_DISPOSITION,
      marketDiscountAccrual: MarketDiscountAccrualMethodProto.RATABLE,
    });
  });

  test("every concrete value has a label and 0 reads as Default (…)", () => {
    expect(electionLabel("bondPremium", 0)).toBe("Default (Premium elected)");
    expect(electionLabel("bondPremium", 1)).toBe("Premium elected");
    expect(electionLabel("marketDiscountAccrual", 2)).toBe("Constant yield");
  });
});

describe("diffElections", () => {
  test("returns exactly the changed elections with old and new values", () => {
    expect(
      diffElections(UNSPECIFIED, {
        bondPremium: 2,
        marketDiscountInclusion: 0,
        marketDiscountAccrual: 1,
      })
    ).toEqual([
      { key: "bondPremium", from: 0, to: 2 },
      { key: "marketDiscountAccrual", from: 0, to: 1 },
    ]);
  });

  test("ignores keys that are absent or inherited", () => {
    const after = Object.create({ bondPremium: 2 });
    expect(diffElections(UNSPECIFIED, after)).toEqual([]);
    expect(diffElections(UNSPECIFIED, {})).toEqual([]);
  });

  test("valid values come from the generated enums", () => {
    expect(isValidElection("bondPremium", 2)).toBe(true);
    expect(isValidElection("bondPremium", 3)).toBe(false);
    expect(isValidElection("marketDiscountAccrual", -1)).toBe(false);
  });
});
