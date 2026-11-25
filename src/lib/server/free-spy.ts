/**
 * US-334: /free/spy's server load. SPY's stored SecurityMetric series
 * (LM-485), read through the broker with the server-held homepage key
 * (FT_HOMEPAGE_API_KEY), never a visitor's, plus the figures derived from
 * them here: monthly net flows vs market move, and (once an expense-ratio
 * series is stored) sponsor fee revenue.
 *
 * Every derivation uses stored series only, in exact decimals. A missing
 * day makes the figures that need it null, never 0, and nothing is
 * interpolated or defaulted. A failed series makes only the sections that
 * need it unavailable. Nothing here throws.
 */
import Decimal from "decimal.js";
import type { SecurityProto } from "@fintekkers/ledger-models/node/fintekkers/models/security/security_pb.js";
import { IdentifierTypeProto } from "@fintekkers/ledger-models/node/fintekkers/models/security/identifier/identifier_type_pb";
import { SecurityMetricClient } from "@fintekkers/ledger-models/node/fintekkers/services/security-metric-service/security_metric_service_grpc_pb";
import type {
  SearchSecurityMetricRequestProto,
  SearchSecurityMetricResponseProto,
} from "@fintekkers/ledger-models/node/fintekkers/requests/security_metric/search_security_metric_request_pb";
import type {
  GetLatestSecurityMetricRequestProto,
  GetLatestSecurityMetricResponseProto,
} from "@fintekkers/ledger-models/node/fintekkers/requests/security_metric/get_latest_security_metric_request_pb";
import {
  SecurityMetricService,
  type SecurityMetricFetcher,
} from "@fintekkers/ledger-models/node/wrappers/services/security-metric-service/SecurityMetricService";
import {
  isoDate,
  type MetricSeries,
} from "@fintekkers/ledger-models/node/wrappers/models/security/security_metric";
import { UUID } from "@fintekkers/ledger-models/node/wrappers/models/utils/uuid";
import { getServiceConnection } from "$lib/grpc-auth";
import { FetchSecurityProtoByIdentifier } from "$lib/security";
import {
  SPY_FEE_UNAVAILABLE,
  daysOld,
  isStale,
  type Section,
  type SpyFeeMonth,
  type SpyLatest,
  type SpyMonth,
  type SpyPageData,
  type SpyPoint,
} from "$lib/free/spy";

export const SPY_TICKER = "SPY";

/** SPY's launch: every search starts here, so nothing stored is cut off. */
export const SPY_INCEPTION = "1993-01-22";

/** The series the page reads, by SecurityMetricTypeProto name. */
export const SPY_METRICS = [
  "SHARES_OUTSTANDING",
  "NAV_PER_SHARE",
  "TOTAL_NET_ASSETS",
] as const;
type SpyMetric = (typeof SPY_METRICS)[number];

/** A stored series as the derivations take it: [ISO date, value or null]. */
export type DailySeries = ReadonlyArray<readonly [string, string | null]>;

// ---------------------------------------------------------------- derive

/** Non-null values keyed by date. */
function byDate(series: DailySeries): Map<string, Decimal> {
  const map = new Map<string, Decimal>();
  for (const [date, value] of series) {
    if (value !== null) map.set(date, new Decimal(value));
  }
  return map;
}

/**
 * The trading calendar: every date any of the series has, ascending. A day
 * missing from all of them is invisible here, so it can't null a month;
 * a day one series has and another lacks is a gap in the one that lacks it.
 */
export function tradingCalendar(...series: DailySeries[]): string[] {
  const dates = new Set<string>();
  for (const s of series) for (const [date] of s) dates.add(date);
  return [...dates].sort();
}

