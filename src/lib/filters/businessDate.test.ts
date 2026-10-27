/**
 * US-291 metric 4: the Business date URL → trade-date filter rules.
 */
import { describe, expect, test } from "vitest";
import { buildFilterUrl } from "./urlState";
import {
  businessDateFilter,
  businessDateHeading,
  businessDateNote,
  businessDateUrlOverrides,
  formatBusinessDate,
  resolveBusinessDate,
  todayUtc,
} from "./businessDate";

const TODAY = "2026-10-27";

function filterFor(query: string, positionType?: string | null) {
  return businessDateFilter(
    resolveBusinessDate(new URLSearchParams(query), TODAY, positionType)
  );
}

describe("resolveBusinessDate → businessDateFilter", () => {
  test("businessDate=YYYY-MM-DD builds TRADE_DATE LESS_THAN_OR_EQUALS that date", () => {
    expect(filterFor("businessDate=2026-05-06")).toEqual({
      tradeDate: "2026-05-06",
      tradeDateOperator: "LESS_THAN_OR_EQUALS",
    });
  });

  test("businessDate=all builds no trade-date filter", () => {
    const state = resolveBusinessDate(
      new URLSearchParams("businessDate=all"),
      TODAY
    );
    expect(state.mode).toBe("all");
    expect(businessDateFilter(state)).toEqual({});
  });

  test("no params builds a filter on today", () => {
    const state = resolveBusinessDate(new URLSearchParams(), TODAY);
    expect(state).toMatchObject({ mode: "date", date: TODAY, legacy: false });
    expect(businessDateFilter(state)).toEqual({
      tradeDate: TODAY,
      tradeDateOperator: "LESS_THAN_OR_EQUALS",
    });
  });

  test.each([
    ["businessDate=2026-10-27", "TAX_LOT"],
    ["businessDate=all", "TAX_LOT"],
    ["", "TAX_LOT"],
    ["tradeDate=2026-10-27&tradeDateOperator=LESS_THAN_OR_EQUALS", "TAX_LOT"],
  ])("Tax Lot builds no trade-date filter (%s)", (query, positionType) => {
    const state = resolveBusinessDate(
      new URLSearchParams(query),
      TODAY,
      positionType
    );
    expect(state).toMatchObject({ mode: "all", taxLot: true });
    expect(businessDateFilter(state)).toEqual({});
  });

  test("Transaction position type keeps the date filter", () => {
    expect(filterFor("businessDate=2026-05-06", "TRANSACTION")).toEqual({
      tradeDate: "2026-05-06",
      tradeDateOperator: "LESS_THAN_OR_EQUALS",
    });
  });

  test.each([["LESS_THAN_OR_EQUALS"], ["MORE_THAN"], ["EQUALS"]])(
    "old tradeDate + tradeDateOperator=%s builds the same filter as before",
    (op) => {
      const state = resolveBusinessDate(
        new URLSearchParams(`tradeDate=2026-05-06&tradeDateOperator=${op}`),
        TODAY
      );
      expect(state.legacy).toBe(true);
      expect(businessDateFilter(state)).toEqual({
        tradeDate: "2026-05-06",
        tradeDateOperator: op,
      });
    }
  );

  test.each([
    ["tradeDate=2026-05-06"],
    ["tradeDateOperator=MORE_THAN"],
    ["tradeDate=&tradeDateOperator=MORE_THAN"],
  ])("old link with one half of the pair builds no filter (%s)", (query) => {
    const state = resolveBusinessDate(new URLSearchParams(query), TODAY);
    expect(state).toMatchObject({ mode: "all", legacy: true });
    expect(businessDateFilter(state)).toEqual({});
  });

  test("businessDate beats old tradeDate params", () => {
    expect(
      filterFor(
        "businessDate=2026-10-27&tradeDate=2026-01-01&tradeDateOperator=MORE_THAN"
      )
    ).toEqual({
      tradeDate: "2026-10-27",
      tradeDateOperator: "LESS_THAN_OR_EQUALS",
    });
    expect(
      filterFor(
        "businessDate=all&tradeDate=2026-01-01&tradeDateOperator=MORE_THAN"
      )
    ).toEqual({});
  });

  test.each([["2026-02-30"], ["2026-13-45"], ["foo"], [""]])(
    "malformed businessDate=%s falls back to today",
    (value) => {
      const state = resolveBusinessDate(
        new URLSearchParams({ businessDate: value }),
        TODAY
      );
      expect(state).toMatchObject({ mode: "date", date: TODAY });
    }
  );
});

describe("businessDateUrlOverrides", () => {
  test("nulls tradeDate and tradeDateOperator", () => {
    expect(businessDateUrlOverrides("date", "2026-10-27")).toEqual({
      businessDate: "2026-10-27",
      tradeDate: null,
      tradeDateOperator: null,
    });
    expect(businessDateUrlOverrides("all", null)).toEqual({
      businessDate: "all",
      tradeDate: null,
      tradeDateOperator: null,
    });
  });

  test("buildFilterUrl drops inherited old params", () => {
    const current = new URLSearchParams(
      "tradeDate=2026-05-06&tradeDateOperator=MORE_THAN"
    );
    expect(
      buildFilterUrl(
        "/data/transactions",
        current,
        businessDateUrlOverrides("all", null),
        ["tradeDate", "tradeDateOperator"]
      )
    ).toBe("/data/transactions?businessDate=all");
  });
});

describe("labels", () => {
  test("formatBusinessDate uses fixed month names", () => {
    expect(formatBusinessDate("2026-10-27")).toBe("27 Oct 2026");
    expect(formatBusinessDate("2026-05-06")).toBe("6 May 2026");
  });

  test("the note spells out each state", () => {
    const at = (query: string, positionType?: string) =>
      businessDateNote(
        resolveBusinessDate(new URLSearchParams(query), TODAY, positionType)
      );
    expect(at("")).toBe("Trades on or before 27 Oct 2026");
    expect(at("businessDate=all")).toBe("No date filter: showing all data");
    expect(at("", "TAX_LOT")).toBe(
      "Business date isn't available for tax lots yet: showing all data"
    );
    expect(at("tradeDate=2026-05-06&tradeDateOperator=MORE_THAN")).toBe(
      "Trade date filter: MORE_THAN 6 May 2026"
    );
  });

  test("headings", () => {
    const dated = resolveBusinessDate(new URLSearchParams(), TODAY);
    const all = resolveBusinessDate(
      new URLSearchParams("businessDate=all"),
      TODAY
    );
    expect(businessDateHeading("positions", dated)).toBe(
      "as of the end of 27 Oct 2026"
    );
    expect(businessDateHeading("transactions", dated)).toBe(
      "trades on or before 27 Oct 2026"
    );
    expect(businessDateHeading("positions", all)).toBe(
      "all dates, including future-dated activity"
    );
  });

  test("todayUtc is the UTC date either side of midnight", () => {
    expect(todayUtc(new Date("2026-10-27T23:59:59Z"))).toBe("2026-10-27");
    expect(todayUtc(new Date("2026-10-28T00:00:00Z"))).toBe("2026-10-28");
  });
});
