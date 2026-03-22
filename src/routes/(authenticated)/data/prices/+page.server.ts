import { FetchSecurity } from '$lib/security';
import { PriceClient } from '@fintekkers/ledger-models/node/fintekkers/services/price-service/price_service_grpc_pb.js';
import { QueryPriceRequestProto, PriceHorizonProto, PriceFrequencyProto } from '@fintekkers/ledger-models/node/fintekkers/requests/price/query_price_request_pb.js';
import { UUIDProto } from '@fintekkers/ledger-models/node/fintekkers/models/util/uuid_pb.js';
import { ZonedDateTime } from '@fintekkers/ledger-models/node/wrappers/models/utils/datetime';
import { PositionFilter } from '@fintekkers/ledger-models/node/wrappers/models/position/positionfilter';
import { UUID } from '@fintekkers/ledger-models/node/wrappers/models/utils/uuid';
import field_pkg from '@fintekkers/ledger-models/node/fintekkers/models/position/field_pb.js';
import { getServiceConnection } from '$lib/grpc-auth';

const { FieldProto } = field_pkg;

interface PriceEntry {
  date: string;
  price: number;
}

/** @type {import('../../../../../.svelte-kit/types/src/routes').PageServerLoad} */
export async function load({ locals, request }) {
  const searchParams = new URLSearchParams(request.url.split('?')[1]);
  let selectedCusip = searchParams.get('cusip') ?? '';

  // Load securities for the CUSIP dropdown
  let securities: { cusip: string; description: string; uuidHex: string }[] = [];
  try {
    const allSecs = await FetchSecurity('Fixed Income', 'US Government');

    // Default to on-the-run 10Y Treasury
    if (!selectedCusip) {
      selectedCusip = '91282CPZ8';
    }

    securities = allSecs
      .filter(s => s.uuidHex)
      .map(s => ({
        cusip: s.cusip,
        description: `${s.cusip} — ${s.issuerName} ${s.couponRate ? s.couponRate + '%' : ''} ${s.maturityDate}`.trim(),
        uuidHex: s.uuidHex!,
      }))
      .sort((a, b) => a.cusip.localeCompare(b.cusip));
  } catch (e) {
    console.error('Failed to load securities for price page:', e);
  }

  // If a CUSIP is selected, fetch its prices
  let prices: PriceEntry[] = [];
  let securityDescription = '';
  let priceError = '';

  if (selectedCusip) {
    const sec = securities.find(s => s.cusip === selectedCusip);
    if (!sec) {
      priceError = `Security ${selectedCusip} not found`;
    } else {
      securityDescription = sec.description;
      try {
        // Reconstruct UUID from serialized hex
        // uuidHex is a serialized UUIDProto (tag + 16 raw bytes)
        const uuidProto = UUIDProto.deserializeBinary(new Uint8Array(Buffer.from(sec.uuidHex, 'hex')));
        const rawBytes = uuidProto.getRawUuid_asU8();
        const uuidStr = Array.from(rawBytes).map(b => b.toString(16).padStart(2, '0')).join('');
        const formatted = `${uuidStr.slice(0,8)}-${uuidStr.slice(8,12)}-${uuidStr.slice(12,16)}-${uuidStr.slice(16,20)}-${uuidStr.slice(20)}`;
        const uuid = new UUID(UUID.fromString(formatted));

        const priceRequest = new QueryPriceRequestProto();
        priceRequest.setObjectClass('QueryPriceRequestProto');
        priceRequest.setVersion('0.0.1');
        priceRequest.setAsOf(ZonedDateTime.now().toProto());
        priceRequest.setHorizon(PriceHorizonProto.PRICE_HORIZON_MAX);
        priceRequest.setFrequency(PriceFrequencyProto.PRICE_FREQUENCY_DAILY);

        // Build filter for this security's UUID
        const filter = new PositionFilter();
        filter.addObjectFilter(FieldProto.SECURITY_ID, uuid);
        priceRequest.setSearchPriceInput(filter.toProto());

        const conn = getServiceConnection();
        const priceURL = conn.url.replace(':8082', ':8083').replace(':80', ':8083');
        const client = new PriceClient(priceURL, conn.credentials);

        prices = await new Promise<PriceEntry[]>((resolve, reject) => {
          const results: PriceEntry[] = [];
          const stream = client.search(priceRequest);

          stream.on('data', (response: any) => {
            const priceList = response.getPriceResponseList?.() ?? [];
            for (const p of priceList) {
              const asOf = p.getAsOf?.();
              const priceVal = p.getPrice?.()?.getArbitraryPrecisionValue?.();
              if (asOf && priceVal) {
                const ts = asOf.getTimestamp?.();
                if (ts) {
                  const d = new Date(ts.getSeconds() * 1000);
                  const dateStr = d.toISOString().slice(0, 10);
                  results.push({ date: dateStr, price: parseFloat(priceVal) });
                }
              }
            }
          });

          stream.on('end', () => resolve(results));
          stream.on('error', (err: any) => {
            console.error('Price fetch error:', err.details ?? err.message);
            resolve(results);
          });
        });

        // Sort by date descending, deduplicate by date
        const byDate = new Map<string, PriceEntry>();
        for (const p of prices) {
          if (!byDate.has(p.date) || p.price > 0) {
            byDate.set(p.date, p);
          }
        }
        prices = Array.from(byDate.values()).sort((a, b) => b.date.localeCompare(a.date));
      } catch (e: any) {
        priceError = e.details ?? e.message ?? 'Failed to fetch prices';
        console.error('Price fetch error:', priceError);
      }
    }
  }

  return {
    securities,
    prices,
    selectedCusip,
    securityDescription,
    priceError,
    user: locals.user,
  };
}
