/**
 * US-250: the homepage "Live from the price service" chart. The loader
 * (src/routes/+page.server.ts) fetches AAPL's daily closes with the
 * server-held FT_HOMEPAGE_API_KEY, never the visitor's key, and the page
 * draws them oldest first or shows the empty state.
 *
 * The security search and the price service are stubbed; the e2e journey
 * in tests/e2e/home-sections.spec.ts covers the real backend.
 */
import { render, waitFor } from "@testing-library/svelte";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  FetchSecurity: vi.fn(),
  FetchSecurityUniverse: vi.fn(),
  PriceService: vi.fn(),
  search: vi.fn(),
  SecurityService: vi.fn(),
  newPlot: vi.fn(),
}));

vi.mock("$lib/security", () => ({
  FetchSecurity: mocks.FetchSecurity,
  FetchSecurityUniverse: mocks.FetchSecurityUniverse,
}));
vi.mock(
  "@fintekkers/ledger-models/node/wrappers/services/price-service/PriceService",
  () => ({ PriceService: mocks.PriceService })
);
vi.mock(
  "@fintekkers/ledger-models/node/wrappers/services/security-service/SecurityService",
  () => ({ SecurityService: mocks.SecurityService })
);
// Under Vitest, `svelte` resolves to its SSR build, whose onMount is a
// no-op; GraphSection draws in onMount, so use the real lifecycle hooks.
vi.mock("svelte", async (importOriginal) => {
  const internal = await import("svelte/internal");
  return {
    ...(await importOriginal<typeof import("svelte")>()),
    onMount: internal.onMount,
    afterUpdate: internal.afterUpdate,
  };
});
// GraphSection calls newPlot on the dynamic import's namespace.
vi.mock("plotly.js-dist", () => ({
  newPlot: mocks.newPlot,
  default: { newPlot: mocks.newPlot },
}));

import { load } from "../routes/+page.server";
import HomePage from "../routes/+page.svelte";
import LiveData from "../components/home/LiveData.svelte";

const SENTINEL = "sentinel-homepage-key-xyz";
const VISITOR_KEY = "visitor-key";
const AAPL = {
  identifier: "AAPL",
  uuidHex: "0a10c0ffee",
  uuidStr: "0a10c0ff-ee00-4000-8000-000000000001",
};

function price(date: string, close: number) {
  const ms = Date.parse(`${date}T20:00:00Z`);
  return {
    getAsOf: () => ({ toDateTime: () => ({ toMillis: () => ms }) }),
    getPrice: () => ({ toNumber: () => close }),
  };
}

// Shuffled on purpose: the loader must sort, not just reverse.
const SHUFFLED = [
  price("2026-04-15", 201.5),
  price("2026-10-13", 247.66),
  price("2025-10-13", 227.1),
  price("2026-07-01", 214.2),
];
const SORTED_DATES = ["2025-10-13", "2026-04-15", "2026-07-01", "2026-10-13"];
const SORTED_CLOSES = [227.1, 201.5, 214.2, 247.66];

type LoadEvent = { locals?: { user?: { apiKey: string } } };
const loggedOut: LoadEvent = {};
const signedIn: LoadEvent = { locals: { user: { apiKey: VISITOR_KEY } } };

function callLoad(event: LoadEvent = loggedOut) {
  // The loader takes no arguments; the event proves nothing from it is read.
  return (load as (e: LoadEvent) => ReturnType<typeof load>)(event);
}

function renderHome(data: Awaited<ReturnType<typeof load>>) {
  return render(HomePage, { props: { data: data as any } });
}

function expectEmptyState(container: HTMLElement) {
  const live = container.querySelector('[data-section="live"]')!;
  expect(live.querySelector(".empty")).not.toBeNull();
  expect(live.querySelector("#plot")).toBeNull();
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.FT_HOMEPAGE_API_KEY = SENTINEL;
  mocks.FetchSecurity.mockResolvedValue([AAPL]);
  mocks.search.mockResolvedValue(SHUFFLED);
  mocks.PriceService.mockImplementation(() => ({ search: mocks.search }));
});

afterEach(() => {
  delete process.env.FT_HOMEPAGE_API_KEY;
});

