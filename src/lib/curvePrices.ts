/**
 * Fetch the latest known clean price (% of par) for a given security UUID
 * as-of a particular date. Used by /data/curves to assemble CurveInputProto[]
 * for RunCurve, and by /data/treasury_curve to display prices alongside
 * the on-the-run bond list.
 */
import { PriceClient } from '@fintekkers/ledger-models/node/fintekkers/services/price-service/price_service_grpc_pb.js';
import { QueryPriceRequestProto, PriceHorizonProto, PriceFrequencyProto } from '@fintekkers/ledger-models/node/fintekkers/requests/price/query_price_request_pb.js';
import { ZonedDateTime } from '@fintekkers/ledger-models/node/wrappers/models/utils/datetime';
import { PositionFilter } from '@fintekkers/ledger-models/node/wrappers/models/position/positionfilter';
import { UUID } from '@fintekkers/ledger-models/node/wrappers/models/utils/uuid';
import type { Identifier } from '@fintekkers/ledger-models/node/wrappers/models/security/identifier';
import field_pkg from '@fintekkers/ledger-models/node/fintekkers/models/position/field_pb.js';
import { getServiceConnection } from '$lib/grpc-auth';

const { FieldProto } = field_pkg;

export interface PricePoint {
  date: string;        // YYYY-MM-DD
  asOfMs: number;
  price: number;       // % of par for bonds; index level for indices
}

/**
 * Fetch all known prices for a security UUID, sorted descending by as-of.
 * Caller picks the most recent on/before their target date.
 */
export async function fetchPricesForSecurity(uuidStr: string, apiKey?: string): Promise<PricePoint[]> {
  const request = new QueryPriceRequestProto();
  request.setObjectClass('QueryPriceRequestProto');
  request.setVersion('0.0.1');
  request.setAsOf(ZonedDateTime.now().toProto());
  request.setHorizon(PriceHorizonProto.PRICE_HORIZON_MAX);
  request.setFrequency(PriceFrequencyProto.PRICE_FREQUENCY_DAILY);

  const filter = new PositionFilter();
  // The wrapper's addObjectFilter signature only declares `Identifier`,
  // but the runtime accepts any pack()-able object including UUID
  // (used for SECURITY_ID filtering). Cast preserves the existing
  // runtime behavior; tracked for an upstream signature widening.
  filter.addObjectFilter(FieldProto.SECURITY_ID, new UUID(UUID.fromString(uuidStr)) as unknown as Identifier);
  request.setSearchPriceInput(filter.toProto());

  const conn = getServiceConnection(apiKey);
  const client = new PriceClient(conn.url, conn.credentials, { interceptors: conn.interceptors });

  const prices: PricePoint[] = await new Promise((resolve) => {
    const out: PricePoint[] = [];
    const stream = client.search(request);
    stream.on('data', (response: any) => {
      const list = response.getPriceResponseList?.() ?? [];
      for (const p of list) {
        const asOf = p.getAsOf?.();
        const value = p.getPrice?.()?.getArbitraryPrecisionValue?.();
        if (!asOf || !value) continue;
        const ts = asOf.getTimestamp?.();
        if (!ts) continue;
        const ms = ts.getSeconds() * 1000;
        out.push({
          date: new Date(ms).toISOString().slice(0, 10),
          asOfMs: ms,
          price: parseFloat(value),
        });
      }
    });
    stream.on('end', () => resolve(out.sort((a, b) => b.asOfMs - a.asOfMs)));
    stream.on('error', (err: any) => {
      console.warn(`Price stream error: ${err.details ?? err.message}`);
      resolve(out.sort((a, b) => b.asOfMs - a.asOfMs));
    });
  });

  return prices;
}

/**
 * Pick the latest price on or before the target date. Returns undefined if
 * none exist.
 */
export function priceAsOf(prices: PricePoint[], asOfDate: Date): PricePoint | undefined {
  const cutoff = asOfDate.getTime();
  return prices.find((p) => p.asOfMs <= cutoff);
}
