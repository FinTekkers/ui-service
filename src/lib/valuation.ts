import { ValuationClient } from "@fintekkers/ledger-models/node/fintekkers/services/valuation-service/valuation_service_grpc_pb.js";
import { ValuationRequestProto } from "@fintekkers/ledger-models/node/fintekkers/requests/valuation/valuation_request_pb.js";
import {
  ProductInput,
  InflationIndexInput,
  MonthlyIndexReadings,
  MonthlyIndexReading,
  ReferenceRateFixingProto,
} from "@fintekkers/ledger-models/node/fintekkers/requests/valuation/product_inputs_pb.js";
import { PriceProto } from "@fintekkers/ledger-models/node/fintekkers/models/price/price_pb.js";
import { LocalDateProto } from "@fintekkers/ledger-models/node/fintekkers/models/util/local_date_pb.js";
import {
  SecurityProto,
  TipsExtensionProto,
} from "@fintekkers/ledger-models/node/fintekkers/models/security/security_pb.js";
import { CouponTypeProto } from "@fintekkers/ledger-models/node/fintekkers/models/security/coupon_type_pb.js";
import { CouponFrequencyProto } from "@fintekkers/ledger-models/node/fintekkers/models/security/coupon_frequency_pb.js";
import index_type_pkg from "@fintekkers/ledger-models/node/fintekkers/models/security/index/index_type_pb.js";
import measure_pkg from "@fintekkers/ledger-models/node/fintekkers/models/position/measure_pb.js";
import { PositionProto } from "@fintekkers/ledger-models/node/fintekkers/models/position/position_pb.js";
import { MeasureMapEntry } from "@fintekkers/ledger-models/node/fintekkers/models/position/position_util_pb.js";
import operation_pkg from "@fintekkers/ledger-models/node/fintekkers/requests/util/operation_pb.js";
import { ZonedDateTime } from "@fintekkers/ledger-models/node/wrappers/models/utils/datetime";
import BondSecurity from "@fintekkers/ledger-models/node/wrappers/models/security/BondSecurity";
import TIPSBond from "@fintekkers/ledger-models/node/wrappers/models/security/TIPSBond";
import FloatingRateNote from "@fintekkers/ledger-models/node/wrappers/models/security/FloatingRateNote";
import { UUID } from "@fintekkers/ledger-models/node/wrappers/models/utils/uuid";
import { stampOwn } from "@fintekkers/ledger-models/node/wrappers/util/object-types";
import {
  checkProductInput,
  forSecurity,
  requiredMarketData,
  type MarketData,
} from "@fintekkers/ledger-models/node/wrappers/models/security/product_inputs";
import { Decimal } from "decimal.js";
import { getServiceConnection } from "$lib/grpc-auth";
import { fromDecimalProto, toDecimalProto } from "$lib/decimal";
import {
  fetchCpiReadings,
  parseSettlementDate,
  type CpiReading,
} from "$lib/cpi";
import { fetchFixings } from "$lib/fixings";
import { FetchSecurityProtoByCusip } from "$lib/security";

const { MeasureProto } = measure_pkg;
const { RequestOperationTypeProto } = operation_pkg;
const { IndexTypeProto } = index_type_pkg;

export interface BondCalculatorInputs {
  mode: "cusip" | "manual";
  price: string; // % of par, e.g. "98.5"
  // CUSIP mode
  cusip?: string;
  // Manual mode
  faceValue?: string;
  couponRate?: string;
  couponFrequency?: "ANNUALLY" | "SEMIANNUALLY" | "QUARTERLY" | "MONTHLY";
  issueDate?: string; // YYYY-MM-DD
  maturityDate?: string; // YYYY-MM-DD
  issuerName?: string;
}

export interface CashflowEntry {
  date: string;
  fvAmount: string;
  pvAmount: string;
  couponRate?: string;
}

export interface ValuationResult {
  presentValue?: string;
  dirtyPrice?: string;
  accruedInterest?: string;
  currentYield?: string;
  yieldToMaturity?: string;
  macaulayDuration?: string;
  modifiedDuration?: string;
  convexity?: string;
  cashflows?: CashflowEntry[];
  error?: string;
}