describe("homepage AAPL chart, logged out", () => {
  test("draws exactly N closes, oldest to newest", async () => {
    const data = await callLoad();
    expect(data.closes).toHaveLength(SHUFFLED.length);

    renderHome(data);
    await waitFor(() => expect(mocks.newPlot).toHaveBeenCalledTimes(1));
    const [target, traces] = mocks.newPlot.mock.calls[0];
    expect(target).toBe("plot");
    expect(traces).toHaveLength(1);
    expect(traces[0].x).toEqual(SORTED_DATES);
    expect(traces[0].y).toEqual(SORTED_CLOSES);
  });

  test("one price search with FT_HOMEPAGE_API_KEY, no universe load, key not in the data", async () => {
    const data = await callLoad();

    expect(mocks.FetchSecurity).toHaveBeenCalledTimes(1);
    const args = mocks.FetchSecurity.mock.calls[0];
    expect(args.slice(2, 4)).toEqual(["AAPL", "EXCH_TICKER"]);
    expect(args[6]).toBe(SENTINEL);
    expect(mocks.PriceService).toHaveBeenCalledTimes(1);
    expect(mocks.PriceService).toHaveBeenCalledWith(SENTINEL);
    expect(mocks.search).toHaveBeenCalledTimes(1);
    expect(mocks.SecurityService).not.toHaveBeenCalled();
    expect(mocks.FetchSecurityUniverse).not.toHaveBeenCalled();

    expect(JSON.stringify(data)).not.toContain(SENTINEL);
    const { container } = renderHome(data);
    expect(container.innerHTML).not.toContain(SENTINEL);
  });

  test.each([
    [
      "the price search rejects",
      () => mocks.search.mockRejectedValue(new Error("14 UNAVAILABLE")),
    ],
    [
      "the price search returns no closes",
      () => mocks.search.mockResolvedValue([]),
    ],
  ])("empty state when %s", async (_, arrange) => {
    arrange();
    const data = await callLoad();
    expect(data).toEqual({ closes: [] });
    expectEmptyState(renderHome(data).container);
  });

  test.each([
    [
      "the AAPL lookup rejects",
      () =>
        mocks.FetchSecurity.mockRejectedValue(new Error("16 UNAUTHENTICATED")),
    ],
    [
      "no AAPL match has a UUID",
      () => mocks.FetchSecurity.mockResolvedValue([{ identifier: "AAPL" }]),
    ],
  ])("empty state, and no price search, when %s", async (_, arrange) => {
    arrange();
    const data = await callLoad();
    expect(data).toEqual({ closes: [] });
    expect(mocks.search).not.toHaveBeenCalled();
    expectEmptyState(renderHome(data).container);
  });
});

describe("homepage AAPL chart, signed in", () => {
  test("uses FT_HOMEPAGE_API_KEY, never the visitor's key", async () => {
    const data = await callLoad(signedIn);
    expect(data.closes).toHaveLength(SHUFFLED.length);
    expect(mocks.FetchSecurity.mock.calls[0][6]).toBe(SENTINEL);
    expect(mocks.PriceService).toHaveBeenCalledWith(SENTINEL);
    const allArgs = JSON.stringify([
      mocks.FetchSecurity.mock.calls,
      mocks.PriceService.mock.calls,
    ]);
    expect(allArgs).not.toContain(VISITOR_KEY);
  });

  test("FT_HOMEPAGE_API_KEY unset: empty state and no calls at all", async () => {
    delete process.env.FT_HOMEPAGE_API_KEY;
    const data = await callLoad(signedIn);
    expect(data).toEqual({ closes: [] });
    expect(mocks.FetchSecurity).not.toHaveBeenCalled();
    expect(mocks.PriceService).not.toHaveBeenCalled();
    expect(mocks.search).not.toHaveBeenCalled();
    expectEmptyState(renderHome(data).container);
  });
});

describe("LiveData copy", () => {
  test.each([
    ["with closes", [{ date: "2026-10-13", close: 247.66 }]],
    ["empty", []],
  ])("mentions AAPL, not SOMA (%s)", (_, data) => {
    const { container } = render(LiveData, { props: { data } });
    const live = container.querySelector('[data-section="live"]')!;
    for (const selector of [".eyebrow", "h2", ".lead", ".card-head .title"]) {
      expect(live.querySelector(selector)?.textContent).toMatch(/AAPL/);
    }
    expect(live.textContent).not.toMatch(/SOMA/);
    expect(live.querySelector('a[href="/login"]')).toBeNull();
    expect(live.textContent).not.toMatch(/sign in/i);
  });
});
