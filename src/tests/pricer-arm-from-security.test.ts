/**
 * US-303: every calculator prices a CUSIP on the arm ledger-models'
 * `forSecurity` picks for the security the lookup returned, not for the tab
 * the user is on.
 *
 *   - metric 1 (R1): the calculators load in CUSIP mode, with CPI,
 *     referenceRate and frnSpread left empty, sends `bond` for a TBILL or
 *     STRIPS, `mbs` for an MBS, `frn` for an FRN and `tips` for a TIPS, on
 *     the bond, TIPS and FRN tabs, with no pre-lookup field error.
 *   - cross-type measures (R3): a page sends only its own measures that
 *     are in ledger-models' measuresForArm list for the built arm (LM-427);
 *     the others stay blank. There is no hand-kept list in ui-service.
 *   - guardrail 4 (R12): an unmapped type fails loudly, with no request.
 *
 * The CUSIP lookup, CPI-U lookup, fixings fetch and valuation client are
 * stubbed.
 */
import fs from "fs";
import path from "path";
import { beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  FetchSecurityProtoByCusip: vi.fn(),
  fetchCpiReadings: vi.fn(),
  fetchFixings: vi.fn(),
  requests: [] as any[],
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
  "@fintekkers/ledger-models/node/fintekkers/services/valuation-service/valuation_service_grpc_pb.js",
  async () => {
    const { toDecimalProto } = await import("$lib/decimal");
    return {
      ValuationClient: vi.fn().mockImplementation(() => ({
        runValuation: (request: any, callback: Function) => {
          mocks.requests.push(request);
          callback(null, {
            getMeasureResultsList: () =>
              request.getMeasuresList().map((m: number) => ({
                getMeasure: () => m,
                getMeasureDecimalValue: () => toDecimalProto("1"),
              })),
            getCashflowsList: () => [],
          });
        },
      })),
    };
  }
);

import { ReferenceRateFixingProto } from "@fintekkers/ledger-models/node/fintekkers/requests/valuation/product_inputs_pb.js";
import { LocalDateProto } from "@fintekkers/ledger-models/node/fintekkers/models/util/local_date_pb.js";
import index_type_pkg from "@fintekkers/ledger-models/node/fintekkers/models/security/index/index_type_pb.js";
import measure_pkg from "@fintekkers/ledger-models/node/fintekkers/models/position/measure_pb.js";
import { toDecimalProto } from "$lib/decimal";
import { measuresForArm } from "$lib/productInputs";
import { load } from "../routes/(authenticated)/data/calculators/+page.server";
import {
  CPI_READINGS,
  EXPECTED_ARM,
  armOf,
  lookedUp,
  type ReturnedType,
} from "./fixtures/pricer-securities";

const { IndexTypeProto } = index_type_pkg;
const { MeasureProto } = measure_pkg;

const CUSIP = "912797ZZ1";

/** Each tab in CUSIP mode, with every type-specific field left empty. */
const TABS = {
  bond: { query: `mode=cusip&cusip=${CUSIP}&price=99.5`, key: "result" },
  tips: {
    query: `tab=tips&tipsMode=cusip&tipsCusip=${CUSIP}&tipsPrice=99.5&settlementDate=2026-10-28&currentCpi=&referenceCpi=`,
    key: "tipsResult",
  },
  frn: {
    query: `tab=frn&frnMode=cusip&frnCusip=${CUSIP}&frnPrice=99.5&referenceRate=&frnSpread=`,
    key: "frnResult",
  },
} as const;
type Tab = keyof typeof TABS;

async function loadTab(tab: Tab) {
  const data: any = await (load as any)({
    locals: { user: { apiKey: "test-key" } },
    request: { url: `http://localhost/data/calculators?${TABS[tab].query}` },
  });
  return data[TABS[tab].key];
}

beforeEach(() => {
  mocks.requests.length = 0;
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
});

const TYPES: ReturnedType[] = ["TBILL", "STRIPS", "MBS", "FRN", "TIPS"];
const ROWS = (Object.keys(TABS) as Tab[]).flatMap((tab) =>
  TYPES.map((type) => [tab, type] as [Tab, ReturnedType])
);

