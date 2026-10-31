/**
 * US-303 metric 3: when the market data the looked-up security's arm needs
 * is missing, ledger-models' builder raises MissingMarketDataError, the page
 * shows its message, and the valuation client is never called.
 *
 *   - R4/R5: a TIPS with no CPI on the TIPS tab, and an FRN with no fixings
 *     on the FRN and bond tabs, rendered from the real load output.
 *   - R7: a checkProductInput violation is shown the same way.
 */
import { render, screen } from "@testing-library/svelte";
import { beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  FetchSecurityProtoByCusip: vi.fn(),
  fetchCpiReadings: vi.fn(),
  fetchFixings: vi.fn(),
  checkProductInput: vi.fn(),
  runValuation: vi.fn(),
}));

vi.mock("$lib/grpc-auth", () => ({
  getServiceConnection: vi
    .fn()
    .mockReturnValue({ url: "localhost:80", credentials: {} }),
}));
vi.mock("$lib/security", async (importOriginal) => ({
  ...(await importOriginal<typeof import("$lib/security")>()),
  FetchSecurity: vi.fn().mockResolvedValue([]),
  FetchSecurityProtoByCusip: mocks.FetchSecurityProtoByCusip,
}));
vi.mock("$lib/cpi", async (importOriginal) => ({
  ...(await importOriginal<typeof import("$lib/cpi")>()),
  fetchCpiReadings: mocks.fetchCpiReadings,
}));
vi.mock("$lib/fixings", async (importOriginal) => ({
  ...(await importOriginal<typeof import("$lib/fixings")>()),
  fetchFixings: mocks.fetchFixings,
}));
vi.mock(
  "@fintekkers/ledger-models/node/wrappers/models/security/product_inputs",
  async (importOriginal) => {
    const actual = await importOriginal<typeof import("$lib/productInputs")>();
    mocks.checkProductInput.mockImplementation(actual.checkProductInput);
    return { ...actual, checkProductInput: mocks.checkProductInput };
  }
);
vi.mock(
  "@fintekkers/ledger-models/node/fintekkers/services/valuation-service/valuation_service_grpc_pb.js",
  () => ({
    ValuationClient: vi.fn().mockImplementation(() => ({
      runValuation: mocks.runValuation,
    })),
  })
);

import {
  MissingMarketDataError,
  ModelValidationError,
  violation,
} from "@fintekkers/ledger-models/node/wrappers/models/errors";
import { UUID } from "@fintekkers/ledger-models/node/wrappers/models/utils/uuid";
import { load } from "../routes/(authenticated)/data/calculators/+page.server";
import BondCalculator from "../components/widgets/BondCalculator.svelte";
import FrnCalculator from "../components/widgets/FrnCalculator.svelte";
import TipsCalculator from "../components/widgets/TipsCalculator.svelte";
import { SECURITY_UUID, lookedUp } from "./fixtures/pricer-securities";

const CUSIP = "912828ZZ9";
const ID = new UUID(UUID.fromString(SECURITY_UUID));

const NO_CPI = new MissingMarketDataError("tips", "CPI_U", "tips.cpi", ID)
  .message;
const NO_FIXINGS = new MissingMarketDataError(
  "frn",
  "FRN_FIXINGS",
  "frn.fixings",
  ID
).message;

async function loadPage(query: string) {
  return (load as any)({
    locals: { user: { apiKey: "test-key" } },
    request: { url: `http://localhost/data/calculators?${query}` },
  });
}

beforeEach(() => {
  mocks.FetchSecurityProtoByCusip.mockReset();
  mocks.fetchCpiReadings
    .mockReset()
    .mockResolvedValue({ readings: null, latestMonth: "Jul 2026" });
  mocks.fetchFixings.mockReset().mockResolvedValue([]);
  mocks.checkProductInput.mockClear();
  mocks.runValuation.mockReset();
});

describe("metric 3: missing market data is shown and nothing is sent", () => {
  test("TIPS tab: a TIPS with no CPI shows the MissingMarketDataError message", async () => {
    mocks.FetchSecurityProtoByCusip.mockResolvedValue(lookedUp("TIPS"));
    const data = await loadPage(
      `tab=tips&tipsMode=cusip&tipsCusip=${CUSIP}&tipsPrice=99.5&settlementDate=2026-10-28&currentCpi=`
    );

    expect(data.tipsResult.error).toBe(NO_CPI);
    expect(mocks.runValuation).not.toHaveBeenCalled();

    const { container } = render(TipsCalculator, {
      props: { result: data.tipsResult, cpi: data.tipsCpi },
    });
    expect(screen.getByText(NO_CPI)).toBeVisible();
    expect(container.querySelector(".results-table")).toBeNull();
  });

  test.each([
    [
      "FRN",
      "frnResult",
      FrnCalculator,
      `tab=frn&frnMode=cusip&frnCusip=${CUSIP}&frnPrice=99.5`,
    ],
    ["bond", "result", BondCalculator, `mode=cusip&cusip=${CUSIP}&price=99.5`],
  ] as const)(
    "%s tab: an FRN with no fixings shows the MissingMarketDataError message",
    async (_tab, key, component, query) => {
      mocks.FetchSecurityProtoByCusip.mockResolvedValue(lookedUp("FRN"));
      const data = await loadPage(query);

      expect(mocks.fetchFixings).toHaveBeenCalledTimes(1);
      expect(data[key].error).toBe(NO_FIXINGS);
      expect(mocks.runValuation).not.toHaveBeenCalled();

      const { container } = render(component as any, {
        props: { result: data[key] },
      });
      expect(screen.getByText(NO_FIXINGS)).toBeVisible();
      expect(container.querySelector(".results-table")).toBeNull();
    }
  );

  test("a checkProductInput violation is shown and nothing is sent", async () => {
    mocks.FetchSecurityProtoByCusip.mockResolvedValue(lookedUp("TBILL"));
    const error = new ModelValidationError([
      violation("product_input.bond", ID, "clean_price is required"),
    ]);
    mocks.checkProductInput.mockImplementationOnce(() => {
      throw error;
    });

    const data = await loadPage(`mode=cusip&cusip=${CUSIP}&price=99.5`);

    expect(mocks.checkProductInput).toHaveBeenCalledTimes(1);
    expect(data.result.error).toBe(error.message);
    expect(data.result.error).toContain("clean_price is required");
    expect(mocks.runValuation).not.toHaveBeenCalled();
  });
});
