import { ValuationClient } from '@fintekkers/ledger-models/node/fintekkers/services/valuation-service/valuation_service_grpc_pb.js';
import { ValuationRequestProto } from '@fintekkers/ledger-models/node/fintekkers/requests/valuation/valuation_request_pb.js';
import { PriceProto } from '@fintekkers/ledger-models/node/fintekkers/models/price/price_pb.js';
import { SecurityProto } from '@fintekkers/ledger-models/node/fintekkers/models/security/security_pb.js';
import { DecimalValueProto } from '@fintekkers/ledger-models/node/fintekkers/models/util/decimal_value_pb.js';
import { SecurityTypeProto } from '@fintekkers/ledger-models/node/fintekkers/models/security/security_type_pb.js';
import { CouponTypeProto } from '@fintekkers/ledger-models/node/fintekkers/models/security/coupon_type_pb.js';
import { CouponFrequencyProto } from '@fintekkers/ledger-models/node/fintekkers/models/security/coupon_frequency_pb.js';
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

export interface ValuationResult {
  presentValue?: string;
  currentYield?: string;
  yieldToMaturity?: string;
  macaulayDuration?: string;
  error?: string;
}

// PRESENT_VALUE (9) and MACAULAY_DURATION (8) were added after the current
// npm release, so we use raw enum values where the package has undefined.
const MEASURE_PRESENT_VALUE = MeasureProto.PRESENT_VALUE ?? 9;
const MEASURE_MACAULAY_DURATION = MeasureProto.MACAULAY_DURATION ?? 8;

const VALUATION_MEASURES = [
  MEASURE_PRESENT_VALUE,
  MeasureProto.CURRENT_YIELD,
  MeasureProto.YIELD_TO_MATURITY,
  MEASURE_MACAULAY_DURATION,
];

function decimalValue(value: string): DecimalValueProto {
  return new DecimalValueProto().setArbitraryPrecisionValue(value);
}

function localDateFromString(dateStr: string): ReturnType<typeof LocalDate.from> {
  return LocalDate.from(new Date(dateStr));
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
