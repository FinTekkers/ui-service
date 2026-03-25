import { FetchSecurity } from '$lib/security';
import { PriceService } from '@fintekkers/ledger-models/node/wrappers/services/price-service/PriceService';
import { UUIDProto } from '@fintekkers/ledger-models/node/fintekkers/models/util/uuid_pb.js';
import { ZonedDateTime } from '@fintekkers/ledger-models/node/wrappers/models/utils/datetime';
import { PositionFilter } from '@fintekkers/ledger-models/node/wrappers/models/position/positionfilter';
import { UUID } from '@fintekkers/ledger-models/node/wrappers/models/utils/uuid';
import field_pkg from '@fintekkers/ledger-models/node/fintekkers/models/position/field_pb.js';

const { FieldProto } = field_pkg;

interface PriceEntry {
  date: string;
  price: number;
  asOfMs: number;
  cusip?: string;
}

/** @type {import('../../../../../.svelte-kit/types/src/routes').PageServerLoad} */
export async function load({ locals, request }) {
  const searchParams = new URLSearchParams(request.url.split('?')[1]);
  const selectedCusip = searchParams.get('cusip') ?? '';

  // Load the single selected security for description/UUID lookup
  let securities: { cusip: string; description: string; uuidHex: string }[] = [];
  if (selectedCusip) {
    try {
      const allSecs = await FetchSecurity('Fixed Income', 'US Government', selectedCusip, 'CUSIP', undefined, undefined, locals.user?.apiKey);
      securities = allSecs
        .filter(s => s.uuidHex)
        .map(s => ({
          cusip: s.cusip,
          description: `${s.cusip} — ${s.issuerName} ${s.couponRate ? s.couponRate + '%' : ''} ${s.maturityDate}`.trim(),
          uuidHex: s.uuidHex!,
        }));
    } catch (e) {
      console.error('Failed to load security for price page:', e);
    }
  }

  let prices: PriceEntry[] = [];
  let securityDescription = '';
  let priceError = '';

  try {
    const priceService = new PriceService(locals.user?.apiKey);
    const now = ZonedDateTime.now();

    if (selectedCusip) {
      // Filtered fetch: prices for one security
      const sec = securities.find(s => s.cusip === selectedCusip);
      if (!sec) {
        priceError = `Security ${selectedCusip} not found`;
      } else {
        securityDescription = sec.description;
        const uuidProto = UUIDProto.deserializeBinary(new Uint8Array(Buffer.from(sec.uuidHex, 'hex')));
        const rawBytes = uuidProto.getRawUuid_asU8();
        const uuidStr = Array.from(rawBytes).map(b => b.toString(16).padStart(2, '0')).join('');
        const formatted = `${uuidStr.slice(0,8)}-${uuidStr.slice(8,12)}-${uuidStr.slice(12,16)}-${uuidStr.slice(16,20)}-${uuidStr.slice(20)}`;
        const filter = new PositionFilter();
        filter.addObjectFilter(FieldProto.SECURITY_ID, new UUID(UUID.fromString(formatted)));

        const rawPrices = await priceService.search(now.toProto(), filter);
        prices = rawPrices
          .map(p => ({
            date: new Date(p.getAsOf().toDateTime().toMillis()).toISOString().slice(0, 10),
            price: p.getPrice().toNumber(),
            asOfMs: p.getAsOf().toDateTime().toMillis(),
          }))
          .sort((a, b) => b.asOfMs - a.asOfMs)
          .slice(0, 1000);
      }
    } else {
      // Browse fetch: no filter — price service returns most recent price per security (capped at 100)
      const rawPrices = await priceService.search(now.toProto(), new PositionFilter());
      prices = rawPrices
        .map(p => {
          const cusip = (p.proto as any).getSecurity?.()?.getIdentifier?.()?.getIdentifierValue?.() ?? undefined;
          return {
            date: new Date(p.getAsOf().toDateTime().toMillis()).toISOString().slice(0, 10),
            price: p.getPrice().toNumber(),
            asOfMs: p.getAsOf().toDateTime().toMillis(),
            cusip,
          };
        })
        .sort((a, b) => a.cusip?.localeCompare(b.cusip ?? '') ?? 0);
    }
  } catch (e: any) {
    priceError = e.details ?? e.message ?? 'Failed to fetch prices';
    console.error('Price fetch error:', priceError);
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
