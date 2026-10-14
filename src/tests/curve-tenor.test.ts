/**
 * US-220 metric 4 — /data/curves reads forward-curve tenors from LM-313's
 * `from_tenor` / `to_tenor` fields only. Par and spot points keep reading
 * `tenor`, as the 0.4.45 proto says.
 *
 * LM-318 deleted the decimal string, so 0.4.45 has no field that can hold a
 * text label such as "0-10". The only tenor-like value left on a forward
 * point is a numeric `tenor`, which readers must not parse: such a point,
 * with no from/to fields, gets no tenor.
 *
 * @vitest-environment node
 */
import fs from "fs";
import path from "path";
import { beforeEach, describe, expect, test, vi } from "vitest";

let curveReply: any = null;

vi.mock(
  "@fintekkers/ledger-models/node/fintekkers/services/valuation-service/valuation_service_grpc_pb.js",
  () => ({
    ValuationClient: vi.fn().mockImplementation(() => ({
      runCurve: (_request: any, callback: Function) =>
        callback(null, curveReply),
    })),
  })
);

vi.mock("$lib/grpc-auth", () => ({
  getServiceConnection: vi
    .fn()
    .mockReturnValue({ url: "localhost:80", credentials: {} }),
}));

vi.mock("$lib/treasuryCurveData", async (importOriginal) => {
  const actual = await importOriginal<
    typeof import("$lib/treasuryCurveData")
  >();
  const { SecurityProto } = await import(
    "@fintekkers/ledger-models/node/fintekkers/models/security/security_pb.js"
  );
  const constituent = (tenor: string, cleanPrice: number) => ({
    tenor,
    cusip: tenor,
    bond: { proto: new SecurityProto() },
    cleanPrice,
  });
  const bundle = {
    asOf: new Date("2026-10-09T12:00:00Z"),
    constituents: [constituent("2Y", 99.25), constituent("10Y", 101.5)],
    pricedCount: actual.EXPECTED_CONSTITUENT_COUNT,
    fullyPriced: true,
  };
  return {
    ...actual,
    loadTreasuryCurveBundle: vi.fn().mockResolvedValue(bundle),
    findLatestBuildableDate: vi
      .fn()
      .mockResolvedValue({ date: null, bundle: null, scannedDays: 1 }),
  };
});

import {
  CurvePointProto,
  CurveResponseProto,
  CurveResultProto,
} from "@fintekkers/ledger-models/node/fintekkers/requests/valuation/curve_response_pb.js";
import measure_pkg from "@fintekkers/ledger-models/node/fintekkers/models/position/measure_pb.js";
import { stampOwn } from "@fintekkers/ledger-models/node/wrappers/util/object-types";
import { toDecimalProto } from "$lib/decimal";
import { curvePointYears } from "$lib/curveTenor";
import { load } from "../routes/(authenticated)/data/curves/+page.server";

const { MeasureProto } = measure_pkg;

function point(fields: {
  tenor?: string;
  fromTenor?: string;
  toTenor?: string;
  yield?: string;
}): CurvePointProto {
  const p = new CurvePointProto();
  if (fields.tenor !== undefined) p.setTenor(toDecimalProto(fields.tenor));
  if (fields.fromTenor !== undefined)
    p.setFromTenor(toDecimalProto(fields.fromTenor));
  if (fields.toTenor !== undefined)
    p.setToTenor(toDecimalProto(fields.toTenor));
  if (fields.yield !== undefined) p.setYield(toDecimalProto(fields.yield));
  return p;
}

function result(curveType: number, points: CurvePointProto[]) {
  return new CurveResultProto().setCurveType(curveType).setPointsList(points);
}

/** A stamped reply, decoded from the wire as the page receives it. */
function reply(results: CurveResultProto[]): CurveResponseProto {
  const response = stampOwn(new CurveResponseProto()).setCurveResultsList(
    results
  );
  return CurveResponseProto.deserializeBinary(response.serializeBinary());
}