export interface TipsCalculatorInputs {
  mode: "cusip" | "manual";
  price: string;
  // Typed by the user: sent as InflationIndexInput.reference_cpi.
  currentCpi?: string;
  // CPI-U months m-3 and m-2 from the price service (US-229): sent as
  // InflationIndexInput.readings instead of currentCpi when present.
  cpiReadings?: CpiReading[];
  settlementDate?: string; // YYYY-MM-DD, sent as asof_datetime
  // CUSIP mode
  cusip?: string;
  // Manual mode
  faceValue?: string;
  realCouponRate?: string;
  couponFrequency?: "ANNUALLY" | "SEMIANNUALLY" | "QUARTERLY" | "MONTHLY";
  referenceCpi?: string;
  issueDate?: string;
  maturityDate?: string;
}

export interface TipsValuationResult {
  inflationAdjustedPrincipal?: string;
  presentValue?: string;
  currentYield?: string;
  realYield?: string;
  yieldToMaturity?: string;
  macaulayDuration?: string;
  referenceCpi?: string; // MeasureProto.REFERENCE_CPI
  indexRatio?: string; // MeasureProto.INDEX_RATIO
  cpiSource?: "Price service" | "Manual entry";
  cashflows?: CashflowEntry[];
  error?: string;
}

export interface FrnCalculatorInputs {
  mode: "cusip" | "manual";
  price?: string; // % of par — if provided, compute DM
  discountMargin?: string; // bps — if provided, compute price
  referenceRate: string; // current market rate as %, e.g. "4.00"
  spread: string; // quoted margin in bps, e.g. "50"
  // CUSIP mode
  cusip?: string;
  // Manual mode
  faceValue?: string;
  couponFrequency?: "ANNUALLY" | "SEMIANNUALLY" | "QUARTERLY" | "MONTHLY";
  maturityDate?: string;
  referenceRateIndex?: "SOFR" | "T_BILL_13_WEEK" | "FED_FUNDS";
}

export interface FrnValuationResult {
  presentValue?: string;
  discountMargin?: string;
  spreadDuration?: string;
  currentYield?: string;
  cashflows?: CashflowEntry[];
  error?: string;
}

const MEASURE_PRESENT_VALUE = MeasureProto.PRESENT_VALUE;
const MEASURE_MACAULAY_DURATION = MeasureProto.MACAULAY_DURATION;
const MEASURE_REAL_YIELD = MeasureProto.REAL_YIELD;
const MEASURE_INFLATION_ADJUSTED_PRINCIPAL =
  MeasureProto.INFLATION_ADJUSTED_PRINCIPAL;
const MEASURE_PRESENT_VALUE_CASHFLOWS = MeasureProto.PRESENT_VALUE_CASHFLOWS;
const MEASURE_DISCOUNT_MARGIN = MeasureProto.DISCOUNT_MARGIN;
const MEASURE_SPREAD_DURATION = MeasureProto.SPREAD_DURATION;

const VALUATION_MEASURES = [
  MEASURE_PRESENT_VALUE,
  MeasureProto.DIRTY_PRICE,
  MeasureProto.ACCRUED_INTEREST,
  MeasureProto.CURRENT_YIELD,
  MeasureProto.YIELD_TO_MATURITY,
  MEASURE_MACAULAY_DURATION,
  MeasureProto.MODIFIED_DURATION,
  MeasureProto.CONVEXITY,
  MEASURE_PRESENT_VALUE_CASHFLOWS,
];

const TIPS_VALUATION_MEASURES = [
  MEASURE_PRESENT_VALUE,
  MeasureProto.CURRENT_YIELD,
  MeasureProto.YIELD_TO_MATURITY,
  MEASURE_MACAULAY_DURATION,
  MEASURE_REAL_YIELD,
  MEASURE_INFLATION_ADJUSTED_PRINCIPAL,
  MeasureProto.REFERENCE_CPI,
  MeasureProto.INDEX_RATIO,
  MEASURE_PRESENT_VALUE_CASHFLOWS,
];

const FRN_VALUATION_MEASURES = [
  MEASURE_PRESENT_VALUE,
  MeasureProto.CURRENT_YIELD,
  MEASURE_DISCOUNT_MARGIN,
  MEASURE_PRESENT_VALUE_CASHFLOWS,
];

const BOND_ARM_MEASURES = [
  MEASURE_PRESENT_VALUE,
  MeasureProto.DIRTY_PRICE,
  MeasureProto.ACCRUED_INTEREST,
  MeasureProto.CURRENT_YIELD,
  MeasureProto.YIELD_TO_MATURITY,
  MEASURE_MACAULAY_DURATION,
  MeasureProto.MODIFIED_DURATION,
  MeasureProto.CONVEXITY,
  MEASURE_PRESENT_VALUE_CASHFLOWS,
  MEASURE_REAL_YIELD,
  MEASURE_INFLATION_ADJUSTED_PRINCIPAL,
  MeasureProto.MARKET_VALUE,
];

