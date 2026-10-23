/**
 * US-252: the artboard's Python sample called PositionService().search with
 * as_of= and filter= keywords and ZonedDateTime.of, none of which the
 * ledger-models 1.1.0 Python API has. src/lib/free/samples/soma.py, shown
 * verbatim on /free/soma, must not bring any of them back.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, test } from "vitest";

const BANNED = ["search(as_of=", "filter=", "ZonedDateTime.of"];

/** The banned forms that `text` contains. */
function bannedForms(text: string): string[] {
  return BANNED.filter((form) => text.includes(form));
}

describe("SOMA Python sample (samples/soma.py)", () => {
  test("uses none of the artboard's non-existent API forms", () => {
    const source = readFileSync(
      path.resolve("src/lib/free/samples/soma.py"),
      "utf8"
    );
    expect(source.trim()).not.toBe("");
    expect(source).toContain("PortfolioService");
    expect(bannedForms(source)).toEqual([]);
  });

  test("the check fails on a filter= keyword (negative control)", () => {
    expect(bannedForms("x(filter=1)")).toEqual(["filter="]);
  });
});
