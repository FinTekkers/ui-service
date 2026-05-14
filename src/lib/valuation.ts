import { ValuationClient } from '@fintekkers/ledger-models/node/fintekkers/services/valuation-service/valuation_service_grpc_pb.js';
import { SecurityClient } from '@fintekkers/ledger-models/node/fintekkers/services/security-service/security_service_grpc_pb.js';
import { ValuationRequestProto } from '@fintekkers/ledger-models/node/fintekkers/requests/valuation/valuation_request_pb.js';
import { ProductInput, BondInput, TipsInput, FrnInput } from '@fintekkers/ledger-models/node/fintekkers/requests/valuation/product_inputs_pb.js';
import { QuerySecurityRequestProto } from '@fintekkers/ledger-models/node/fintekkers/requests/security/query_security_request_pb.js';
import { SecurityProto, TipsExtensionProto } from '@fintekkers/ledger-models/node/fintekkers/models/security/security_pb.js';
import { DecimalValueProto } from '@fintekkers/ledger-models/node/fintekkers/models/util/decimal_value_pb.js';
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
import BondSecurity from '@fintekkers/ledger-models/node/wrappers/models/security/BondSecurity';
import TIPSBond from '@fintekkers/ledger-models/node/wrappers/models/security/TIPSBond';
import FloatingRateNote from '@fintekkers/ledger-models/node/wrappers/models/security/FloatingRateNote';
import { UUID } from '@fintekkers/ledger-models/node/wrappers/models/utils/uuid';
import { Decimal } from 'decimal.js';
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

function frequency(name: string | undefined, fallback: CouponFrequencyProto): CouponFrequencyProto {
  return CouponFrequencyProto[(name ?? '') as keyof typeof CouponFrequencyProto] ?? fallback;
}

function buildManualSecurityProto(inputs: BondCalculatorInputs): SecurityProto {
  // BondSecurity.fromPricerInputs builds a TREASURY_NOTE-typed proto with
  // the structured bond_details sub-message populated. Issuer name + UUID
  // + asOf are envelope concerns the pricer doesn't need but we stamp
  // them for consistency with the prior shape.
  const security = BondSecurity.fromPricerInputs({
    faceValue: new Decimal(inputs.faceValue ?? '0'),
    couponRate: new Decimal(inputs.couponRate ?? '0'),
    couponType: CouponTypeProto.FIXED,
    couponFrequency: frequency(inputs.couponFrequency, CouponFrequencyProto.SEMIANNUALLY),
    issueDate: LocalDate.from(new Date(inputs.issueDate ?? new Date().toISOString().slice(0, 10))),
    maturityDate: LocalDate.from(new Date(inputs.maturityDate ?? new Date().toISOString().slice(0, 10))),
  });
  security.setObjectClass('Security');
  security.setVersion('0.0.1');
  security.setUuid(UUID.random().toUUIDProto());
  security.setAsOf(ZonedDateTime.now().toProto());
  security.setAssetClass('Fixed Income');
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
  const issueDate = LocalDate.from(new Date(inputs.issueDate ?? new Date().toISOString().slice(0, 10)));
  const maturityDate = LocalDate.from(new Date(inputs.maturityDate ?? new Date().toISOString().slice(0, 10)));

  // US TIPS accrue off CPI-U; the inflation_index_type field is required on
  // the structured TipsExtensionProto. indexDate defaults to the bond's
  // issue date — the base CPI is fixed at issuance for vanilla TIPS, so the
  // issue date is the natural reference.
  const security = TIPSBond.fromPricerInputs({
    faceValue: new Decimal(inputs.faceValue ?? '0'),
    couponRate: new Decimal(inputs.realCouponRate ?? '0'),
    couponType: CouponTypeProto.FIXED,
    couponFrequency: frequency(inputs.couponFrequency, CouponFrequencyProto.SEMIANNUALLY),
    issueDate,
    maturityDate,
    baseCpi: new Decimal(inputs.referenceCpi && inputs.referenceCpi.trim() !== '' ? inputs.referenceCpi : '0'),
    indexDate: issueDate,
    inflationIndexType: IndexTypeProto.CPI_U,
  });
  security.setObjectClass('Security');
  security.setVersion('0.0.1');
  security.setUuid(UUID.random().toUUIDProto());
  security.setAsOf(ZonedDateTime.now().toProto());
  security.setAssetClass('Fixed Income');
  security.setIssuerName('US Government');
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
    // coupon_rate backfills didn't cover base_cpi). The CUSIP-mode proto
    // comes from a search and may or may not already carry a TipsExtension —
    // re-use the existing one when present so we don't drop index_date /
    // inflation_index_type, otherwise stamp a fresh CPI-U extension.
    if (inputs.referenceCpi && inputs.referenceCpi.trim()) {
      const tipsExt = securityProto.getTipsExtension() ?? new TipsExtensionProto();
      tipsExt.setBaseCpi(decimalValue(inputs.referenceCpi.trim()));
      if (tipsExt.getInflationIndexType() === IndexTypeProto.UNKNOWN_INDEX_TYPE) {
        tipsExt.setInflationIndexType(IndexTypeProto.CPI_U);
      }
      securityProto.setTipsExtension(tipsExt);
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
    const protoBaseCpiStr = securityProto.getTipsExtension()?.getBaseCpi()?.getArbitraryPrecisionValue();
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
  // FRN coupon rate = reference_rate + spread_in_percent
  // referenceRate is in % (e.g. "4"), spread is in bps (e.g. "50" = 0.50%)
  const refRate = parseFloat(inputs.referenceRate ?? '0');
  const spreadPct = parseFloat(inputs.spread ?? '0') / 100;
  const effectiveCoupon = new Decimal((refRate + spreadPct).toString());
  const couponFrequency = frequency(inputs.couponFrequency, CouponFrequencyProto.QUARTERLY);
  const maturityDate = LocalDate.from(new Date(inputs.maturityDate ?? new Date().toISOString().slice(0, 10)));
  const referenceRateIndex =
    IndexTypeProto[(inputs.referenceRateIndex ?? 'SOFR') as keyof typeof IndexTypeProto] ??
    IndexTypeProto.SOFR;

  const security = FloatingRateNote.fromPricerInputs({
    faceValue: new Decimal(inputs.faceValue ?? '0'),
    couponRate: effectiveCoupon,
    couponType: CouponTypeProto.FLOAT,
    couponFrequency,
    issueDate: maturityDate,
    maturityDate,
    spread: new Decimal(inputs.spread ?? '0'),
    referenceRateIndex,
    resetFrequency: couponFrequency,
  });
  security.setObjectClass('Security');
  security.setVersion('0.0.1');
  security.setUuid(UUID.random().toUUIDProto());
  security.setAsOf(ZonedDateTime.now().toProto());
  security.setAssetClass('Fixed Income');
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
