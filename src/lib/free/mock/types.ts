// Shapes of the mock data behind the Free data explorer (/free/*). They
// mirror PositionProto from ledger-models, but with enum names and plain
// strings so mock files stay readable. Type-only imports: nothing from
// ledger-models ships to the page, and nothing calls the backend.
import type { FieldProto } from "@fintekkers/ledger-models/node/fintekkers/models/position/field_pb";
import type { MeasureProto } from "@fintekkers/ledger-models/node/fintekkers/models/position/measure_pb";
import type {
  PositionTypeProto,
  PositionViewProto,
} from "@fintekkers/ledger-models/node/fintekkers/models/position/position_pb";

/** One entry of PositionProto's fields list, e.g. SECURITY_ID → a CUSIP. */
export interface MockFieldEntry {
  field: keyof typeof FieldProto;
  value: string;
}

/** One entry of PositionProto's measures list. */
export interface MockMeasureEntry {
  measure: keyof typeof MeasureProto;
  /** A decimal as a string, e.g. "1234.56", so no precision is lost. */
  value: string;
}

/** A position as PositionProto models it. */
export interface MockPosition {
  /** ISO date the position is as of, e.g. "2026-10-21". */
  asOf: string;
  positionView: keyof typeof PositionViewProto;
  positionType: keyof typeof PositionTypeProto;
  fields: MockFieldEntry[];
  measures: MockMeasureEntry[];
}
