import { ValuationClient } from '@fintekkers/ledger-models/node/fintekkers/services/valuation-service/valuation_service_grpc_pb.js';
import { SecurityClient } from '@fintekkers/ledger-models/node/fintekkers/services/security-service/security_service_grpc_pb.js';
import { ValuationRequestProto } from '@fintekkers/ledger-models/node/fintekkers/requests/valuation/valuation_request_pb.js';
import { ProductInput, BondInput, TipsInput, FrnInput } from '@fintekkers/ledger-models/node/fintekkers/requests/valuation/product_inputs_pb.js';
import { QuerySecurityRequestProto } from '@fintekkers/ledger-models/node/fintekkers/requests/security/query_security_request_pb.js';
import { SecurityProto } from '@fintekkers/ledger-models/node/fintekkers/models/security/security_pb.js';
import { DecimalValueProto } from '@fintekkers/ledger-models/node/fintekkers/models/util/decimal_value_pb.js';
import { ProductTypeProto } from '@fintekkers/ledger-models/node/fintekkers/models/security/product_type_pb.js';
import { CouponTypeProto } from '@fintekkers/ledger-models/node/fintekkers/models/security/coupon_type_pb.js';
import { CouponFrequencyProto } from '@fintekkers/ledger-models/node/fintekkers/models/security/coupon_frequency_pb.js';
import index_type_pkg from '@fintekkers/ledger-models/node/fintekkers/models/security/index/index_type_pb.js';
import { IdentifierProto } from '@fintekkers/ledger-models/node/fintekkers/models/security/identifier/identifier_pb.js';
import { IdentifierTypeProto } from '@fintekkers/ledger-models/node/fintekkers/models/security/identifier/identifier_type_pb.js';
import measure_pkg from '@fintekkers/ledger-models/node/fintekkers/models/position/measure_pb.js';
import field_pkg from '@fintekkers/ledger-models/node/fintekkers/models/position/field_pb.js';
import operation_pkg from '@fintekkers/ledger-models/node/fintekkers/requests/util/operation_pb.js';
import { LocalDate } from '@fintekkers/ledger-models/node/wrappers/models/utils/date';
import { ZonedDateTime } from '@fintekkers/ledger-models/node/wrappers/models/utils/datetime';
import { PositionFilter } from '@fintekkers/ledger-models/node/wrappers/models/position/positionfilter';
import { Identifier } from '@fintekkers/ledger-models/node/wrappers/models/security/identifier';
import { UUID } from '@fintekkers/ledger-models/node/wrappers/models/utils/uuid';
import { getServiceConnection } from '$lib/grpc-auth';

const { MeasureProto } = measure_pkg;
const { FieldProto } = field_pkg;
const { RequestOperationTypeProto } = operation_pkg;
const { IndexTypeProto } = index_type_pkg;

export interface BondCalculatorInputs {
  mode: 'cusip' | 'manual';
  price: string;          // % of par, e.g. "98.5"
  // CUSIP mode
  cusip?: string;
  // Manual mode
  faceValue?: string;
  couponRate?: string;
  couponFrequency?: 'ANNUALLY' | 'SEMIANNUALLY' | 'QUARTERLY' | 'MONTHLY';
  issueDate?: string;     // YYYY-MM-DD
  maturityDate?: string;  // YYYY-MM-DD
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
  mode: 'cusip' | 'manual';
  price: string;
  currentCpi?: string;
  settlementDate?: string;
  // CUSIP mode
  cusip?: string;
  // Manual mode
  faceValue?: string;
  realCouponRate?: string;
  couponFrequency?: 'ANNUALLY' | 'SEMIANNUALLY' | 'QUARTERLY' | 'MONTHLY';
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
  indexRatio?: string;
  cashflows?: CashflowEntry[];
  error?: string;
}