/** "2026-10" → "2026-09". */
function previousMonth(month: string): string {
  const y = Number(month.slice(0, 4));
  const m = Number(month.slice(5, 7));
  return m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, "0")}`;
}

function nextMonth(month: string): string {
  const y = Number(month.slice(0, 4));
  const m = Number(month.slice(5, 7));
  return m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;
}

/** Every month from the first to the last, inclusive. */
function monthsBetween(first: string, last: string): string[] {
  const months: string[] = [];
  for (let m = first; m <= last; m = nextMonth(m)) months.push(m);
  return months;
}

/**
 * Monthly AUM change split into net flows and market move.
 *
 * - aumEnd: TOTAL_NET_ASSETS on the month's last trading day; null when
 *   that day has none (never an earlier day's).
 * - deltaAum: aumEnd − the previous calendar month's aumEnd; null when
 *   either is null (so always null for the first month).
 * - netFlows: Σ over the month's trading days d of (shares[d] −
 *   shares[previous trading day]) × nav[d]. Null when any of those values
 *   is missing, or d has no previous trading day in this or the previous
 *   month: never a partial sum.
 * - marketMove: deltaAum − netFlows, so the two add up to deltaAum exactly.
 *
 * Months with no trading days at all, between the first and last, are
 * kept with every figure null.
 */
export function monthlyFlows(
  shares: DailySeries,
  nav: DailySeries,
  tna: DailySeries
): SpyMonth[] {
  const calendar = tradingCalendar(shares, nav, tna);
  if (!calendar.length) return [];
  const s = byDate(shares);
  const n = byDate(nav);
  const t = byDate(tna);

  const flows = new Map<string, Decimal | null>();
  const lastDay = new Map<string, string>();
  calendar.forEach((day, i) => {
    const month = day.slice(0, 7);
    lastDay.set(month, day);
    const prev = i > 0 ? calendar[i - 1] : null;
    const prevMonth = prev?.slice(0, 7);
    const sum = flows.has(month) ? flows.get(month) ?? null : new Decimal(0);
    const today = s.get(day);
    const before = prev ? s.get(prev) : undefined;
    const price = n.get(day);
    const linked =
      prevMonth !== undefined &&
      (prevMonth === month || prevMonth === previousMonth(month));
    flows.set(
      month,
      sum === null || !linked || !today || !before || !price
        ? null
        : sum.plus(today.minus(before).times(price))
    );
  });

  const months = monthsBetween(
    calendar[0].slice(0, 7),
    calendar[calendar.length - 1].slice(0, 7)
  );
  const aumEnd = new Map<string, Decimal | null>();
  for (const month of months) {
    const day = lastDay.get(month);
    aumEnd.set(month, day ? t.get(day) ?? null : null);
  }

  return months.map((month) => {
    const end = aumEnd.get(month) ?? null;
    const prior = aumEnd.get(previousMonth(month)) ?? null;
    const delta = end && prior ? end.minus(prior) : null;
    const net = flows.get(month) ?? null;
    return {
      month,
      aumEnd: end ? end.toString() : null,
      deltaAum: delta ? delta.toString() : null,
      netFlows: net ? net.toString() : null,
      marketMove: delta && net ? delta.minus(net).toString() : null,
    };
  });
}

/** The ISO date one day after `iso`. */
function nextDay(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

/**
 * Estimated sponsor fee revenue per month: Σ over every calendar day d of
 * AUM(d) × the expense ratio in force on d ÷ 365.
 *
 * - The ratio is an annual fraction (0.000945 for 9.45 bp). The one in
 *   force on d is the latest stored with observation date ≤ d, so a change
 *   applies from its own date and splits its month there.
 * - AUM(d) is TOTAL_NET_ASSETS on d for a trading day; a non-trading day
 *   (weekend, holiday) uses the previous trading day's, as the trust
 *   accrues its fee daily.
 * - A month is null when any of its days has no AUM (a trading day missing
 *   from TOTAL_NET_ASSETS, or a day before the first trading day) or no
 *   ratio in force. Days after the last trading day are not counted, so
 *   the latest month is month to date.
 */
export function feeRevenue(
  tna: DailySeries,
  ratio: DailySeries,
  calendar: string[]
): SpyFeeMonth[] {
  if (!calendar.length) return [];
  const trading = new Set(calendar);
  const t = byDate(tna);
  const ratios = [...byDate(ratio).entries()].sort(([a], [b]) =>
    a < b ? -1 : 1
  );
  const first = calendar[0];
  const last = calendar[calendar.length - 1];

  const fees = new Map<string, Decimal | null>();
  let aum: Decimal | null = null;
  let r = -1;
  for (let day = `${first.slice(0, 7)}-01`; day <= last; day = nextDay(day)) {
    const month = day.slice(0, 7);
    if (trading.has(day)) aum = t.get(day) ?? null;
    while (r + 1 < ratios.length && ratios[r + 1][0] <= day) r++;
    const inForce = r >= 0 ? ratios[r][1] : null;
    const sum = fees.has(month) ? fees.get(month) ?? null : new Decimal(0);
    fees.set(
      month,
      sum === null || aum === null || inForce === null
        ? null
        : sum.plus(aum.times(inForce).dividedBy(365))
    );
  }
  return [...fees.entries()].map(([month, fee]) => ({
    month,
    fee: fee === null ? null : fee.toString(),
  }));
}

/** The latest non-null point of `series`, or null. */
export function latestShareCount(
  series: DailySeries
): { date: string; value: string } | null {
  for (let i = series.length - 1; i >= 0; i--) {
    const [date, value] = series[i];
    if (value !== null) return { date, value };
  }
  return null;
}

// ---------------------------------------------------------------- broker

/**
 * A SecurityMetricFetcher that calls the broker (BROKER_HOST) with `apiKey`
 * on every request, as the other broker clients do (getServiceConnection).
 * The wrapper's default gRPC fetcher sends no key, and the broker rejects
 * keyless calls. Read-only: ui-service never writes metrics.
 */
export function brokerSecurityMetricFetcher(
  apiKey: string
): SecurityMetricFetcher & { close(): void } {
  const conn = getServiceConnection(apiKey);
  const client = new SecurityMetricClient(conn.url, conn.credentials, {
    interceptors: conn.interceptors,
    ...conn.clientOptions,
  });
  return {
    getLatest(request: GetLatestSecurityMetricRequestProto) {
      return new Promise<GetLatestSecurityMetricResponseProto>(
        (resolve, reject) => {
          client.getLatest(request, (err, response) => {
            if (err) reject(err);
            else resolve(response);
          });
        }
      );
    },
    search(request: SearchSecurityMetricRequestProto) {
      return new Promise<SearchSecurityMetricResponseProto[]>(
        (resolve, reject) => {
          const chunks: SearchSecurityMetricResponseProto[] = [];
          const stream = client.search(request);
          stream.on("data", (chunk: SearchSecurityMetricResponseProto) =>
            chunks.push(chunk)
          );
          stream.on("end", () => resolve(chunks));
          stream.on("error", (err: unknown) => reject(err));
        }
      );
    },
    createOrUpdate() {
      return Promise.reject(
        new Error("ui-service reads security metrics only")
      );
    },
    close() {
      client.close();
    },
  };
}

function errorText(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

function unavailable<T>(message: string): Section<T> {
  return { ok: false, message };
}

function toPoints(series: MetricSeries): SpyPoint[] {
  return series.points.map((p) => [isoDate(p.date), p.value.toString()]);
}

/**
 * Everything /free/spy shows. An unset key, or SPY not found, makes every
 * section unavailable with that reason. The fee section is always
 * unavailable: no expense-ratio series is stored (and none is read), and a
 * ratio is never defaulted.
 */
export async function loadFreeSpy(
  apiKey: string | undefined,
  now: Date
): Promise<SpyPageData> {
  const asOf = now.toISOString().slice(0, 10);
  const fees = unavailable<SpyFeeMonth[]>(SPY_FEE_UNAVAILABLE);
  const all = (message: string): SpyPageData => ({
    asOf,
    latest: unavailable(message),
    shares: unavailable(message),
    flows: unavailable(message),
    fees,
  });
  if (!apiKey) {
    return all("Unavailable: live data is not configured on this server.");
  }

  let security: SecurityProto;
  try {
    security = await FetchSecurityProtoByIdentifier(
      IdentifierTypeProto.EXCH_TICKER,
      SPY_TICKER,
      apiKey
    );
  } catch (e) {
    return all(`Unavailable: SPY could not be found (${errorText(e)}).`);
  }
  const uuid = UUID.fromUUIDProto(security.getUuid());
  if (!uuid) return all("Unavailable: SPY's security record has no ID.");

  let fetcher: ReturnType<typeof brokerSecurityMetricFetcher>;
  try {
    fetcher = brokerSecurityMetricFetcher(apiKey);
  } catch (e) {
    return all(
      `Unavailable: the SecurityMetric service could not be reached (${errorText(
        e
      )}).`
    );
  }
  const service = new SecurityMetricService({ fetcher });
  const settled = await Promise.allSettled(
    SPY_METRICS.map((metric) =>
      service.getHistory(metric, uuid, SPY_INCEPTION, asOf)
    )
  );
  fetcher.close();

  const series = {} as Record<SpyMetric, Section<SpyPoint[]>>;
  SPY_METRICS.forEach((metric, i) => {
    const result = settled[i];
    if (result.status === "rejected") {
      series[metric] = unavailable(
        `Unavailable: ${metric} could not be read (${errorText(
          result.reason
        )}).`
      );
    } else if (!result.value.points.length) {
      series[metric] = unavailable(
        `Unavailable: no ${metric} values are stored for SPY.`
      );
    } else {
      series[metric] = { ok: true, data: toPoints(result.value) };
    }
  });

  const shares = series.SHARES_OUTSTANDING;
  const nav = series.NAV_PER_SHARE;
  const tna = series.TOTAL_NET_ASSETS;

  let latest: Section<SpyLatest>;
  const last = shares.ok ? latestShareCount(shares.data) : null;
  if (!shares.ok) latest = shares;
  else if (!last)
    latest = unavailable("Unavailable: no share count is stored.");
  else {
    latest = {
      ok: true,
      data: {
        ...last,
        ageDays: daysOld(last.date, now),
        stale: isStale(last.date, now),
      },
    };
  }

  let flows: Section<SpyMonth[]>;
  if (!shares.ok) flows = shares;
  else if (!nav.ok) flows = nav;
  else if (!tna.ok) flows = tna;
  else
    flows = { ok: true, data: monthlyFlows(shares.data, nav.data, tna.data) };

  return { asOf, latest, shares, flows, fees };
}
