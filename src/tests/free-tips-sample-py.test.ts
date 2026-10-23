/**
 * US-253: the artboard's Python sample called SecurityService().search with
 * as_of= and filter= keywords, which the ledger-models 1.1.0 Python API does
 * not have. src/lib/free/samples/tips.py, shown verbatim on /free/tips, uses
 * QuerySecurityRequest.create_query_request instead, and looks up the same
 * bond as the TypeScript sample.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, test } from "vitest";

const source = readFileSync(
  path.resolve("src/lib/free/samples/tips.py"),
  "utf8"
);

describe("TIPS Python sample (samples/tips.py)", () => {
  test("builds a query request and searches with it", () => {
    expect(source).toContain("QuerySecurityRequest.create_query_request(");
    expect(source).toContain("SecurityService().search(request)");
  });

  test("filters on the same CUSIP as the TypeScript sample", () => {
    expect(source).toMatch(/FieldProto\.IDENTIFIER:\s*"91282CPU9"/);
  });

  test("uses none of the artboard's non-existent API forms", () => {
    for (const form of ["as_of=", "filter=", "ZonedDateTime"]) {
      expect(source).not.toContain(form);
    }
  });
});
