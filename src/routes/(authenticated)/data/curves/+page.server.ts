/**
 * Live yield curves on /data/curves (Phase 3 of #203 + term-forward view #264).
 *
 * #268 migration: drops the client-side `selectOnTheRunBonds` helper in
 * favour of the server-side index resolver (ledger-service PR #43). The
 * Treasury Curve index Security carries its on-the-run constituents via
 * `SecurityService.GetByIds(uuid, lookthrough=true)`; the UI just consumes.
 *
 * Pipeline:
 *   1. Resolve constituents + latest prices via `loadTreasuryCurveBundle`
 *      (calls SecurityService.GetByIds with lookthrough + a follow-up
 *      GetByIds for full bodies + PriceService.search per constituent).
 *   2. When the user lands without `?asof=`, scan backward day-by-day
 *      (cap 30) for the latest date with a fully-priced curve — surfaces
 *      as the URL default + a "latest available" hint (#268 Bug 4 UX).
 *   3. Build CurveRequestProto with `asof_datetime`, the three curve types,
 *      and (if a term is selected) `forward_term_years = T`.
 *   4. Call ValuationClient.runCurve via the broker.
 *   5. Map CurveResultProto[] → {par, spot, forward}.
 */
import { ValuationClient } from '@fintekkers/ledger-models/node/fintekkers/services/valuation-service/valuation_service_grpc_pb.js';
import { CurveRequestProto, CurveInputProto } from '@fintekkers/ledger-models/node/fintekkers/requests/valuation/curve_request_pb.js';
import type { CurveResponseProto } from '@fintekkers/ledger-models/node/fintekkers/requests/valuation/curve_response_pb.js';
import { DecimalValueProto } from '@fintekkers/ledger-models/node/fintekkers/models/util/decimal_value_pb.js';
import measure_pkg from '@fintekkers/ledger-models/node/fintekkers/models/position/measure_pb.js';
import { ZonedDateTime } from '@fintekkers/ledger-models/node/wrappers/models/utils/datetime';
import { getServiceConnection } from '$lib/grpc-auth';
import {
  EXPECTED_CONSTITUENT_COUNT,
  findLatestBuildableDate,
  loadTreasuryCurveBundle,
  type ConstituentBundle,
  type CurveConstituent,
} from '$lib/treasuryCurveData';
import {
  formatYears,
  parseForwardTerm,
  type ForwardTermYears,
} from '$lib/curveForwardTerm';

const { MeasureProto } = measure_pkg;

const LATEST_DATE_SCAN_DAYS = 30;

export interface CurvePoint {
  tenor: string;   // decimal-year display label (e.g. "9.95Y")
  years: number;   // numeric (decimal years). For the term-forward trace this is
                   //   the *starting* year t, not the maturity tenor.
  yield: number;   // percent (e.g. 4.25 means 4.25%)
}

interface PageData {
  par: CurvePoint[];
  spot: CurvePoint[];
  forward: CurvePoint[];
  curveDate: string;
  termYears: ForwardTermYears;
  warnings: string[];
  error: string | null;
  /** Latest date with a fully-priced curve; null if scan returned nothing. */
  latestBuildableDate: string | null;
  /** True when the loader auto-defaulted the asOf (no `?asof=` URL param). */
  asofWasDefaulted: boolean;
}

function decimal(value: string): DecimalValueProto {
  return new DecimalValueProto().setArbitraryPrecisionValue(value);
}

/**
 * End-of-day timestamp at 23:59:59.999 UTC for the given calendar date.
 * Per #203 decision table: as-of semantics are end-of-day.
 */
function endOfDayProto(asOf: Date) {
  const eod = new Date(Date.UTC(
    asOf.getUTCFullYear(), asOf.getUTCMonth(), asOf.getUTCDate(),
    23, 59, 59, 999,
  ));
  return ZonedDateTime.from(eod).toProto();
}

function buildCurveRequest(
  constituents: CurveConstituent[],
  asOf: Date,
  termYears: ForwardTermYears,
): { request: CurveRequestProto; warnings: string[] } {
  const warnings: string[] = [];
  const request = new CurveRequestProto();
  request.setObjectClass('CurveRequestProto');
  request.setVersion('0.0.1');
  request.setAsofDatetime(endOfDayProto(asOf));
  request.setCurveTypesList([
    MeasureProto.PAR_YIELD,
    MeasureProto.SPOT_YIELD,
    MeasureProto.FORWARD_YIELD,
  ]);
  request.setForwardTermYears(termYears);

  for (const c of constituents) {
    if (c.cleanPrice === null) {
      warnings.push(`No price available for ${c.cusip} (${c.tenor})`);
      continue;
    }
    const input = new CurveInputProto();
    input.setSecurity((c.bond as any).proto);
    input.setCleanPrice(decimal(c.cleanPrice.toString()));
    request.addCurveInputs(input);
  }

  return { request, warnings };
}

