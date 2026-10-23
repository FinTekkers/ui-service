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
import type { CouponFrequencyProto } from "@fintekkers/ledger-models/node/fintekkers/models/security/coupon_frequency_pb";
import type { IdentifierTypeProto } from "@fintekkers/ledger-models/node/fintekkers/models/security/identifier/identifier_type_pb";
import type { IndexTypeProto } from "@fintekkers/ledger-models/node/fintekkers/models/security/index/index_type_pb";
import type { ProductTypeProto } from "@fintekkers/ledger-models/node/fintekkers/models/security/product_type_pb";

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

/** One row of the SOMA snapshot table, in $ billions. */
export interface SnapshotRow {
  label: string;
  current: number;
  prior: number;
  /** Stored, not computed: the artboard's figures are rounded per row. */
  change: number;
}

/** One slice of the snapshot's composition bar. */
export interface CompositionSlice {
  /** Legend text, e.g. "Notes & bonds". */
  label: string;
  /** The same slice in words, for the bar's accessible name. */
  spoken: string;
  pct: number;
  color: string;
}

/** One card of "What the portfolio is telling us". */
export interface Finding {
  figure: string;
  title: string;
  body: string;
  link?: { href: string; label: string };
}

/** One remaining-maturity bucket of the maturity profile. */
export interface MaturityBucket {
  /** Holdings in $ millions (H.4.1, Table 2). */
  valueM: number;
  /** Share of the asset type's total, %, to 1 decimal place. Also the
   * bar width (metric 3: each bar's width equals its stored share). */
  sharePct: number;
}

export interface MaturityView {
  note: string;
  color: string;
  buckets: MaturityBucket[];
}

/** What /free/soma's load returns. */
export interface SomaResponse {
  /** ISO date of the H.4.1 release the figures come from. */
  asOf: string;
  headline: { total: string; caption: string; change: string };
  composition: CompositionSlice[];
  table: {
    columns: [string, string];
    rows: SnapshotRow[];
    total: SnapshotRow;
  };
  findings: Finding[];
  maturity: {
    labels: string[];
    tsy: MaturityView;
    mbs: MaturityView;
  };
}

/** A security as SecurityProto models it: field names follow its getters
 * (getIdentifiersList, getBondDetails, getTipsExtension, ...), with enum
 * names and decimals as strings. */
export interface MockSecurity {
  productType: keyof typeof ProductTypeProto;
  issuerName: string;
  description: string;
  identifiersList: {
    identifierType: keyof typeof IdentifierTypeProto;
    identifierValue: string;
  }[];
  bondDetails: {
    /** Percent, e.g. "1.875". */
    couponRate: string;
    couponFrequency: keyof typeof CouponFrequencyProto;
    /** ISO dates. */
    datedDate: string;
    maturityDate: string;
  };
  tipsExtension: {
    baseCpi: string;
    inflationIndexType: keyof typeof IndexTypeProto;
  };
}

/** One measure result, with the text the artboard shows for it. */
export interface MockMeasureResult extends MockMeasureEntry {
  display: string;
}

/** One row of the calculator's projected cashflows, as the artboard shows
 * it. */
export interface TipsCashflowRow {
  /** "0.5 yr" */
  time: string;
  indexRatio: string;
  coupon: string;
  /** "—" until the final row. */
  principal: string;
  total: string;
}

/** What /free/tips shows: one TIPS, the calculator's default inputs and its
 * pre-computed results. Every figure is a literal. */
export interface TipsResponse {
  /** ISO date the reference CPI and index ratio are for. */
  asOf: string;
  security: MockSecurity;
  /** The artboard's text for values SecurityProto holds as enums or not at
   * all. */
  securityLabels: { frequency: string; payDates: string; index: string };
  /** The calculator's 7 inputs, as the artboard pre-fills them. */
  inputs: {
    face: string;
    coupon: string;
    baseCpi: string;
    refCpi: string;
    years: string;
    realYield: string;
    inflation: string;
  };
  /** Steps 01–05 of "How this bond tracks inflation". */
  workedExample: {
    baseCpi: string;
    refCpi: string;
    indexRatio: string;
    adjustedPrincipal: string;
    coupon: string;
  };
  valuation: {
    measureResults: MockMeasureResult[];
    /** No MeasureProto holds a single coupon payment. */
    nextCoupon: string;
    /** No MeasureProto holds the undiscounted sum of the cashflows. */
    totalReceived: string;
    cashflows: TipsCashflowRow[];
  };
}
