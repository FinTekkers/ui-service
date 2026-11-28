/**
 * CPI-U NSA readings for the TIPS Pricer (US-229), read with the existing
 * price `Search`. This module only finds and labels the monthly index
 * levels: the reference CPI and index ratio are derived by valuation-service
 * (MeasureProto.REFERENCE_CPI / INDEX_RATIO), never here.
 */
import { PriceHorizonProto } from "@fintekkers/ledger-models/node/fintekkers/requests/price/query_price_request_pb.js";
import { DateRangeProto } from "@fintekkers/ledger-models/node/fintekkers/models/util/date_range_pb.js";
import { ProductTypeProto } from "@fintekkers/ledger-models/node/fintekkers/models/security/product_type_pb.js";
import { IdentifierTypeProto } from "@fintekkers/ledger-models/node/fintekkers/models/security/identifier/identifier_type_pb.js";
import field_pkg from "@fintekkers/ledger-models/node/fintekkers/models/position/field_pb.js";
import { ZonedDateTime } from "@fintekkers/ledger-models/node/wrappers/models/utils/datetime";
import { PositionFilter } from "@fintekkers/ledger-models/node/wrappers/models/position/positionfilter";
import { SecurityService } from "@fintekkers/ledger-models/node/wrappers/services/security-service/SecurityService";
import { stampOwn } from "@fintekkers/ledger-models/node/wrappers/util/object-types";
import Decimal from "decimal.js";
import { searchSeriesPrices } from "$lib/fixings";

const { FieldProto } = field_pkg;

/** BLS series id of CPI-U NSA, the index US TIPS accrue off. */
export const CPI_U_NSA_SERIES_ID = "CUUR0000SA0";

export type YearMonth = { year: number; month: number }; // month 1-12

/**
 * CPI-U NSA months BLS never published, keyed "YYYY-MM", with the index
 * Treasury announced for TIPS in their place under 31 CFR 356 Appendix B.
 * Only these, and nothing else, stand in for a missing reading (US-328).
 * - 2025-10: no BLS release (2025 federal shutdown). 325.604 per
 *   TreasuryDirect, CPI_20251126.pdf, 26 Nov 2025. valuation-service uses
 *   the same number (VS-163, LM-496).
 */
export const TREASURY_TIPS_INDEX: Readonly<Record<string, string>> =
  Object.freeze({ "2025-10": "325.604" });

function treasuryTipsIndex(m: YearMonth): string | undefined {
  const key = `${m.year}-${String(m.month).padStart(2, "0")}`;
  return Object.prototype.hasOwnProperty.call(TREASURY_TIPS_INDEX, key)
    ? TREASURY_TIPS_INDEX[key]
    : undefined;
}

/** One monthly CPI-U level as stored in the price service. */
export type CpiReading = YearMonth & { label: string; value: string };

export type CpiLookup = {
  /** Readings for months m-3 and m-2, or null unless both exist. */
  readings: CpiReading[] | null;
  /** Latest month loaded, e.g. "Aug 2026"; null when unknown. */
  latestMonth: string | null;
};

/**
 * US-328: CPI-U's change over the 12 months to its latest month, or why
 * there is none. Never a default rate: without the same month a year
 * earlier there is no change.
 */
export type CpiChange =
  | {
      ok: true;
      /** Percent a year at full precision, the unit of
       * TipsInput.assumed_inflation_rate ("3.0 = 3% a year"). */
      rate: string;
      /** The same rate to 1 decimal, for display, e.g. "3.0". */
      pct: string;
      /** The latest month, e.g. "September 2026". */
      month: string;
      /** Set when the year-ago month is one BLS never published, so its
       * level is Treasury's TIPS index (TREASURY_TIPS_INDEX). */
      treasuryIndex?: { month: string; value: string };
    }
  | { ok: false; reason: "no-latest" }
  | {
      ok: false;
      reason: "no-year-ago";
      /** The missing month, e.g. "September 2025". */
      missingMonth: string;
    };

/** What the TIPS Pricer's Current CPI field shows after a lookup. */
export type CurrentCpiState = {
  source: "price-service" | "manual";
  /** valuation-service's REFERENCE_CPI, or "" until there is one. */
  value: string;
  readings: CpiReading[];
  note: string | null;
};

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/** `YYYY-MM-DD` with a real calendar date, else null. */
export function parseSettlementDate(
  value: string | null | undefined
): { year: number; month: number; day: number } | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value ?? "");
  if (!m) return null;
  const [year, month, day] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const d = new Date(Date.UTC(year, month - 1, day));
  if (d.getUTCMonth() !== month - 1 || d.getUTCDate() !== day) return null;
  return { year, month, day };
}

