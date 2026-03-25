import { PriceClient } from '@fintekkers/ledger-models/node/fintekkers/services/price-service/price_service_grpc_pb.js';
import { QueryPriceRequestProto, PriceHorizonProto, PriceFrequencyProto } from '@fintekkers/ledger-models/node/fintekkers/requests/price/query_price_request_pb.js';
import { ZonedDateTime } from '@fintekkers/ledger-models/node/wrappers/models/utils/datetime';
import { getServiceConnection } from '$lib/grpc-auth';
import { PositionFilter } from '@fintekkers/ledger-models/node/wrappers/models/position/positionfilter';
import { UUID } from '@fintekkers/ledger-models/node/wrappers/models/utils/uuid';
import { FieldProto } from '@fintekkers/ledger-models/node/fintekkers/models/position/field_pb.js';

// CPI-U index security UUID (from the backend)
const CPI_U_UUID = 'c7c719a1-7bbc-5890-992d-7f6f3a4b3dca';

// Stub data shown when the service returns no CPI data or is unavailable.
// Covers the most recent 15 months so the chart is always useful.
const STUB_CPI_DATA = [
  { date: '2024-01', value: 308.417 },
  { date: '2024-02', value: 310.326 },
  { date: '2024-03', value: 312.230 },
  { date: '2024-04', value: 313.207 },
  { date: '2024-05', value: 314.069 },
  { date: '2024-06', value: 314.175 },
  { date: '2024-07', value: 314.540 },
  { date: '2024-08', value: 314.796 },
  { date: '2024-09', value: 315.301 },
  { date: '2024-10', value: 315.664 },
  { date: '2024-11', value: 316.048 },
  { date: '2024-12', value: 316.525 },
  { date: '2025-01', value: 317.671 },
  { date: '2025-02', value: 318.678 },
  { date: '2025-03', value: 319.799 },
];

interface CpiDataPoint {
  date: string;
  value: number;
}

/** @type {import('./$types').PageServerLoad} */
export async function load({ locals }: { locals: App.Locals }) {
  const apiKey = locals.user?.apiKey;
  try {
    const request = new QueryPriceRequestProto();
    request.setObjectClass('QueryPriceRequestProto');
    request.setVersion('0.0.1');
    request.setAsOf(ZonedDateTime.now().toProto());
    // 5-year horizon is sufficient for the chart and avoids a full-history scan
    // (PRICE_HORIZON_MAX causes ~1 s gRPC latency for large datasets).
    request.setHorizon(PriceHorizonProto.PRICE_HORIZON_5_YEAR);
    request.setFrequency(PriceFrequencyProto.PRICE_FREQUENCY_WEEKLY);

    // Filter by the CPI-U security UUID
    const filter = new PositionFilter();
    const uuid = new UUID(UUID.fromString(CPI_U_UUID));
    filter.addObjectFilter(FieldProto.SECURITY_ID, uuid);
    request.setSearchPriceInput(filter.toProto());

    const conn = getServiceConnection(apiKey);
    const client = new PriceClient(conn.url, conn.credentials, { interceptors: conn.interceptors });

    const prices: CpiDataPoint[] = await new Promise((resolve, reject) => {
      const results: CpiDataPoint[] = [];
      const stream = client.search(request);

      stream.on('data', (response: any) => {
        const priceList = response.getPriceResponseList?.() ?? [];
        for (const price of priceList) {
          const asOf = price.getAsOf?.();
          const priceVal = price.getPrice?.()?.getArbitraryPrecisionValue?.();
          if (asOf && priceVal) {
            const ts = asOf.getTimestamp?.();
            let dateStr = '';
            if (ts) {
              const d = new Date(ts.getSeconds() * 1000);
              dateStr = d.toISOString().slice(0, 10);
            }
            if (dateStr) {
              results.push({ date: dateStr, value: parseFloat(priceVal) });
            }
          }
        }
      });

      stream.on('end', () => resolve(results));
      stream.on('error', (err: any) => {
        console.error('CPI price fetch error:', err.details ?? err.message);
        resolve(results); // Return partial results on error
      });
    });

    // Sort by date and deduplicate (keep latest per month)
    const sorted = prices.sort((a, b) => a.date.localeCompare(b.date));
    const byMonth = new Map<string, CpiDataPoint>();
    for (const p of sorted) {
      const monthKey = p.date.slice(0, 7); // YYYY-MM
      byMonth.set(monthKey, p); // last entry per month wins
    }
    const cpiData = Array.from(byMonth.values());

    // If the service returned nothing (UUID not matched or no data in range),
    // fall back to stub data rather than rendering an empty chart.
    if (cpiData.length === 0) {
      console.warn('CPI fetch returned 0 rows — falling back to stub data');
      return { cpiData: STUB_CPI_DATA, error: 'Live CPI data unavailable — showing sample data' };
    }

    return { cpiData, error: null };
  } catch (error: any) {
    console.error('CPI page load error:', error.message);
    return { cpiData: STUB_CPI_DATA, error: 'Price service unavailable — showing sample data' };
  }
}
