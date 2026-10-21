/**
 * US-237: the Calculators page loads its CUSIP dropdowns by issuer
 * `US Government` only (no asset class: the RATES search returns 0 until
 * ledger-models#361 reaches ledger-service), then splits the results into
 * bonds, TIPS and FRNs by productType.
 *
 * @vitest-environment node
 */
import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("$lib/grpc-auth", () => ({
  getServiceConnection: vi
    .fn()
    .mockReturnValue({ url: "localhost:80", credentials: {} }),
}));

vi.mock("$lib/security", async (importOriginal) => ({
  ...(await importOriginal<typeof import("$lib/security")>()),
  FetchSecurity: vi.fn().mockResolvedValue([]),
}));

import { FetchSecurity } from "$lib/security";
import { load } from "../routes/(authenticated)/data/calculators/+page.server";

const fetchSecurity = vi.mocked(FetchSecurity);

function security(overrides: Record<string, unknown>) {
  return {
    issuerName: "US Government",
    couponRate: "0.125",
    maturityDate: "2099/01/15",
    ...overrides,
  };
}

async function loadSecurities() {
  const result = await (load as any)({
    locals: { user: { apiKey: "test-key" } },
    request: { url: "http://localhost/data/calculators" },
  });
  return result.streamed.securities;
}

beforeEach(() => {
  fetchSecurity.mockReset();
});

describe("calculators load securities", () => {
  test("searches by issuer US Government with no asset class and splits by productType", async () => {
    fetchSecurity.mockResolvedValue([
      security({ cusip: "912810RL4", productType: "TIPS", baseCpi: "236.08" }),
      security({ cusip: "91282CJN2", productType: "TREASURY_FRN" }),
      security({ cusip: "912810TM0", productType: "BOND" }),
    ] as any);

    const { bondSecurities, tipsSecurities, frnSecurities } =
      await loadSecurities();

    expect(fetchSecurity).toHaveBeenCalledTimes(1);
    expect(fetchSecurity).toHaveBeenCalledWith(
      null,
      "US Government",
      undefined,
      undefined,
      undefined,
      undefined,
      "test-key"
    );
    expect(tipsSecurities.map((s: any) => s.cusip)).toEqual(["912810RL4"]);
    expect(frnSecurities.map((s: any) => s.cusip)).toEqual(["91282CJN2"]);
    expect(bondSecurities.map((s: any) => s.cusip)).toEqual(["912810TM0"]);
  });

  test("a TIPS item keeps its baseCpi in tipsSecurities", async () => {
    fetchSecurity.mockResolvedValue([
      security({ cusip: "912810RL4", productType: "TIPS", baseCpi: "236.08" }),
    ] as any);

    const { tipsSecurities } = await loadSecurities();

    expect(tipsSecurities).toEqual([
      expect.objectContaining({ cusip: "912810RL4", baseCpi: "236.08" }),
    ]);
  });
});