export interface FrnCalculatorInputs {
  mode: 'cusip' | 'manual';
  price?: string;           // % of par — if provided, compute DM
  discountMargin?: string;  // bps — if provided, compute price
  referenceRate: string;    // current market rate as %, e.g. "4.00"
  spread: string;           // quoted margin in bps, e.g. "50"
  // CUSIP mode
  cusip?: string;
  // Manual mode
  faceValue?: string;
  couponFrequency?: 'ANNUALLY' | 'SEMIANNUALLY' | 'QUARTERLY' | 'MONTHLY';
  maturityDate?: string;
  referenceRateIndex?: 'SOFR' | 'T_BILL_13_WEEK' | 'FED_FUNDS';
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
const MEASURE_INFLATION_ADJUSTED_PRINCIPAL = MeasureProto.INFLATION_ADJUSTED_PRINCIPAL;
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
  MEASURE_PRESENT_VALUE_CASHFLOWS,
];

const FRN_VALUATION_MEASURES = [
  MEASURE_PRESENT_VALUE,
  MeasureProto.CURRENT_YIELD,
  MEASURE_DISCOUNT_MARGIN,
  MEASURE_PRESENT_VALUE_CASHFLOWS,
];

function decimalValue(value: string): DecimalValueProto {
  return new DecimalValueProto().setArbitraryPrecisionValue(value);
}

function localDateFromString(dateStr: string): ReturnType<typeof LocalDate.from> {
  return LocalDate.from(new Date(dateStr));
}

function parseCashflows(response: any): CashflowEntry[] {
  const cashflows: CashflowEntry[] = [];
  const cfList = response.getCashflowsList?.() ?? [];
  for (const cf of cfList) {
    const d = cf.getCashflowDate?.();
    if (!d) continue;
    const date = `${d.getYear()}-${String(d.getMonth()).padStart(2, '0')}-${String(d.getDay()).padStart(2, '0')}`;
    const fvAmount = cf.getFvAmount()?.getArbitraryPrecisionValue() ?? '0';
    const pvAmount = cf.getPvAmount()?.getArbitraryPrecisionValue() ?? '0';
    const couponRate = cf.getCouponRate?.()?.getArbitraryPrecisionValue();
    cashflows.push({ date, fvAmount, pvAmount, ...(couponRate != null ? { couponRate } : {}) });
  }
  return cashflows;
}

async function buildSecurityProtoFromCusip(cusip: string, apiKey?: string): Promise<SecurityProto> {
  const filter = new PositionFilter();
  const identifierProto = new IdentifierProto()
    .setIdentifierType(IdentifierTypeProto.CUSIP)
    .setIdentifierValue(cusip.trim());
  filter.addObjectFilter(FieldProto.IDENTIFIER, new Identifier(identifierProto));

  const conn = getServiceConnection(apiKey);
  const client = new SecurityClient(conn.url, conn.credentials, { interceptors: conn.interceptors });
  const searchRequest = new QuerySecurityRequestProto();
  searchRequest.setObjectClass('SecurityRequest');
  searchRequest.setVersion('0.0.1');
  searchRequest.setAsOf(ZonedDateTime.now().toProto());
  searchRequest.setSearchSecurityInput(filter.toProto());

  const results = await new Promise<SecurityProto[]>((resolve, reject) => {
    const list: SecurityProto[] = [];
    const stream = client.search(searchRequest);
    stream.on('data', (response: any) => {
      response.getSecurityResponseList().forEach((proto: any) => list.push(proto));
    });
    stream.on('end', () => resolve(list));
    stream.on('error', (err: any) => reject(err));
  });

  if (results.length === 0) {
    throw new Error(`No security found for CUSIP: ${cusip}`);
  }
  return results[0];
}

