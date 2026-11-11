/**
 * US-307: /free/soma's and /free's live figures: the Fed's SOMA Treasury
 * holdings from the FinTekkers ledger, for one H.4.1 week.
 *
 * The caller passes the server-held homepage key (FT_HOMEPAGE_API_KEY),
 * never a visitor's. Lives under src/lib/server/ so SvelteKit refuses any
 * client import of it. One position search per week, through the broker:
 * DIRECTED_QUANTITY and the ledger's INFLATION_COMPENSATION (LS-206), by
 * IDENTIFIER, PRODUCT_TYPE and MATURITY_DATE, for trades on or before the
 * week. US-309: its rows feed Positions by CUSIP as well as the totals. A
 * second search for the year-ago week, by PRODUCT_TYPE and MATURITY_DATE
 * only, feeds the table's prior column only.
 *
 * Totals, shares and the six H.4.1 Table 2 buckets are summed here, from
 * MATURITY_DATE relative to the week. Inflation compensation is the
 * ledger's figure as returned; nothing here recomputes it. Rows of any
 * product type outside the Treasury scope are dropped. A failed or empty
 * search makes every section unavailable; a row Positions by CUSIP can't
 * show makes that section alone unavailable. Nothing here throws, and
 * nothing falls back to a mock.
 *
 * US-317: Holdings over time is a third search, for every week at once:
 * SOMA's trades by TRADE_DATE, TRANSACTION_TYPE and PRODUCT_TYPE, with
 * DIRECTED_QUANTITY only. The cash legs (WITHDRAWAL and DEPOSIT) are
 * dropped, the rest summed cumulatively by date, and each H.4.1 Wednesday
 * read off; MATURATION rows are negative, so matured bonds net out. The
 * page renders without waiting for it: it is streamed, capped at
 * SOMA_HISTORY_TIMEOUT_MS, and a failure makes that section alone
 * unavailable.
 */
import Decimal from "decimal.js";
import type { FieldMapEntry } from "@fintekkers/ledger-models/node/fintekkers/models/position/position_util_pb";
import type { LocalDateProto } from "@fintekkers/ledger-models/node/fintekkers/models/util/local_date_pb";
import field_pkg from "@fintekkers/ledger-models/node/fintekkers/models/position/field_pb.js";
import measure_pkg from "@fintekkers/ledger-models/node/fintekkers/models/position/measure_pb.js";
import position_pkg from "@fintekkers/ledger-models/node/fintekkers/models/position/position_pb.js";
import { ProductTypeProto } from "@fintekkers/ledger-models/node/fintekkers/models/security/product_type_pb.js";
import { TransactionTypeProto } from "@fintekkers/ledger-models/node/fintekkers/models/transaction/transaction_type_pb.js";
import { IdentifierTypeProto } from "@fintekkers/ledger-models/node/fintekkers/models/security/identifier/identifier_type_pb.js";
import type { IdentifierProto } from "@fintekkers/ledger-models/node/fintekkers/models/security/identifier/identifier_pb";
import { PositionFilterOperator } from "@fintekkers/ledger-models/node/fintekkers/models/position/position_util_pb.js";
import { Position } from "@fintekkers/ledger-models/node/wrappers/models/position/position";
import { PositionFilter } from "@fintekkers/ledger-models/node/wrappers/models/position/positionfilter";
import { ZonedDateTime } from "@fintekkers/ledger-models/node/wrappers/models/utils/datetime";
import { QueryPositionRequest } from "@fintekkers/ledger-models/node/wrappers/requests/position/QueryPositionRequest";
import { fromDecimalProto } from "$lib/decimal";
import { formatOneDecimal } from "$lib/free/format";
import { searchPositions } from "$lib/positions";
import {
  SOMA_BUCKET_LABELS,
  SOMA_STACKS,
  SOMA_TOTAL_LABEL,
  somaUnavailable,
  somaWeek,
  weekLabel,
  type Section,
  type SomaFinding,
  type SomaHistoryPoint,
  type SomaHistoryView,
  type SomaMaturityView,
  type SomaPageData,
  type SomaPageWithHistory,
  type SomaPosition,
  type SomaPositionsView,
  type SomaSnapshotView,
  type SomaStack,
  type SomaTableRow,
} from "$lib/free/soma";

