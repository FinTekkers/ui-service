/**
 * US-303 metric 2: on the FRN tab, a looked-up FRN's fixings are read
 * through the broker-service PriceClient, and the request's `frn` arm
 * carries exactly those fixings, oldest first. A typed reference rate does
 * not replace them.
 *
 * The security lookups, the PriceClient stream and the valuation client are
 * stubbed; getServiceConnection returns a sentinel broker connection.
 */
import { EventEmitter } from "events";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  BROKER: { url: "broker.sentinel:8085", credentials: { broker: true } },
  FetchSecurityProtoByCusip: vi.fn(),
  searchSecurityAsOfNow: vi.fn(),
  PriceClient: vi.fn(),
  priceRows: [] as any[],
  requests: [] as any[],
}));

vi.mock("$lib/grpc-auth", () => ({
  getServiceConnection: vi.fn().mockReturnValue(mocks.BROKER),
}));
vi.mock("$lib/security", async (importOriginal) => ({
  ...(await importOriginal<typeof import("$lib/security")>()),
  FetchSecurity: vi.fn().mockResolvedValue([]),
  FetchSecurityProtoByCusip: mocks.FetchSecurityProtoByCusip,
}));
vi.mock(
  "@fintekkers/ledger-models/node/wrappers/services/security-service/SecurityService",
  () => ({
    SecurityService: vi.fn().mockImplementation(() => ({
      searchSecurityAsOfNow: mocks.searchSecurityAsOfNow,
    })),
  })
);
vi.mock(
  "@fintekkers/ledger-models/node/fintekkers/services/price-service/price_service_grpc_pb.js",
  () => ({ PriceClient: mocks.PriceClient })
);
vi.mock(
  "@fintekkers/ledger-models/node/fintekkers/services/valuation-service/valuation_service_grpc_pb.js",
  () => ({
    ValuationClient: vi.fn().mockImplementation(() => ({
      runValuation: (request: any, callback: Function) => {
        mocks.requests.push(request);
        callback(null, {
          getMeasureResultsList: () => [],
          getCashflowsList: () => [],
        });
      },
    })),
  })
);

import {
  IndexDetailsProto,
  SecurityProto,
} from "@fintekkers/ledger-models/node/fintekkers/models/security/security_pb.js";
import { ProductTypeProto } from "@fintekkers/ledger-models/node/fintekkers/models/security/product_type_pb.js";
import index_type_pkg from "@fintekkers/ledger-models/node/fintekkers/models/security/index/index_type_pb.js";
import { fromDecimalProto, toDecimalProto } from "$lib/decimal";
import { load } from "../routes/(authenticated)/data/calculators/+page.server";
import { lookedUp } from "./fixtures/pricer-securities";

const { IndexTypeProto } = index_type_pkg;

const NOW = new Date("2026-10-28T15:00:00Z");
const TBILL_SERIES = "0a10c0ff-ee00-4000-8000-0000000013b1";
const SOFR_SERIES = "0a10c0ff-ee00-4000-8000-00000000050f";

function series(uuid: string, productType: number, index: number) {
  return {
    proto: new SecurityProto()
      .setProductType(productType)
      .setIndexDetails(new IndexDetailsProto().setIndexType(index)),
    getID: () => ({ toString: () => uuid }),
  };
}

/** A RATE price stamped at 00:00 New York (04:00Z in EDT) on `date`. */
function fixingRow(date: string, rate: string) {
  const seconds = Date.parse(`${date}T04:00:00Z`) / 1000;
  return {
    getAsOf: () => ({ getTimestamp: () => ({ getSeconds: () => seconds }) }),
    getPrice: () => toDecimalProto(rate),
  };
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(NOW);
  mocks.requests.length = 0;
  mocks.FetchSecurityProtoByCusip.mockResolvedValue(lookedUp("FRN"));
  mocks.searchSecurityAsOfNow.mockResolvedValue([
    series(SOFR_SERIES, ProductTypeProto.SOFR_SERIES, IndexTypeProto.SOFR),
    series(
      TBILL_SERIES,
      ProductTypeProto.T_BILL_13_WEEK_SERIES,
      IndexTypeProto.T_BILL_13_WEEK
    ),
  ]);
  // Out of order, as the stream may return them.
  mocks.priceRows = [
    fixingRow("2026-10-26", "3.905"),
    fixingRow("2026-10-14", "3.955"),
    fixingRow("2026-10-20", "3.930"),
  ];
  mocks.PriceClient.mockReset().mockImplementation(() => ({
    search: vi.fn().mockImplementation(() => {
      const stream = new EventEmitter();
      queueMicrotask(() => {
        stream.emit("data", { getPriceResponseList: () => mocks.priceRows });
        stream.emit("end");
      });
      return stream;
    }),
  }));
});

afterEach(() => {
  vi.useRealTimers();
});

async function loadFrn(query: string) {
  const data: any = await (load as any)({
    locals: { user: { apiKey: "test-key" } },
    request: {
      url: `http://localhost/data/calculators?tab=frn&frnMode=cusip&frnCusip=91282CJN2&frnPrice=99.9&${query}`,
    },
  });
  return data.frnResult;
}

describe("metric 2: FRN fixings come through the broker PriceClient", () => {
  test("the PriceClient is built on the broker connection and searches the T-bill series", async () => {
    const result = await loadFrn("referenceRate=&frnSpread=");

    expect(result.error).toBeUndefined();
    expect(mocks.PriceClient).toHaveBeenCalledTimes(1);
    expect(mocks.PriceClient.mock.calls[0][0]).toBe(mocks.BROKER.url);
    expect(mocks.PriceClient.mock.calls[0][1]).toBe(mocks.BROKER.credentials);

    const client = mocks.PriceClient.mock.results[0].value;
    const query = client.search.mock.calls[0][0];
    const filter = query.getSearchPriceInput().getFiltersList()[0];
    expect(filter).toBeDefined();
    expect(query.hasDateRange()).toBe(true);
  });

  test("the frn arm carries the fixing values, oldest first, with their dates and index", async () => {
    await loadFrn("referenceRate=&frnSpread=");

    expect(mocks.requests).toHaveLength(1);
    const fixings = mocks.requests[0]
      .getProductInput()
      .getFrn()
      .getFixingsList();
    expect(fixings.map((f: any) => fromDecimalProto(f.getRate()))).toEqual([
      "3.955",
      "3.930",
      "3.905",
    ]);
    expect(
      fixings.map((f: any) => {
        const d = f.getFixingDate();
        return `${d.getYear()}-${d.getMonth()}-${d.getDay()}`;
      })
    ).toEqual(["2026-10-14", "2026-10-20", "2026-10-26"]);
    for (const f of fixings) {
      expect(f.getIndex()).toBe(IndexTypeProto.T_BILL_13_WEEK);
    }
  });

  test("a typed reference rate does not replace the broker fixings", async () => {
    await loadFrn("referenceRate=9.99&frnSpread=50");

    const fixings = mocks.requests[0]
      .getProductInput()
      .getFrn()
      .getFixingsList();
    const rates = fixings.map((f: any) => fromDecimalProto(f.getRate()));
    expect(rates).toEqual(["3.955", "3.930", "3.905"]);
    expect(rates).not.toContain("9.99");
  });
});