function buildManualSecurityProto(inputs: BondCalculatorInputs): SecurityProto {
  const security = new SecurityProto();
  security.setObjectClass('Security');
  security.setVersion('0.0.1');
  security.setUuid(UUID.random().toUUIDProto());
  security.setAsOf(ZonedDateTime.now().toProto());
  // M5 / #260: BOND_SECURITY retired. The bond calculator's
  // synthetic Security represents a generic coupon-paying treasury
  // note (it carries a coupon rate + face value + maturity, no
  // bills/TIPS/FRN-specific fields). TREASURY_NOTE is the
  // narrowest accurate leaf — calculator dispatches off product
  // type, and TREASURY_NOTE is what the engine's bond pricer
  // expects.
  security.setProductType(ProductTypeProto.TREASURY_NOTE);
  security.setAssetClass('Fixed Income');

  if (inputs.issuerName) {
    security.setIssuerName(inputs.issuerName);
  }

  if (inputs.faceValue) {
    security.setFaceValue(decimalValue(inputs.faceValue));
  }

  if (inputs.couponRate) {
    security.setCouponRate(decimalValue(inputs.couponRate));
  }

  security.setCouponType(CouponTypeProto.FIXED);

  const freqMap: Record<string, CouponFrequencyProto> = {
    ANNUALLY: CouponFrequencyProto.ANNUALLY,
    SEMIANNUALLY: CouponFrequencyProto.SEMIANNUALLY,
    QUARTERLY: CouponFrequencyProto.QUARTERLY,
    MONTHLY: CouponFrequencyProto.MONTHLY,
  };
  security.setCouponFrequency(freqMap[inputs.couponFrequency ?? 'SEMIANNUALLY'] ?? CouponFrequencyProto.SEMIANNUALLY);

  if (inputs.issueDate) {
    security.setIssueDate(localDateFromString(inputs.issueDate).toProto());
  }

  if (inputs.maturityDate) {
    security.setMaturityDate(localDateFromString(inputs.maturityDate).toProto());
  }

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
): Promise<import('@fintekkers/ledger-models/node/fintekkers/requests/valuation/valuation_response_pb.js').ValuationResponseProto> {
  const request = new ValuationRequestProto();
  request.setObjectClass('ValuationRequestProto');
  request.setVersion('0.0.1');
  request.setOperationType(RequestOperationTypeProto.GET);
  request.setAsofDatetime(ZonedDateTime.now().toProto());
  request.setProductInput(productInput);
  measures.forEach((m) => request.addMeasures(m));

  const conn = getServiceConnection(apiKey);
  const client = new ValuationClient(conn.url, conn.credentials, { interceptors: conn.interceptors });

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
  productSpecific?: (msg: string) => string | null,
): string {
  if (productSpecific) {
    const override = productSpecific(rawMessage);
    if (override) return override;
  }
  if (rawMessage.includes('Maturity date must be in the future')) {
    return 'This security has already matured and cannot be valued.';
  }
  if (rawMessage.includes('Periods to maturity must be at least 1')) {
    return 'This security matures too soon (less than one coupon period remaining).';
  }
  return rawMessage; // fall through — surface the underlying error to the user
}

// ---------------------------------------------------------------------------
// Bond
// ---------------------------------------------------------------------------

export async function RunBondValuation(inputs: BondCalculatorInputs, apiKey?: string): Promise<ValuationResult> {
  if (inputs.mode === 'cusip' && (!inputs.cusip || !inputs.cusip.trim())) {
    return { error: 'Please enter a CUSIP to look up.' };
  }
  if (!inputs.price || !inputs.price.trim()) {
    return { error: 'Please enter a price (% of par).' };
  }

  try {
    const securityProto = inputs.mode === 'cusip'
      ? await buildSecurityProtoFromCusip(inputs.cusip!, apiKey)
      : buildManualSecurityProto(inputs);

    const productInput = new ProductInput().setBond(
      new BondInput()
        .setSecurity(securityProto)
        .setCleanPrice(decimalValue(inputs.price)),
    );

    const response = await runValuationCore(productInput, VALUATION_MEASURES, apiKey);

    const result: ValuationResult = {};
    response.getMeasureResultsList().forEach((entry) => {
      const value = entry.getMeasureDecimalValue()?.getArbitraryPrecisionValue();
      switch (entry.getMeasure()) {
        case MEASURE_PRESENT_VALUE:            result.presentValue = value; break;
        case MeasureProto.DIRTY_PRICE:         result.dirtyPrice = value; break;
        case MeasureProto.ACCRUED_INTEREST:    result.accruedInterest = value; break;
        case MeasureProto.CURRENT_YIELD:       result.currentYield = value; break;
        case MeasureProto.YIELD_TO_MATURITY:   result.yieldToMaturity = value; break;
        case MEASURE_MACAULAY_DURATION:        result.macaulayDuration = value; break;
        case MeasureProto.MODIFIED_DURATION:   result.modifiedDuration = value; break;
        case MeasureProto.CONVEXITY:           result.convexity = value; break;
      }
    });
    result.cashflows = parseCashflows(response);
    return result;
  } catch (error: any) {
    return {
      error: mapValuationError(error.details ?? error.message ?? 'Valuation failed', (msg) => {
        if (msg.includes('Invalid Coupon Frequency')) {
          return 'This security has no coupon (e.g. a zero-coupon bond or FRN) and cannot be valued with this calculator.';
        }
        if (msg.includes('No security found')) return msg;
        return null;
      }),
    };
  }
}

