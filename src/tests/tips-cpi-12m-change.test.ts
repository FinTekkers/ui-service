/**
 * US-328: CPI-U's change over the 12 months to its latest month, the rate
 * /free/tips sends as TipsInput.assumed_inflation_rate. It is the latest
 * month against exactly the same month a year earlier: never an older
 * month's change and never a default. The security search and price search
 * are stubbed.
 */
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  searchSecurityAsOfNow: vi.fn(),
  searchSeriesPrices: vi.fn(),
}));

vi.mock(
  "@fintekkers/ledger-models/node/wrappers/services/security-service/SecurityService",
  () => ({
    SecurityService: vi.fn().mockImplementation(() => ({
      searchSecurityAsOfNow: mocks.searchSecurityAsOfNow,
    })),
  })
);
vi.mock("$lib/fixings", async (importOriginal) => ({
  ...(await importOriginal<typeof import("$lib/fixings")>()),
  searchSeriesPrices: mocks.searchSeriesPrices,
}));

import Decimal from "decimal.js";
import { IdentifierTypeProto } from "@fintekkers/ledger-models/node/fintekkers/models/security/identifier/identifier_type_pb.js";
import { ProductTypeProto } from "@fintekkers/ledger-models/node/fintekkers/models/security/product_type_pb.js";
import {
  CPI_U_NSA_SERIES_ID,
  fetchLatestCpiChange,
  TREASURY_TIPS_INDEX,
  twelveMonthCpiChange,
  type CpiReading,
} from "$lib/cpi";

function reading(year: number, month: number, value: string): CpiReading {
  return { year, month, label: `CPI-U ${year}-${month}`, value };
}

const CPI_SERIES = {
  proto: {
    getProductType: () => ProductTypeProto.CPI_SERIES,
    getIdentifiersList: () => [
      {
        getIdentifierType: () => IdentifierTypeProto.SERIES_ID,
        getIdentifierValue: () => CPI_U_NSA_SERIES_ID,
      },
    ],
  },
  getID: () => ({ toString: () => "cpi-series-uuid" }),
};

const consoleError = console.error;

beforeEach(() => {
  console.error = vi.fn();
  mocks.searchSecurityAsOfNow.mockResolvedValue([CPI_SERIES]);
});

afterEach(() => {
  console.error = consoleError;
  vi.clearAllMocks();
});

describe("twelveMonthCpiChange", () => {
  test("300.0 against 291.26 a year earlier is 3.0%, sent unrounded", () => {
    const change = twelveMonthCpiChange([
      reading(2026, 9, "300.0"),
      reading(2025, 9, "291.26"),
      reading(2026, 3, "296.5"),
    ]);
    expect(change).toEqual({
      ok: true,
      rate: new Decimal("300.0")
        .dividedBy("291.26")
        .minus(1)
        .times(100)
        .toFixed(),
      pct: "3.0",
      month: "September 2026",
    });
  });

  test("the same month a year earlier is missing: no change, even with an older month", () => {
    expect(
      twelveMonthCpiChange([
        reading(2025, 8, "290.9"),
        reading(2025, 10, "291.6"),
        reading(2026, 9, "300.0"),
      ])
    ).toEqual({
      ok: false,
      reason: "no-year-ago",
      missingMonth: "September 2025",
    });
  });

  test("no BLS reading for October 2025: CPI(2026-10) / 325.604 - 1, Treasury's TIPS index", () => {
    expect(TREASURY_TIPS_INDEX).toEqual({ "2025-10": "325.604" });
    expect(
      twelveMonthCpiChange([
        reading(2025, 9, "324.8"),
        reading(2025, 11, "324.1"),
        reading(2026, 10, "334.2"),
      ])
    ).toEqual({
      ok: true,
      rate: new Decimal("334.2")
        .dividedBy("325.604")
        .minus(1)
        .times(100)
        .toFixed(),
      pct: "2.6",
      month: "October 2026",
      treasuryIndex: { month: "October 2025", value: "325.604" },
    });
  });

  test("a BLS reading for October 2025 is used as it is, with no Treasury note", () => {
    const change = twelveMonthCpiChange([
      reading(2025, 10, "325.0"),
      reading(2026, 10, "334.2"),
    ]);
    expect(change).toMatchObject({
      ok: true,
      rate: new Decimal("334.2")
        .dividedBy("325.0")
        .minus(1)
        .times(100)
        .toFixed(),
    });
    expect(change).not.toHaveProperty("treasuryIndex");
  });

  test("no readings: no latest month", () => {
    expect(twelveMonthCpiChange([])).toEqual({
      ok: false,
      reason: "no-latest",
    });
  });
});

describe("fetchLatestCpiChange", () => {
  const at = (iso: string, value: string) => ({ at: Date.parse(iso), value });

  test("reads every month in one search; the latest stamp in a month wins", async () => {
    mocks.searchSeriesPrices.mockResolvedValue([
      at("2026-09-01T12:30:00Z", "300.0"),
      at("2025-09-01T12:30:00Z", "291.26"),
      at("2026-09-01T00:00:00Z", "299.1"),
      at("2026-08-01T12:30:00Z", "299.5"),
    ]);
    const change = await fetchLatestCpiChange("key");
    expect(change).toMatchObject({
      ok: true,
      pct: "3.0",
      month: "September 2026",
    });
    expect(mocks.searchSeriesPrices).toHaveBeenCalledTimes(1);
    expect(mocks.searchSeriesPrices.mock.calls[0][0]).toBe("cpi-series-uuid");
  });

  test("the year-ago month is missing: no-year-ago, never the 13-month change", async () => {
    mocks.searchSeriesPrices.mockResolvedValue([
      at("2025-08-01T12:30:00Z", "290.9"),
      at("2026-09-01T12:30:00Z", "300.0"),
    ]);
    expect(await fetchLatestCpiChange("key")).toEqual({
      ok: false,
      reason: "no-year-ago",
      missingMonth: "September 2025",
    });
  });

  test.each<[string, () => void]>([
    [
      "the security search rejects",
      () => mocks.searchSecurityAsOfNow.mockRejectedValue(new Error("down")),
    ],
    [
      "the price search rejects",
      () => mocks.searchSeriesPrices.mockRejectedValue(new Error("down")),
    ],
    [
      "there is no CPI-U series",
      () => mocks.searchSecurityAsOfNow.mockResolvedValue([]),
    ],
    [
      "the series has no prices",
      () => mocks.searchSeriesPrices.mockResolvedValue([]),
    ],
  ])("%s: no-latest, and it never throws", async (_name, fail) => {
    fail();
    expect(await fetchLatestCpiChange("key")).toEqual({
      ok: false,
      reason: "no-latest",
    });
  });
});
