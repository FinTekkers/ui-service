/**
 * US-354: /free/corporate-bond/crwv-2030's server load, the CoreWeave 9.25%
 * 2030 notes (ISIN USU2069EAA83).
 *
 * The caller passes the server-held homepage key (FT_HOMEPAGE_API_KEY),
 * never a visitor's. Lives under src/lib/server/ so SvelteKit refuses any
 * client import of it.
 * - The clean price and trade date are checked first; a bad one is a field
 *   error and no call is made.
 * - The security comes from the ledger security master, by ISIN.
 * - valuation-service values it to maturity, settling the trade date T+1 on
 *   its US_SIFMA calendar: one call for the calculator's measures and the
 *   cash flows on 100 face, one for DV01 on $1,000,000 face, and one
 *   YIELD_TO_MATURITY call per sweep price.
 * - The whole load has one budget (LOAD_BUDGET_MS). A failed or late main
 *   call makes the calculator and the sweep unavailable; a failed or late
 *   sweep point makes only the sweep unavailable; a missing measure makes
 *   only its tile unavailable.
 * Nothing here throws. Only display formatting happens here: every figure is
 * valuation-service's, and the raw value travels beside its display text.
 */
import Decimal from "decimal.js";
import type { SecurityProto } from "@fintekkers/ledger-models/node/fintekkers/models/security/security_pb.js";
import { IdentifierTypeProto } from "@fintekkers/ledger-models/node/fintekkers/models/security/identifier/identifier_type_pb.js";
import measure_pkg from "@fintekkers/ledger-models/node/fintekkers/models/position/measure_pb.js";
import { fromDecimalProto } from "$lib/decimal";
import { FetchSecurityProtoByIdentifier } from "$lib/security";
import {
  RunCorporateBondMeasures,
  type BondMeasuresResult,
  type CashflowEntry,
} from "$lib/valuation";
import {
  CRWV_ISIN,
  SWEEP_PRICES,
  UNAVAILABLE,
  validateCleanPrice,
  validateTradeDate,
  type BondMeasureView,
  type CalcSection,
  type CalcView,
  type CashflowView,
  type CorporateBondPageData,
  type SweepPoint,
  type SweepSection,
} from "$lib/free/corporateBond";

const { MeasureProto } = measure_pkg;

/** The calculator's measures and the cash flows, on CALC_FACE. */
export const CRWV_MEASURES = [
  MeasureProto.ACCRUED_INTEREST,
  MeasureProto.DIRTY_PRICE,
  MeasureProto.YIELD_TO_MATURITY,
  MeasureProto.MACAULAY_DURATION,
  MeasureProto.MODIFIED_DURATION,
  MeasureProto.CONVEXITY,
  MeasureProto.PRESENT_VALUE_CASHFLOWS,
];

/** DV01, on DV01_FACE: the tile reads "per $1M face". */
export const DV01_MEASURES = [MeasureProto.DV01];

export const SWEEP_MEASURES = [MeasureProto.YIELD_TO_MATURITY];

/** ACCRUED_INTEREST is in dollars for the position: on 100 face it reads
 * per 100, as the clean and dirty prices do. */
export const CALC_FACE = "100";
export const DV01_FACE = "1000000";

/** The whole load's time limit; each call also carries it as its gRPC
 * deadline. */
export const LOAD_BUDGET_MS = 12_000;

/** Sweep calls in flight at once. */
export const SWEEP_CONCURRENCY = 5;

/** How long a found security is reused before it is looked up again. */
export const SECURITY_CACHE_MS = 10 * 60_000;

export interface CorporateBondDeps {
  lookup: (isin: string, apiKey: string) => Promise<SecurityProto>;
  value: (
    security: SecurityProto,
    cleanPrice: string,
    tradeDate: string,
    measures: number[],
    apiKey: string,
    options: { directedQuantity: string; deadlineMs?: number }
  ) => Promise<BondMeasuresResult>;
}

let cachedSecurity: { proto: SecurityProto; at: number } | null = null;

/** The ledger's security for the ISIN, reused for SECURITY_CACHE_MS.
 * Failures are never cached. */
async function cachedLookup(
  isin: string,
  apiKey: string
): Promise<SecurityProto> {
  const now = Date.now();
  if (cachedSecurity && now - cachedSecurity.at < SECURITY_CACHE_MS) {
    return cachedSecurity.proto;
  }
  const proto = await FetchSecurityProtoByIdentifier(
    IdentifierTypeProto.ISIN,
    isin,
    apiKey
  );
  cachedSecurity = { proto, at: now };
  return proto;
}

