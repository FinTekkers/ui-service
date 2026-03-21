import { ValuationClient } from '@fintekkers/ledger-models/node/fintekkers/services/valuation-service/valuation_service_grpc_pb.js';
import { ValuationRequestProto } from '@fintekkers/ledger-models/node/fintekkers/requests/valuation/valuation_request_pb.js';
import { PriceProto } from '@fintekkers/ledger-models/node/fintekkers/models/price/price_pb.js';
import { SecurityProto } from '@fintekkers/ledger-models/node/fintekkers/models/security/security_pb.js';
import { DecimalValueProto } from '@fintekkers/ledger-models/node/fintekkers/models/util/decimal_value_pb.js';
import { SecurityTypeProto } from '@fintekkers/ledger-models/node/fintekkers/models/security/security_type_pb.js';
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
import { SecurityService } from '@fintekkers/ledger-models/node/wrappers/services/security-service/SecurityService';
import { Identifier } from '@fintekkers/ledger-models/node/wrappers/models/security/identifier';
import { UUID } from '@fintekkers/ledger-models/node/wrappers/models/utils/uuid';
import EnvConfig from '@fintekkers/ledger-models/node/wrappers/models/utils/requestcontext';

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
  currentYield?: string;
  yieldToMaturity?: string;
  macaulayDuration?: string;
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
  MeasureProto.CURRENT_YIELD,
  MeasureProto.YIELD_TO_MATURITY,
  MEASURE_MACAULAY_DURATION,
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

async function buildSecurityProtoFromCusip(cusip: string): Promise<SecurityProto> {
  const securityService = new SecurityService();
  const filter = new PositionFilter();
  const identifierProto = new IdentifierProto()
    .setIdentifierType(IdentifierTypeProto.CUSIP)
    .setIdentifierValue(cusip.trim());
  filter.addObjectFilter(FieldProto.IDENTIFIER, new Identifier(identifierProto));

  const results = await securityService.searchSecurityAsOfNow(filter);
  if (results.length === 0) {
    throw new Error(`No security found for CUSIP: ${cusip}`);
  }
  return results[0].proto;
}

