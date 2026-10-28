/**
 * US-298: /free/tips's live figures for one TIPS, TII 1⅞ 01/15/36.
 *
 * The caller passes the server-held homepage key (FT_HOMEPAGE_API_KEY),
 * never a visitor's. Lives under src/lib/server/ so SvelteKit refuses any
 * client import of it. Four sources, each its own section:
 * - security: the ledger security master, by CUSIP;
 * - price: the latest FedInvest real clean price within 7 days (the only
 *   loader of US Treasury prices into price-service is FedInvest's);
 * - CPI-U: months m-3 and m-2 of the price date's month;
 * - valuation: valuation-service at the price date, for the position of the
 *   security's face. Never CLEAN_PRICE: the price is an input (VS-138).
 * A failed source makes its section, and the sections that need it,
 * unavailable. Nothing here throws, and nothing falls back to the mock.
 *
 * Only display formatting happens here: every measure is valuation-service's.
 */
import Decimal from "decimal.js";
import type { SecurityProto } from "@fintekkers/ledger-models/node/fintekkers/models/security/security_pb.js";
import type { LocalDateProto } from "@fintekkers/ledger-models/node/fintekkers/models/util/local_date_pb.js";
import { CouponFrequencyProto } from "@fintekkers/ledger-models/node/fintekkers/models/security/coupon_frequency_pb.js";
import { IdentifierTypeProto } from "@fintekkers/ledger-models/node/fintekkers/models/security/identifier/identifier_type_pb.js";
import { ProductTypeProto } from "@fintekkers/ledger-models/node/fintekkers/models/security/product_type_pb.js";
import index_type_pkg from "@fintekkers/ledger-models/node/fintekkers/models/security/index/index_type_pb.js";
import measure_pkg from "@fintekkers/ledger-models/node/fintekkers/models/position/measure_pb.js";
import field_pkg from "@fintekkers/ledger-models/node/fintekkers/models/position/field_pb.js";
import type { Identifier } from "@fintekkers/ledger-models/node/wrappers/models/security/identifier";
import { PriceService } from "@fintekkers/ledger-models/node/wrappers/services/price-service/PriceService";
import { ZonedDateTime } from "@fintekkers/ledger-models/node/wrappers/models/utils/datetime";
import { PositionFilter } from "@fintekkers/ledger-models/node/wrappers/models/position/positionfilter";
import { UUID } from "@fintekkers/ledger-models/node/wrappers/models/utils/uuid";
import { fetchCpiReadings, monthLabel, type CpiReading } from "$lib/cpi";
import { fromDecimalProto } from "$lib/decimal";
import { FetchSecurityProtoByCusip } from "$lib/security";
import { RunTipsMeasures } from "$lib/valuation";
import {
  UNAVAILABLE,
  type Section,
  type TipsCpiView,
  type TipsPageData,
  type TipsPriceView,
  type TipsSecurityView,
  type TipsValuationView,
} from "$lib/free/tips";

const { MeasureProto } = measure_pkg;
const { FieldProto } = field_pkg;
const { IndexTypeProto } = index_type_pkg;

export const FREE_TIPS_CUSIP = "91282CPU9";

/** The measures /free/tips shows, plus the cashflows for the next coupon. */
export const FREE_TIPS_MEASURES = [
  MeasureProto.REFERENCE_CPI,
  MeasureProto.INDEX_RATIO,
  MeasureProto.INFLATION_ADJUSTED_PRINCIPAL,
  MeasureProto.MARKET_VALUE,
  MeasureProto.YIELD_TO_MATURITY,
  MeasureProto.PRESENT_VALUE_CASHFLOWS,
];

/** The calculator's labelled inflation assumption, in percent. */
export const ASSUMED_INFLATION_PCT = "2.30";

/** The price lookback: the latest price at most this many days old. */
export const PRICE_LOOKBACK_DAYS = 7;

const DAY_MS = 24 * 60 * 60 * 1000;

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const FREQUENCY_LABELS: Partial<Record<CouponFrequencyProto, string>> = {
  [CouponFrequencyProto.ANNUALLY]: "Annual",
  [CouponFrequencyProto.SEMIANNUALLY]: "Semiannual",
  [CouponFrequencyProto.QUARTERLY]: "Quarterly",
  [CouponFrequencyProto.MONTHLY]: "Monthly",
};

const PERIODS_PER_YEAR: Partial<Record<CouponFrequencyProto, number>> = {
  [CouponFrequencyProto.ANNUALLY]: 1,
  [CouponFrequencyProto.SEMIANNUALLY]: 2,
  [CouponFrequencyProto.QUARTERLY]: 4,
  [CouponFrequencyProto.MONTHLY]: 12,
};

function unavailable<T>(message: string): Section<T> {
  return { ok: false, message };
}

function enumName(values: object, value: number): string | undefined {
  return Object.entries(values).find(([, v]) => v === value)?.[0];
}