/**
 * The measures valuation-service computes on each ProductInput arm (US-303).
 * It rejects a whole request that asks an arm for any other measure, so a
 * page sends only its own measures that the built arm computes; the rest
 * stay blank. The arm is read off the builder's output, never chosen here.
 */
const ARM_MEASURES: Partial<Record<ProductInput.InputCase, number[]>> = {
  [ProductInput.InputCase.BOND]: BOND_ARM_MEASURES,
  [ProductInput.InputCase.MBS]: BOND_ARM_MEASURES,
  [ProductInput.InputCase.TIPS]: [
    ...BOND_ARM_MEASURES,
    MeasureProto.REFERENCE_CPI,
    MeasureProto.INDEX_RATIO,
  ],
  [ProductInput.InputCase.FRN]: [
    MEASURE_DISCOUNT_MARGIN,
    MeasureProto.DIRTY_PRICE,
    MeasureProto.ACCRUED_INTEREST,
    MEASURE_SPREAD_DURATION,
    MEASURE_PRESENT_VALUE_CASHFLOWS,
    MeasureProto.CURRENT_YIELD,
    MeasureProto.MARKET_VALUE,
  ],
};

function parseCashflows(response: any): CashflowEntry[] {
  const cashflows: CashflowEntry[] = [];
  const cfList = response.getCashflowsList?.() ?? [];
  for (const cf of cfList) {
    const d = cf.getCashflowDate?.();
    if (!d) continue;
    const date = `${d.getYear()}-${String(d.getMonth()).padStart(
      2,
      "0"
    )}-${String(d.getDay()).padStart(2, "0")}`;
    const fvAmount = fromDecimalProto(cf.getFvAmount()) ?? "0";
    const pvAmount = fromDecimalProto(cf.getPvAmount()) ?? "0";
    const couponRate = fromDecimalProto(cf.getCouponRate?.());
    cashflows.push({
      date,
      fvAmount,
      pvAmount,
      ...(couponRate != null ? { couponRate } : {}),
    });
  }
  return cashflows;
}

function frequency(
  name: string | undefined,
  fallback: CouponFrequencyProto
): CouponFrequencyProto {
  return (
    CouponFrequencyProto[name as keyof typeof CouponFrequencyProto] ?? fallback
  );
}

function buildManualSecurityProto(inputs: BondCalculatorInputs): SecurityProto {
  // BondSecurity.fromPricerInputs builds a TREASURY_NOTE-typed proto with
  // the structured bond_details sub-message populated. Issuer name + UUID
  // + asOf are envelope concerns the pricer doesn't need but we stamp
  // them for consistency with the prior shape.
  const security = BondSecurity.fromPricerInputs({
    faceValue: new Decimal(inputs.faceValue ?? "0"),
    couponRate: new Decimal(inputs.couponRate ?? "0"),
    couponType: CouponTypeProto.FIXED,
    couponFrequency: frequency(
      inputs.couponFrequency,
      CouponFrequencyProto.SEMIANNUALLY
    ),
    issueDate: new Date(
      inputs.issueDate ?? new Date().toISOString().slice(0, 10)
    ),
    maturityDate: new Date(
      inputs.maturityDate ?? new Date().toISOString().slice(0, 10)
    ),
  });
  stampOwn(security);
  security.setUuid(UUID.random().toUUIDProto());
  security.setAsOf(ZonedDateTime.now().toProto());
  security.setAssetClass("Fixed Income");
  if (inputs.issuerName) security.setIssuerName(inputs.issuerName);
  return security;
}

// ---------------------------------------------------------------------------
// Shared core (#210)
// ---------------------------------------------------------------------------

/**
 * Send a ValuationRequestProto to the service. Caller assembles the
 * ProductInput + measure list; this just handles the request envelope and
 * the (callback-style) gRPC call.
 */
async function runValuationCore(
  productInput: ProductInput,
  measures: number[],
  apiKey?: string,
  asOf: ZonedDateTime = ZonedDateTime.now(),
  positionInput?: PositionProto
): Promise<
  import("@fintekkers/ledger-models/node/fintekkers/requests/valuation/valuation_response_pb.js").ValuationResponseProto
