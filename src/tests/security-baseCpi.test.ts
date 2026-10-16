/**
 * US-232: the TIPS Pricer's Reference CPI auto-fill reads `baseCpi` off
 * the rows `FetchSecurity` returns. It used to sit behind a class
 * identity check against an imported TIPSBond, which is always false at
 * runtime (the class Security.create instantiates is a different copy),
 * so `baseCpi` was never set. Covers both mapping paths in security.ts:
 * `FetchSecurity` (the calculators page) and `FetchSecurityByUuid`
 * (`mapSecuritiesToData`).
 *
 * @vitest-environment node
 */
import { readFileSync } from "fs";
import { resolve } from "path";
import { beforeEach, describe, expect, test, vi } from "vitest";

const TIPS_CUSIP = "912810RL4";
const NOTE_CUSIP = "91282CJL6";

// Protos the mocked security service streams back, built per test.
let searchProtos: () => any[] = () => [];

async function buildProtos() {
  const { Decimal } = await import("decimal.js");
  const TIPSBond = (
    await vi.importActual<any>(
      "@fintekkers/ledger-models/node/wrappers/models/security/TIPSBond"
    )
  ).default;
  const BondSecurity = (
    await import(
      "@fintekkers/ledger-models/node/wrappers/models/security/BondSecurity"
    )
  ).default;
  const { CouponTypeProto } = await import(
    "@fintekkers/ledger-models/node/fintekkers/models/security/coupon_type_pb.js"
  );
  const { CouponFrequencyProto } = await import(
    "@fintekkers/ledger-models/node/fintekkers/models/security/coupon_frequency_pb.js"
  );
  const { IdentifierProto } = await import(
    "@fintekkers/ledger-models/node/fintekkers/models/security/identifier/identifier_pb.js"
  );
  const { IdentifierTypeProto } = await import(
    "@fintekkers/ledger-models/node/fintekkers/models/security/identifier/identifier_type_pb.js"
  );
  const index_type_pkg = (
    await import(
      "@fintekkers/ledger-models/node/fintekkers/models/security/index/index_type_pb.js"
    )
  ).default;

  const { UUID } = await import(
    "@fintekkers/ledger-models/node/wrappers/models/utils/uuid"
  );
  const { ZonedDateTime } = await import(
    "@fintekkers/ledger-models/node/wrappers/models/utils/datetime"
  );
  // Security.create needs a UUID and as_of, as a stored row has.
  const stored = <T>(proto: T): T =>
    (proto as any)
      .setUuid(UUID.random().toUUIDProto())
      .setAsOf(ZonedDateTime.now().toProto())
      .setIssuerName("US Government")
      .setAssetClass("RATES");

  const cusip = (value: string) =>
    new IdentifierProto()
      .setIdentifierType(IdentifierTypeProto.CUSIP)
      .setIdentifierValue(value);

  const common = {
    faceValue: new Decimal("1000"),
    couponRate: new Decimal("0.75"),
    couponType: CouponTypeProto.FIXED,
    couponFrequency: CouponFrequencyProto.SEMIANNUALLY,
    issueDate: new Date("2015-02-15"),
    maturityDate: new Date("2045-02-15"),
  };
  const tips = stored(
    TIPSBond.fromPricerInputs({
      ...common,
      baseCpi: new Decimal("235.4815"),
      indexDate: new Date("2015-02-15"),
      inflationIndexType: index_type_pkg.IndexTypeProto.CPI_U,
    })
  ).setIdentifiersList([cusip(TIPS_CUSIP)]);
  const note = stored(BondSecurity.fromPricerInputs(common)).setIdentifiersList(
    [cusip(NOTE_CUSIP)]
  );
  return { tips, note };
}

vi.mock(
  "@fintekkers/ledger-models/node/fintekkers/services/security-service/security_service_grpc_pb.js",
  async () => {
    const { EventEmitter } = await import("events");
    return {
      SecurityClient: vi.fn().mockImplementation(() => ({
        search: () => {
          const stream = new EventEmitter();
          setTimeout(() => {
            stream.emit("data", {
              getSecurityResponseList: () => searchProtos(),
            });
            stream.emit("end");
          }, 0);
          return stream;
        },
      })),
    };
  }
);

// FetchSecurityByUuid goes through the wrapper SecurityService; stub its
// lookup so the returned rows run through mapSecuritiesToData.
vi.mock(
  "@fintekkers/ledger-models/node/wrappers/services/security-service/SecurityService",
  async () => {
    const Security = (
      await import(
        "@fintekkers/ledger-models/node/wrappers/models/security/security"
      )
    ).default;
    return {
      SecurityService: vi.fn().mockImplementation(() => ({
        searchByUuid: async () =>
          searchProtos().map((proto) => Security.create(proto)),
      })),
    };
  }
);

// Reproduce the SSR build: a TIPSBond imported by app code is a
// different class from the one Security.create instantiates inside the
// wrapper, so any class identity check on it is false.
vi.mock(
  "@fintekkers/ledger-models/node/wrappers/models/security/TIPSBond",
  () => ({ default: class DetachedTIPSBond {} })
);

vi.mock("$lib/grpc-auth", () => ({
  getServiceConnection: vi
    .fn()
    .mockReturnValue({ url: "localhost:80", credentials: {} }),
}));

import { FetchSecurity, FetchSecurityByUuid } from "$lib/security";

function byCusip(rows: { identifier: string }[], cusip: string): any {
  const row = rows.find((r) => r.identifier === cusip);
  expect(row, `row for ${cusip}`).toBeDefined();
  return row;
}

describe("US-232: baseCpi from tips_extension.base_cpi", () => {
  beforeEach(async () => {
    const { tips, note } = await buildProtos();
    searchProtos = () => [tips, note];
  });

  test("FetchSecurity (calculators page path) sets baseCpi on the TIPS only", async () => {
    // Same arguments the calculators page passes.
    const rows = await FetchSecurity(
      "RATES",
      "US Government",
      undefined,
      undefined,
      undefined,
      undefined,
      "test-api-key"
    );
    const tips = byCusip(rows, TIPS_CUSIP);
    expect(tips.productType).toBe("TIPS");
    expect(tips.baseCpi).toBe("235.4815");
    expect(byCusip(rows, NOTE_CUSIP).baseCpi).toBeUndefined();
  });

  test("FetchSecurityByUuid (mapSecuritiesToData) sets baseCpi on the TIPS only", async () => {
    const rows = await FetchSecurityByUuid(
      "00000000-0000-4000-8000-000000000000",
      "test-api-key"
    );
    expect(byCusip(rows, TIPS_CUSIP).baseCpi).toBe("235.4815");
    expect(byCusip(rows, NOTE_CUSIP).baseCpi).toBeUndefined();
  });

  test("a TIPS with no tips_extension gets no baseCpi and does not drop the row", async () => {
    const { tips, note } = await buildProtos();
    tips.clearTipsExtension();
    searchProtos = () => [tips, note];
    const rows = await FetchSecurity(
      "RATES",
      "US Government",
      undefined,
      undefined,
      undefined,
      undefined,
      "test-api-key"
    );
    expect(byCusip(rows, TIPS_CUSIP).baseCpi).toBeUndefined();
    expect(byCusip(rows, NOTE_CUSIP)).toBeDefined();
  });

  // Belt and braces for the mock above: keep the identity check out.
  test("security.ts does not narrow on the TIPSBond class", () => {
    const source = readFileSync(
      resolve(__dirname, "../lib/security.ts"),
      "utf8"
    );
    expect(source).not.toMatch(/instanceof\s+TIPSBond/);
  });
});
