import { FetchSecurity, FetchSecurityUniverse, type IdentifierTypeName } from '$lib/security';
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

const VALID_TYPES = new Set(['cusip', 'ticker', 'isin', 'series']);

function parseIdentifierType(raw: string | null): IdentifierTypeName {
  const v = (raw ?? '').toLowerCase();
  if (v === 'ticker') return 'EXCH_TICKER';
  if (v === 'isin') return 'ISIN';
  if (v === 'series') return 'SERIES_ID';
  return 'CUSIP';
}

function uuidHexToString(uuidHex: string): string {
  const uuidProto = UUIDProto.deserializeBinary(new Uint8Array(Buffer.from(uuidHex, 'hex')));
  const rawBytes = uuidProto.getRawUuid_asU8();
  const uuidStr = Array.from(rawBytes).map(b => b.toString(16).padStart(2, '0')).join('');
  return `${uuidStr.slice(0,8)}-${uuidStr.slice(8,12)}-${uuidStr.slice(12,16)}-${uuidStr.slice(16,20)}-${uuidStr.slice(20)}`;
}

/** @type {import('../../../../../.svelte-kit/types/src/routes').PageServerLoad} */
export async function load({ locals, request }) {
  const searchParams = new URLSearchParams(request.url.split('?')[1]);

  // URL contract: ?type=cusip|ticker|isin&id=<value>
  // Legacy alias: ?cusip=<value> → treated as type=cusip&id=<value>
  let typeRaw = searchParams.get('type');
  let identifierValue = (searchParams.get('id') ?? '').trim();
  const legacyCusip = (searchParams.get('cusip') ?? '').trim();
  if (!identifierValue && legacyCusip) {
    identifierValue = legacyCusip;
    if (!typeRaw) typeRaw = 'cusip';
  }
  const identifierType = parseIdentifierType(typeRaw);
  const identifierTypeUrl = VALID_TYPES.has((typeRaw ?? '').toLowerCase())
    ? (typeRaw as string).toLowerCase()
    : 'cusip';

  // Streamed promise — universe loads in parallel, page paints without waiting.
  const universe = FetchSecurityUniverse(locals.user?.apiKey).catch((e) => {
    console.error('Failed to load security universe:', e);
    return [];
  });

  // Look up the selected security to render the chart and resolve UUID for PriceService.
  let prices: PriceEntry[] = [];
  let securityDescription = '';
  let priceError = '';

  try {
    const priceService = new PriceService(locals.user?.apiKey);
    const now = ZonedDateTime.now();

    if (identifierValue) {
      const matches = await FetchSecurity(
        null,
        null,
        identifierValue,
        identifierType,
        undefined,
        undefined,
        locals.user?.apiKey,
      );

      const sec = matches.find(s => s.uuidHex);
      if (!sec) {
        const typeLabel =
          identifierType === 'EXCH_TICKER' ? 'Ticker' :
          identifierType === 'SERIES_ID'   ? 'Series ID' :
          identifierType;
        priceError = `${typeLabel} ${identifierValue} not found`;
      } else {
        const couponPart = sec.couponRate ? ` ${sec.couponRate}%` : '';
        const maturityPart = sec.maturityDate ? ` ${sec.maturityDate}` : '';
        securityDescription = `${sec.identifier} — ${sec.issuerName}${couponPart}${maturityPart}`.trim();

        const filter = new PositionFilter();
        filter.addObjectFilter(FieldProto.SECURITY_ID, new UUID(UUID.fromString(uuidHexToString(sec.uuidHex!))));

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
      // Browse fetch: latest price per security
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
    universe,                       // un-awaited Promise — streamed
    prices,
    selectedIdentifier: identifierValue,
    selectedIdentifierType: identifierTypeUrl,
    securityDescription,
    priceError,
    user: locals.user,
  };
}
