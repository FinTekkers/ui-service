/**
 * US-242: on the positions page an ADJUSTED_COST_BASIS request shows the
 * "not supported yet" error, never a blank cell. UNADJUSTED_COST_BASIS and
 * PROFIT_LOSS behave as before, and other errors keep their prefix.
 */
import { render, screen } from "@testing-library/svelte";
import { beforeEach, describe, expect, test, vi } from "vitest";

const { FetchPosition } = vi.hoisted(() => ({ FetchPosition: vi.fn() }));

vi.mock("$lib/positions", () => ({ FetchPosition }));
vi.mock("$lib/portfolios", () => ({
  FetchPortfolioUniverse: vi.fn().mockResolvedValue([]),
}));

import fieldPkg from "@fintekkers/ledger-models/node/fintekkers/models/position/field_pb.js";
import measurePkg from "@fintekkers/ledger-models/node/fintekkers/models/position/measure_pb.js";
import { load } from "../routes/(authenticated)/data/positions/+page.server";
import PositionsPage from "../routes/(authenticated)/data/positions/+page.svelte";

function url(measures: string) {
  const params = new URLSearchParams({
    fields: "SECURITY_DESCRIPTION",
    measures,
    positionView: "DEFAULT_VIEW",
    positionType: "TRANSACTION",
  });
  return `http://localhost/data/positions?${params}`;
}

async function loadFor(measures: string): Promise<any> {
  return load({
    locals: { user: { apiKey: "key" } },
    request: { url: url(measures) },
  } as any);
}

const { FieldProto } = fieldPkg;
const { MeasureProto } = measurePkg;
const DESC = FieldProto.SECURITY_DESCRIPTION;

const ROW = {
  [DESC]: "UST 4.25% 2030",
  [MeasureProto.UNADJUSTED_COST_BASIS]: 101.5,
  [MeasureProto.PROFIT_LOSS]: 12.5,
};

beforeEach(() => {
  FetchPosition.mockReset();
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("positions load", () => {
  test("UNIMPLEMENTED shows the backend's details verbatim", async () => {
    FetchPosition.mockRejectedValue({
      code: 12,
      details: "ADJUSTED_COST_BASIS is not supported yet",
    });
    const result = await loadFor("ADJUSTED_COST_BASIS");
    expect(result.error).toBe("ADJUSTED_COST_BASIS is not supported yet");
  });

  test("UNIMPLEMENTED with empty details falls back to the catalog's measure", async () => {
    FetchPosition.mockRejectedValue({ code: 12, details: "" });
    const result = await loadFor("MARKET_VALUE,ADJUSTED_COST_BASIS");
    expect(result.error).toBe("ADJUSTED_COST_BASIS is not supported yet");
  });

  test("a reply with no value for ADJUSTED_COST_BASIS still says it is not supported", async () => {
    FetchPosition.mockResolvedValue([]);
    const result = await loadFor("ADJUSTED_COST_BASIS");
    expect(result.error).toBe("ADJUSTED_COST_BASIS is not supported yet");
    expect(result.unsupportedMeasures).toEqual(["ADJUSTED_COST_BASIS"]);
  });

  test.each(["UNADJUSTED_COST_BASIS", "PROFIT_LOSS"])(
    "%s still returns rows with no error",
    async (measure) => {
      FetchPosition.mockResolvedValue([ROW]);
      const result = await loadFor(measure);
      expect(result.positions).toEqual([ROW]);
      expect(result.error).toBeNull();
      expect(result.unsupportedMeasures).toEqual([]);
    }
  );

  test("other errors keep the Could not load positions prefix", async () => {
    FetchPosition.mockRejectedValue({
      code: 3,
      details: "FRN requires spread",
    });
    const result = await loadFor("MARKET_VALUE");
    expect(result.error).toBe("Could not load positions: FRN requires spread");
  });
});

describe("positions page", () => {
  test("shows the error and no blank ADJUSTED_COST_BASIS cell", async () => {
    FetchPosition.mockResolvedValue([
      { [DESC]: "UST 4.25% 2030", [MeasureProto.MARKET_VALUE]: 100 },
    ]);
    const data = await loadFor("MARKET_VALUE,ADJUSTED_COST_BASIS");
    render(PositionsPage, { props: { data } });

    expect(screen.getByRole("alert").textContent).toContain(
      "ADJUSTED_COST_BASIS is not supported yet"
    );
    const row = screen.getByText("UST 4.25% 2030").closest("tr")!;
    const cells = Array.from(row.querySelectorAll("td")).map((td) =>
      td.textContent?.trim()
    );
    expect(cells).toEqual(["UST 4.25% 2030", "$100.00", "Not supported yet"]);
  });
});