const { FieldProto } = field_pkg;
const { MeasureProto } = measure_pkg;
const { PositionTypeProto, PositionViewProto } = position_pkg;

/** The ledger portfolio, as src/lib/treasury_positions.ts names it. */
export const SOMA_PORTFOLIO_NAME = "Federal Reserve SOMA Holdings";

/** The year-ago week's grouping: its rows feed totals only. */
export const SOMA_FIELDS = [FieldProto.PRODUCT_TYPE, FieldProto.MATURITY_DATE];
/** The week's grouping: one row per CUSIP, for Positions by CUSIP and the
 * totals alike. */
export const SOMA_POSITION_FIELDS = [
  FieldProto.IDENTIFIER,
  FieldProto.PRODUCT_TYPE,
  FieldProto.MATURITY_DATE,
];
export const SOMA_MEASURES = [
  MeasureProto.DIRECTED_QUANTITY,
  MeasureProto.INFLATION_COMPENSATION,
];

/** US-317: Holdings over time's grouping, every SOMA trade date at once. */
export const SOMA_HISTORY_FIELDS = [
  FieldProto.TRADE_DATE,
  FieldProto.TRANSACTION_TYPE,
  FieldProto.PRODUCT_TYPE,
];
export const SOMA_HISTORY_MEASURES = [MeasureProto.DIRECTED_QUANTITY];

/** How long the page's Holdings over time waits for its search. */
export const SOMA_HISTORY_TIMEOUT_MS = 10_000;

/** A trade's cash leg, on the USD security: the opposite sign of its BUY
 * or SELL, so counting it would cancel the holdings. */
const CASH_LEGS = new Set(["WITHDRAWAL", "DEPOSIT"]);

/** The year-ago week: 52 weeks back, so also a Wednesday. */
export const PRIOR_WEEK_DAYS = 364;

const DAY_MS = 24 * 60 * 60 * 1000;

type TypeClass = "bills" | "nominal" | "tips";

/** The Treasury product types SOMA's figures cover: the snapshot table's
 * row, Positions by CUSIP's Type column and Holdings over time's stack
 * (US-317), from one table so the sections can't drift. */
const TREASURY_TYPES = new Map<
  string,
  { kind: TypeClass; label: string; stack: SomaStack }
>([
  ["TBILL", { kind: "bills", label: "Bill", stack: "bills" }],
  ["TREASURY_NOTE", { kind: "nominal", label: "Note", stack: "notesBonds" }],
  ["TREASURY_BOND", { kind: "nominal", label: "Bond", stack: "notesBonds" }],
  ["TREASURY_FRN", { kind: "nominal", label: "FRN", stack: "frns" }],
  ["STRIPS", { kind: "nominal", label: "STRIPS", stack: "notesBonds" }],
  ["TIPS", { kind: "tips", label: "TIPS", stack: "tips" }],
]);

const COLORS = { nominal: "#5B8DEF", bills: "#B9D0FA", tips: "#2F5BB7" };

/** One grouped position row, as the ledger returns it. Decimals are
 * strings; an absent measure or field is null. */
export interface SomaRow {
  /** The IDENTIFIER's value when its type is CUSIP; null when the row has
   * none, or another identifier type. */
  cusip: string | null;
  productType: string;
  /** ISO date. */
  maturityDate: string | null;
  /** Dollars of face. */
  directedQuantity: string | null;
  /** Dollars; the ledger sends it for TIPS only. */
  inflationCompensation: string | null;
}

