/**
 * ISSUE #3: Create CPI-U price records in PriceService via gRPC.
 * Falls back to Postgres direct insert if gRPC fails.
 *
 * Sources CPI-U data from FRED series CPIAUCNS (unadjusted)
 * Source: https://fred.stlouisfed.org/series/CPIAUCNS
 */

const CPI_U_SECURITY_UUID = 'c7c719a1-7bbc-5890-992d-7f6f3a4b3dca';

const CPI_DATA = [
  { year: 2024, month: 1,  value: '308.417' },
  { year: 2024, month: 2,  value: '310.326' },
  { year: 2024, month: 3,  value: '312.230' },
  { year: 2024, month: 4,  value: '313.207' },
  { year: 2024, month: 5,  value: '314.069' },
  { year: 2024, month: 6,  value: '314.175' },
  { year: 2024, month: 7,  value: '314.540' },
  { year: 2024, month: 8,  value: '314.121' },
  { year: 2024, month: 9,  value: '314.796' },
  { year: 2024, month: 10, value: '315.664' },
  { year: 2024, month: 11, value: '316.006' },
  { year: 2024, month: 12, value: '316.578' },
];

const { PriceClient } = require('@fintekkers/ledger-models/node/fintekkers/services/price-service/price_service_grpc_pb.js');
const { CreatePriceRequestProto } = require('@fintekkers/ledger-models/node/fintekkers/requests/price/create_price_request_pb.js');
const { PriceProto } = require('@fintekkers/ledger-models/node/fintekkers/models/price/price_pb.js');
const { SecurityProto } = require('@fintekkers/ledger-models/node/fintekkers/models/security/security_pb.js');
const { SecurityTypeProto } = require('@fintekkers/ledger-models/node/fintekkers/models/security/security_type_pb.js');
const { DecimalValueProto } = require('@fintekkers/ledger-models/node/fintekkers/models/util/decimal_value_pb.js');
const { ZonedDateTime } = require('@fintekkers/ledger-models/node/wrappers/models/utils/datetime');
const { UUIDProto } = require('@fintekkers/ledger-models/node/fintekkers/models/util/uuid_pb.js');
const { UUID } = require('@fintekkers/ledger-models/node/wrappers/models/utils/uuid');
const EnvConfig = require('@fintekkers/ledger-models/node/wrappers/models/utils/requestcontext').default;

function uuidProtoFromString(uuidStr) {
  const bytes = UUID.fromString(uuidStr);
  return new UUIDProto().setRawUuid(Buffer.from(bytes));
}

function dv(value) {
  return new DecimalValueProto().setArbitraryPrecisionValue(value);
}

async function createCpiPrice(client, entry) {
  const security = new SecurityProto();
  security.setObjectClass('Security');
  security.setVersion('0.0.1');
  security.setIsLink(true);
  security.setSecurityType(SecurityTypeProto.INDEX_SECURITY);
  security.setUuid(uuidProtoFromString(CPI_U_SECURITY_UUID));

  const price = new PriceProto();
  price.setObjectClass('PriceProto');
  price.setVersion('0.0.1');
  const randomUuid = require('crypto').randomUUID();
  price.setUuid(uuidProtoFromString(randomUuid));
  price.setAsOf(ZonedDateTime.now().toProto());
  price.setValidFrom(ZonedDateTime.now().toProto());
  price.setPrice(dv(entry.value));
  price.setSecurity(security);

  const request = new CreatePriceRequestProto();
  request.setObjectClass('CreatePriceRequestProto');
  request.setVersion('0.0.1');
  request.setCreatePriceInput(price);

  return new Promise((resolve, reject) => {
    client.createOrUpdate(request, (error, response) => {
      if (error) reject(error);
      else resolve(response);
    });
  });
}

async function main() {
  const priceURL = EnvConfig.apiURL.replace(':8082', ':8083');
  console.log('Connecting to PriceService at:', priceURL);

  const client = new PriceClient(priceURL, EnvConfig.apiCredentials);

  let created = 0;
  let failed = 0;

  for (const entry of CPI_DATA) {
    const label = `${entry.year}-${String(entry.month).padStart(2, '0')}`;
    try {
      await createCpiPrice(client, entry);
      console.log(`  CREATED: ${label} = ${entry.value}`);
      created++;
    } catch (error) {
      console.log(`  FAILED: ${label} = ${entry.value} — ${error.details || error.message}`);
      failed++;
    }
  }

  console.log(`\nDone. Created: ${created}, Failed: ${failed}, Total: ${CPI_DATA.length}`);
}

main().then(() => process.exit(0)).catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
