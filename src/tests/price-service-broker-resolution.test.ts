/**
 * US-209: the prices page reaches the price service through the broker.
 *
 * Before LM-287 (@fintekkers/ledger-models 0.4.31) the JS PriceService
 * connected to API_URL on the ledger port, so the page called
 * ledger-service:8082 and failed with "UNIMPLEMENTED: Method not found:
 * …Price/Search". From 0.4.31 every wrapper client asks ledger-models'
 * service lookup, which puts BROKER_HOST first.
 *
 *   - metric 1: package-lock pins ledger-models at or above the LM-287
 *     release, and the price client the prices page load() builds connects
 *     to BROKER_HOST (127.0.0.1:8085), not port 8082.
 *   - guardrail 1: the prices page server code names no address or port.
 */
import fs from "fs";
import path from "path";
import { afterAll, beforeAll, describe, expect, test, vi } from "vitest";
import { UUIDProto } from "@fintekkers/ledger-models/node/fintekkers/models/util/uuid_pb.js";
import { expectLedgerModelsAtLeast } from "./ledgerModelsPin";

const LM_287_RELEASE = "0.4.31";
const ROUTE = "src/routes/(authenticated)/data/prices/+page.server.ts";

// Keep the real PriceService constructor (that is what resolves the address)
// and record each instance; only search() is stubbed so no call goes out.
const priceServices: any[] = [];
vi.mock(
  "@fintekkers/ledger-models/node/wrappers/services/price-service/PriceService",
  async (importOriginal) => {
    const actual = await importOriginal<
      typeof import("@fintekkers/ledger-models/node/wrappers/services/price-service/PriceService")
    >();
    class RecordingPriceService extends actual.PriceService {
      constructor(apiKey?: string) {
        super(apiKey);
        priceServices.push(this);
      }
      search = vi.fn().mockResolvedValue([]);
    }
    return { ...actual, PriceService: RecordingPriceService };
  }
);

function aaplUuidHex(): string {
  const proto = new UUIDProto();
  proto.setRawUuid(new Uint8Array(16).fill(7));
  return Buffer.from(proto.serializeBinary()).toString("hex");
}

vi.mock("$lib/security", () => ({
  FetchSecurityUniverse: vi.fn().mockResolvedValue([]),
  FetchSecurity: vi.fn().mockImplementation(async () => [
    {
      uuidHex: aaplUuidHex(),
      identifier: "AAPL",
      issuerName: "Apple Inc",
    },
  ]),
}));

describe("metric 1: prices page price client resolves to the broker", () => {
  let load: (event: any) => Promise<any>;

  beforeAll(async () => {
    // Set before the page module (and ledger-models) is imported, in case
    // anything on that path reads the address at load time.
    vi.stubEnv("BROKER_HOST", "127.0.0.1:8085");
    vi.stubEnv("API_URL", "localhost");
    ({ load } = await import(
      "../routes/(authenticated)/data/prices/+page.server"
    ));
  });

  afterAll(() => {
    vi.unstubAllEnvs();
  });

  test(`package-lock pins ${LM_287_RELEASE} or later`, () => {
    expectLedgerModelsAtLeast(LM_287_RELEASE);
  });

  test("load() for ticker AAPL builds its PriceClient on 127.0.0.1:8085, not 8082", async () => {
    priceServices.length = 0;
    const data = await load({
      locals: { user: { apiKey: "test-key" } },
      request: new Request("http://localhost/data/prices?type=ticker&id=AAPL"),
    });

    expect(data.priceError).toBe("");
    expect(priceServices).toHaveLength(1);
    const service = priceServices[0];
    expect(service.search).toHaveBeenCalledTimes(1);

    const target: string = service.client.getChannel().getTarget();
    expect(target).toMatch(/(^|:)127\.0\.0\.1:8085$/);
    expect(target).not.toContain(":8082");
    service.client.close();
  });
});

describe("guardrail 1: no service address in the prices page server code", () => {
  test(`${ROUTE} names no broker or service port`, () => {
    const src = fs.readFileSync(path.resolve(ROUTE), "utf-8");
    expect(src).not.toContain("8082");
    expect(src).not.toContain("8085");
    expect(src).not.toContain("BROKER_HOST");
  });
});
