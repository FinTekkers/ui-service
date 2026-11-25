/**
 * US-350: the /data/prices loader reads every stored price for the
 * security through closes.ts's chunked reader, not just the price
 * service's default 1,000. A read cut short shows "Price history
 * incomplete" in the page's error banner, with no rows. The security
 * lookups are stubbed; the price Search is the shared fake
 * (helpers/fakePriceSearch.ts), which fails any request whose limit is
 * unset, 0 or over 10,000.
 */
import { render, screen } from "@testing-library/svelte";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createPriceSearch: vi.fn(),
  FetchSecurity: vi.fn(),
  FetchSecurityUniverse: vi.fn(),
}));

vi.mock("$lib/security", () => ({
  FetchSecurity: mocks.FetchSecurity,
  FetchSecurityUniverse: mocks.FetchSecurityUniverse,
}));
vi.mock("$lib/server/closes", async (importOriginal) => ({
  ...(await importOriginal<typeof import("$lib/server/closes")>()),
  createPriceSearch: mocks.createPriceSearch,
}));

import { UUIDProto } from "@fintekkers/ledger-models/node/fintekkers/models/util/uuid_pb.js";
import { load } from "../routes/(authenticated)/data/prices/+page.server";
import PricesPage from "../routes/(authenticated)/data/prices/+page.svelte";
import {
  dailyRows,
  expectLimitsWithinCeiling,
  fakeSearch,
  warning,
} from "./helpers/fakePriceSearch";

const NOW = new Date("2026-11-25T15:00:00Z");
const KEY = "key-350";

const AAPL = {
  identifier: "AAPL",
  issuerName: "Apple Inc.",
  uuidHex: Buffer.from(
    new UUIDProto().setRawUuid(new Uint8Array(16).fill(0x35)).serializeBinary()
  ).toString("hex"),
};

/** 2,500 daily prices, 2020-01-02 onward. */
const ROWS = dailyRows("2020-01-02", 2_500);

let fake: ReturnType<typeof fakeSearch>;

function loadPage() {
  return load({
    locals: { user: { apiKey: KEY } },
    request: { url: "https://example.test/data/prices?type=ticker&id=AAPL" },
  } as any);
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(NOW);
  vi.spyOn(console, "error").mockImplementation(() => {});
  mocks.FetchSecurity.mockReset().mockResolvedValue([AAPL]);
  mocks.FetchSecurityUniverse.mockReset().mockResolvedValue([]);
  mocks.createPriceSearch.mockReset().mockImplementation(() => fake.search);
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("/data/prices load", () => {
  test("2,500 stored prices: all 2,500 rows, newest first, no error", async () => {
    fake = fakeSearch(ROWS);

    const data = await loadPage();

    expect(data.priceError).toBe("");
    expect(data.prices).toHaveLength(2_500);
    for (let i = 1; i < data.prices.length; i++) {
      expect(data.prices[i].asOfMs, `row ${i}`).toBeLessThan(
        data.prices[i - 1].asOfMs
      );
    }
    expect(data.prices.at(-1)).toMatchObject({
      date: "2020-01-02",
      price: 100.25,
    });
    expect(data.prices[0].price).toBe(2_599.25);
    expect(mocks.createPriceSearch).toHaveBeenCalledWith(KEY);
    expectLimitsWithinCeiling(fake.calls);
  });

  test("1,000 rows with a truncation notice: no rows, a 'Price history incomplete' banner", async () => {
    fake = fakeSearch(ROWS.slice(-1_000), {
      summaryOnCall: {
        call: 1,
        summary: warning("Results limited to 1000 records"),
      },
    });

    const data = await loadPage();

    expect(data.prices).toEqual([]);
    expect(data.priceError).toMatch(/^Price history incomplete: /);
    expect(data.priceError).toContain("Results limited to 1000 records");
    expectLimitsWithinCeiling(fake.calls);

    const { container } = render(PricesPage, {
      props: { data: { ...data, universe: Promise.resolve([]) } as any },
    });
    expect(screen.getByText(/Price history incomplete/)).toBeTruthy();
    expect(container.querySelectorAll("tbody tr")).toHaveLength(0);
  });
});