const DEFAULT_DEPS: CorporateBondDeps = {
  lookup: cachedLookup,
  value: RunCorporateBondMeasures,
};

/** Today's date in New York, the bond market's, as YYYY-MM-DD. */
export function newYorkToday(now: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

const TIMED_OUT = Symbol("timed out");

/** `work`, or TIMED_OUT once `deadline` (epoch ms) passes. */
function beforeDeadline<T>(
  work: Promise<T>,
  deadline: number
): Promise<T | typeof TIMED_OUT> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const late = new Promise<typeof TIMED_OUT>((resolve) => {
    timer = setTimeout(
      () => resolve(TIMED_OUT),
      Math.max(0, deadline - Date.now())
    );
  });
  return Promise.race([work, late]).finally(() => clearTimeout(timer));
}

/** `items` mapped by `run`, at most `limit` at a time, in order. Rejects on
 * the first failure and starts nothing after it. */
async function inPool<T, R>(
  items: readonly T[],
  limit: number,
  run: (item: T) => Promise<R>
): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  let failed = false;
  async function worker() {
    while (!failed && next < items.length) {
      const i = next++;
      try {
        out[i] = await run(items[i]);
      } catch (error) {
        failed = true;
        throw error;
      }
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, worker)
  );
  return out;
}

function fixed(value: string, places: number): string {
  return new Decimal(value).toFixed(places);
}