> {
  const request = new ValuationRequestProto();
  stampOwn(request);
  request.setOperationType(RequestOperationTypeProto.GET);
  request.setAsofDatetime(asOf.toProto());
  request.setProductInput(productInput);
  measures.forEach((m) => request.addMeasures(m));
  if (positionInput) request.setPositionInput(positionInput);

  const conn = getServiceConnection(apiKey);
  const client = new ValuationClient(conn.url, conn.credentials, {
    interceptors: conn.interceptors,
    ...conn.clientOptions,
  });

  return new Promise((resolve, reject) => {
    client.runValuation(request, (err, response) => {
      if (err) reject(err);
      else resolve(response);
    });
  });
}

/**
 * Translate raw service error strings into user-friendly messages. Most
 * errors are shared across product types ("Maturity date must be in the
 * future" applies to bonds, TIPS, FRNs alike); the per-product overrides
 * are layered on top via the optional `productSpecific` callback.
 */
function mapValuationError(
  rawMessage: string,
  productSpecific?: (msg: string) => string | null
): string {
  if (productSpecific) {
    const override = productSpecific(rawMessage);
    if (override) return override;
  }
  if (rawMessage.includes("Maturity date must be in the future")) {
    return "This security has already matured and cannot be valued.";
  }
  if (rawMessage.includes("Periods to maturity must be at least 1")) {
    return "This security matures too soon (less than one coupon period remaining).";
  }
  return rawMessage; // fall through — surface the underlying error to the user
}

/** Where a page's market data comes from when the security's arm needs it. */
type MarketDataSources = {
  cpi?: () => Promise<InflationIndexInput | undefined>;
  fixings?: () => Promise<ReferenceRateFixingProto[]>;
};

/** CPI-U readings for the as-of date, through the broker. */
async function brokerCpi(
  asOf: ZonedDateTime,
  apiKey?: string
): Promise<InflationIndexInput | undefined> {
  const date = asOf.toDateTime().toUTC().toISODate() ?? "";
  const { readings } = await fetchCpiReadings(date, apiKey);
  return readings ? cpiFromReadings(readings) : undefined;
}

/**
 * Value `security` (US-303). ledger-models' forSecurity picks the arm from
 * the security itself, whichever page asked; requiredMarketData says which
 * market data to gather first. Throws the builder's UnmappedProductTypeError
 * or MissingMarketDataError, or checkProductInput's error, before any
 * request is sent; there is no other path to the valuation client.
 */
async function priceSecurity(
  security: SecurityProto,
  price: string,
  measures: number[],
  apiKey?: string,
  opts: {
    asOf?: ZonedDateTime;
    position?: PositionProto;
    sources?: MarketDataSources;
  } = {}
) {
  const asOf = opts.asOf ?? ZonedDateTime.now();
  const marketData: MarketData = {};
  for (const kind of requiredMarketData(security)) {
    if (kind === "CPI_U") {
      marketData.cpi = await (opts.sources?.cpi?.() ?? brokerCpi(asOf, apiKey));
    } else if (kind === "FRN_FIXINGS") {
      marketData.fixings = await (opts.sources?.fixings?.() ??
        fetchFixings(security, new Date(asOf.toDateTime().toMillis()), apiKey));
    }
  }
  const productInput = forSecurity(
    security,
    new PriceProto().setPrice(toDecimalProto(price)),
    marketData
  );
  checkProductInput(productInput);

  const supported = ARM_MEASURES[productInput.getInputCase()] ?? [];
  const sent = measures.filter((m) => supported.includes(m));
  if (sent.length === 0) {
    throw new Error(
      "None of this calculator's measures apply to this security."
    );
  }
  return runValuationCore(productInput, sent, apiKey, asOf, opts.position);
}

// ---------------------------------------------------------------------------
// Bond
// ---------------------------------------------------------------------------

