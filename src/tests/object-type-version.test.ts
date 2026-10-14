/**
 * US-220 metric 2 — ledger-models 0.4.45 (LM-318 / LM-320): every message
 * carries `ObjectTypeProto object_type = 1` and `VersionProto version = 2`,
 * set through the library's `stampOwn`.
 *
 * Requests are captured from the service's own API and checked after a
 * serializeBinary → deserializeBinary round trip, so the wire form is what is
 * asserted. ui-service builds no *ResponseProto in production; the mocked
 * CurveResponseProto reply goes through the same round trip before
 * runCurve.ts receives it, and the decoded message is asserted.
 *
 * @vitest-environment node
 */
import { beforeEach, describe, expect, test, vi } from "vitest";

const capturedCurves: any[] = [];
const receivedCurveResponses: any[] = [];
const capturedPrices: any[] = [];
const capturedDeletes: any[] = [];

vi.mock(
  "@fintekkers/ledger-models/node/fintekkers/services/valuation-service/valuation_service_grpc_pb.js",
  async () => {
    const { CurveResponseProto } = await import(
      "@fintekkers/ledger-models/node/fintekkers/requests/valuation/curve_response_pb.js"
    );
    const { stampOwn } = await import(
      "@fintekkers/ledger-models/node/wrappers/util/object-types"
    );
    return {
      ValuationClient: vi.fn().mockImplementation(() => ({
        runCurve: (request: any, callback: Function) => {
          capturedCurves.push(request);
          const reply = CurveResponseProto.deserializeBinary(
            stampOwn(new CurveResponseProto()).serializeBinary()
          );
          receivedCurveResponses.push(reply);
          callback(null, reply);
        },
      })),
    };
  }
);

vi.mock(
  "@fintekkers/ledger-models/node/fintekkers/services/price-service/price_service_grpc_pb.js",
  async () => {
    const { EventEmitter } = await import("events");
    return {
      PriceClient: vi.fn().mockImplementation(() => ({
        search: (request: any) => {
          capturedPrices.push(request);
          const stream = new EventEmitter();
          setTimeout(() => stream.emit("end"));
          return stream;
        },
      })),
    };
  }
);

vi.mock(
  "@fintekkers/ledger-models/node/fintekkers/services/security-service/security_service_grpc_pb.js",
  async () => {
    const { DeleteResponseProto } = await import(
      "@fintekkers/ledger-models/node/fintekkers/requests/util/delete_request_pb.js"
    );
    return {
      SecurityClient: vi.fn().mockImplementation(() => ({
        delete: (request: any, callback: Function) => {
          capturedDeletes.push(request);
          callback(null, new DeleteResponseProto().setSuccess(true));
        },
      })),
    };
  }
);

vi.mock("$lib/grpc-auth", () => ({
  getServiceConnection: vi
    .fn()
    .mockReturnValue({ url: "localhost:80", credentials: {} }),
}));

import { ObjectTypeProto } from "@fintekkers/ledger-models/node/fintekkers/models/util/object_type_pb.js";
import { CurveRequestProto } from "@fintekkers/ledger-models/node/fintekkers/requests/valuation/curve_request_pb.js";
import { CurveResponseProto } from "@fintekkers/ledger-models/node/fintekkers/requests/valuation/curve_response_pb.js";
import { QueryPriceRequestProto } from "@fintekkers/ledger-models/node/fintekkers/requests/price/query_price_request_pb.js";
import { DeleteRequestProto } from "@fintekkers/ledger-models/node/fintekkers/requests/util/delete_request_pb.js";
import { SecurityProto } from "@fintekkers/ledger-models/node/fintekkers/models/security/security_pb.js";
import { UUID } from "@fintekkers/ledger-models/node/wrappers/models/utils/uuid";
import { runCurveParYieldsByTenor } from "$lib/runCurve";
import { fetchPricesForSecurity } from "$lib/curvePrices";
import { deleteSecurity } from "$lib/security-delete";
import type { CurveConstituent } from "$lib/treasuryCurveData";

