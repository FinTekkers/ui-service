/**
 * US-218 metric 2: on LM-318 every message the service sends names its type
 * as `ObjectTypeProto object_type = 1` and its schema as
 * `VersionProto version = 2`, set only through ledger-models' `stamp`. The
 * old `object_class` / string `version` fields are gone.
 *
 * Each request is captured at the gRPC client, sent through the service's
 * public functions.
 *
 * @vitest-environment node
 */
import { createRequire } from "module";
import { beforeEach, describe, expect, test, vi } from "vitest";

const captured: { delete: any[]; priceSearch: any[]; valuation: any[] } = {
  delete: [],
  priceSearch: [],
  valuation: [],
};

vi.mock(
  "@fintekkers/ledger-models/node/fintekkers/services/security-service/security_service_grpc_pb.js",
  () => ({
    SecurityClient: vi.fn().mockImplementation(() => ({
      delete: (request: any, callback: Function) => {
        captured.delete.push(request);
        callback(null, {
          getSuccess: () => true,
          getTotalCount: () => 1,
          getAffectedEntitiesList: () => [],
          getWarningsList: () => [],
        });
      },
    })),
  })
);

vi.mock(
  "@fintekkers/ledger-models/node/fintekkers/services/price-service/price_service_grpc_pb.js",
  async () => {
    const { EventEmitter } = await import("events");
    return {
      PriceClient: vi.fn().mockImplementation(() => ({
        search: (request: any) => {
          captured.priceSearch.push(request);
          const stream = new EventEmitter();
          setTimeout(() => stream.emit("end"));
          return stream;
        },
      })),
    };
  }
);

vi.mock(
  "@fintekkers/ledger-models/node/fintekkers/services/valuation-service/valuation_service_grpc_pb.js",
  () => ({
    ValuationClient: vi.fn().mockImplementation(() => ({
      runValuation: (request: any, callback: Function) => {
        captured.valuation.push(request);
        callback(null, {
          getMeasureResultsList: () => [],
          getCashflowsList: () => [],
        });
      },
    })),
  })
);

vi.mock("$lib/grpc-auth", () => ({
  getServiceConnection: vi
    .fn()
    .mockReturnValue({ url: "localhost:80", credentials: {} }),
}));

import { ObjectTypeProto } from "@fintekkers/ledger-models/node/fintekkers/models/util/object_type_pb.js";
import { UUID } from "@fintekkers/ledger-models/node/wrappers/models/utils/uuid";
import { deleteSecurity } from "$lib/security-delete";
import { fetchPricesForSecurity } from "$lib/curvePrices";
import { RunBondValuation } from "$lib/valuation";
import { expectLedgerModelsAtLeast } from "./ledgerModelsPin";

/** First @fintekkers/ledger-models release with LM-318's object_type + VersionProto. */
const LM_318_RELEASE = "0.4.44";

/** Exact type, version (0, 0, 1) field by field, and none of the old fields. */
function expectStamped(message: any, objectType: ObjectTypeProto) {
  expect(message.getObjectType()).toBe(objectType);
  expect(message.hasVersion()).toBe(true);
  const version = message.getVersion();
  expect(version.getMajor()).toBe(0);
  expect(version.getMinor()).toBe(0);
  expect(version.getPatch()).toBe(1);

  const obj = message.toObject();
  expect(obj).not.toHaveProperty("objectClass");
  expect(typeof obj.version).not.toBe("string");
  expect(obj.version).toEqual({ major: 0, minor: 0, patch: 1 });
  expect(obj.objectType).toBe(objectType);
}

beforeEach(() => {
  captured.delete.length = 0;
  captured.priceSearch.length = 0;
  captured.valuation.length = 0;
});

describe("US-218 metric 2: requests carry object_type and VersionProto (0, 0, 1)", () => {
  test("deleteSecurity sends a DeleteRequest", async () => {
    // The hex of a serialized UUIDProto, as the securities page passes it.
    const uuidHex = Buffer.from(
      UUID.random().toUUIDProto().serializeBinary()
    ).toString("hex");
    const result = await deleteSecurity(uuidHex, true);
    expect(result.error).toBeUndefined();
    expect(captured.delete).toHaveLength(1);
    expectStamped(
      captured.delete[0],
      ObjectTypeProto.OBJECT_TYPE_DELETE_REQUEST
    );
  });

  test("fetchPricesForSecurity sends a QueryPriceRequest", async () => {
    await fetchPricesForSecurity(UUID.random().toString());
    expect(captured.priceSearch).toHaveLength(1);
    expectStamped(
      captured.priceSearch[0],
      ObjectTypeProto.OBJECT_TYPE_QUERY_PRICE_REQUEST
    );
  });

  test("RunBondValuation sends a ValuationRequest with a stamped Security inside", async () => {
    await RunBondValuation({
      mode: "manual",
      price: "98.5",
      faceValue: "100",
      couponRate: "5",
      couponFrequency: "SEMIANNUALLY",
      maturityDate: "2030-01-15",
    });
    expect(captured.valuation).toHaveLength(1);
    const request = captured.valuation[0];
    expectStamped(request, ObjectTypeProto.OBJECT_TYPE_VALUATION_REQUEST);
    expectStamped(
      request.getProductInput().getBond().getSecurity(),
      ObjectTypeProto.OBJECT_TYPE_SECURITY
    );
  });
});

describe("US-218: ledger-models pin and the CJS entry the scripts use", () => {
  test(`package-lock resolves ledger-models at ${LM_318_RELEASE} or later, installed`, () => {
    expectLedgerModelsAtLeast(LM_318_RELEASE);
  });

  test("require() finds stamp and ObjectTypeProto for src/scripts/*.cjs", () => {
    const require = createRequire(import.meta.url);
    const {
      stamp,
    } = require("@fintekkers/ledger-models/node/wrappers/util/object-types");
    const {
      ObjectTypeProto: CjsObjectTypeProto,
    } = require("@fintekkers/ledger-models/node/fintekkers/models/util/object_type_pb.js");
    const {
      PriceProto,
    } = require("@fintekkers/ledger-models/node/fintekkers/models/price/price_pb.js");
    expect(typeof stamp).toBe("function");
    expectStamped(
      stamp(new PriceProto(), CjsObjectTypeProto.OBJECT_TYPE_PRICE),
      ObjectTypeProto.OBJECT_TYPE_PRICE
    );
  });
});