function addMonths(m: YearMonth, n: number): YearMonth {
  const index = m.year * 12 + (m.month - 1) + n;
  return { year: Math.floor(index / 12), month: (index % 12) + 1 };
}

/** Months m-3 and m-2 of the settlement month m. */
export function readingMonthsFor(
  settlementDate: string
): [YearMonth, YearMonth] {
  const d = parseSettlementDate(settlementDate);
  if (!d) throw new Error(`Invalid settlement date: ${settlementDate}`);
  const m = { year: d.year, month: d.month };
  return [addMonths(m, -3), addMonths(m, -2)];
}

/** `[1st 00:00Z, next 1st 00:00Z)` of the month, as UTC milliseconds. */
export function monthWindow(m: YearMonth): { start: number; end: number } {
  return {
    start: Date.UTC(m.year, m.month - 1, 1),
    end: Date.UTC(m.year, m.month, 1),
  };
}

/** e.g. "September 2026". */
export function longMonthLabel(m: YearMonth): string {
  const name = new Date(Date.UTC(m.year, m.month - 1, 1)).toLocaleString(
    "en-US",
    { month: "long", timeZone: "UTC" }
  );
  return `${name} ${m.year}`;
}

export function monthLabel(m: YearMonth): string {
  return `${MONTHS[m.month - 1]} ${m.year}`;
}

/** e.g. "CPI-U Jul 2026": month only, never a day. */
export function cpiReadingLabel(m: YearMonth): string {
  return `CPI-U ${monthLabel(m)}`;
}

export function noReadingNote(
  settlementDate: string,
  latestMonth: string | null
): string {
  return `No CPI-U reading for ${settlementDate} in the price service (latest loaded: ${
    latestMonth ?? "unknown"
  }). Enter it to calculate. It is not saved.`;
}

export function currentCpiFromLookup(
  settlementDate: string,
  lookup: CpiLookup
): CurrentCpiState {
  if (lookup.readings) {
    return {
      source: "price-service",
      value: "",
      readings: lookup.readings,
      note: null,
    };
  }
  return {
    source: "manual",
    value: "",
    readings: [],
    note: noReadingNote(settlementDate, lookup.latestMonth),
  };
}

/**
 * The UUID of the CPI-U NSA series, matched on its SERIES_ID identifier
 * only. Another CPI_U-indexed series (e.g. CPI-U SA) never matches.
 */
export async function findCpiUSeriesId(
  apiKey?: string
): Promise<string | null> {
  const filter = new PositionFilter();
  filter.addEqualsFilter(FieldProto.ASSET_CLASS, "RATES");
  const securities = await new SecurityService(apiKey).searchSecurityAsOfNow(
    filter
  );
  for (const sec of securities) {
    if (sec.proto.getProductType() !== ProductTypeProto.CPI_SERIES) continue;
    const isSeries = sec.proto
      .getIdentifiersList()
      .some(
        (id) =>
          id.getIdentifierType() === IdentifierTypeProto.SERIES_ID &&
          id.getIdentifierValue() === CPI_U_NSA_SERIES_ID
      );
    if (isSeries) return sec.getID().toString();
  }
  return null;
}

async function fetchMonth(
  seriesId: string,
  m: YearMonth,
  apiKey?: string
): Promise<CpiReading | null> {
  const { start, end } = monthWindow(m);
  const points = await searchSeriesPrices(
    seriesId,
    (request) => {
      // date_range's end is inclusive: the half-open filter below drops a
      // row stamped exactly on the next month's 1st.
      const range = new DateRangeProto();
      stampOwn(range);
      range.setStart(ZonedDateTime.from(new Date(start)).toProto());
      range.setEnd(ZonedDateTime.from(new Date(end)).toProto());
      request.setDateRange(range);
    },
    apiKey
  );
  // One reading per month: the latest stamp wins when an old duplicate
  // (e.g. 00:00Z next to 08:30 New York) is still loaded.
  const inMonth = points
    .filter((p) => p.at >= start && p.at < end)
    .sort((a, b) => a.at - b.at);
  const latest = inMonth[inMonth.length - 1];
  if (!latest) return null;
  return { ...m, label: cpiReadingLabel(m), value: latest.value };
}

/**
 * Every month the series has, oldest first, from one PRICE_HORIZON_MAX
 * search. One reading per month: the latest stamp wins, as in fetchMonth.
 */