/**
 * @deprecated Use `RunBondValuation` for clarity. Kept as an alias for the
 * existing UI consumers; remove once they migrate.
 */
export const RunValuation = RunBondValuation;

function buildManualTipsSecurityProto(inputs: TipsCalculatorInputs): SecurityProto {
  const security = new SecurityProto();
  security.setObjectClass('Security');
  security.setVersion('0.0.1');
  security.setUuid(UUID.random().toUUIDProto());
  security.setAsOf(ZonedDateTime.now().toProto());
  security.setProductType(ProductTypeProto.TIPS);
  security.setAssetClass('Fixed Income');
  security.setIssuerName('US Government');

  if (inputs.faceValue) {
    security.setFaceValue(decimalValue(inputs.faceValue));
  }

  if (inputs.realCouponRate) {
    security.setCouponRate(decimalValue(inputs.realCouponRate));
  }

  security.setCouponType(CouponTypeProto.FIXED);

  const freqMap: Record<string, CouponFrequencyProto> = {
    ANNUALLY: CouponFrequencyProto.ANNUALLY,
    SEMIANNUALLY: CouponFrequencyProto.SEMIANNUALLY,
    QUARTERLY: CouponFrequencyProto.QUARTERLY,
    MONTHLY: CouponFrequencyProto.MONTHLY,
  };
  security.setCouponFrequency(freqMap[inputs.couponFrequency ?? 'SEMIANNUALLY'] ?? CouponFrequencyProto.SEMIANNUALLY);

  if (inputs.issueDate) {
    security.setIssueDate(localDateFromString(inputs.issueDate).toProto());
  }

  if (inputs.maturityDate) {
    security.setMaturityDate(localDateFromString(inputs.maturityDate).toProto());
  }

  if (inputs.referenceCpi) {
    security.setBaseCpi(decimalValue(inputs.referenceCpi));
  }

  return security;
}

// ---------------------------------------------------------------------------
// TIPS
// ---------------------------------------------------------------------------