/** "1234.5" → "$1,234.50". */
function dollars(value: string): string {
  const d = new Decimal(value);
  const [int, frac] = d.abs().toFixed(2).split(".");
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${d.isNegative() ? "−" : ""}$${grouped}.${frac}`;
}

/** "1000" → "$1,000". */
function wholeDollars(value: string): string {
  const d = new Decimal(value);
  const text = d.isInteger() ? d.toFixed(0) : d.toFixed(2);
  return `$${text.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
}

/** A decimal yield (0.1644 = 16.44%) in percent, to `places`. */
function percent(value: string, places: number): string {
  return new Decimal(value).times(100).toFixed(places);
}

/** The measure as returned plus its display text, or null when the service
 * returned none (or not a number). Never derived from another measure. */
function measureView(
  values: Map<number, string | undefined>,
  measure: number,
  display: (value: string) => string
): BondMeasureView | null {
  const value = values.get(measure);
  if (!value) return null;
  try {
    if (!new Decimal(value).isFinite()) return null;
    return { value, display: display(value) };
  } catch {
    return null;
  }
}

/** By date; on the maturity date the final coupon, then the principal. */
function cashflowViews(rows: CashflowEntry[]): CashflowView[] {
  const isCoupon = (row: CashflowEntry) => !!row.couponRate;
  return [...rows]
    .sort(
      (a, b) =>
        a.date.localeCompare(b.date) ||
        Number(isCoupon(b)) - Number(isCoupon(a))
    )
    .map((row) => ({
      date: row.date,
      kind: isCoupon(row) ? "coupon" : "principal",
      fv: row.fvAmount,
      pv: row.pvAmount,
      fvDisplay: dollars(row.fvAmount),
      pvDisplay: dollars(row.pvAmount),
    }));
}

function calcView(
  main: BondMeasuresResult,
  dv01: BondMeasuresResult | null,
  face: string
): CalcView | null {
  if (!main.settlementDate) return null;
  const m = (measure: number, display: (v: string) => string) =>
    measureView(main.values, measure, display);
  return {
    settlementDate: main.settlementDate,
    faceDisplay: wholeDollars(face),
    accrued: m(MeasureProto.ACCRUED_INTEREST, (v) => fixed(v, 3)),
    dirtyPrice: m(MeasureProto.DIRTY_PRICE, (v) => fixed(v, 3)),
    ytm: m(MeasureProto.YIELD_TO_MATURITY, (v) => `${percent(v, 2)}%`),
    macaulayDuration: m(MeasureProto.MACAULAY_DURATION, (v) => fixed(v, 2)),
    modifiedDuration: m(MeasureProto.MODIFIED_DURATION, (v) => fixed(v, 2)),
    convexity: m(MeasureProto.CONVEXITY, (v) => fixed(v, 2)),
    dv01: dv01
      ? measureView(dv01.values, MeasureProto.DV01, (v) => dollars(v))
      : null,
    cashflows: cashflowViews(main.cashflows),
  };
}

/** The sweep's points by price, the visitor's marked: on the grid it marks
 * that point, off it the main call's yield is added as its own point. */
function sweepPoints(
  grid: { price: string; ytm: string }[],
  price: string,
  ytm: BondMeasureView | null
): SweepPoint[] | null {
  const priced = new Decimal(price);
  const onGrid = grid.some((p) => new Decimal(p.price).equals(priced));
  if (!onGrid && !ytm) return null;
  const all = onGrid ? grid : [...grid, { price, ytm: ytm!.value }];
  return all
    .map((p) => ({
      price: p.price,
      ytm: p.ytm,
      ytmPct: percent(p.ytm, 2),
      marked: new Decimal(p.price).equals(priced),
    }))
    .sort((a, b) => new Decimal(a.price).comparedTo(b.price));
}

/** Every section of /free/corporate-bond/crwv-2030 for `params` (?price=,
 * ?tradeDate=). `apiKey` undefined: unavailable, and no call is made. */
export async function fetchFreeCorporateBond(
  apiKey: string | undefined,
  params: URLSearchParams,
  now: Date,
  deps: Partial<CorporateBondDeps> = {}
): Promise<CorporateBondPageData> {
  const { lookup, value } = { ...DEFAULT_DEPS, ...deps };
  const today = newYorkToday(now);
  const rawPrice = params.get("price");
  const rawTradeDate = params.get("tradeDate");
  const price = validateCleanPrice(rawPrice);
  const tradeDate = validateTradeDate(rawTradeDate, today);
  const data: CorporateBondPageData = {
    input: {
      price: price.value ?? rawPrice ?? "",
      tradeDate: tradeDate.value ?? rawTradeDate ?? "",
    },
    fieldErrors: {
      ...(price.error ? { price: price.error } : {}),
      ...(tradeDate.error ? { tradeDate: tradeDate.error } : {}),
    },
    calc: { status: "not-run" },
    sweep: { status: "not-run" },
  };
  if (!price.value || !tradeDate.value) return data;

  const calcDown: CalcSection = {
    status: "unavailable",
    message: UNAVAILABLE.calc,
  };
  const sweepDown: SweepSection = {
    status: "unavailable",
    message: UNAVAILABLE.sweep,
  };
  data.calc = calcDown;
  data.sweep = sweepDown;
  if (!apiKey) return data;

  const deadline = Date.now() + LOAD_BUDGET_MS;
  const cleanPrice = price.value;
  const trade = tradeDate.value;
  const call = (
    security: SecurityProto,
    at: string,
    measures: number[],
    face: string
  ) =>
    value(security, at, trade, measures, apiKey, {
      directedQuantity: face,
      deadlineMs: Math.max(1, deadline - Date.now()),
    });

  try {
    const security = await beforeDeadline(lookup(CRWV_ISIN, apiKey), deadline);
    if (security === TIMED_OUT) {
      console.log("The free corporate bond lookup timed out");
      return data;
    }
    const face =
      fromDecimalProto(security.getBondDetails()?.getFaceValue()) || "";

    // Started together; each settles on its own, never rejects.
    const settle = <T>(work: Promise<T>) =>
      beforeDeadline(work, deadline).catch((error) => {
        console.log(
          "A free corporate bond valuation failed",
          (error as Error)?.message
        );
        return null;
      });
    const [main, dv01, grid] = await Promise.all([
      settle(call(security, cleanPrice, CRWV_MEASURES, CALC_FACE)),
      settle(call(security, cleanPrice, DV01_MEASURES, DV01_FACE)),
      settle(
        inPool(SWEEP_PRICES, SWEEP_CONCURRENCY, async (at) => {
          const run = await call(security, at, SWEEP_MEASURES, CALC_FACE);
          const ytm = run.values.get(MeasureProto.YIELD_TO_MATURITY);
          if (!ytm || !new Decimal(ytm).isFinite()) {
            throw new Error(`No YIELD_TO_MATURITY at ${at}`);
          }
          return { price: at, ytm };
        })
      ),
    ]);

    if (!main || main === TIMED_OUT) return data;
    const view = calcView(
      main,
      dv01 && dv01 !== TIMED_OUT ? dv01 : null,
      face || "100"
    );
    if (!view) return data;
    data.calc = { status: "ok", data: view };

    if (grid && grid !== TIMED_OUT) {
      const points = sweepPoints(grid, cleanPrice, view.ytm);
      if (points) data.sweep = { status: "ok", points };
    }
    return data;
  } catch (error) {
    // The message only: the error object can carry request metadata.
    console.log(
      "Could not load the free corporate bond",
      (error as Error)?.message
    );
    data.calc = calcDown;
    data.sweep = sweepDown;
    return data;
  }
}