export async function RunBondValuation(
  inputs: BondCalculatorInputs,
  apiKey?: string
): Promise<ValuationResult> {
  if (inputs.mode === "cusip" && (!inputs.cusip || !inputs.cusip.trim())) {
    return { error: "Please enter a CUSIP to look up." };
  }
  if (!inputs.price || !inputs.price.trim()) {
    return { error: "Please enter a price (% of par)." };
  }

  try {
    const securityProto =
      inputs.mode === "cusip"
        ? await FetchSecurityProtoByCusip(inputs.cusip!, apiKey)
        : buildManualSecurityProto(inputs);

    const response = await priceSecurity(
      securityProto,
      inputs.price,
      VALUATION_MEASURES,
      apiKey
    );

    const result: ValuationResult = {};
    response.getMeasureResultsList().forEach((entry) => {
      const value = fromDecimalProto(entry.getMeasureDecimalValue());
      switch (entry.getMeasure()) {
        case MEASURE_PRESENT_VALUE:
          result.presentValue = value;
          break;
        case MeasureProto.DIRTY_PRICE:
          result.dirtyPrice = value;
          break;
        case MeasureProto.ACCRUED_INTEREST:
          result.accruedInterest = value;
          break;
        case MeasureProto.CURRENT_YIELD:
          result.currentYield = value;
          break;
        case MeasureProto.YIELD_TO_MATURITY:
          result.yieldToMaturity = value;
          break;
        case MEASURE_MACAULAY_DURATION:
          result.macaulayDuration = value;
          break;
        case MeasureProto.MODIFIED_DURATION:
          result.modifiedDuration = value;
          break;
        case MeasureProto.CONVEXITY:
          result.convexity = value;
          break;
      }
    });
    result.cashflows = parseCashflows(response);
    return result;
  } catch (error: any) {
    return {
      error: mapValuationError(
        error.details ?? error.message ?? "Valuation failed",
        (msg) => {
          if (msg.includes("Invalid Coupon Frequency")) {
            return "This security has no coupon (e.g. a zero-coupon bond or FRN) and cannot be valued with this calculator.";
          }
          if (msg.includes("No security found")) return msg;
          return null;
        }
      ),
    };
  }
}

/**
 * @deprecated Use `RunBondValuation` for clarity. Kept as an alias for the
 * existing UI consumers; remove once they migrate.
 */
export const RunValuation = RunBondValuation;

function buildManualTipsSecurityProto(
  inputs: TipsCalculatorInputs
): SecurityProto {
  const issueDate = new Date(
    inputs.issueDate ?? new Date().toISOString().slice(0, 10)
  );
  const maturityDate = new Date(
    inputs.maturityDate ?? new Date().toISOString().slice(0, 10)
  );

  // US TIPS accrue off CPI-U; the inflation_index_type field is required on
  // the structured TipsExtensionProto. indexDate defaults to the bond's
  // issue date — the base CPI is fixed at issuance for vanilla TIPS, so the
  // issue date is the natural reference.
  const security = TIPSBond.fromPricerInputs({
    faceValue: new Decimal(inputs.faceValue ?? "0"),
    couponRate: new Decimal(inputs.realCouponRate ?? "0"),
    couponType: CouponTypeProto.FIXED,
    couponFrequency: frequency(
      inputs.couponFrequency,
      CouponFrequencyProto.SEMIANNUALLY
    ),
    issueDate,
    maturityDate,
    baseCpi: new Decimal(
      inputs.referenceCpi && inputs.referenceCpi.trim() !== ""
        ? inputs.referenceCpi
        : "0"
    ),
    indexDate: issueDate,
    inflationIndexType: IndexTypeProto.CPI_U,
  });
  stampOwn(security);
  security.setUuid(UUID.random().toUUIDProto());
  security.setAsOf(ZonedDateTime.now().toProto());
  security.setAssetClass("Fixed Income");
  security.setIssuerName("US Government");
  return security;
}

// ---------------------------------------------------------------------------
// TIPS
// ---------------------------------------------------------------------------

function hasCpiReadings(inputs: TipsCalculatorInputs): boolean {
  return (inputs.cpiReadings?.length ?? 0) > 0;
}

function validateTipsInputs(inputs: TipsCalculatorInputs): string | null {
  if (inputs.mode === "cusip" && (!inputs.cusip || !inputs.cusip.trim())) {
    return "Please enter a CUSIP to look up.";
  }
  if (!inputs.price || !inputs.price.trim()) {
    return "Please enter a price (% of par).";
  }
  // US-303: in CUSIP mode the looked-up security decides what it needs;
  // a missing CPI is the builder's MissingMarketDataError.
  if (
    inputs.mode === "manual" &&
    !hasCpiReadings(inputs) &&
    (!inputs.currentCpi || !inputs.currentCpi.trim())
  ) {
    return "Please enter the current CPI value.";
  }
  return null;
}

function cpiFromReadings(readings: CpiReading[]): InflationIndexInput {
  return new InflationIndexInput().setReadings(
    new MonthlyIndexReadings().setReadingsList(
      readings.map((r) =>
        new MonthlyIndexReading()
          .setYear(r.year)
          .setMonth(r.month)
          .setValue(toDecimalProto(r.value))
      )
    )
  );
}