export async function RunTipsValuation(inputs: TipsCalculatorInputs, apiKey?: string): Promise<TipsValuationResult> {
  if (inputs.mode === 'cusip' && (!inputs.cusip || !inputs.cusip.trim())) {
    return { error: 'Please enter a CUSIP to look up.' };
  }
  if (!inputs.price || !inputs.price.trim()) {
    return { error: 'Please enter a price (% of par).' };
  }
  if (!inputs.currentCpi || !inputs.currentCpi.trim()) {
    return { error: 'Please enter the current CPI value.' };
  }

  try {
    const securityProto = inputs.mode === 'cusip'
      ? await buildSecurityProtoFromCusip(inputs.cusip!, apiKey)
      : buildManualTipsSecurityProto(inputs);

    // Reference CPI (base_cpi) override. The form's Reference CPI input is
    // rendered in both CUSIP and manual modes; the user may need to supply
    // it in CUSIP mode too because some TIPS records on the wire don't yet
    // have base_cpi populated (data-sourcing-dev's #263 face_value +
    // coupon_rate backfills didn't cover base_cpi). Pre-fix the CUSIP path
    // dropped the form value and valuation-service rejected the request
    // with "Missing required field: base_cpi". When the form supplies one,
    // we overlay it on the security proto regardless of mode — on BOTH the
    // flat field and the tips_details oneof, since valuation-service may
    // read either depending on which one is populated on the wire.
    if (inputs.referenceCpi && inputs.referenceCpi.trim()) {
      const baseCpiOverride = decimalValue(inputs.referenceCpi.trim());
      securityProto.setBaseCpi(baseCpiOverride);
      const tipsDetails = (securityProto as any).getTipsDetails?.();
      if (tipsDetails && typeof tipsDetails.setBaseCpi === 'function') {
        tipsDetails.setBaseCpi(decimalValue(inputs.referenceCpi.trim()));
      }
    }

    const productInput = new ProductInput().setTips(
      new TipsInput()
        .setSecurity(securityProto)
        .setCleanPrice(decimalValue(inputs.price))
        .setCurrentCpi(decimalValue(inputs.currentCpi)),
    );

    const response = await runValuationCore(productInput, TIPS_VALUATION_MEASURES, apiKey);

    const result: TipsValuationResult = {};

    // Compute index ratio client-side from CPI inputs. Use the form's
    // referenceCpi when supplied (works for both modes after the override
    // above); otherwise fall back to the security proto's base_cpi for
    // CUSIP mode where the wire populated it.
    const formReferenceCpi = parseFloat(inputs.referenceCpi ?? '');
    const protoBaseCpiStr = securityProto.getBaseCpi?.()?.getArbitraryPrecisionValue?.();
    const referenceCpi = Number.isFinite(formReferenceCpi) && formReferenceCpi > 0
      ? formReferenceCpi
      : parseFloat(protoBaseCpiStr ?? '0');
    const currentCpi = parseFloat(inputs.currentCpi);
    if (referenceCpi > 0 && currentCpi > 0) {
      result.indexRatio = (currentCpi / referenceCpi).toString();
    }

    response.getMeasureResultsList().forEach((entry) => {
      const value = entry.getMeasureDecimalValue()?.getArbitraryPrecisionValue();
      switch (entry.getMeasure()) {
        case MEASURE_PRESENT_VALUE:                    result.presentValue = value; break;
        case MeasureProto.CURRENT_YIELD:              result.currentYield = value; break;
        case MeasureProto.YIELD_TO_MATURITY:          result.yieldToMaturity = value; break;
        case MEASURE_MACAULAY_DURATION:               result.macaulayDuration = value; break;
        case MEASURE_REAL_YIELD:                      result.realYield = value; break;
        case MEASURE_INFLATION_ADJUSTED_PRINCIPAL:    result.inflationAdjustedPrincipal = value; break;
      }
    });
    result.cashflows = parseCashflows(response);
    return result;
  } catch (error: any) {
    return {
      error: mapValuationError(error.details ?? error.message ?? 'Valuation failed', (msg) => {
        if (msg.includes('Invalid Coupon Frequency')) {
          return 'This security has an unsupported coupon frequency for TIPS valuation.';
        }
        if (msg.includes('Maturity date must be in the future')) {
          return 'This TIPS has already matured and cannot be valued.';
        }
        if (msg.includes('Periods to maturity must be at least 1')) {
          return 'This TIPS matures too soon (less than one coupon period remaining).';
        }
        if (msg.includes('No security found') || msg.includes('TIPS') || msg.includes('inflation')) {
          return msg;
        }
        return null;
      }),
    };
  }
}