function expectOwnTypeAndVersion(message: any, objectType: number) {
  expect(message.getObjectType()).toBe(objectType);
  expect(message.hasVersion()).toBe(true);
  const version = message.getVersion();
  expect(version.getMajor()).toBe(0);
  expect(version.getMinor()).toBe(0);
  expect(version.getPatch()).toBe(1);
}

const constituent = (tenor: string, cleanPrice: number) =>
  ({
    tenor,
    bond: { proto: new SecurityProto() },
    cleanPrice,
  } as unknown as CurveConstituent);

beforeEach(() => {
  capturedCurves.length = 0;
  receivedCurveResponses.length = 0;
  capturedPrices.length = 0;
  capturedDeletes.length = 0;
});

describe("US-220 metric 2: messages carry their own object_type and version 0.0.1", () => {
  test("the expected types are distinct, so a shared default cannot pass", () => {
    const expected = [
      ObjectTypeProto.OBJECT_TYPE_CURVE_REQUEST,
      ObjectTypeProto.OBJECT_TYPE_CURVE_RESPONSE,
      ObjectTypeProto.OBJECT_TYPE_QUERY_PRICE_REQUEST,
      ObjectTypeProto.OBJECT_TYPE_DELETE_REQUEST,
    ];
    expect(new Set(expected).size).toBe(expected.length);
    expect(expected).not.toContain(ObjectTypeProto.OBJECT_TYPE_UNKNOWN);
  });

  test("runCurve.ts writes a CurveRequestProto", async () => {
    await runCurveParYieldsByTenor(
      [constituent("2Y", 99.25), constituent("10Y", 101.5)],
      new Date("2026-10-09T00:00:00Z")
    );
    expect(capturedCurves).toHaveLength(1);
    const decoded = CurveRequestProto.deserializeBinary(
      capturedCurves[0].serializeBinary()
    );
    expectOwnTypeAndVersion(decoded, ObjectTypeProto.OBJECT_TYPE_CURVE_REQUEST);
  });

  test("runCurve.ts receives a CurveResponseProto decoded from the wire", async () => {
    await runCurveParYieldsByTenor(
      [constituent("2Y", 99.25), constituent("10Y", 101.5)],
      new Date("2026-10-09T00:00:00Z")
    );
    expect(receivedCurveResponses).toHaveLength(1);
    const reply = receivedCurveResponses[0];
    expect(reply).toBeInstanceOf(CurveResponseProto);
    expectOwnTypeAndVersion(reply, ObjectTypeProto.OBJECT_TYPE_CURVE_RESPONSE);
  });

  test("curvePrices.ts writes a QueryPriceRequestProto", async () => {
    await fetchPricesForSecurity(UUID.random().toString());
    expect(capturedPrices).toHaveLength(1);
    const decoded = QueryPriceRequestProto.deserializeBinary(
      capturedPrices[0].serializeBinary()
    );
    expectOwnTypeAndVersion(
      decoded,
      ObjectTypeProto.OBJECT_TYPE_QUERY_PRICE_REQUEST
    );
  });

  test("security-delete.ts writes a DeleteRequestProto", async () => {
    // The page passes the serialized UUIDProto as hex.
    const uuidHex = Buffer.from(
      UUID.random().toUUIDProto().serializeBinary()
    ).toString("hex");
    const result = await deleteSecurity(uuidHex, true);
    expect(result.error).toBeUndefined();
    expect(capturedDeletes).toHaveLength(1);
    const decoded = DeleteRequestProto.deserializeBinary(
      capturedDeletes[0].serializeBinary()
    );
    expectOwnTypeAndVersion(
      decoded,
      ObjectTypeProto.OBJECT_TYPE_DELETE_REQUEST
    );
  });
});