/** "1234.5" → "$1,234.50"; with `whole`, "1000" → "$1,000". */
function dollars(value: string, whole = false): string {
  const d = new Decimal(value);
  const fixed = d.abs().toFixed(whole && d.isInteger() ? 0 : 2);
  const [int, frac] = fixed.split(".");
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${d.isNegative() ? "−" : ""}$${grouped}${frac ? `.${frac}` : ""}`;
}

type Ymd = { year: number; month: number; day: number };

function isoDate({ year, month, day }: Ymd): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(
    2,
    "0"
  )}`;
}

function longDate({ year, month, day }: Ymd): string {
  return `${MONTH_NAMES[month - 1]} ${day}, ${year}`;
}

function ymdOf(proto: LocalDateProto | undefined): Ymd | null {
  if (!proto || !proto.getYear()) return null;
  return {
    year: proto.getYear(),
    month: proto.getMonth(),
    day: proto.getDay(),
  };
}

function ymdFromIso(iso: string): Ymd {
  const [year, month, day] = iso.split("-").map((part) => Number(part));
  return { year, month, day };
}

/** "Jan 15 / Jul 15": the coupon dates in a year, from the maturity date. */
function payDates(maturity: Ymd, perYear: number | undefined): string {
  const step = perYear ? 12 / perYear : 12;
  const months = Array.from(
    { length: 12 / step },
    (_, i) => ((maturity.month - 1 + i * step) % 12) + 1
  ).sort((a, b) => a - b);
  return months
    .map((m) => `${MONTH_NAMES[m - 1].slice(0, 3)} ${maturity.day}`)
    .join(" / ");
}

/** The security panel's fields, or null when the proto lacks one. */
export function securityView(proto: SecurityProto): TipsSecurityView | null {
  const bond = proto.getBondDetails();
  const tips = proto.getTipsExtension();
  const dated = ymdOf(bond?.getDatedDate());
  const maturity = ymdOf(bond?.getMaturityDate());
  const couponRate = fromDecimalProto(bond?.getCouponRate());
  const faceValue = fromDecimalProto(bond?.getFaceValue());
  const baseCpi = fromDecimalProto(tips?.getBaseCpi());
  if (
    !bond ||
    !tips ||
    !dated ||
    !maturity ||
    !couponRate ||
    !faceValue ||
    !baseCpi
  ) {
    return null;
  }
  const frequency = bond.getCouponFrequency();
  const indexType = tips.getInflationIndexType();
  const cusip =
    proto
      .getIdentifiersList()
      .find((id) => id.getIdentifierType() === IdentifierTypeProto.CUSIP)
      ?.getIdentifierValue() || FREE_TIPS_CUSIP;
  return {
    cusip,
    description: proto.getDescription() || FREE_TIPS_CUSIP,
    issuer: proto.getIssuerName(),
    product:
      enumName(ProductTypeProto, proto.getProductType()) ?? "Unknown product",
    couponRate,
    frequency: FREQUENCY_LABELS[frequency] ?? "Unknown frequency",
    payDates: payDates(maturity, PERIODS_PER_YEAR[frequency]),
    datedDate: isoDate(dated),
    datedDateLong: longDate(dated),
    maturityDate: isoDate(maturity),
    maturityDateLong: longDate(maturity),
    index:
      indexType === IndexTypeProto.CPI_U
        ? "CPI-U NSA"
        : enumName(IndexTypeProto, indexType) ?? "Unknown index",
    baseCpi,
    faceValue,
    faceDisplay: dollars(faceValue, true),
  };
}

/**
 * The latest price for the security whose UTC date is at most 7 days
 * before `today` (inclusive) and not after it, or null. One price search,
 * as the homepage chart does it.
 */
export async function fetchLatestRealCleanPrice(
  securityUuid: string,
  apiKey: string,
  today: Date
): Promise<{ value: string; date: string } | null> {
  const filter = new PositionFilter();
  // Same cast as /data/prices: the wrapper's addObjectFilter declares only
  // Identifier, but the runtime accepts a UUID for SECURITY_ID.
  filter.addObjectFilter(
    FieldProto.SECURITY_ID,
    new UUID(UUID.fromString(securityUuid)) as unknown as Identifier
  );
  const prices = await new PriceService(apiKey).search(
    ZonedDateTime.now().toProto(),
    filter
  );

  const end = isoDate({
    year: today.getUTCFullYear(),
    month: today.getUTCMonth() + 1,
    day: today.getUTCDate(),
  });
  const start = new Date(Date.parse(end) - PRICE_LOOKBACK_DAYS * DAY_MS)
    .toISOString()
    .slice(0, 10);

  let latest: { value: string; date: string; at: number } | null = null;
  for (const price of prices) {
    const at = price.getAsOf().toDateTime().toMillis();
    const date = new Date(at).toISOString().slice(0, 10);
    if (date < start || date > end) continue;
    if (!latest || at > latest.at) {
      latest = { value: price.getPrice().toString(), date, at };
    }
  }
  return latest && { value: latest.value, date: latest.date };
}

function priceView(price: { value: string; date: string }): TipsPriceView {
  const ymd = ymdFromIso(price.date);
  return {
    value: price.value,
    date: price.date,
    dateLong: longDate(ymd),
    monthYear: `${MONTH_NAMES[ymd.month - 1]} ${ymd.year}`,
    monthName: MONTH_NAMES[ymd.month - 1],
    nextMonthName: MONTH_NAMES[ymd.month % 12],
  };
}