/**
 * The `cpi` market data (US-229): the price service's monthly readings when
 * there are any, else the user's typed value as the reference CPI, else
 * none. Built from the generated classes only; valuation-service derives
 * REFERENCE_CPI and INDEX_RATIO from it.
 */
function buildInflationIndexInput(
  inputs: TipsCalculatorInputs
): InflationIndexInput | undefined {
  if (inputs.cpiReadings && inputs.cpiReadings.length > 0) {
    return cpiFromReadings(inputs.cpiReadings);
  }
  const typed = (inputs.currentCpi ?? "").trim();
  if (!typed) return undefined;
  return new InflationIndexInput().setReferenceCpi(toDecimalProto(typed));
}

/** Settlement date at 00:00 UTC (valuation-service reads its UTC date). */
function settlementAsOf(settlementDate?: string): ZonedDateTime | undefined {
  const d = parseSettlementDate(settlementDate?.trim());
  if (!d) return undefined;
  return ZonedDateTime.from(new Date(Date.UTC(d.year, d.month - 1, d.day)));
}

async function buildTipsSecurity(
  inputs: TipsCalculatorInputs,
  apiKey?: string,
  security?: SecurityProto
): Promise<SecurityProto> {
  const securityProto =
    inputs.mode === "cusip"
      ? security ?? (await FetchSecurityProtoByCusip(inputs.cusip!, apiKey))
      : buildManualTipsSecurityProto(inputs);

  // Reference CPI (base_cpi) override. The form's Reference CPI input is
  // rendered in both CUSIP and manual modes; the user may need to supply
  // it in CUSIP mode too because some TIPS records on the wire don't yet
  // have base_cpi populated (data-sourcing-dev's #263 face_value +
  // coupon_rate backfills didn't cover base_cpi). The CUSIP-mode proto
  // comes from a search and may or may not already carry a TipsExtension —
  // re-use the existing one when present so we don't drop index_date /
  // inflation_index_type, otherwise stamp a fresh CPI-U extension.
  if (inputs.referenceCpi && inputs.referenceCpi.trim()) {
    const tipsExt =
      securityProto.getTipsExtension() ?? new TipsExtensionProto();
    tipsExt.setBaseCpi(toDecimalProto(inputs.referenceCpi.trim()));
    if (tipsExt.getInflationIndexType() === IndexTypeProto.UNKNOWN_INDEX_TYPE) {
      tipsExt.setInflationIndexType(IndexTypeProto.CPI_U);
    }
    securityProto.setTipsExtension(tipsExt);
  }
  return securityProto;
}

/**
 * Value the TIPS page's security. The page owns its CPI: the readings its
 * load looked up, or the typed value; it never looks CPI up again here.
 */
async function priceTipsInputs(
  inputs: TipsCalculatorInputs,
  measures: number[],
  apiKey?: string,
  options: { security?: SecurityProto; position?: PositionProto } = {}
) {
  return priceSecurity(
    await buildTipsSecurity(inputs, apiKey, options.security),
    inputs.price,
    measures,
    apiKey,
    {
      asOf: settlementAsOf(inputs.settlementDate),
      position: options.position,
      sources: { cpi: async () => buildInflationIndexInput(inputs) },
    }
  );
}

function mapTipsValuationError(error: any): string {
  return mapValuationError(
    error.details ?? error.message ?? "Valuation failed",
    (msg) => {
      if (msg.includes("Invalid Coupon Frequency")) {
        return "This security has an unsupported coupon frequency for TIPS valuation.";
      }
      if (msg.includes("Maturity date must be in the future")) {
        return "This TIPS has already matured and cannot be valued.";
      }
      if (msg.includes("Periods to maturity must be at least 1")) {
        return "This TIPS matures too soon (less than one coupon period remaining).";
      }
      if (
        msg.includes("No security found") ||
        msg.includes("TIPS") ||
        msg.includes("inflation")
      ) {
        return msg;
      }
      return null;
    }
  );
}

/**
 * The reference CPI valuation-service derives from the price service's
 * readings for the settlement date, to show in the Current CPI field before
 * Calculate. Needs the price: valuation-service requires clean_price.
 */
