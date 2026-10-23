/**
 * US-253: /free/tips renders the 5 DataExplorerTIPS.dc.html sections from
 * the mock in src/lib/free/mock/tips.ts, with the code cards showing the
 * sample files verbatim.
 */
import { render, screen, within } from "@testing-library/svelte";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, test } from "vitest";
import TipsPage from "../routes/free/tips/+page.svelte";

const H2S = [
  "What are Treasury Inflation-Protected Securities?",
  "TII 1⅞ 01/15/36 · 10-Year TIPS, Series A-2036",
  "How this bond tracks inflation",
  "Value a TIPS position",
  "Pull TIPS data from the API",
];

describe("/free/tips page", () => {
  test("renders the 5 artboard h2 headings in order", () => {
    render(TipsPage);
    expect(
      screen
        .getAllByRole("heading", { level: 2 })
        .map((h) => h.textContent?.trim())
    ).toEqual(H2S);
  });

  test("the security widget shows the stored fields", () => {
    render(TipsPage);
    const widget = screen.getByRole("region", { name: H2S[1] });
    const rows = [...widget.querySelectorAll("dl > div")].map((row) => [
      row.querySelector("dt")?.textContent,
      row.querySelector("dd")?.textContent,
    ]);
    expect(rows).toEqual([
      ["CUSIP", "91282CPU9"],
      ["Issuer", "US Treasury"],
      ["Product", "TIPS"],
      ["Coupon (real)", "1.875%"],
      ["Frequency", "Semiannual"],
      ["Pay dates", "Jan 15 / Jul 15"],
      ["Dated date", "2026-01-15"],
      ["Maturity", "2036-01-15"],
      ["Index", "CPI-U NSA"],
      ["Base ref CPI", "324.93471"],
      ["Ref CPI (Jun 30)", "332.92643"],
      ["Index ratio", "1.02459"],
    ]);
    expect(widget).toHaveTextContent("As of 2026-06-30");
  });

  test("the worked example shows the 6 steps' figures", () => {
    render(TipsPage);
    const example = screen.getByRole("article", { name: H2S[2] });
    const figures = [...example.querySelectorAll("ol > li")].map(
      (li) => li.lastElementChild?.textContent
    );
    expect(figures).toEqual([
      "324.93471",
      "332.92643",
      "1.02459",
      "$10,245.90",
      "$96.06",
      "max(adj., par)",
    ]);
  });

  test("the calculator intro says the inputs are locked", () => {
    render(TipsPage);
    const calc = screen.getByRole("region", { name: H2S[3] });
    expect(calc).toHaveTextContent(
      "Pre-filled with the January 2036 bond. This preview shows the default result; sign in to change the real yield and inflation."
    );
    expect(calc).not.toHaveTextContent("Change the real yield and your");
    expect(within(calc).getAllByRole("textbox")).toHaveLength(7);
  });

  test("each code card shows its sample file verbatim", () => {
    render(TipsPage);
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