async function loadCurves() {
  return load({
    url: new URL("http://localhost/data/curves?asof=2026-10-09&term=1"),
    locals: {} as App.Locals,
  });
}

/** Yields rounded off the parseFloat x 100 noise, as the page shows them. */
function rounded(
  points: Array<{ tenor: string; years: number; yield: number }>
) {
  return points.map((p) => ({ ...p, yield: Number(p.yield.toFixed(6)) }));
}

beforeEach(() => {
  curveReply = null;
});

describe("curvePointYears", () => {
  test("a forward point reads its years from from_tenor", () => {
    const fwd = point({ fromTenor: "1.5", toTenor: "2.5", yield: "0.04" });
    expect(curvePointYears(fwd, MeasureProto.FORWARD_YIELD)).toBe(1.5);
    // 0 is a valid start: the first forward period.
    const first = point({ fromTenor: "0", toTenor: "1", yield: "0.04" });
    expect(curvePointYears(first, MeasureProto.FORWARD_YIELD)).toBe(0);
  });

  test("a forward point with a tenor-like `tenor` but no from/to fields gets null", () => {
    // `tenor` is the field the "0-10" label lived in before LM-318.
    const labelled = point({ tenor: "10", yield: "0.04" });
    expect(curvePointYears(labelled, MeasureProto.FORWARD_YIELD)).toBeNull();
  });

  test("a forward point with no tenor fields at all gets null", () => {
    const bare = point({ yield: "0.04" });
    expect(curvePointYears(bare, MeasureProto.FORWARD_YIELD)).toBeNull();
  });

  test("par and spot points keep reading tenor", () => {
    const p = point({ tenor: "9.95", yield: "0.04" });
    expect(curvePointYears(p, MeasureProto.PAR_YIELD)).toBe(9.95);
    expect(curvePointYears(p, MeasureProto.SPOT_YIELD)).toBe(9.95);
    expect(
      curvePointYears(point({ yield: "0.04" }), MeasureProto.PAR_YIELD)
    ).toBeNull();
  });

  test("curveTenor.ts has no label fallback", () => {
    const source = fs.readFileSync(
      path.resolve(__dirname, "../lib/curveTenor.ts"),
      "utf-8"
    );
    expect(source).not.toContain("FORWARD_LABEL");
    expect(source).not.toMatch(/catch/);
    expect(source).not.toMatch(/arbitrary/i);
  });
});

describe("/data/curves load", () => {
  test("par, spot and forward each keep their points", async () => {
    curveReply = reply([
      result(MeasureProto.PAR_YIELD, [point({ tenor: "2", yield: "0.0412" })]),
      result(MeasureProto.SPOT_YIELD, [
        point({ tenor: "9.95", yield: "0.0425" }),
      ]),
      result(MeasureProto.FORWARD_YIELD, [
        point({ fromTenor: "1", toTenor: "2", yield: "0.045" }),
      ]),
    ]);
    const page = await loadCurves();
    expect(page.error).toBeNull();
    expect(rounded(page.par)).toEqual([{ tenor: "2Y", years: 2, yield: 4.12 }]);
    expect(rounded(page.spot)).toEqual([
      { tenor: "9.95Y", years: 9.95, yield: 4.25 },
    ]);
    expect(rounded(page.forward)).toEqual([
      { tenor: "1Y", years: 1, yield: 4.5 },
    ]);
  });

  test("a forward point with no from/to fields is dropped", async () => {
    curveReply = reply([
      result(MeasureProto.FORWARD_YIELD, [
        point({ tenor: "10", yield: "0.045" }),
        point({ yield: "0.046" }),
        point({ fromTenor: "2", toTenor: "3", yield: "0.047" }),
      ]),
    ]);
    const page = await loadCurves();
    expect(rounded(page.forward)).toEqual([
      { tenor: "2Y", years: 2, yield: 4.7 },
    ]);
  });
});
