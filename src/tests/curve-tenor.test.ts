/**
 * US-218 metric 3: /data/curves reads forward tenors from LM-313's
 * from_tenor / to_tenor fields, and nothing else.
 *
 * Before LM-318 a forward point carried a "from-to" label in the decimal's
 * string form and src/lib/curveTenor.ts parsed its start year. LM-318 deleted
 * that string form (DecimalValueProto has no label field left), so a
 * label-only point cannot be built any more. The negative cases below use the
 * closest shape that remains: a forward point with only `tenor` set, which
 * readers must not parse on FORWARD_YIELD points (curve_response.proto).
 *
 * @vitest-environment node
 */
import fs from "fs";
import path from "path";
import { beforeEach, describe, expect, test, vi } from "vitest";

const capturedCurves: any[] = [];
let curveResponse: any = null;

vi.mock(
  "@fintekkers/ledger-models/node/fintekkers/services/valuation-service/valuation_service_grpc_pb.js",
  () => ({
    ValuationClient: vi.fn().mockImplementation(() => ({
      runCurve: (request: any, callback: Function) => {
        capturedCurves.push(request);
        callback(null, curveResponse);
      },
    })),
  })
);

vi.mock("$lib/grpc-auth", () => ({
  getServiceConnection: vi
    .fn()
    .mockReturnValue({ url: "localhost:80", credentials: {} }),
}));

vi.mock("$lib/treasuryCurveData", async (importOriginal) => {
  const actual: any = await importOriginal();
  return {
    ...actual,
    loadTreasuryCurveBundle: vi.fn(),
    findLatestBuildableDate: vi.fn(),
  };
});

import {
  CurvePointProto,
  CurveResponseProto,
  CurveResultProto,
} from "@fintekkers/ledger-models/node/fintekkers/requests/valuation/curve_response_pb.js";
import { SecurityProto } from "@fintekkers/ledger-models/node/fintekkers/models/security/security_pb.js";
import { ObjectTypeProto } from "@fintekkers/ledger-models/node/fintekkers/models/util/object_type_pb.js";
import measure_pkg from "@fintekkers/ledger-models/node/fintekkers/models/position/measure_pb.js";
import { toDecimalProto } from "$lib/decimal";
import {
  EXPECTED_CONSTITUENT_COUNT,
  findLatestBuildableDate,
  loadTreasuryCurveBundle,
  type CurveConstituent,
} from "$lib/treasuryCurveData";
import { load } from "../routes/(authenticated)/data/curves/+page.server";

const { MeasureProto } = measure_pkg;

function constituent(tenor: string, cleanPrice: number): CurveConstituent {
  return {
    tenor,
    bond: { proto: new SecurityProto() },
    cleanPrice,
  } as unknown as CurveConstituent;
}

function point(fields: {
  tenor?: string;
  from?: string;
  to?: string;
  yield: string;
}): CurvePointProto {
  const p = new CurvePointProto().setYield(toDecimalProto(fields.yield));
  if (fields.tenor !== undefined) p.setTenor(toDecimalProto(fields.tenor));
  if (fields.from !== undefined) p.setFromTenor(toDecimalProto(fields.from));
  if (fields.to !== undefined) p.setToTenor(toDecimalProto(fields.to));
  return p;
}

function respondWith(par: CurvePointProto[], forward: CurvePointProto[]) {
  curveResponse = new CurveResponseProto().setCurveResultsList([
    new CurveResultProto()
      .setCurveType(MeasureProto.PAR_YIELD)
      .setPointsList(par),
    new CurveResultProto()
      .setCurveType(MeasureProto.FORWARD_YIELD)
      .setPointsList(forward),
  ]);
}

async function loadCurves() {
  const url = new URL("http://localhost/data/curves?asof=2026-10-09&term=10");
  return load({ url, locals: {} as App.Locals });
}

beforeEach(() => {
  capturedCurves.length = 0;
  vi.mocked(loadTreasuryCurveBundle).mockResolvedValue({
    asOf: new Date("2026-10-09T12:00:00Z"),
    constituents: [constituent("2Y", 99.25), constituent("10Y", 101.5)],
    pricedCount: EXPECTED_CONSTITUENT_COUNT,
    fullyPriced: true,
  });
  vi.mocked(findLatestBuildableDate).mockResolvedValue({
    date: null,
    bundle: null,
    scannedDays: 1,
  });
});

describe("/data/curves forward tenors come from from_tenor / to_tenor (LM-313)", () => {
  test("from=2, to=12 gives a forward point at year 2", async () => {
    respondWith(
      [point({ tenor: "2", yield: "0.04" })],
      [point({ from: "2", to: "12", yield: "0.045" })]
    );
    const page = await loadCurves();
    expect(page.error).toBeNull();
    expect(page.forward).toHaveLength(1);
    expect(page.forward[0].years).toBe(2);
    expect(page.forward[0].tenor).toBe("2Y");
    expect(page.forward[0].yield).toBeCloseTo(4.5);
  });

  test("from_tenor wins over a conflicting tenor on a forward point", async () => {
    respondWith(
      [],
      [point({ tenor: "5", from: "2", to: "12", yield: "0.045" })]
    );
    const page = await loadCurves();
    expect(page.forward.map((p) => p.years)).toEqual([2]);
  });

  test("par points still read their numeric tenor", async () => {
    respondWith([point({ tenor: "9.95", yield: "0.04" })], []);
    const page = await loadCurves();
    expect(page.par.map((p) => p.years)).toEqual([9.95]);
  });

  test("the request /data/curves sends is stamped as a CurveRequest", async () => {
    respondWith([], []);
    await loadCurves();
    expect(capturedCurves).toHaveLength(1);
    const req = capturedCurves[0];
    expect(req.getObjectType()).toBe(ObjectTypeProto.OBJECT_TYPE_CURVE_REQUEST);
    const v = req.getVersion();
    expect([v.getMajor(), v.getMinor(), v.getPatch()]).toEqual([0, 0, 1]);
  });
});

describe("no label-derived forward tenor", () => {
  test("a forward point without from/to tenors is dropped, not read from its tenor", async () => {
    respondWith(
      [point({ tenor: "2", yield: "0.04" })],
      [
        point({ tenor: "5", yield: "0.05" }),
        point({ from: "1", to: "11", yield: "0.045" }),
      ]
    );
    const page = await loadCurves();
    expect(page.forward.map((p) => p.years)).toEqual([1]);
  });

  test("curveTenor.ts has no label fallback left", () => {
    // LM-318 has no label field to build a label-only point from, so assert
    // the fallback code path itself is gone.
    const source = fs.readFileSync(
      path.resolve(__dirname, "../lib/curveTenor.ts"),
      "utf-8"
    );
    expect(source).not.toContain("FORWARD_LABEL");
    expect(source).not.toMatch(/Arbitrary/);
  });
});
