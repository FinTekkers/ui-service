import { PriceClient } from '@fintekkers/ledger-models/node/fintekkers/services/price-service/price_service_grpc_pb.js';
import { QueryPriceRequestProto, PriceHorizonProto, PriceFrequencyProto } from '@fintekkers/ledger-models/node/fintekkers/requests/price/query_price_request_pb.js';
import { ZonedDateTime } from '@fintekkers/ledger-models/node/wrappers/models/utils/datetime';
import { getServiceConnection } from '$lib/grpc-auth';
import { PositionFilter } from '@fintekkers/ledger-models/node/wrappers/models/position/positionfilter';
import { UUID } from '@fintekkers/ledger-models/node/wrappers/models/utils/uuid';
import field_pkg from '@fintekkers/ledger-models/node/fintekkers/models/position/field_pb.js';
import { SecurityService } from '@fintekkers/ledger-models/node/wrappers/services/security-service/SecurityService';
import { IndexTypeProto } from '@fintekkers/ledger-models/node/fintekkers/models/security/index/index_type_pb';

const { FieldProto } = field_pkg;

const DEFAULT_SERIES_ID = 'CUUR0000SA0';

interface CpiSeries {
  identifier: string;        // BLS series id, e.g. CUUR0000SA0
  description: string;       // human-readable BLS title
  indexType: string;         // CPI_U / CORE_CPI / etc.
  uuidHex: string;           // hex-encoded protobuf UUID — used as primary key
  uuidStr: string;           // formatted UUID string — used to look up prices
}

interface CpiDataPoint {
  date: string;
  value: number;
}

function indexTypeToString(t: number): string {
  switch (t) {
    case IndexTypeProto.CPI_U: return 'CPI_U';
    case IndexTypeProto.CPI_W: return 'CPI_W';
    case IndexTypeProto.CORE_CPI: return 'CORE_CPI';
    case IndexTypeProto.PCE: return 'PCE';
    case IndexTypeProto.HICP: return 'HICP';
    default: return 'UNKNOWN';
  }
}

async function fetchCpiSeries(apiKey?: string): Promise<CpiSeries[]> {
  const filter = new PositionFilter();
  filter.addEqualsFilter(FieldProto.ASSET_CLASS, 'Index');

  const service = new SecurityService(apiKey);
  const securities = await service.searchSecurityAsOfNow(filter);

  const series: CpiSeries[] = [];
  for (const sec of securities) {
    const idProto = sec.proto.getIdentifier();
    const idValue = idProto?.getIdentifierValue();
    const indexTypeNum = sec.proto.getIndexType();
    const indexTypeStr = indexTypeToString(indexTypeNum);

    // Filter to CPI families. Other Index-class securities (e.g. SOFR) wouldn't
    // belong on this page even if they were ASSET_CLASS=Index.
    if (indexTypeStr !== 'CPI_U' && indexTypeStr !== 'CORE_CPI' && indexTypeStr !== 'CPI_W' && indexTypeStr !== 'PCE' && indexTypeStr !== 'HICP') continue;
    if (!idValue) continue;

    const uuidProto = sec.proto.getUuid();
    if (!uuidProto) continue;
    const uuidHex = Buffer.from(uuidProto.serializeBinary()).toString('hex');
    const uuidStr = sec.getID().toString();

    let description = '';
    try { description = sec.proto.getDescription() || ''; } catch { /* no description */ }
    if (!description) description = sec.getIssuerName() || idValue;

    series.push({ identifier: idValue, description, indexType: indexTypeStr, uuidHex, uuidStr });
  }

  // Group by index_type then alphabetical by description — deterministic order in the dropdown.
  series.sort((a, b) => a.indexType.localeCompare(b.indexType) || a.description.localeCompare(b.description));
  return series;
}

async function fetchPrices(uuidStr: string, apiKey?: string): Promise<CpiDataPoint[]> {
  const request = new QueryPriceRequestProto();
  request.setObjectClass('QueryPriceRequestProto');
  request.setVersion('0.0.1');
  request.setAsOf(ZonedDateTime.now().toProto());
  // CPI is monthly; pull the full available history so spot-checks like
  // 1947-01 = 21.48 work. The largest series (1,358 obs) fits in one response.
  request.setHorizon(PriceHorizonProto.PRICE_HORIZON_MAX);
  request.setFrequency(PriceFrequencyProto.PRICE_FREQUENCY_DAILY);

  const filter = new PositionFilter();
  filter.addObjectFilter(FieldProto.SECURITY_ID, new UUID(UUID.fromString(uuidStr)));
  request.setSearchPriceInput(filter.toProto());

  const conn = getServiceConnection(apiKey);
  const client = new PriceClient(conn.url, conn.credentials, { interceptors: conn.interceptors });

  const prices: CpiDataPoint[] = await new Promise((resolve) => {
    const results: CpiDataPoint[] = [];
    const stream = client.search(request);

    stream.on('data', (response: any) => {
      const priceList = response.getPriceResponseList?.() ?? [];
      for (const price of priceList) {
        const asOf = price.getAsOf?.();
        const priceVal = price.getPrice?.()?.getArbitraryPrecisionValue?.();
        if (asOf && priceVal) {
          const ts = asOf.getTimestamp?.();
          if (ts) {
            const d = new Date(ts.getSeconds() * 1000);
            const dateStr = d.toISOString().slice(0, 10);
            if (dateStr) results.push({ date: dateStr, value: parseFloat(priceVal) });
          }
        }
      }
    });

    stream.on('end', () => resolve(results));
    stream.on('error', (err: any) => {
      console.error('CPI price fetch error:', err.details ?? err.message);
      resolve(results);
    });
  });

  // Dedupe by month (keep the latest entry per YYYY-MM, in case revisions land).
  const sorted = prices.sort((a, b) => a.date.localeCompare(b.date));
  const byMonth = new Map<string, CpiDataPoint>();
  for (const p of sorted) byMonth.set(p.date.slice(0, 7), p);
  return Array.from(byMonth.values());
}

/** @type {import('./$types').PageServerLoad} */
export async function load({ locals, request }: { locals: App.Locals; request: Request }) {
  const apiKey = locals.user?.apiKey;
  const url = new URL(request.url);
  const requestedSeries = (url.searchParams.get('series') ?? '').trim() || DEFAULT_SERIES_ID;

  let allSeries: CpiSeries[] = [];
  let error: string | null = null;
  try {
    allSeries = await fetchCpiSeries(apiKey);
  } catch (e: any) {
    console.error('CPI series fetch error:', e?.message ?? e);
    error = 'Could not load CPI series — security service unavailable';
  }

  if (allSeries.length === 0) {
    return {
      allSeries: [],
      selectedSeries: null,
      cpiData: [] as CpiDataPoint[],
      error: error ?? 'No CPI series loaded yet',
    };
  }

  const selected = allSeries.find((s) => s.identifier === requestedSeries) ?? allSeries.find((s) => s.identifier === DEFAULT_SERIES_ID) ?? allSeries[0];

  let cpiData: CpiDataPoint[] = [];
  try {
    cpiData = await fetchPrices(selected.uuidStr, apiKey);
  } catch (e: any) {
    console.error('CPI price fetch error:', e?.message ?? e);
    error = error ?? 'Price service unavailable';
  }

  return {
    allSeries,
    selectedSeries: selected,
    cpiData,
    error,
  };
}