export async function LookupCurrentCpi(
  inputs: TipsCalculatorInputs,
  apiKey?: string
): Promise<{ value?: string; error?: string }> {
  if (!hasCpiReadings(inputs)) return { error: "No CPI-U readings to send." };
  const invalid = validateTipsInputs(inputs);
  if (invalid) return { error: invalid };
  try {
    const response = await priceTipsInputs(
      inputs,
      [MeasureProto.REFERENCE_CPI],
      apiKey
    );
    const entry = response
      .getMeasureResultsList()
      .find((e) => e.getMeasure() === MeasureProto.REFERENCE_CPI);
    const value = fromDecimalProto(entry?.getMeasureDecimalValue());
    return value ? { value } : { error: "No reference CPI was returned." };
  } catch (error: any) {
    return { error: mapTipsValuationError(error) };
  }
}

/** position_input with one DIRECTED_QUANTITY: the face amount MARKET_VALUE
 * values. */
function directedQuantityInput(quantity: string): PositionProto {
  const position = new PositionProto();
  stampOwn(position);
  position.addMeasures(
    new MeasureMapEntry()
      .setMeasure(MeasureProto.DIRECTED_QUANTITY)
      .setMeasureDecimalValue(toDecimalProto(quantity))
  );
  return position;
}

/** Each requested measure valuation-service returned, and the cashflows. */
export interface TipsMeasuresResult {
  values: Map<number, string | undefined>;
  cashflows: CashflowEntry[];
}

/**
 * One TIPS valuation for exactly `measures`. In CUSIP mode, pass `security`
 * when the caller already holds the SecurityProto, to skip a second lookup.
 * MARKET_VALUE needs `directedQuantity`, the position's face amount.
 */
export async function RunTipsMeasures(
  inputs: TipsCalculatorInputs,
  measures: number[],
  apiKey?: string,
  options: { security?: SecurityProto; directedQuantity?: string } = {}
): Promise<TipsMeasuresResult | { error: string }> {
  const invalid = validateTipsInputs(inputs);
  if (invalid) return { error: invalid };

  try {
    const response = await priceTipsInputs(inputs, measures, apiKey, {
      security: options.security,
      position: options.directedQuantity
        ? directedQuantityInput(options.directedQuantity)
        : undefined,
    });
    const values = new Map<number, string | undefined>();
    response.getMeasureResultsList().forEach((entry) => {
      values.set(
        entry.getMeasure(),
        fromDecimalProto(entry.getMeasureDecimalValue())
      );
    });
    return { values, cashflows: parseCashflows(response) };
  } catch (error: any) {
    return { error: mapTipsValuationError(error) };
  }
}

export async function RunTipsValuation(
  inputs: TipsCalculatorInputs,
  apiKey?: string
): Promise<TipsValuationResult> {
  const run = await RunTipsMeasures(inputs, TIPS_VALUATION_MEASURES, apiKey);
  if ("error" in run) return { error: run.error };

  const result: TipsValuationResult = {
    cpiSource: hasCpiReadings(inputs) ? "Price service" : "Manual entry",
  };

  run.values.forEach((value, measure) => {
    switch (measure) {
      case MEASURE_PRESENT_VALUE:
        result.presentValue = value;
        break;
      case MeasureProto.CURRENT_YIELD:
        result.currentYield = value;
        break;
      case MeasureProto.YIELD_TO_MATURITY:
        result.yieldToMaturity = value;
        break;
      case MEASURE_MACAULAY_DURATION:
        result.macaulayDuration = value;
        break;
      case MEASURE_REAL_YIELD:
        result.realYield = value;
        break;
      case MEASURE_INFLATION_ADJUSTED_PRINCIPAL:
        result.inflationAdjustedPrincipal = value;
        break;
      case MeasureProto.REFERENCE_CPI:
        result.referenceCpi = value;
        break;
      case MeasureProto.INDEX_RATIO:
        result.indexRatio = value;
        break;
    }
  });
  result.cashflows = run.cashflows;
  return result;
}

