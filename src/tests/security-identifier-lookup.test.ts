/**
 * US-334 guardrail 4: FetchSecurityProtoByCusip keeps its behaviour after
 * the lookup was shared with FetchSecurityProtoByIdentifier: same CUSIP
 * filter, same error text. The generic lookup names its identifier type.
 *
 * @vitest-environment node
 */
import { beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  results: [] as unknown[],
  requests: [] as any[],
}));

vi.mock(
  "@fintekkers/ledger-models/node/fintekkers/services/security-service/security_service_grpc_pb.js",
  async () => {
    const { EventEmitter } = await import("events");
    return {
      SecurityClient: vi.fn().mockImplementation(() => ({
        search: (request: any) => {
          mocks.requests.push(request);
          const stream = new EventEmitter();
          setTimeout(() => {
            stream.emit("data", {
              getSecurityResponseList: () => mocks.results,
            });
            stream.emit("end");
          }, 0);
          return stream;
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

import { IdentifierTypeProto } from "@fintekkers/ledger-models/node/fintekkers/models/security/identifier/identifier_type_pb";
import {
  FetchSecurityProtoByCusip,
  FetchSecurityProtoByIdentifier,
} from "$lib/security";

/** The packed bytes of the identifier the request filters on, as text. */
function filteredIdentifier(): string {
  const filter = mocks.requests[0].getSearchSecurityInput();
  const any = filter.getFiltersList()[0].getFieldValuePacked();
  return Buffer.from(any.getValue_asU8()).toString("latin1");
}

beforeEach(() => {
  mocks.results = [];
  mocks.requests = [];
});

describe("identifier lookups", () => {
  test("a CUSIP with no match keeps its error text", async () => {
    await expect(FetchSecurityProtoByCusip("91282CPU9", "key")).rejects.toThrow(
      /^No security found for CUSIP: 91282CPU9$/
    );
    expect(filteredIdentifier()).toContain("91282CPU9");
  });

  test("a CUSIP with a match returns the first security", async () => {
    mocks.results = ["first", "second"];
    await expect(FetchSecurityProtoByCusip(" 91282CPU9 ", "key")).resolves.toBe(
      "first"
    );
  });

  test("the generic lookup names its identifier type", async () => {
    await expect(
      FetchSecurityProtoByIdentifier(
        IdentifierTypeProto.EXCH_TICKER,
        "SPY",
        "key"
      )
    ).rejects.toThrow(/^No security found for EXCH_TICKER: SPY$/);
    expect(filteredIdentifier()).toContain("SPY");
  });
});