function isoDate(proto: LocalDateProto): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${proto.getYear()}-${pad(proto.getMonth())}-${pad(proto.getDay())}`;
}

/** ISO date `years` calendar years after `iso`. */
function addYears(iso: string, years: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y + years, m - 1, d)).toISOString().slice(0, 10);
}

function minusDays(iso: string, days: number): string {
  return new Date(Date.parse(iso) - days * DAY_MS).toISOString().slice(0, 10);
}

/**
 * The H.4.1 Table 2 bucket (index into SOMA_BUCKET_LABELS) of a security
 * maturing on `maturity`, as of `asOf`: within 15 days, 16 to 90 days, 91
 * days to 1 year, over 1 to 5 years, over 5 to 10 years, over 10 years.
 * A maturity before the week counts as within 15 days.
 */
export function bucketOf(
  maturity: string,
  asOf: string
): 0 | 1 | 2 | 3 | 4 | 5 {
  const days = (Date.parse(maturity) - Date.parse(asOf)) / DAY_MS;
  if (days <= 15) return 0;
  if (days <= 90) return 1;
  if (maturity <= addYears(asOf, 1)) return 2;
  if (maturity <= addYears(asOf, 5)) return 3;
  if (maturity <= addYears(asOf, 10)) return 4;
  return 5;
}

interface Totals {
  bills: Decimal;
  nominal: Decimal;
  tipsPrincipal: Decimal;
  inflationCompensation: Decimal;
  total: Decimal;
  buckets: Decimal[];
}

/**
 * The week's Treasury totals and buckets, or null when the rows can't give
 * them: no Treasury row, a row with no quantity or maturity, or a TIPS row
 * with no INFLATION_COMPENSATION (absent is not zero).
 */
export function somaTotals(rows: SomaRow[], asOf: string): Totals | null {
  const zero = new Decimal(0);
  const t: Totals = {
    bills: zero,
    nominal: zero,
    tipsPrincipal: zero,
    inflationCompensation: zero,
    total: zero,
    buckets: SOMA_BUCKET_LABELS.map(() => zero),
  };
  const dropped = new Map<string, number>();
  let treasuryRows = 0;
  for (const row of rows) {
    const kind = TREASURY_TYPES.get(row.productType)?.kind;
    if (!kind) {
      dropped.set(row.productType, (dropped.get(row.productType) ?? 0) + 1);
      continue;
    }
    if (!row.directedQuantity || !row.maturityDate) return null;
    const face = new Decimal(row.directedQuantity);
    let value = face;
    if (kind === "tips") {
      if (!row.inflationCompensation) return null;
      const ic = new Decimal(row.inflationCompensation);
      t.tipsPrincipal = t.tipsPrincipal.plus(face);
      t.inflationCompensation = t.inflationCompensation.plus(ic);
      value = face.plus(ic);
    } else {
      t[kind] = t[kind].plus(face);
    }
    treasuryRows++;
    t.total = t.total.plus(value);
    const bucket = bucketOf(row.maturityDate, asOf);
    t.buckets[bucket] = t.buckets[bucket].plus(value);
  }
  if (dropped.size > 0) {
    console.log(
      "SOMA rows outside the Treasury scope dropped",
      Object.fromEntries(dropped)
    );
  }
  return treasuryRows > 0 && !t.total.isZero() ? t : null;
}

const billions = (d: Decimal) => Number(d.dividedBy(1e9).toFixed(1));
const millions = (d: Decimal) => Number(d.dividedBy(1e6).toFixed(3));
const pct = (part: Decimal, whole: Decimal) =>
  Number(part.dividedBy(whole).times(100).toFixed(1));

/** 4570552e6 → "$4.57T"; 386566e6 → "$386.6B". */
function amount(d: Decimal): string {
  return d.abs().greaterThanOrEqualTo(1e12)
    ? `$${d.dividedBy(1e12).toFixed(2)}T`
    : `$${formatOneDecimal(billions(d))}B`;
}

/** 373.1e9 → "+$373.1B", −30.2e9 → "−$30.2B" (U+2212). */
function signedBillions(d: Decimal): string {
  return `${d.isNegative() ? "−" : "+"}$${formatOneDecimal(
    billions(d.abs())
  )}B`;
}

function row(
  label: string,
  current: Decimal,
  prior: Decimal | null
): SomaTableRow {
  return {
    label,
    current: billions(current),
    prior: prior && billions(prior),
    change: prior && billions(current.minus(prior)),
  };
}

function snapshotView(
  t: Totals,
  p: Totals | null,
  asOf: string,
  priorAsOf: string
): SomaSnapshotView {
  const tips = t.tipsPrincipal.plus(t.inflationCompensation);
  return {
    total: amount(t.total),
    change: p && `${signedBillions(t.total.minus(p.total))} vs a year ago`,
    composition: [
      {
        label: "Notes & bonds",
        spoken: "notes and bonds",
        pct: pct(t.nominal, t.total),
        color: COLORS.nominal,
      },
      {
        label: "Bills",
        spoken: "bills",
        pct: pct(t.bills, t.total),
        color: COLORS.bills,
      },
      {
        label: "TIPS incl. inflation comp.",
        spoken: "TIPS including inflation compensation",
        pct: pct(tips, t.total),
        color: COLORS.tips,
      },
    ],
    columns: [weekLabel(asOf), p && weekLabel(priorAsOf)],
    rows: [
      row("Treasury bills", t.bills, p && p.bills),
      row("Notes & bonds, nominal", t.nominal, p && p.nominal),
      row("TIPS principal", t.tipsPrincipal, p && p.tipsPrincipal),
      row(
        "Inflation compensation",
        t.inflationCompensation,
        p && p.inflationCompensation
      ),
    ],
    totalRow: row(SOMA_TOTAL_LABEL, t.total, p && p.total),
  };
}

function findingCards(t: Totals, p: Totals | null): SomaFinding[] {
  const cards: SomaFinding[] = [];
  if (p) {
    const change = t.total.minus(p.total);
    cards.push({
      figure: signedBillions(change),
      title: change.isNegative()
        ? "The portfolio is shrinking"
        : "The portfolio is growing again",
      body: `Total Treasury holdings ${
        change.isNegative() ? "fell" : "rose"
      } from ${amount(p.total)} to ${amount(t.total)} year over year.`,
    });
    if (p.bills.greaterThan(0)) {
      cards.push({
        figure: `${t.bills.dividedBy(p.bills).toFixed(1)}×`,
        title: "Bills compared with a year ago",
        body: `From ${amount(p.bills)} to ${amount(t.bills)}.`,
      });
    }
  }
  if (t.tipsPrincipal.greaterThan(0)) {
    cards.push({
      figure: amount(t.tipsPrincipal.plus(t.inflationCompensation)),
      title: "A large TIPS holder",
      body: `${amount(t.tipsPrincipal)} of TIPS principal plus ${amount(
        t.inflationCompensation
      )} of accrued inflation compensation.`,
      link: { href: "/free/tips", label: "See how TIPS work" },
    });
  }
  return cards;
}

function maturityView(t: Totals): SomaMaturityView {
  const withinYear = t.buckets[0].plus(t.buckets[1]).plus(t.buckets[2]);
  return {
    note: `Treasuries are spread across the curve. About ${amount(
      withinYear
    )}, or ${withinYear
      .dividedBy(t.total)
      .times(100)
      .toFixed(0)}%, matures within a year.`,
    totalM: millions(t.total),
    buckets: t.buckets.map((b) => ({
      valueM: millions(b),
      sharePct: pct(b, t.total),
    })),
  };
}

/**
 * Positions by CUSIP: one row per Treasury CUSIP held (non-zero par), par
 * descending, then CUSIP ascending. Par is DIRECTED_QUANTITY, face only, so
 * the rows sum to the Treasury total less inflation compensation; weight is
 * par over that sum. Null, with the reason logged, when a Treasury row has
 * no CUSIP, maturity or quantity, or a CUSIP comes twice: nothing here
 * fills in or parses a value.
 */
export function somaPositions(rows: SomaRow[]): SomaPositionsView | null {
  const held: { row: SomaRow; type: string; par: Decimal }[] = [];
  const seen = new Set<string>();
  for (const row of rows) {
    const type = TREASURY_TYPES.get(row.productType)?.label;
    if (!type) continue;
    if (!row.cusip || !row.maturityDate || !row.directedQuantity) {
      console.log("SOMA position row unusable for Positions by CUSIP", {
        cusip: row.cusip,
        productType: row.productType,
        maturityDate: row.maturityDate,
        directedQuantity: row.directedQuantity,
      });
      return null;
    }
    const par = new Decimal(row.directedQuantity);
    if (par.isZero()) continue;
    if (seen.has(row.cusip)) {
      console.log("SOMA position search returned a CUSIP twice", row.cusip);
      return null;
    }
    seen.add(row.cusip);
    held.push({ row, type, par });
  }
  const total = held.reduce((sum, h) => sum.plus(h.par), new Decimal(0));
  if (held.length === 0 || total.isZero()) return null;
  held.sort(
    (a, b) =>
      b.par.comparedTo(a.par) ||
      ((a.row.cusip as string) < (b.row.cusip as string) ? -1 : 1)
  );
  return {
    rows: held.map(
      ({ row, type, par }): SomaPosition => ({
        cusip: row.cusip as string,
        type,
        maturity: row.maturityDate as string,
        par: par.toFixed(),
        parB: Number(par.dividedBy(1e9).toFixed(2)),
        weightPct: Number(par.dividedBy(total).times(100).toFixed(2)),
      })
    ),
  };
}

/**
 * Every section for the week `asOf`, from its rows and, when they loaded,
 * the year-ago week's. Rows that can't give totals make every section
 * unavailable; unusable year-ago rows only blank the prior column, and rows
 * Positions by CUSIP can't show blank that section only.
 */
export function somaRowsToView(
  rows: SomaRow[] | null,
  asOf: string,
  prior: SomaRow[] | null
): Pick<SomaPageData, "snapshot" | "findings" | "maturity" | "positions"> {
  const priorAsOf = minusDays(asOf, PRIOR_WEEK_DAYS);
  const message = somaUnavailable(weekLabel(asOf));
  const t = rows && somaTotals(rows, asOf);
  if (!t) {
    return {
      snapshot: { ok: false, message },
      findings: { ok: false, message },
      maturity: { ok: false, message },
      positions: { ok: false, message },
    };
  }
  const p = prior && somaTotals(prior, priorAsOf);
  const positions = rows && somaPositions(rows);
  return {
    snapshot: { ok: true, data: snapshotView(t, p, asOf, priorAsOf) },
    findings: { ok: true, data: { cards: findingCards(t, p) } },
    maturity: { ok: true, data: maturityView(t) },
    positions: positions
      ? { ok: true, data: positions }
      : { ok: false, message },
  };
}

/** An enum field's name: its string value, else its enum value's name in
 * `names`, else its packed value. */
function enumNameOf(entry: FieldMapEntry, names: object): string {
  if (entry.getStringValue()) return entry.getStringValue();
  if (entry.getEnumValue() > 0) {
    // The generated JS enum has no reverse mapping.
    const value = entry.getEnumValue();
    const name = Object.entries(names).find(([, v]) => v === value);
    return name ? name[0] : String(value);
  }
  return entry.getFieldValuePacked()
    ? Position.unpackField(entry).getValue()
    : "";
}

/** A ledger position as a SomaRow. */
export function somaRowOf(position: Position): SomaRow {
  const out: SomaRow = {
    cusip: null,
    productType: "",
    maturityDate: null,
    directedQuantity: null,
    inflationCompensation: null,
  };
  for (const entry of position.getFields()) {
    if (entry.getField() === FieldProto.PRODUCT_TYPE) {
      out.productType = enumNameOf(entry, ProductTypeProto);
    } else if (
      entry.getField() === FieldProto.IDENTIFIER &&
      entry.getFieldValuePacked()
    ) {
      const id: IdentifierProto = Position.unpackField(entry);
      if (id.getIdentifierType() === IdentifierTypeProto.CUSIP) {
        out.cusip = id.getIdentifierValue() || null;
      }
    } else if (
      entry.getField() === FieldProto.MATURITY_DATE &&
      entry.getFieldValuePacked()
    ) {
      out.maturityDate = isoDate(Position.unpackField(entry));
    }
  }
  for (const entry of position.getMeasures()) {
    const value = fromDecimalProto(entry.getMeasureDecimalValue()) || null;
    if (entry.getMeasure() === MeasureProto.DIRECTED_QUANTITY) {
      out.directedQuantity = value;
    } else if (entry.getMeasure() === MeasureProto.INFLATION_COMPENSATION) {
      out.inflationCompensation = value;
    }
  }
  return out;
}

/** One grouped trade row of Holdings over time's search (US-317). */
export interface SomaTradeRow {
  /** ISO date. */
  tradeDate: string | null;
  /** e.g. "BUY", "MATURATION", "WITHDRAWAL". */
  transactionType: string;
  productType: string;
  /** Dollars of face, signed: negative for a SELL or MATURATION. */
  directedQuantity: string | null;
}

/** A ledger position from Holdings over time's search as a SomaTradeRow. */
export function somaTradeRowOf(position: Position): SomaTradeRow {
  const out: SomaTradeRow = {
    tradeDate: null,
    transactionType: "",
    productType: "",
    directedQuantity: null,
  };
  for (const entry of position.getFields()) {
    if (entry.getField() === FieldProto.PRODUCT_TYPE) {
      out.productType = enumNameOf(entry, ProductTypeProto);
    } else if (entry.getField() === FieldProto.TRANSACTION_TYPE) {
      out.transactionType = enumNameOf(entry, TransactionTypeProto);
    } else if (
      entry.getField() === FieldProto.TRADE_DATE &&
      entry.getFieldValuePacked()
    ) {
      out.tradeDate = isoDate(Position.unpackField(entry));
    }
  }
  for (const entry of position.getMeasures()) {
    if (entry.getMeasure() === MeasureProto.DIRECTED_QUANTITY) {
      out.directedQuantity =
        fromDecimalProto(entry.getMeasureDecimalValue()) || null;
    }
  }
  return out;
}

/**
 * Holdings over time up to `asOf` (a Wednesday): par per stack at every
 * Wednesday from the first one on or after the earliest trade. Cash legs
 * are dropped; other rows outside the Treasury scope are dropped and
 * logged. Null, with the reason logged, when a Treasury row has no trade
 * date or quantity (never a partial series), or no Treasury row is on or
 * before `asOf`.
 */
export function somaHistory(
  rows: SomaTradeRow[],
  asOf: string
): SomaHistoryView | null {
  const byDate = new Map<string, Record<SomaStack, Decimal>>();
  const dropped = new Map<string, number>();
  for (const row of rows) {
    if (CASH_LEGS.has(row.transactionType)) continue;
    const stack = TREASURY_TYPES.get(row.productType)?.stack;
    if (!stack) {
      dropped.set(row.productType, (dropped.get(row.productType) ?? 0) + 1);
      continue;
    }
    if (!row.tradeDate || !row.directedQuantity) {
      console.log("SOMA trade row unusable for Holdings over time", row);
      return null;
    }
    if (row.tradeDate > asOf) continue;
    let day = byDate.get(row.tradeDate);
    if (!day) {
      day = zeroStacks();
      byDate.set(row.tradeDate, day);
    }
    day[stack] = day[stack].plus(row.directedQuantity);
  }
  if (dropped.size > 0) {
    console.log(
      "SOMA trade rows outside the Treasury scope dropped",
      Object.fromEntries(dropped)
    );
  }
  const dates = [...byDate.keys()].sort();
  if (dates.length === 0) return null;
  // The first Wednesday on or after the earliest trade.
  const ahead = (3 - new Date(Date.parse(dates[0])).getUTCDay() + 7) % 7;
  const firstWeek = new Date(Date.parse(dates[0]) + ahead * DAY_MS)
    .toISOString()
    .slice(0, 10);
  if (firstWeek > asOf) return null;

  const held = zeroStacks();
  const points: SomaHistoryPoint[] = [];
  let next = 0;
  for (
    let ms = Date.parse(firstWeek);
    ms <= Date.parse(asOf);
    ms += 7 * DAY_MS
  ) {
    const week = new Date(ms).toISOString().slice(0, 10);
    for (; next < dates.length && dates[next] <= week; next++) {
      const day = byDate.get(dates[next]) as Record<SomaStack, Decimal>;
      for (const stack of SOMA_STACKS) {
        held[stack] = held[stack].plus(day[stack]);
      }
    }
    const par = {} as Record<SomaStack, string>;
    let total = new Decimal(0);
    for (const stack of SOMA_STACKS) {
      par[stack] = held[stack].toFixed();
      total = total.plus(held[stack]);
    }
    points.push({ week, par, total: total.toFixed() });
  }
  return { firstWeek, points };
}

function zeroStacks(): Record<SomaStack, Decimal> {
  const zero = new Decimal(0);
  return { bills: zero, notesBonds: zero, tips: zero, frns: zero };
}

/** The position search for one week: SOMA trades on or before it, valued
 * as of the end of its UTC day, grouped by `fields`, with `measures`. */
export function somaRequest(
  asOf: string,
  fields = SOMA_FIELDS,
  measures = SOMA_MEASURES
): QueryPositionRequest {
  const [y, m, d] = asOf.split("-").map(Number);
  const filter = new PositionFilter();
  filter.addEqualsFilter(FieldProto.PORTFOLIO_NAME, SOMA_PORTFOLIO_NAME);
  // Local midnight: the filter serialises a Date with local-time getters.
  filter.addFilter(
    FieldProto.TRADE_DATE,
    PositionFilterOperator.LESS_THAN_OR_EQUALS,
    new Date(y, m - 1, d)
  );
  return new QueryPositionRequest(
    filter,
    PositionTypeProto.TRANSACTION,
    PositionViewProto.DEFAULT_VIEW,
    fields,
    measures,
    ZonedDateTime.from(new Date(`${asOf}T23:59:59Z`))
  );
}

async function fetchRows(
  asOf: string,
  apiKey: string,
  fields: number[]
): Promise<SomaRow[] | null> {
  try {
    const positions = await searchPositions(
      somaRequest(asOf, fields).toProto(),
      apiKey
    );
    return positions.map(somaRowOf);
  } catch (error) {
    // The message only: the error object can carry request metadata.
    console.log(
      `Could not fetch SOMA holdings for ${asOf}`,
      (error as Error)?.message
    );
    return null;
  }
}

/**
 * Every section of /free/soma for the H.4.1 week of `requestedAsOf`
 * (?asOf=, snapped to its Wednesday; the latest week when missing, invalid
 * or after `now`). `apiKey` undefined: all unavailable, and no call is made
 * (the broker rejects keyless calls).
 */
export async function fetchFreeSoma(
  apiKey: string | undefined,
  requestedAsOf: string | null,
  now: Date
): Promise<SomaPageData> {
  const today = now.toISOString().slice(0, 10);
  const asOf = somaWeek(requestedAsOf, today);
  const base = { asOf, asOfLabel: weekLabel(asOf), today };
  if (!apiKey) return { ...base, ...somaRowsToView(null, asOf, null) };
  const [rows, prior] = await Promise.all([
    fetchRows(asOf, apiKey, SOMA_POSITION_FIELDS),
    // Totals only: the year-ago rows never feed Positions by CUSIP.
    fetchRows(minusDays(asOf, PRIOR_WEEK_DAYS), apiKey, SOMA_FIELDS),
  ]);
  return { ...base, ...somaRowsToView(rows, asOf, prior) };
}

/**
 * Holdings over time for the week `asOf`, from one search for every week.
 * Never rejects: a failed or empty search, unusable rows, or no answer
 * within SOMA_HISTORY_TIMEOUT_MS all resolve to unavailable, naming the
 * week. Logs how long it took.
 */
export async function fetchSomaHistory(
  apiKey: string,
  asOf: string
): Promise<Section<SomaHistoryView>> {
  const unavailable = {
    ok: false as const,
    message: somaUnavailable(weekLabel(asOf)),
  };
  const started = Date.now();
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const search = searchPositions(
      somaRequest(asOf, SOMA_HISTORY_FIELDS, SOMA_HISTORY_MEASURES).toProto(),
      apiKey
    );
    // searchPositions takes no deadline, so a timed-out search is not
    // cancelled: it runs on to its end, and its late result or error is
    // ignored here.
    search.catch(() => undefined);
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(
        () => reject(new Error(`no answer in ${SOMA_HISTORY_TIMEOUT_MS} ms`)),
        SOMA_HISTORY_TIMEOUT_MS
      );
    });
    const positions = await Promise.race([search, timeout]);
    const view = somaHistory(positions.map(somaTradeRowOf), asOf);
    console.log(
      `SOMA history for ${asOf}: ${positions.length} rows, ${
        view?.points.length ?? 0
      } weeks, in ${Date.now() - started} ms`
    );
    return view ? { ok: true, data: view } : unavailable;
  } catch (error) {
    // The message only: the error object can carry request metadata.
    console.log(
      `Could not fetch SOMA history for ${asOf} after ${
        Date.now() - started
      } ms`,
      (error as Error)?.message
    );
    return unavailable;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Both routes' load (US-317): fetchFreeSoma's sections, awaited, and
 * Holdings over time under `streamed`, started at once but not awaited, so
 * a slow or failed history never holds up the rest of the page. No key:
 * unavailable, and no call is made.
 */
export async function loadFreeSoma(
  apiKey: string | undefined,
  requestedAsOf: string | null,
  now: Date
): Promise<SomaPageWithHistory> {
  const page = fetchFreeSoma(apiKey, requestedAsOf, now);
  const asOf = somaWeek(requestedAsOf, now.toISOString().slice(0, 10));
  const history: Promise<Section<SomaHistoryView>> = apiKey
    ? fetchSomaHistory(apiKey, asOf)
    : Promise.resolve({ ok: false, message: somaUnavailable(weekLabel(asOf)) });
  return { ...(await page), streamed: { history } };
}