function buildManualFrnSecurityProto(
  inputs: FrnCalculatorInputs
): SecurityProto {
  // FRN coupon rate = reference_rate + spread_in_percent
  // referenceRate is in % (e.g. "4"), spread is in bps (e.g. "50" = 0.50%)
  const refRate = parseFloat(inputs.referenceRate ?? "0");
  const spreadPct = parseFloat(inputs.spread ?? "0") / 100;
  const effectiveCoupon = new Decimal((refRate + spreadPct).toString());
  const couponFrequency = frequency(
    inputs.couponFrequency,
    CouponFrequencyProto.QUARTERLY
  );
  const maturityDate = new Date(
    inputs.maturityDate ?? new Date().toISOString().slice(0, 10)
  );

  const security = FloatingRateNote.fromPricerInputs({
    faceValue: new Decimal(inputs.faceValue ?? "0"),
    couponRate: effectiveCoupon,
    couponType: CouponTypeProto.FLOAT,
    couponFrequency,
    issueDate: maturityDate,
    maturityDate,
    spread: new Decimal(inputs.spread ?? "0"),
    referenceRateIndex:
      IndexTypeProto[
        inputs.referenceRateIndex as keyof typeof IndexTypeProto
      ] ?? IndexTypeProto.SOFR,
    resetFrequency: couponFrequency,
  });
  stampOwn(security);
  security.setUuid(UUID.random().toUUIDProto());
  security.setAsOf(ZonedDateTime.now().toProto());
  security.setAssetClass("Fixed Income");
  return security;
}

/** The typed reference rate as today's fixing of the security's index. */
function typedFixing(
  security: SecurityProto,
  inputs: FrnCalculatorInputs
): ReferenceRateFixingProto {
  const today = new Date();
  return new ReferenceRateFixingProto()
    .setIndex(
      security.getFrnExtension()?.getReferenceRateIndex() ?? IndexTypeProto.SOFR
    )
    .setFixingDate(
      new LocalDateProto()
        .setYear(today.getUTCFullYear())
        .setMonth(today.getUTCMonth() + 1)
        .setDay(today.getUTCDate())
    )
    .setRate(toDecimalProto(inputs.referenceRate.trim()));
}

// ---------------------------------------------------------------------------
// FRN
// ---------------------------------------------------------------------------

export async function RunFrnValuation(
  inputs: FrnCalculatorInputs,
  apiKey?: string
): Promise<FrnValuationResult> {
  if (inputs.mode === "cusip" && (!inputs.cusip || !inputs.cusip.trim())) {
    return { error: "Please enter a CUSIP to look up." };
  }
  if (!inputs.price && !inputs.discountMargin) {
    return { error: "Please enter either a price or a discount margin." };
  }
  // US-303: a looked-up FRN carries its own spread, and its fixings come
  // from the price service, so CUSIP mode needs neither field.
  if (
    inputs.mode === "manual" &&
    (!inputs.referenceRate || !inputs.referenceRate.trim())
  ) {
    return { error: "Please enter the current reference rate (%)." };
  }
  if (inputs.mode === "manual" && (!inputs.spread || !inputs.spread.trim())) {
    return { error: "Please enter the spread (basis points)." };
  }

  try {
    const securityProto =
      inputs.mode === "cusip"
        ? await FetchSecurityProtoByCusip(inputs.cusip!, apiKey)
        : buildManualFrnSecurityProto(inputs);

    const priceValue =
      inputs.price && inputs.price.trim() ? inputs.price : "100";
    // Manual mode's fixing is the typed reference rate; CUSIP mode reads
    // the security's fixings from the price service.
    const response = await priceSecurity(
      securityProto,
      priceValue,
      FRN_VALUATION_MEASURES,
      apiKey,
      inputs.mode === "manual"
        ? {
            sources: {
              fixings: async () => [typedFixing(securityProto, inputs)],
            },
          }
        : {}
    );

    const result: FrnValuationResult = {};
    response.getMeasureResultsList().forEach((entry) => {
      const value = fromDecimalProto(entry.getMeasureDecimalValue());
      switch (entry.getMeasure()) {
        case MEASURE_PRESENT_VALUE:
          result.presentValue = value;
          break;
        case MeasureProto.CURRENT_YIELD:
          result.currentYield = value;
          break;
        case MEASURE_DISCOUNT_MARGIN:
          result.discountMargin = value;
          break;
        case MEASURE_SPREAD_DURATION:
          result.spreadDuration = value;
          break;
      }
    });
    result.cashflows = parseCashflows(response);
    return result;
  } catch (error: any) {
    return {
      error: mapValuationError(
        error.details ?? error.message ?? "Valuation failed",
        (msg) => {
          if (msg.includes("Maturity date must be in the future")) {
            return "This FRN has already matured and cannot be valued.";
          }
          if (msg.includes("Periods to maturity must be at least 1")) {
            return "This FRN matures too soon (less than one coupon period remaining).";
          }
          if (msg.includes("No security found")) return msg;
          return null;
        }
      ),
    };
  }
}