function parseCurveResponse(response: CurveResponseProto): {
  par: CurvePoint[]; spot: CurvePoint[]; forward: CurvePoint[];
} {
  const par: CurvePoint[] = [];
  const spot: CurvePoint[] = [];
  const forward: CurvePoint[] = [];

  for (const result of response.getCurveResultsList()) {
    const curveType = result.getCurveType();
    for (const point of result.getPointsList()) {
      const tenorStr = point.getTenor()?.getArbitraryPrecisionValue();
      const yieldStr = point.getYield()?.getArbitraryPrecisionValue();
      if (!tenorStr || !yieldStr) continue;
      const years = parseFloat(tenorStr);
      const yieldPct = parseFloat(yieldStr) * 100;
      const cp: CurvePoint = { tenor: formatYears(years), years, yield: yieldPct };
      if (curveType === MeasureProto.PAR_YIELD) par.push(cp);
      else if (curveType === MeasureProto.SPOT_YIELD) spot.push(cp);
      else if (curveType === MeasureProto.FORWARD_YIELD) forward.push(cp);
    }
  }

  return { par, spot, forward };
}

function emptyPage(
  curveDate: string,
  termYears: ForwardTermYears,
  warnings: string[],
  error: string | null,
  latestBuildableDate: string | null,
  asofWasDefaulted: boolean,
): PageData {
  return {
    par: [], spot: [], forward: [],
    curveDate, termYears, warnings, error,
    latestBuildableDate, asofWasDefaulted,
  };
}

/** @type {import('./$types').PageServerLoad} */
export async function load({ url, locals }: { url: URL; locals: App.Locals }): Promise<PageData> {
  const apiKey = locals.user?.apiKey;
  const dateParam = url.searchParams.get('asof');
  const termYears = parseForwardTerm(url.searchParams.get('term'));

  // Asof resolution. Explicit ?asof= → use it (no scan). Missing → scan
  // backward from today for the latest fully-priced date. The scan also
  // populates the hint shown unconditionally on the page.
  let asOf: Date;
  let bundle: ConstituentBundle;
  let asofWasDefaulted: boolean;
  let latestBuildableDateStr: string | null;

  if (dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
    asOf = new Date(dateParam + 'T12:00:00Z');
    asofWasDefaulted = false;
    try {
      bundle = await loadTreasuryCurveBundle(asOf, apiKey);
    } catch (e: any) {
      return emptyPage(
        asOf.toISOString().slice(0, 10), termYears, [],
        `Failed to resolve Treasury curve constituents: ${e.message ?? e}`,
        null, false,
      );
    }
    // Best-effort populate the hint without blocking the user-requested
    // render — only scan if today differs from the user's pick.
    latestBuildableDateStr = null;
    try {
      const today = new Date();
      const latest = await findLatestBuildableDate(today, LATEST_DATE_SCAN_DAYS, apiKey);
      latestBuildableDateStr = latest.date ? latest.date.toISOString().slice(0, 10) : null;
    } catch { /* hint is non-critical */ }
  } else {
    asofWasDefaulted = true;
    try {
      const latest = await findLatestBuildableDate(new Date(), LATEST_DATE_SCAN_DAYS, apiKey);
      asOf = latest.date ?? new Date();
      bundle = latest.bundle ?? await loadTreasuryCurveBundle(asOf, apiKey);
      latestBuildableDateStr = latest.date ? latest.date.toISOString().slice(0, 10) : null;
    } catch (e: any) {
      return emptyPage(
        new Date().toISOString().slice(0, 10), termYears, [],
        `Failed to resolve Treasury curve constituents: ${e.message ?? e}`,
        null, true,
      );
    }
  }

  const curveDate = asOf.toISOString().slice(0, 10);

  if (bundle.constituents.length === 0) {
    return emptyPage(
      curveDate, termYears, [],
      'No Treasury curve constituents resolved for the selected date.',
      latestBuildableDateStr, asofWasDefaulted,
    );
  }

  const { request, warnings } = buildCurveRequest(bundle.constituents, asOf, termYears);

  if (bundle.pricedCount < EXPECTED_CONSTITUENT_COUNT) {
    warnings.unshift(
      `Curve has ${bundle.pricedCount}/${EXPECTED_CONSTITUENT_COUNT} priced constituents` +
      (latestBuildableDateStr && latestBuildableDateStr !== curveDate
        ? ` — latest fully-priced date is ${latestBuildableDateStr}.`
        : '.'),
    );
  }

  if (request.getCurveInputsList().length < 2) {
    return emptyPage(
      curveDate, termYears, warnings,
      'Insufficient curve inputs — need at least 2 bonds with prices to bootstrap a curve.',
      latestBuildableDateStr, asofWasDefaulted,
    );
  }

  let response: CurveResponseProto;
  try {
    const conn = getServiceConnection(apiKey);
    const client = new ValuationClient(conn.url, conn.credentials, { interceptors: conn.interceptors, ...conn.clientOptions });
    response = await new Promise<CurveResponseProto>((resolve, reject) => {
      client.runCurve(request, (err, resp) => (err ? reject(err) : resolve(resp)));
    });
  } catch (e: any) {
    return emptyPage(
      curveDate, termYears, warnings,
      `RunCurve failed: ${e.details ?? e.message ?? e}`,
      latestBuildableDateStr, asofWasDefaulted,
    );
  }

  const { par, spot, forward } = parseCurveResponse(response);

  const summary = response.getSummary?.();
  if (summary) {
    try {
      for (const w of summary.getWarningsList?.() ?? []) {
        const detail = (w as any).getDetail?.();
        const text = detail?.toString?.() ?? `Warning code ${(w as any).getCode?.()}`;
        if (text) warnings.push(text);
      }
    } catch { /* summary shape varies */ }
  }

  return {
    par, spot, forward, curveDate, termYears, warnings, error: null,
    latestBuildableDate: latestBuildableDateStr,
    asofWasDefaulted,
  };
}