function buildManualSecurityProto(inputs: BondCalculatorInputs): SecurityProto {
  const security = new SecurityProto();
  security.setObjectClass('Security');
  security.setVersion('0.0.1');
  security.setUuid(UUID.random().toUUIDProto());
  security.setAsOf(ZonedDateTime.now().toProto());
  security.setSecurityType(SecurityTypeProto.BOND_SECURITY);
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

function buildPriceProto(securityProto: SecurityProto, price: string): PriceProto {
  const priceProto = new PriceProto();
  priceProto.setObjectClass('PriceProto');
  priceProto.setVersion('0.0.1');
  priceProto.setAsOf(ZonedDateTime.now().toProto());
  priceProto.setPrice(decimalValue(price));
  priceProto.setSecurity(securityProto);
  return priceProto;
}

export async function RunValuation(inputs: BondCalculatorInputs): Promise<ValuationResult> {
  try {
    if (inputs.mode === 'cusip' && (!inputs.cusip || !inputs.cusip.trim())) {
      return { error: 'Please enter a CUSIP to look up.' };
    }
    if (!inputs.price || !inputs.price.trim()) {
      return { error: 'Please enter a price (% of par).' };
    }

    const securityProto = inputs.mode === 'cusip'
      ? await buildSecurityProtoFromCusip(inputs.cusip!)
      : buildManualSecurityProto(inputs);

    const priceProto = buildPriceProto(securityProto, inputs.price);

    const request = new ValuationRequestProto();
    request.setObjectClass('ValuationRequestProto');
    request.setVersion('0.0.1');
    request.setOperationType(RequestOperationTypeProto.GET);
    request.setAsofDatetime(ZonedDateTime.now().toProto());
    request.setSecurityInput(securityProto);
    request.setPriceInput(priceProto);
    VALUATION_MEASURES.forEach(m => request.addMeasures(m));

    // The valuation service runs on port 8080 (separate from the main API on 8082)
    const valuationURL = EnvConfig.apiURL.replace(':8082', ':8080');
    const client = new ValuationClient(valuationURL, EnvConfig.apiCredentials);

    const response = await new Promise<import('@fintekkers/ledger-models/node/fintekkers/requests/valuation/valuation_response_pb.js').ValuationResponseProto>((resolve, reject) => {
      client.runValuation(request, (error, response) => {
        if (error) reject(error);
        else resolve(response);
      });
    });

    const result: ValuationResult = {};
    response.getMeasureResultsList().forEach(entry => {
      const value = entry.getMeasureDecimalValue()?.getArbitraryPrecisionValue();
      switch (entry.getMeasure()) {
        case MEASURE_PRESENT_VALUE:             result.presentValue = value; break;
        case MeasureProto.CURRENT_YIELD:       result.currentYield = value; break;
        case MeasureProto.YIELD_TO_MATURITY:   result.yieldToMaturity = value; break;
        case MEASURE_MACAULAY_DURATION:        result.macaulayDuration = value; break;
      }
    });

    result.cashflows = parseCashflows(response);

    return result;
  } catch (error: any) {
    const rawMessage = error.details ?? error.message ?? 'Valuation failed';

    // Provide user-friendly messages for known service errors
    if (rawMessage.includes('Invalid Coupon Frequency')) {
      return { error: 'This security has no coupon (e.g. a zero-coupon bond or FRN) and cannot be valued with this calculator.' };
    }
    if (rawMessage.includes('Maturity date must be in the future')) {
      return { error: 'This security has already matured and cannot be valued.' };
    }
    if (rawMessage.includes('Periods to maturity must be at least 1')) {
      return { error: 'This security matures too soon (less than one coupon period remaining).' };
    }
    if (rawMessage.includes('No security found')) {
      return { error: rawMessage };
    }

    return { error: rawMessage };
  }
}

function buildManualTipsSecurityProto(inputs: TipsCalculatorInputs): SecurityProto {
  const security = new SecurityProto();
  security.setObjectClass('Security');
  security.setVersion('0.0.1');
  security.setUuid(UUID.random().toUUIDProto());
  security.setAsOf(ZonedDateTime.now().toProto());
  security.setSecurityType(SecurityTypeProto.TIPS);
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

function buildCpiPriceProto(currentCpi: string): PriceProto {
  const cpiPrice = new PriceProto();
  cpiPrice.setObjectClass('PriceProto');
  cpiPrice.setVersion('0.0.1');
  cpiPrice.setAsOf(ZonedDateTime.now().toProto());
  cpiPrice.setPrice(decimalValue(currentCpi));
  return cpiPrice;
}

export async function RunTipsValuation(inputs: TipsCalculatorInputs): Promise<TipsValuationResult> {
  try {
    if (inputs.mode === 'cusip' && (!inputs.cusip || !inputs.cusip.trim())) {
      return { error: 'Please enter a CUSIP to look up.' };
    }
    if (!inputs.price || !inputs.price.trim()) {
      return { error: 'Please enter a price (% of par).' };
    }
    if (!inputs.currentCpi || !inputs.currentCpi.trim()) {
      return { error: 'Please enter the current CPI value.' };
    }

    const securityProto = inputs.mode === 'cusip'
      ? await buildSecurityProtoFromCusip(inputs.cusip!)
      : buildManualTipsSecurityProto(inputs);

    const priceProto = buildPriceProto(securityProto, inputs.price);
    const cpiPriceProto = buildCpiPriceProto(inputs.currentCpi);

    const request = new ValuationRequestProto();
    request.setObjectClass('ValuationRequestProto');
    request.setVersion('0.0.1');
    request.setOperationType(RequestOperationTypeProto.GET);
    request.setAsofDatetime(ZonedDateTime.now().toProto());
    request.setSecurityInput(securityProto);
    request.setPriceInput(priceProto);

    request.setCpiPriceInput(cpiPriceProto);

    TIPS_VALUATION_MEASURES.forEach(m => request.addMeasures(m));

    const valuationURL = EnvConfig.apiURL.replace(':8082', ':8080');
    const client = new ValuationClient(valuationURL, EnvConfig.apiCredentials);

    const response = await new Promise<import('@fintekkers/ledger-models/node/fintekkers/requests/valuation/valuation_response_pb.js').ValuationResponseProto>((resolve, reject) => {
      client.runValuation(request, (error, response) => {
        if (error) reject(error);
        else resolve(response);
      });
    });

    const result: TipsValuationResult = {};

    // Compute index ratio client-side from CPI inputs
    const referenceCpi = inputs.mode === 'manual' ? parseFloat(inputs.referenceCpi ?? '0') : 0;
    const currentCpi = parseFloat(inputs.currentCpi);
    if (referenceCpi > 0 && currentCpi > 0) {
      result.indexRatio = (currentCpi / referenceCpi).toString();
    }

    response.getMeasureResultsList().forEach(entry => {
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
    const rawMessage = error.details ?? error.message ?? 'Valuation failed';

    if (rawMessage.includes('Invalid Coupon Frequency')) {
      return { error: 'This security has an unsupported coupon frequency for TIPS valuation.' };
    }
    if (rawMessage.includes('Maturity date must be in the future')) {
      return { error: 'This TIPS has already matured and cannot be valued.' };
    }
    if (rawMessage.includes('Periods to maturity must be at least 1')) {
      return { error: 'This TIPS matures too soon (less than one coupon period remaining).' };
    }
    if (rawMessage.includes('No security found')) {
      return { error: rawMessage };
    }
    if (rawMessage.includes('TIPS') || rawMessage.includes('inflation')) {
      return { error: rawMessage };
    }

    return { error: rawMessage };
  }
}

function buildManualFrnSecurityProto(inputs: FrnCalculatorInputs): SecurityProto {
  const security = new SecurityProto();
  security.setObjectClass('Security');
  security.setVersion('0.0.1');
  security.setUuid(UUID.random().toUUIDProto());
  security.setAsOf(ZonedDateTime.now().toProto());
  security.setSecurityType(SecurityTypeProto.FRN);
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

function buildReferenceRatePriceProto(referenceRate: string): PriceProto {
  const ratePrice = new PriceProto();
  ratePrice.setObjectClass('PriceProto');
  ratePrice.setVersion('0.0.1');
  ratePrice.setAsOf(ZonedDateTime.now().toProto());
  ratePrice.setPrice(decimalValue(referenceRate));
  return ratePrice;
}

export async function RunFrnValuation(inputs: FrnCalculatorInputs): Promise<FrnValuationResult> {
  try {
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

    const securityProto = inputs.mode === 'cusip'
      ? await buildSecurityProtoFromCusip(inputs.cusip!)
      : buildManualFrnSecurityProto(inputs);

    const priceValue = inputs.price && inputs.price.trim() ? inputs.price : '100';
    const priceProto = buildPriceProto(securityProto, priceValue);
    const referenceRateProto = buildReferenceRatePriceProto(inputs.referenceRate);

    const request = new ValuationRequestProto();
    request.setObjectClass('ValuationRequestProto');
    request.setVersion('0.0.1');
    request.setOperationType(RequestOperationTypeProto.GET);
    request.setAsofDatetime(ZonedDateTime.now().toProto());
    request.setSecurityInput(securityProto);
    request.setPriceInput(priceProto);
    request.setReferenceRateInput(referenceRateProto);
    FRN_VALUATION_MEASURES.forEach(m => request.addMeasures(m));

    const valuationURL = EnvConfig.apiURL.replace(':8082', ':8080');
    const client = new ValuationClient(valuationURL, EnvConfig.apiCredentials);

    const response = await new Promise<import('@fintekkers/ledger-models/node/fintekkers/requests/valuation/valuation_response_pb.js').ValuationResponseProto>((resolve, reject) => {
      client.runValuation(request, (error, response) => {
        if (error) reject(error);
        else resolve(response);
      });
    });

    const result: FrnValuationResult = {};
    response.getMeasureResultsList().forEach(entry => {
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
    const rawMessage = error.details ?? error.message ?? 'Valuation failed';

    if (rawMessage.includes('Maturity date must be in the future')) {
      return { error: 'This FRN has already matured and cannot be valued.' };
    }
    if (rawMessage.includes('Periods to maturity must be at least 1')) {
      return { error: 'This FRN matures too soon (less than one coupon period remaining).' };
    }
    if (rawMessage.includes('No security found')) {
      return { error: rawMessage };
    }

    return { error: rawMessage };
  }
}
