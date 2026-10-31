/**
 * US-303 on /free/tips, through its entry point fetchFreeTips:
 *   - metric 1 (R2): the valuation request's arm comes from the security
 *     the CUSIP lookup returned (ledger-models' forSecurity), not from the
 *     page being a TIPS page.
 *   - metric 3 (R6): with no CPI-U readings the valuation client is never
 *     called and the valuation section shows its unavailable message.
 *
 * The security lookup, price search, CPI-U lookup, fixings fetch and
 * valuation client are stubbed.
 */
import { beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  FetchSecurityProtoByCusip: vi.fn(),
  fetchCpiReadings: vi.fn(),
  fetchFixings: vi.fn(),
  search: vi.fn(),
  runValuation: vi.fn(),
}));

vi.mock("$lib/grpc-auth", () => ({
  getServiceConnection: vi
    .fn()
    .mockReturnValue({ url: "localhost:80", credentials: {} }),
}));
vi.mock("$lib/security", async (importOriginal) => ({
  ...(await importOriginal<typeof import("$lib/security")>()),
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
  "@fintekkers/ledger-models/node/wrappers/services/price-service/PriceService",
  () => ({
    PriceService: vi.fn().mockImplementation(() => ({ search: mocks.search })),
  })
);
vi.mock(
  "@fintekkers/ledger-models/node/fintekkers/services/valuation-service/valuation_service_grpc_pb.js",
  () => ({
    ValuationClient: vi.fn().mockImplementation(() => ({
      runValuation: mocks.runValuation,
    })),
  })
);

import { TipsExtensionProto } from "@fintekkers/ledger-models/node/fintekkers/models/security/security_pb.js";
import { ReferenceRateFixingProto } from "@fintekkers/ledger-models/node/fintekkers/requests/valuation/product_inputs_pb.js";
import { LocalDateProto } from "@fintekkers/ledger-models/node/fintekkers/models/util/local_date_pb.js";
import index_type_pkg from "@fintekkers/ledger-models/node/fintekkers/models/security/index/index_type_pb.js";
import { toDecimalProto } from "$lib/decimal";
import { UNAVAILABLE } from "$lib/free/tips";
import { fetchFreeTips, FREE_TIPS_CUSIP } from "$lib/server/free-tips";
import {
  CPI_READINGS,
  EXPECTED_ARM,
  armOf,
  lookedUp,
  type ReturnedType,
} from "./fixtures/pricer-securities";

const { IndexTypeProto } = index_type_pkg;

const NOW = new Date("2026-10-28T15:00:00Z");

/** The returned security, with the TIPS fields /free/tips's security panel
 * reads, whatever its product type. */
function returned(type: ReturnedType) {
  const proto = lookedUp(type);
  if (!proto.getTipsExtension()) {
    proto.setTipsExtension(
      new TipsExtensionProto()
        .setBaseCpi(toDecimalProto("319.12345"))
        .setInflationIndexType(IndexTypeProto.CPI_U)
    );
  }
  return proto;
}

beforeEach(() => {
  mocks.FetchSecurityProtoByCusip.mockReset();
  mocks.fetchCpiReadings
    .mockReset()
    .mockResolvedValue({ readings: CPI_READINGS, latestMonth: null });
  mocks.fetchFixings
    .mockReset()
    .mockResolvedValue([
      new ReferenceRateFixingProto()
        .setIndex(IndexTypeProto.T_BILL_13_WEEK)
        .setFixingDate(
          new LocalDateProto().setYear(2026).setMonth(10).setDay(26)
        )
        .setRate(toDecimalProto("4.215")),
    ]);
  const ms = Date.parse("2026-10-23T00:00:00Z");
  mocks.search.mockReset().mockResolvedValue([
    {
      getAsOf: () => ({ toDateTime: () => ({ toMillis: () => ms }) }),
      getPrice: () => ({ toString: () => "98.4375" }),
    },
  ]);
  mocks.runValuation
    .mockReset()
    .mockImplementation((_request: any, callback: Function) =>
      callback(null, {
        getMeasureResultsList: () => [],
        getCashflowsList: () => [],
      })
    );
});

describe("metric 1: /free/tips values on the returned security's arm", () => {
  test.each(["TBILL", "STRIPS", "MBS", "FRN", "TIPS"] as ReturnedType[])(
    "lookup of %s returns its arm",
    async (type) => {
      mocks.FetchSecurityProtoByCusip.mockResolvedValue(returned(type));

      await fetchFreeTips("homepage-key", NOW);

      expect(mocks.FetchSecurityProtoByCusip).toHaveBeenCalledWith(
        FREE_TIPS_CUSIP,
        "homepage-key"
      );
      expect(mocks.runValuation).toHaveBeenCalledTimes(1);
      expect(armOf(mocks.runValuation.mock.calls[0][0])).toBe(
        EXPECTED_ARM[type]
      );
    }
  );
});

describe("metric 3: /free/tips with no CPI-U", () => {
  test("never calls the valuation client and shows the valuation as unavailable", async () => {
    mocks.FetchSecurityProtoByCusip.mockResolvedValue(returned("TIPS"));
    mocks.fetchCpiReadings.mockResolvedValue({
      readings: null,
      latestMonth: "Jul 2026",
    });

    const data = await fetchFreeTips("homepage-key", NOW);

    expect(mocks.runValuation).not.toHaveBeenCalled();
    expect(data.valuation).toEqual({
      ok: false,
      message: UNAVAILABLE.valuation,
    });
  });
});
