/**
 * ISSUE #3: Insert CPI-U price records directly into Postgres.
 *
 * The PriceService.CreateOrUpdate returns "PriceProto deserialization not yet implemented",
 * so we insert directly into the price table with serialized protobuf binary data.
 *
 * Source: FRED CPIAUCNS (unadjusted) — https://fred.stlouisfed.org/series/CPIAUCNS
 */

const { execSync } = require('child_process');

const CPI_U_SECURITY_UUID = 'c7c719a1-7bbc-5890-992d-7f6f3a4b3dca';

const CPI_DATA = [
  // 2020 — Source: FRED CPIAUCNS (unadjusted)
  { year: 2020, month: 1,  value: '257.971' },
  { year: 2020, month: 2,  value: '258.678' },
  { year: 2020, month: 3,  value: '258.115' },
  { year: 2020, month: 4,  value: '256.389' },
  { year: 2020, month: 5,  value: '256.394' },
  { year: 2020, month: 6,  value: '257.797' },
  { year: 2020, month: 7,  value: '259.101' },
  { year: 2020, month: 8,  value: '259.918' },
  { year: 2020, month: 9,  value: '260.280' },
  { year: 2020, month: 10, value: '260.388' },
  { year: 2020, month: 11, value: '260.229' },
  { year: 2020, month: 12, value: '260.474' },
  // 2021
  { year: 2021, month: 1,  value: '261.582' },
  { year: 2021, month: 2,  value: '263.014' },
  { year: 2021, month: 3,  value: '264.877' },
  { year: 2021, month: 4,  value: '267.054' },
  { year: 2021, month: 5,  value: '269.195' },
  { year: 2021, month: 6,  value: '271.696' },
  { year: 2021, month: 7,  value: '273.003' },
  { year: 2021, month: 8,  value: '273.567' },
  { year: 2021, month: 9,  value: '274.310' },
  { year: 2021, month: 10, value: '276.589' },
  { year: 2021, month: 11, value: '277.948' },
  { year: 2021, month: 12, value: '278.802' },
  // 2022
  { year: 2022, month: 1,  value: '281.148' },
  { year: 2022, month: 2,  value: '283.716' },
  { year: 2022, month: 3,  value: '287.504' },
  { year: 2022, month: 4,  value: '289.109' },
  { year: 2022, month: 5,  value: '292.296' },
  { year: 2022, month: 6,  value: '296.311' },
  { year: 2022, month: 7,  value: '296.276' },
  { year: 2022, month: 8,  value: '296.171' },
  { year: 2022, month: 9,  value: '296.808' },
  { year: 2022, month: 10, value: '298.012' },
  { year: 2022, month: 11, value: '297.711' },
  { year: 2022, month: 12, value: '296.797' },
  // 2023
  { year: 2023, month: 1,  value: '299.170' },
  { year: 2023, month: 2,  value: '300.840' },
  { year: 2023, month: 3,  value: '301.836' },
  { year: 2023, month: 4,  value: '303.363' },
  { year: 2023, month: 5,  value: '304.127' },
  { year: 2023, month: 6,  value: '305.109' },
  { year: 2023, month: 7,  value: '305.691' },
  { year: 2023, month: 8,  value: '307.026' },
  { year: 2023, month: 9,  value: '307.789' },
  { year: 2023, month: 10, value: '307.671' },
  { year: 2023, month: 11, value: '307.051' },
  { year: 2023, month: 12, value: '306.746' },
  // 2024
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

// Proto imports
const { PriceProto } = require('@fintekkers/ledger-models/node/fintekkers/models/price/price_pb.js');
const { SecurityProto } = require('@fintekkers/ledger-models/node/fintekkers/models/security/security_pb.js');
const { SecurityTypeProto } = require('@fintekkers/ledger-models/node/fintekkers/models/security/security_type_pb.js');
const { DecimalValueProto } = require('@fintekkers/ledger-models/node/fintekkers/models/util/decimal_value_pb.js');
const { UUIDProto } = require('@fintekkers/ledger-models/node/fintekkers/models/util/uuid_pb.js');
const { LocalTimestampProto } = require('@fintekkers/ledger-models/node/fintekkers/models/util/local_timestamp_pb.js');
const { UUID } = require('@fintekkers/ledger-models/node/wrappers/models/utils/uuid');
const crypto = require('crypto');
const { Timestamp } = require('google-protobuf/google/protobuf/timestamp_pb.js');

function uuidProtoFromString(uuidStr) {
  const bytes = UUID.fromString(uuidStr);
  return new UUIDProto().setRawUuid(Buffer.from(bytes));
}

function makeTimestamp(year, month, day) {
  const dt = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
  const ts = new Timestamp();
  ts.setSeconds(Math.floor(dt.getTime() / 1000));
  ts.setNanos(0);
  const lts = new LocalTimestampProto();
  lts.setTimestamp(ts);
  lts.setTimeZone('UTC');
  return lts;
}

function buildPriceProto(entry) {
  const priceUuid = crypto.randomUUID();

  // Security link
  const security = new SecurityProto();
  security.setObjectClass('Security');
  security.setVersion('0.0.1');
  security.setIsLink(true);
  security.setSecurityType(SecurityTypeProto.INDEX_SECURITY);
  security.setUuid(uuidProtoFromString(CPI_U_SECURITY_UUID));

  // As-of timestamp = observation date (1st of month)
  const asOf = makeTimestamp(entry.year, entry.month, 1);

  const price = new PriceProto();
  price.setObjectClass('PriceProto');
  price.setVersion('0.0.1');
  price.setUuid(uuidProtoFromString(priceUuid));
  price.setAsOf(asOf);
  price.setValidFrom(asOf);
  price.setPrice(new DecimalValueProto().setArbitraryPrecisionValue(entry.value));
  price.setSecurity(security);

  return { priceUuid, bytes: Buffer.from(price.serializeBinary()), asOf: `${entry.year}-${String(entry.month).padStart(2, '0')}-01` };
}

const PSQL_ENV = 'PGPASSWORD=cejmot-gabze7-qaJdej';
const PSQL_CMD = 'psql -h localhost -U postgres -d postgres -t -A';

let created = 0;
let failed = 0;

for (const entry of CPI_DATA) {
  const label = `${entry.year}-${String(entry.month).padStart(2, '0')}`;
  try {
    const { priceUuid, bytes, asOf } = buildPriceProto(entry);
    const hexBytes = '\\x' + bytes.toString('hex');
    const sql = `INSERT INTO price (primarykey, binarydata, asof, validfrom, securityid) VALUES ('${priceUuid}', '${hexBytes}', '${asOf}', '${asOf}', '${CPI_U_SECURITY_UUID}') ON CONFLICT (primarykey, asof) DO UPDATE SET binarydata = EXCLUDED.binarydata, validfrom = EXCLUDED.validfrom;`;

    execSync(`${PSQL_ENV} ${PSQL_CMD} -c "${sql.replace(/"/g, '\\"')}"`, { stdio: 'pipe' });
    console.log(`  CREATED: ${label} = ${entry.value} (uuid: ${priceUuid})`);
    created++;
  } catch (error) {
    console.log(`  FAILED: ${label} = ${entry.value} — ${error.message.substring(0, 100)}`);
    failed++;
  }
}

console.log(`\nDone. Created: ${created}, Failed: ${failed}, Total: ${CPI_DATA.length}`);

// Verify
try {
  const count = execSync(`${PSQL_ENV} ${PSQL_CMD} -c "SELECT COUNT(*) FROM price WHERE securityid = '${CPI_U_SECURITY_UUID}';"`, { encoding: 'utf-8' }).trim();
  console.log(`Verification: ${count} CPI-U price records in database`);
} catch (e) {
  console.log('Verification query failed:', e.message);
}
