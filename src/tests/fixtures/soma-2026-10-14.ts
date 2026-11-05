/**
 * US-307: the ledger's grouped SOMA rows (PRODUCT_TYPE × MATURITY_DATE,
 * with DIRECTED_QUANTITY and INFLATION_COMPENSATION) for the week of
 * Wednesday 2026-10-14, and for the year-ago week, 2025-10-15.
 *
 * Traceability, Federal Reserve H.4.1 for the week ended 2026-10-14 (the
 * figures US-252 copied into the /free/soma artboard):
 * - Table 2, U.S. Treasury securities by remaining maturity, $ millions:
 *   106,926 / 390,845 / 529,071 / 1,436,242 / 482,152 / 1,625,316, which
 *   sum to the Treasury total, 4,570,552 (inflation compensation included).
 * - Table 1, $ billions: bills 566.0, notes and bonds nominal 3,618.0,
 *   inflation-indexed 280.0, inflation compensation 106.6.
 * The rows below split those totals to the million: each type's sum rounds
 * to its Table 1 figure, and each bucket's sum is its Table 2 figure.
 * Year-ago Table 1, $ billions: bills 196.0, nominal 3,579.0, TIPS 310.2,
 * inflation compensation 112.2.
 */
import {
  FieldMapEntry,
  MeasureMapEntry,
} from "@fintekkers/ledger-models/node/fintekkers/models/position/position_util_pb.js";
import { PositionProto } from "@fintekkers/ledger-models/node/fintekkers/models/position/position_pb.js";
import { ProductTypeProto } from "@fintekkers/ledger-models/node/fintekkers/models/security/product_type_pb.js";
import field_pkg from "@fintekkers/ledger-models/node/fintekkers/models/position/field_pb.js";
import measure_pkg from "@fintekkers/ledger-models/node/fintekkers/models/position/measure_pb.js";
import { Position } from "@fintekkers/ledger-models/node/wrappers/models/position/position";
import { pack } from "@fintekkers/ledger-models/node/wrappers/models/utils/serialization.util";
import { toDecimalProto } from "../../lib/decimal";
import type { SomaRow } from "../../lib/server/free-soma";

const { FieldProto } = field_pkg;
const { MeasureProto } = measure_pkg;

export const AS_OF = "2026-10-14";
export const PRIOR_AS_OF = "2025-10-15";

/** H.4.1 Table 2, $ millions, week ended 2026-10-14. */
export const PUBLISHED_BUCKETS_M = [
  106926, 390845, 529071, 1436242, 482152, 1625316,
];
export const PUBLISHED_TOTAL_M = 4570552;

const M = "000000"; // $ millions → dollars

function row(
  productType: string,
  maturityDate: string,
  faceM: string,
  icM: string | null = null
): SomaRow {
  return {
    productType,
    maturityDate,
    directedQuantity: `${faceM}${M}`,
    inflationCompensation: icM === null ? null : `${icM}${M}`,
  };
}

export const ROWS: SomaRow[] = [
  // Within 15 days: 106,926
  row("TBILL", "2026-10-22", "60000"),
  row("TREASURY_NOTE", "2026-10-29", "46926"),
  // 16–90 days: 390,845
  row("TBILL", "2026-12-10", "250000"),
  row("TREASURY_FRN", "2026-12-31", "20000"),
  row("TREASURY_NOTE", "2026-11-30", "120845"),
  // 91 days–1 yr: 529,071
  row("TBILL", "2027-04-15", "255983"),
  row("TREASURY_NOTE", "2027-06-30", "263088"),
  row("TIPS", "2027-07-15", "8000", "2000"),
  // 1–5 yrs: 1,436,242
  row("TREASURY_NOTE", "2029-05-15", "1300000"),
  row("TIPS", "2029-01-15", "100000", "36242"),
  // 5–10 yrs: 482,152
  row("TREASURY_NOTE", "2033-08-15", "380000"),
  row("TIPS", "2034-07-15", "80000", "22152"),
  // Over 10 yrs: 1,625,316
  row("TREASURY_BOND", "2045-02-15", "1487132"),
  row("TIPS", "2044-02-15", "92012", "46172"),
];

export const PRIOR_ROWS: SomaRow[] = [
  row("TBILL", "2025-12-11", "196000"),
  row("TREASURY_NOTE", "2028-05-15", "2579000"),
  row("TREASURY_BOND", "2044-02-15", "1000000"),
  row("TIPS", "2030-01-15", "310200", "112200"),
];

/** Out-of-scope rows the ledger may hold under the same portfolio. */
export const OUT_OF_SCOPE_ROWS: SomaRow[] = [
  row("MORTGAGE_BACKED", "2051-06-01", "2100000"),
  row("AGENCY_DEBT", "2027-03-01", "2300"),
];

function dateEntry(iso: string): FieldMapEntry {
  const [y, m, d] = iso.split("-").map(Number);
  return new FieldMapEntry()
    .setField(FieldProto.MATURITY_DATE)
    .setFieldValuePacked(pack(new Date(y, m - 1, d)));
}

function measureEntry(measure: number, value: string): MeasureMapEntry {
  return new MeasureMapEntry()
    .setMeasure(measure)
    .setMeasureDecimalValue(toDecimalProto(value));
}

/** A row as the broker returns it: a Position over a PositionProto, with
 * PRODUCT_TYPE as its enum value. */
export function positionOf(r: SomaRow): Position {
  const type = (ProductTypeProto as unknown as Record<string, number>)[
    r.productType
  ];
  const fields = [
    type === undefined
      ? new FieldMapEntry()
          .setField(FieldProto.PRODUCT_TYPE)
          .setStringValue(r.productType)
      : new FieldMapEntry()
          .setField(FieldProto.PRODUCT_TYPE)
          .setEnumValue(type),
  ];
  if (r.maturityDate) fields.push(dateEntry(r.maturityDate));
  const measures: MeasureMapEntry[] = [];
  if (r.directedQuantity) {
    measures.push(
      measureEntry(MeasureProto.DIRECTED_QUANTITY, r.directedQuantity)
    );
  }
  if (r.inflationCompensation) {
    measures.push(
      measureEntry(MeasureProto.INFLATION_COMPENSATION, r.inflationCompensation)
    );
  }
  return new Position(
    new PositionProto().setFieldsList(fields).setMeasuresList(measures)
  );
}