function cpiView(readings: CpiReading[]): TipsCpiView {
  const [first, second] = readings.map((r) => ({
    label: r.label,
    monthName: MONTH_NAMES[r.month - 1],
    value: r.value,
  }));
  return {
    readings: [first, second],
    months: `${first.label} and ${monthLabel(readings[1])}`,
  };
}

async function loadValuation(
  proto: SecurityProto,
  security: TipsSecurityView,
  price: TipsPriceView,
  cpiReadings: CpiReading[],
  apiKey: string
): Promise<Section<TipsValuationView>> {
  const run = await RunTipsMeasures(
    {
      mode: "cusip",
      cusip: security.cusip,
      price: price.value,
      cpiReadings,
      settlementDate: price.date,
    },
    FREE_TIPS_MEASURES,
    apiKey,
    { security: proto, directedQuantity: security.faceValue }
  );
  if ("error" in run) {
    console.log("Could not value the free TIPS", run.error);
    return unavailable(UNAVAILABLE.valuation);
  }
  const measure = (m: number) => run.values.get(m) || null;
  const referenceCpi = measure(MeasureProto.REFERENCE_CPI);
  const indexRatio = measure(MeasureProto.INDEX_RATIO);
  const adjusted = measure(MeasureProto.INFLATION_ADJUSTED_PRINCIPAL);
  const marketValue = measure(MeasureProto.MARKET_VALUE);
  const ytm = measure(MeasureProto.YIELD_TO_MATURITY);
  if (!referenceCpi || !indexRatio || !adjusted || !marketValue || !ytm) {
    return unavailable(UNAVAILABLE.valuation);
  }
  const moved = new Decimal(indexRatio).minus(1).times(100);
  const first = [...run.cashflows].sort((a, b) =>
    a.date.localeCompare(b.date)
  )[0];
  return {
    ok: true,
    data: {
      referenceCpi: new Decimal(referenceCpi).toFixed(5),
      indexRatio: new Decimal(indexRatio).toFixed(5),
      inflationVerb: moved.isNegative() ? "fell" : "rose",
      inflationPct: `${moved.abs().toFixed(2)}%`,
      adjustedPrincipal: dollars(adjusted),
      marketValue: dollars(marketValue),
      realYield: new Decimal(ytm).times(100).toFixed(3),
      nextCoupon: first ? dollars(first.fvAmount) : null,
    },
  };
}

/** Actual/365 years from the price date to maturity, to 2 decimals. */
function yearsToMaturity(priceDate: string, maturityDate: string): string {
  const days = (Date.parse(maturityDate) - Date.parse(priceDate)) / DAY_MS;
  return new Decimal(days).dividedBy(365).toFixed(2);
}

/** Every section of /free/tips. `apiKey` undefined: all unavailable, and no
 * call is made (the broker rejects keyless calls). */
export async function fetchFreeTips(
  apiKey: string | undefined,
  today: Date
): Promise<TipsPageData> {
  const data: TipsPageData = {
    cusip: FREE_TIPS_CUSIP,
    asOf: { priceDate: null, cpiMonths: null },
    security: unavailable(UNAVAILABLE.security),
    price: unavailable(UNAVAILABLE.price),
    cpi: unavailable(UNAVAILABLE.cpi),
    valuation: unavailable(UNAVAILABLE.valuation),
    calculator: { years: null, inflation: ASSUMED_INFLATION_PCT },
  };
  if (!apiKey) return data;

  let proto: SecurityProto;
  let security: TipsSecurityView | null;
  try {
    proto = await FetchSecurityProtoByCusip(FREE_TIPS_CUSIP, apiKey);
    security = securityView(proto);
  } catch (error) {
    // The message only: the error object can carry request metadata.
    console.log("Could not fetch the free TIPS", (error as Error)?.message);
    return data;
  }
  if (!security) return data;
  data.security = { ok: true, data: security };

  let price: TipsPriceView | null = null;
  try {
    const uuid = UUID.fromUUIDProto(proto.getUuid())?.toString();
    const latest = uuid
      ? await fetchLatestRealCleanPrice(uuid, apiKey, today)
      : null;
    price = latest && priceView(latest);
  } catch (error) {
    console.log("Could not fetch the TIPS price", (error as Error)?.message);
  }
  if (!price) return data;
  data.price = { ok: true, data: price };
  data.asOf.priceDate = price.date;
  data.calculator.years = yearsToMaturity(price.date, security.maturityDate);

  // Never throws: a failed lookup reads as no readings.
  const { readings } = await fetchCpiReadings(price.date, apiKey);
  if (!readings || readings.length !== 2) return data;
  const cpi = cpiView(readings);
  data.cpi = { ok: true, data: cpi };
  data.asOf.cpiMonths = cpi.months;

  try {
    data.valuation = await loadValuation(
      proto,
      security,
      price,
      readings,
      apiKey
    );
  } catch (error) {
    console.log("Could not value the free TIPS", (error as Error)?.message);
  }
  return data;
}