describe("metric 1: the arm comes from the looked-up security, on every tab", () => {
  test.each(ROWS)("%s tab, lookup returns a %s", async (tab, type) => {
    mocks.FetchSecurityProtoByCusip.mockResolvedValue(lookedUp(type));

    const result = await loadTab(tab);

    expect(result.error).toBeUndefined();
    expect(mocks.FetchSecurityProtoByCusip).toHaveBeenCalledWith(
      CUSIP,
      "test-key"
    );
    expect(mocks.requests).toHaveLength(1);
    expect(armOf(mocks.requests[0])).toBe(EXPECTED_ARM[type]);
    const armMeasures: number[] = measuresForArm(EXPECTED_ARM[type]);
    for (const m of mocks.requests[0].getMeasuresList()) {
      expect(armMeasures).toContain(m);
    }
    expect(mocks.requests[0].hasSecurityInput()).toBe(false);
    expect(mocks.requests[0].hasPriceInput()).toBe(false);
  });

  test("the FRN arm carries the fetched fixings; no other arm asks for them", async () => {
    mocks.FetchSecurityProtoByCusip.mockResolvedValue(lookedUp("FRN"));
    await loadTab("bond");
    const frn = mocks.requests[0].getProductInput().getFrn();
    expect(frn.getFixingsList()).toHaveLength(1);

    mocks.FetchSecurityProtoByCusip.mockResolvedValue(lookedUp("TBILL"));
    mocks.fetchFixings.mockClear();
    await loadTab("frn");
    expect(mocks.fetchFixings).not.toHaveBeenCalled();
  });
});

describe("cross-type measures: a page sends only what the built arm computes", () => {
  test("an MBS on the TIPS tab sends only the mbs arm's measures and leaves the TIPS-only ones blank", async () => {
    mocks.FetchSecurityProtoByCusip.mockResolvedValue(lookedUp("MBS"));

    const result = await loadTab("tips");

    expect(mocks.requests[0].getMeasuresList()).toEqual([
      MeasureProto.PRESENT_VALUE,
      MeasureProto.CURRENT_YIELD,
      MeasureProto.YIELD_TO_MATURITY,
      MeasureProto.MACAULAY_DURATION,
      MeasureProto.PRESENT_VALUE_CASHFLOWS,
    ]);
    expect(result.error).toBeUndefined();
    expect(result.referenceCpi).toBeUndefined();
    expect(result.indexRatio).toBeUndefined();
    expect(result.realYield).toBeUndefined();
    expect(result.inflationAdjustedPrincipal).toBeUndefined();
    expect(result.presentValue).toBe("1");
  });

  test("a TBILL on the FRN tab drops DISCOUNT_MARGIN and leaves it blank", async () => {
    mocks.FetchSecurityProtoByCusip.mockResolvedValue(lookedUp("TBILL"));

    const result = await loadTab("frn");

    const sent = mocks.requests[0].getMeasuresList();
    expect(sent).not.toContain(MeasureProto.DISCOUNT_MARGIN);
    expect(sent).toContain(MeasureProto.PRESENT_VALUE);
    expect(result.error).toBeUndefined();
    expect(result.discountMargin).toBeUndefined();
    expect(result.presentValue).toBe("1");
  });

  test("a page's own type still sends its whole measure list", async () => {
    mocks.FetchSecurityProtoByCusip.mockResolvedValue(lookedUp("TBILL"));
    await loadTab("bond");
    mocks.FetchSecurityProtoByCusip.mockResolvedValue(lookedUp("TIPS"));
    await loadTab("tips");

    expect(mocks.requests[0].getMeasuresList()).toHaveLength(9);
    expect(mocks.requests[1].getMeasuresList()).toHaveLength(9);
  });
});

describe("per-arm measures come from ledger-models, not a hand-kept list", () => {
  test("valuation.ts reads measuresForArm and keeps no arm measure list", () => {
    const src = fs.readFileSync(path.resolve("src/lib/valuation.ts"), "utf-8");
    expect(src).toContain("measuresForArm(armFor(security))");
    expect(src).not.toContain("ARM_MEASURES");
  });

  test("DV01 is listed for the bond and TIPS arms, which the old list omitted", () => {
    expect(measuresForArm("bond")).toContain(MeasureProto.DV01);
    expect(measuresForArm("tips")).toContain(MeasureProto.DV01);
    expect(measuresForArm("frn")).not.toContain(MeasureProto.DV01);
  });
});

describe("guardrail 4: an unmapped type fails loudly, with no fallback", () => {
  test.each(Object.keys(TABS) as Tab[])(
    "%s tab, lookup returns a CPI_SERIES",
    async (tab) => {
      mocks.FetchSecurityProtoByCusip.mockResolvedValue(lookedUp("CPI_SERIES"));

      const result = await loadTab(tab);

      expect(result.error).toBe(
        "No valuation arm for product_type CPI_SERIES, coupon_type UNKNOWN_COUPON_TYPE"
      );
      expect(mocks.requests).toHaveLength(0);
    }
  );
});