function buildManualFrnSecurityProto(inputs: FrnCalculatorInputs): SecurityProto {
  const security = new SecurityProto();
  security.setObjectClass('Security');
  security.setVersion('0.0.1');
  security.setUuid(UUID.random().toUUIDProto());
  security.setAsOf(ZonedDateTime.now().toProto());
  // M5 / #260: FRN → TREASURY_FRN (the FRN proto enum was renamed
  // to match the GOV_BOND-leaf convention).
  security.setProductType(ProductTypeProto.TREASURY_FRN);
  security.setAssetClass('Fixed Income');

  if (inputs.faceValue) {
    security.setFaceValue(decimalValue(inputs.faceValue));
  }

  if (inputs.spread) {
    security.setSpread(decimalValue(inputs.spread));
  }

  // FRN coupon rate = reference_rate + spread_in_percent
  // referenceRate is in % (e.g. "4"), spread is in bps (e.g. "50" = 0.50%)
  const refRate = parseFloat(inputs.referenceRate ?? '0');
  const spreadPct = parseFloat(inputs.spread ?? '0') / 100;
  security.setCouponRate(decimalValue((refRate + spreadPct).toString()));

  security.setCouponType(CouponTypeProto.FLOAT);

  const freqMap: Record<string, CouponFrequencyProto> = {
    ANNUALLY: CouponFrequencyProto.ANNUALLY,
    SEMIANNUALLY: CouponFrequencyProto.SEMIANNUALLY,
    QUARTERLY: CouponFrequencyProto.QUARTERLY,
    MONTHLY: CouponFrequencyProto.MONTHLY,
  };
  security.setCouponFrequency(freqMap[inputs.couponFrequency ?? 'QUARTERLY'] ?? CouponFrequencyProto.QUARTERLY);

  if (inputs.maturityDate) {
    security.setMaturityDate(localDateFromString(inputs.maturityDate).toProto());
  }

  const indexMap: Record<string, number> = {
    SOFR: IndexTypeProto.SOFR,
    T_BILL_13_WEEK: IndexTypeProto.T_BILL_13_WEEK,
    FED_FUNDS: IndexTypeProto.FED_FUNDS,
  };
  security.setReferenceRateIndex(indexMap[inputs.referenceRateIndex ?? 'SOFR'] ?? IndexTypeProto.SOFR);

  return security;
}

// ---------------------------------------------------------------------------
// FRN
// ---------------------------------------------------------------------------

export async function RunFrnValuation(inputs: FrnCalculatorInputs, apiKey?: string): Promise<FrnValuationResult> {
  if (inputs.mode === 'cusip' && (!inputs.cusip || !inputs.cusip.trim())) {
    return { error: 'Please enter a CUSIP to look up.' };
  }
  if (!inputs.price && !inputs.discountMargin) {
    return { error: 'Please enter either a price or a discount margin.' };
  }
  if (!inputs.referenceRate || !inputs.referenceRate.trim()) {
    return { error: 'Please enter the current reference rate (%).' };
  }
  if (!inputs.spread || !inputs.spread.trim()) {
    return { error: 'Please enter the spread (basis points).' };
  }

  try {
    const securityProto = inputs.mode === 'cusip'
      ? await buildSecurityProtoFromCusip(inputs.cusip!, apiKey)
      : buildManualFrnSecurityProto(inputs);

    const priceValue = inputs.price && inputs.price.trim() ? inputs.price : '100';
    const productInput = new ProductInput().setFrn(
      new FrnInput()
        .setSecurity(securityProto)
        .setCleanPrice(decimalValue(priceValue)),
    );

    const response = await runValuationCore(productInput, FRN_VALUATION_MEASURES, apiKey);

    const result: FrnValuationResult = {};
    response.getMeasureResultsList().forEach((entry) => {
      const value = entry.getMeasureDecimalValue()?.getArbitraryPrecisionValue();
      switch (entry.getMeasure()) {
        case MEASURE_PRESENT_VALUE:        result.presentValue = value; break;
        case MeasureProto.CURRENT_YIELD:  result.currentYield = value; break;
        case MEASURE_DISCOUNT_MARGIN:     result.discountMargin = value; break;
        case MEASURE_SPREAD_DURATION:     result.spreadDuration = value; break;
      }
    });
    result.cashflows = parseCashflows(response);
    return result;
  } catch (error: any) {
    return {
      error: mapValuationError(error.details ?? error.message ?? 'Valuation failed', (msg) => {
        if (msg.includes('Maturity date must be in the future')) {
          return 'This FRN has already matured and cannot be valued.';
        }
        if (msg.includes('Periods to maturity must be at least 1')) {
          return 'This FRN matures too soon (less than one coupon period remaining).';
        }
        if (msg.includes('No security found')) return msg;
        return null;
      }),
    };
  }
}