async function fetchMonthlyReadings(
  seriesId: string,
  apiKey?: string
): Promise<CpiReading[]> {
  const points = await searchSeriesPrices(
    seriesId,
    (request) => request.setHorizon(PriceHorizonProto.PRICE_HORIZON_MAX),
    apiKey
  );
  const byMonth = new Map<number, { at: number; reading: CpiReading }>();
  for (const p of points) {
    const at = new Date(p.at);
    const m = { year: at.getUTCFullYear(), month: at.getUTCMonth() + 1 };
    const key = m.year * 12 + m.month - 1;
    const seen = byMonth.get(key);
    if (seen && seen.at >= p.at) continue;
    byMonth.set(key, {
      at: p.at,
      reading: { ...m, label: cpiReadingLabel(m), value: p.value },
    });
  }
  return [...byMonth.entries()]
    .sort(([a], [b]) => a - b)
    .map(([, { reading }]) => reading);
}

async function fetchLatestMonth(
  seriesId: string,
  apiKey?: string
): Promise<string | null> {
  const readings = await fetchMonthlyReadings(seriesId, apiKey);
  const latest = readings[readings.length - 1];
  return latest ? monthLabel(latest) : null;
}

/**
 * The 12-month change to the latest of `readings`: the latest month against
 * exactly the same month a year earlier, never an older one. 300.0 against
 * 291.26 is rate "3.0007..." and pct "3.0". The rate is display-free: it is
 * what valuation-service is sent. A year-ago month BLS never published uses
 * Treasury's TIPS index for it (TREASURY_TIPS_INDEX), and only that.
 */
export function twelveMonthCpiChange(readings: CpiReading[]): CpiChange {
  let latest: CpiReading | undefined;
  for (const r of readings) {
    if (!latest || r.year * 12 + r.month > latest.year * 12 + latest.month) {
      latest = r;
    }
  }
  if (!latest) return { ok: false, reason: "no-latest" };
  const target = addMonths(latest, -12);
  const yearAgo = readings.find(
    (r) => r.year === target.year && r.month === target.month
  );
  const treasury = yearAgo ? undefined : treasuryTipsIndex(target);
  const yearAgoValue = yearAgo?.value ?? treasury;
  const base = yearAgoValue !== undefined && new Decimal(yearAgoValue);
  const now = new Decimal(latest.value);
  if (!base || !base.isFinite() || base.lte(0)) {
    return {
      ok: false,
      reason: "no-year-ago",
      missingMonth: longMonthLabel(target),
    };
  }
  if (!now.isFinite()) return { ok: false, reason: "no-latest" };
  const rate = now.dividedBy(base).minus(1).times(100);
  return {
    ok: true,
    rate: rate.toFixed(),
    pct: rate.toFixed(1),
    month: longMonthLabel(latest),
    ...(treasury !== undefined
      ? { treasuryIndex: { month: longMonthLabel(target), value: treasury } }
      : {}),
  };
}

/**
 * US-328: CPI-U NSA's change over the 12 months to its latest month in the
 * price service. Never throws: a failed lookup reads as "no-latest".
 */
export async function fetchLatestCpiChange(
  apiKey?: string
): Promise<CpiChange> {
  try {
    const seriesId = await findCpiUSeriesId(apiKey);
    if (!seriesId) return { ok: false, reason: "no-latest" };
    return twelveMonthCpiChange(await fetchMonthlyReadings(seriesId, apiKey));
  } catch (e: any) {
    console.error(
      "CPI-U 12-month change lookup failed:",
      e?.details ?? e?.message ?? e
    );
    return { ok: false, reason: "no-latest" };
  }
}

/**
 * CPI-U NSA readings for months m-3 and m-2 of the settlement month. Never
 * throws: a security or price service error reads as "no readings" with an
 * unknown latest month, so the page still renders and the user can type it.
 */
export async function fetchCpiReadings(
  settlementDate: string,
  apiKey?: string
): Promise<CpiLookup> {
  let seriesId: string | null = null;
  try {
    seriesId = await findCpiUSeriesId(apiKey);
    if (!seriesId) return { readings: null, latestMonth: null };
    const months = readingMonthsFor(settlementDate);
    const found = await Promise.all(
      months.map((m) => fetchMonth(seriesId!, m, apiKey))
    );
    if (found.every((r): r is CpiReading => r !== null)) {
      return { readings: found, latestMonth: null };
    }
    return {
      readings: null,
      latestMonth: await fetchLatestMonth(seriesId, apiKey),
    };
  } catch (e: any) {
    console.error(
      "CPI-U reading lookup failed:",
      e?.details ?? e?.message ?? e
    );
    return { readings: null, latestMonth: null };
  }
}
