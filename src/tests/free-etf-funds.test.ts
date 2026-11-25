/**
 * US-338: the fund config behind /free/etf/[ticker]. It holds wording and
 * identity only, never a fund figure (expense ratio, AUM, share count): those
 * come from the stored SecurityMetric series. findEtf is the allowlist: an
 * exact match on the lowercase slug, so inherited keys match nothing. The
 * route's matcher (src/params/etf.ts) uses it, so an unknown ticker never
 * reaches the page or its __data.json.
 */
import { describe, expect, test } from "vitest";
import { ETF_FUNDS, etfFeeNote, findEtf } from "$lib/free/etf/funds";
import { match } from "../params/etf";

// Text a fund's wording may hold that has digits but is no figure: dates,
// the funds' index names, and URLs (not shown as text).
const ISO_DATE = /\b\d{4}-\d{2}-\d{2}\b/g;
const DAY_LABEL = /\b[A-Z][a-z]{2} \d{1,2}, \d{4}\b/g;
const INDEX_NAMES = /S&P 500|Nasdaq-100/g;
const FIGURE = /%|\$|billion|million|trillion|\bbn\b|\d/i;

/** Every string in `value` with its path, skipping URL fields. */
function strings(value: unknown, at: string): [string, string][] {
  if (typeof value === "string") return [[at, value]];
  if (Array.isArray(value)) {
    return value.flatMap((v, i) => strings(v, `${at}[${i}]`));
  }
  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([k, v]) =>
      k === "href" ? [] : strings(v, `${at}.${k}`)
    );
  }
  return [];
}

/** Every leaf that is neither a string nor a container. */
function nonStrings(value: unknown, at: string): string[] {
  if (typeof value === "string") return [];
  if (Array.isArray(value)) {
    return value.flatMap((v, i) => nonStrings(v, `${at}[${i}]`));
  }
  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([k, v]) =>
      nonStrings(v, `${at}.${k}`)
    );
  }
  return [`${at}: ${typeof value}`];
}

describe("guardrail 2: no hardcoded fund figures in the config", () => {
  test("every field is text: no numbers", () => {
    expect(nonStrings(ETF_FUNDS, "ETF_FUNDS")).toEqual([]);
  });

  test("no string holds %, $, billion, bn or a number that is not a date", () => {
    const hits = strings(ETF_FUNDS, "ETF_FUNDS").filter(([, text]) =>
      FIGURE.test(
        text
          .replace(ISO_DATE, "")
          .replace(DAY_LABEL, "")
          .replace(INDEX_NAMES, "")
      )
    );
    expect(hits).toEqual([]);
  });

  test("the walk catches a figure", () => {
    for (const text of ["0.78%", "$27.7B", "27 billion", "4,225 days"]) {
      expect(FIGURE.test(text), text).toBe(true);
    }
  });
});

describe("guardrail 1: one config, SPY and TQQQ in it", () => {
  test("slugs are unique, lowercase, and the tickers are SPY and TQQQ", () => {
    const slugs = ETF_FUNDS.map((f) => f.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const f of ETF_FUNDS) expect(f.slug).toBe(f.ticker.toLowerCase());
    expect(ETF_FUNDS.map((f) => f.ticker)).toEqual(["SPY", "TQQQ"]);
  });

  test("TQQQ has a split note and SPY none; the fee note names the sponsor's structure", () => {
    expect(findEtf("tqqq")?.splitNote).toMatch(/ProShares/);
    expect(findEtf("spy")?.splitNote).toBeUndefined();
    const tqqq = findEtf("tqqq");
    expect(tqqq && etfFeeNote(tqqq)).toMatch(
      /^Estimate\. TQQQ is an open-end fund: .*ProShares/
    );
  });
});

describe("guardrail 4: findEtf matches configured slugs only", () => {
  test.each(["spy", "tqqq"])(
    "%s is found, and the route matches it",
    (slug) => {
      expect(findEtf(slug)?.slug).toBe(slug);
      expect(match(slug)).toBe(true);
    }
  );

  test.each([
    "xyz",
    "SPY",
    "Tqqq",
    "constructor",
    "__proto__",
    "toString",
    "hasOwnProperty",
    "",
    "spy ",
  ])("%j is not, and the route doesn't match it", (slug) => {
    expect(findEtf(slug)).toBeUndefined();
    expect(match(slug)).toBe(false);
  });
});
